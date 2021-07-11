import { Browser, Page } from 'puppeteer';
import UserAgent from 'user-agents';
import {
  ElementType, Options, Source, Sources,
} from '../types/daemon.types';
import AlertsService from './alerts.service';
import Alerts from '../types/alerts.types';
import BrowserService from './browser.service';
import CliService from './cli.service';

export default class ImpfDaemon {
  readonly alertsService: AlertsService;

  readonly browserService: BrowserService;

  readonly cliService: CliService;

  readonly sources: Source[];

  readonly options: Options = {
    elementTimeout: 300,
    windowWidth: 768,
    windowHeight: 1024,
    expandScopeToNext: false,
    maxHeapSize: 110,
    overkill: false,
  };

  private foundAppointment = false;

  private browser: Browser | undefined;

  constructor(data: Sources) {
    const { sources, options } = data;

    this.options = {
      ...this.options,
      ...options || {},
    };

    this.sources = sources;

    this.browserService = new BrowserService(this.options);
    this.alertsService = new AlertsService();
    this.cliService = new CliService();
  }

  private alert(type?: Alerts) {
    this.alertsService.alert(type);
  }

  async start(): Promise<boolean> {
    this.alert();

    if (!this.browser) {
      await this.prepareBrowserEnvironment();
    }

    const promises = [];

    this.sources.forEach((source: Source) => {
      const promise = this.initializeAppointmentSearch(source);

      promises.push(promise);
      promise.then((foundAppointment) => {
        if (foundAppointment) {
          console.log(foundAppointment);
        }
      });
    });

    return false;
  }

  private async initializeAppointmentSearch(source: Source): Promise<boolean> {
    try {
      const foundAppointment = await this.checkForAppointments(source);

      if (foundAppointment) {
        return true;
      }
      return await this.initializeAppointmentSearch(source); // not so good practice, refactor
    } catch (err) {
      return false;
    }
  }

  /**
   * TODO: Refactor promise properly
   * @returns
   */
  private async prepareBrowserEnvironment() {
    try {
      this.browser = await this.browserService.initializeBrowserInstance({ headless: false });

      const cookiesPage = await this.newPage();
      await cookiesPage.goto('https://www.doctolib.de');

      try {
        await (await cookiesPage.waitForSelector('#didomi-notice-agree-button'))?.click();

        this.alert(Alerts.READY);

        return await cookiesPage.close();
      } catch (err) {
        console.error('failed to accept cookies');

        return false;
      }
    } catch (err) {
      console.error('failed to start browser');
      console.log(err);

      process.exit(999);
      return false;
    }
  }

  private async newPage(): Promise<Page> {
    if (this.browser && !this.foundAppointment) {
      const page = await this.browser.newPage();
      await page.setUserAgent(ImpfDaemon.getRandomUserAgent());
      await page.setViewport({
        width: 768,
        height: 1024,
        deviceScaleFactor: 1,
      });

      return page;
    }
    throw new Error();
  }

  private async checkForAppointments(source: Source) {
    const localOptions: Options = {
      ...this.options,
      ...source.options,
    } || {};

    if (this.foundAppointment) {
      return false;
    }

    const page = await this.newPage();

    let appointmentIsHere = false;
    let refreshCount = 0;

    const bar = this.cliService.create(5, 0);
    const heapSize = async () => Math
      .ceil((await page.metrics()).JSHeapUsedSize as number / 1000000);

    while (!this.foundAppointment && (await heapSize()) < (localOptions?.maxHeapSize as number)) {
      try {
        bar.update(1, { status: 'Opening page', metrics: await heapSize(), refreshCount });
        await page.goto(source.bookingLink, { waitUntil: ['domcontentloaded', 'networkidle0'], timeout: 5000 });

        bar.update(2, { status: 'Filling in inputs' });
        await this.fillInInputs(source, page);

        bar.update(3, { status: 'Checking if next appointment page' });
        if (localOptions.expandScopeToNext) {
          const nextAvailableAppointmentButtonClicked = await this.clickElement(page, '.availabilities-next-slot', localOptions.elementTimeout);

          if (nextAvailableAppointmentButtonClicked) {
            this.alert(Alerts.QUIET);
            this.switchToPage(page);
          }
        }

        bar.update(4, { status: 'Looking for appointments' });
        const firstAppointmentSlotClicked = await this.clickElement(page, '.availabilities-slot', localOptions.elementTimeout);

        if (!this.foundAppointment && firstAppointmentSlotClicked) {
          bar.update(5, { status: 'Appointment found' });

          this.switchToPage(page);
          this.alert();
          this.foundAppointment = true;
          appointmentIsHere = true;

          // click second slot to temporarily block appointment
          await this.clickElement(page, '.availabilities-slot', localOptions.elementTimeout);
        }
      } finally {
        bar.update(0, { status: 'Restarting search' });
        refreshCount += refreshCount;
      }
    }

    if (!this.foundAppointment) {
      bar.update(5, { status: 'Restarted to reduce memory usage' });
      bar.stop();
      this.cliService.stop(bar);

      await page.close();
      return false;
    }

    if (this.foundAppointment && !appointmentIsHere) {
      bar.update(5, { status: 'Closed as another appointment is found' });
      bar.stop();

      await page.close();
      return false;
    }

    return true;
  }

  private async clickElement(page: Page, selector: string, timeout?: number): Promise<boolean> {
    timeout = timeout || this.options.elementTimeout as number;

    try {
      const slot = await page.waitForSelector(selector,
        {
          timeout,
        });

      await slot?.click();

      return true;
    } catch (err) {
      return false;
    }
  }

  private static getRandomUserAgent(): string {
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });

    return userAgent.toString();
  }

  private switchToPage(page: Page) {
    if (!this.foundAppointment) {
      return page.bringToFront();
    }

    return false;
  }

  private async fillInInputs(source: Source, page: Page): Promise<boolean> {
    const { elementsToInteract } = source;

    if (elementsToInteract) {
      const timeout = this.options?.elementTimeout || 300;

      for (const element of elementsToInteract) {
        const { selector, value, type } = element;

        try {
          switch (type) {
            default:
            case ElementType.SELECT:
              await page.select(selector, value);
              break;

            case ElementType.BUTTON:
              await (await page.waitForSelector(selector, { timeout }))?.click();
          }
        } catch (err) {
          console.log(err);
        }

        await ImpfDaemon.cooldown(500);
      }
    }

    return true;
  }

  private static cooldown(timeout: number): Promise<boolean> {
    return new Promise((resolve) => setTimeout(() => resolve(true), timeout));
  }
}
