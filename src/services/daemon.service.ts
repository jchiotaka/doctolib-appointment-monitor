import {Options, Source, Sources} from "../types/daemon.types";
import {Browser, BrowserLaunchArgumentOptions, Page} from 'puppeteer';
import UserAgent from 'user-agents';
import puppeteer from 'puppeteer';
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
    const {sources, options} = data;

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

  async start() {
    this.alert();

    if (!this.browser) {
      await this.prepareBrowserEnvironment();
    }

    for (const source of this.sources) {
      this.checkForAppointments(source);
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

    const retry = () => {
      this.alert(Alerts.TAP);
      this.checkForAppointments(source);
    }

    const page = await this.newPage();

    let appointmentIsHere = false;
    let refreshCount = 0;

    try {
      await page.goto(source.bookingLink, {waitUntil: ['domcontentloaded', 'networkidle0']});
    } catch (err) {

      await page.close();
      retry();
      
      return;
    }

    while (!this.foundAppointment && refreshCount < 20) {
      try {
        let nextSlotButton;

        await ImpfDaemon.fillInInputs(source, page);

        if (localOptions.expandScopeToNext) {
          try {
            nextSlotButton = await page.waitForSelector('.availabilities-next-slot', {timeout: localOptions.elementTimeout});
            await nextSlotButton?.click();

            this.alert(Alerts.QUIET);

            this.switchToPage(page);
          } catch (err) {
          }
        }

        const slot = await page.waitForSelector('.availabilities-slot',
            {
              // @ts-ignore will fix this too :D
              timeout: localOptions.elementTimeout + (nextSlotButton ? localOptions.elementTimeoutOffset : 0)
            }
        );

        await slot?.click();

        this.switchToPage(page);
        this.foundAppointment = true;
        appointmentIsHere = true;

        this.alert();
      } catch (err) {
        refreshCount++;

        try {
          await page.reload({waitUntil: ['domcontentloaded', 'networkidle0']});
        } catch (err) {
          page.close();

          return retry();
        }
      }
    }

    if (!this.foundAppointment) {
      await page.close();

      return retry();
    }

    if (this.foundAppointment && !appointmentIsHere) {
      await page.close();
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

  private static async fillInInputs(source: Source, page: Page) {
    const {selects, inputs} = source;

    if (selects) {
      for (const select of selects) {
        const {selector, value} = select;

        await page.select(selector, value);
      }
    }

    if (inputs) {
      for (const input of inputs) {
        const {selector, value} = input;

        await page.type(selector, value);
      }
    }
  }
}
