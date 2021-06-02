import {Alerts, Options, Source, Sources} from "../types/daemon.types";
import Play from 'play-sound';
import {Browser, BrowserLaunchArgumentOptions, Page} from 'puppeteer';
import UserAgent from 'user-agents';
import puppeteer from 'puppeteer';
import readline from 'readline';
import path from 'path';

export default class ImpfDaemon {
  readonly audio;
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

    // @ts-ignore will fix it one day
    this.audio = new Play();
  }

  async start() {
    this.alert();

    if (!this.browser) {
      await this.prepare();
    }

    for (const source of this.sources) {
      this.checkForAppointments(source);
    }
  }

  private async prepare() {
    this.browser = await this.initializeBrowserInstance({ headless: false });

    const cookiesPage = await this.newPage();
    await cookiesPage.goto('https://www.doctolib.de');

    try {
      await (await cookiesPage.waitForSelector('#didomi-notice-agree-button'))?.click();

      this.alert(Alerts.READY);

      return cookiesPage.close();
    } catch (err) {
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
      setTimeout(() => retry(), localOptions.delayAfterAppointmentFound);
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
      return retry();
    }

    // refreshCount will close the page after 10 refreshes as with each refresh the memory consumption increases
    while (!this.foundAppointment && refreshCount < 10) {
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
          await page.close();

          return retry();
        }
      }
    }

    if (!this.foundAppointment) {
      await page.close();

      return retry();
    }

    if (this.foundAppointment) {
      if (appointmentIsHere) {
        const input = await this.requestInput('Continue searching? (y/n)');

        this.foundAppointment = false;
        await page.close();

        if (input) {
          return retry();
        } else {
          process.exit();
        }
      } else {
        await page.close();
      }
    }
  }

  private async initializeBrowserInstance(options?: BrowserLaunchArgumentOptions) {
    return puppeteer.launch(
        {
          headless: true,
          defaultViewport: null,
          args: [`--window-size=${this.options.windowWidth},${this.options.windowHeight}`],
          ...options,
        });
  }

  private static getRandomUserAgent(): string {
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });

    console.log(userAgent.toString());
    console.log(JSON.stringify(userAgent.data, null, 2));

    return userAgent.toString();
  }

  private switchToPage(page: Page) {
    if (!this.foundAppointment) {
      return page.bringToFront();
    }

    return false;
  }

  private alert(alertType?: Alerts) {
    let soundFile: string;

    switch (alertType) {
      case Alerts.LOUD:
        soundFile = `../assets/notify.wav`;
        break;

      case Alerts.QUIET:
        soundFile = `../assets/subtle.wav`;
        break;

      case Alerts.TAP:
        soundFile = `../assets/tap.wav`;
        break;

      case Alerts.READY:
        soundFile = `../assets/ready.wav`;
        break;

      default:
        soundFile = `../assets/notify.wav`;
        break;
    }

    return this.audio.play(path.join(__dirname, soundFile));
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

  private requestInput(query: string) {
    const readLine = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(
      resolve => readLine.question(query, ans => {
        readLine.close();

        resolve(['y', 'Y'].includes(ans));
      })
    );
  }
}
