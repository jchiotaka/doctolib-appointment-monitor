import {ElementType, Options, Source, Sources} from "../types/daemon.types";
import {Browser, Page} from 'puppeteer';
import UserAgent from 'user-agents';
import AlertsService from './alerts.service';
import {Alerts} from "../types/alerts.types";
import BrowserService from "./browser.service";

export default class ImpfDaemon {
  readonly alertsService: AlertsService;
  readonly browserService: BrowserService;

  readonly sources: Source[];
  readonly options: Options = {
    elementTimeout: 300,
    elementTimeoutOffset: 1000,
    delayAfterAppointmentFound: 1000 * 5,
    windowHeight: 1024,
    windowWidth: 768,
    expandScopeToNext: false,
  };

  private foundAppointment = false;

  private browser: Browser | undefined;

  constructor(data: Sources) {
    const { sources, options } = data;

    this.options = {
      ...this.options,
      ...options || {}
    };

    this.sources = sources;

    this.browserService = new BrowserService(this.options);
    this.alertsService = new AlertsService();
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

    do {
      for (const source of this.sources) {
        promises.push(this.initializeAppointmentSearch(source));
      }
    } while (!(await Promise.all(promises)).includes(true));

    return false;
  }

  private async initializeAppointmentSearch(source: Source) {
    try {
      return await this.checkForAppointments(source);
    } catch (err) {
      return false;
    }
  }

  private async prepareBrowserEnvironment() {
    try {
      this.browser = await this.browserService.initializeBrowserInstance({ headless: false });

      const cookiesPage = await this.newPage();
      await cookiesPage.goto('https://www.doctolib.de');

      try {
        await (await cookiesPage.waitForSelector('#didomi-notice-agree-button'))?.click();

        this.alert(Alerts.READY);

        return cookiesPage.close();
      } catch (err) {
        console.error('failed to accept cookies');
      }
    } catch (err) {
      console.error('failed to start browser');
      console.log(err);

      process.exit(999);
    }
  }

  private async newPage(): Promise<Page> {
    if (this.browser) {
      const page = await this.browser.newPage();
      await page.setUserAgent(ImpfDaemon.getRandomUserAgent());
      await page.setViewport({
        width: 768,
        height: 1024,
        deviceScaleFactor: 1,
      });

      return page;
    } else {
      throw new Error();
    }
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


    while (!this.foundAppointment && refreshCount < 15) {
      try {
        await page.goto(source.bookingLink, { waitUntil: ['domcontentloaded', 'networkidle0'] });
        await this.fillInInputs(source, page);

        if (localOptions.expandScopeToNext) {
          const nextAvailableAppointmentButtonClicked = await this.clickElement(page, '.availabilities-next-slot', localOptions.elementTimeout);

          if (nextAvailableAppointmentButtonClicked) {
            this.alert(Alerts.QUIET);
            this.switchToPage(page);
          }
        }

        //try to find first slot on page
        const firstAppointmentSlotClicked = await this.clickElement(page, '.availabilities-slot', localOptions.elementTimeout);

        if (!this.foundAppointment && firstAppointmentSlotClicked) {
          this.switchToPage(page);
          this.alert();
          this.foundAppointment = true;
          appointmentIsHere = true;
          
          // click second slot to temporarily block appointment
          await this.clickElement(page, '.availabilities-slot', localOptions.elementTimeout);
        }
      } finally {
        refreshCount++
      }
    }

    if (!this.foundAppointment) {
      await page.close();
      return false;
    }

    if (this.foundAppointment && !appointmentIsHere) {
      await page.close();
      return false;
    }

    return true;
  }

  private async clickElement(page: Page, selector: string, timeout: number = this.options.elementTimeout as number): Promise<boolean> {
    try {
      const slot = await page.waitForSelector(selector,
        {
          timeout
        }
      );

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
            case ElementType.SELECT:
              await page.select(selector, value);
              break;

            case ElementType.BUTTON:
              await (await page.waitForSelector(selector, { timeout }))?.click();
          }
        } catch(err) {}

        await this.cooldown(500);
      }
    }

    return true;
  }

  private cooldown(timeout: number): Promise<boolean> {
    return new Promise(resolve => setTimeout(() => resolve(true), timeout));
  }
}
