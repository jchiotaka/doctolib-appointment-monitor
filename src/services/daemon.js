const audio = require('sound-play');
const readline = require('readline');
const puppeteer = require('puppeteer');
const path = require('path');

class ImpfDaemon {
  sources;
  foundAppointment = false;
  options = {
    elementTimeout: 300, // general element timeout
    elementTimeoutOffset: 1000, // add extra time for waiting if a next available appointment button was present
    delayAfterAppointmentFound: 1000 * 5,
    windowHeight: 1024,
    windowWidth: 768,
    expandScopeToNext: false, // click on the next available appointment window if provided
  };

  browser;
  page;

  constructor(data) {
    const { sources, options } = data;

    this.options = {
      ...this.options,
      ...options || {}
    };

    this.sources = sources;
  }

  async prepareBrowser() {
    this.browser = await puppeteer.launch(
      {
        headless: false,
        defaultViewport: null,
        args: [`--window-size=${this.options.windowWidth},${this.options.windowHeight}`],
      });

    this.page = await this.browser.newPage();

    await this.page.goto('https://www.doctolib.de');

    try {
      await (await this.page.waitForSelector('#didomi-notice-agree-button')).click();

      this.playSound('ready.wav')
      return this.page.close();
    } catch (err) {
    }
  }

  /**
   * One day this will be nicely done in TS with enums
   */
  playSound(soundString) {
    audio.play(path.join(__dirname, `../assets/${soundString}`));
  }

  alert() {
    this.playSound('notify.wav');
  }

  alertLater() {
    this.playSound('subtle.wav');
  }

  async browserMonitoring() {
    if (!this.browser) {
      await this.prepareBrowser();
    }

    for (const source of this.sources) {
      let promise = this.checkForAppointments(source);
    }
  }

  switchToPage(page) {
    if (!this.foundAppointment) {
      page.bringToFront();
    }
  }
  async fillInInputs(source, page) {
    const { selects, inputs } = source;

    for (const select of selects) {
      const { selector, value } = select;

      await page.select(selector, value);
    }
  }

  async checkForAppointments(source) {
    const localOptions = {
      ...this.options,
      ...source.options,
    }

    if (this.foundAppointment) {
      setTimeout(() => retry(), localOptions.delayAfterAppointmentFound);
      return;
    }

    const retry = () => {
      this.playSound('tap.wav');
      this.checkForAppointments(source);
    }

    const page = await this.browser.newPage();

    let appointmentIsHere = false;
    let refreshCount = 0;

    try {
      await page.goto(source.bookingLink, { waitUntil: ['domcontentloaded', 'networkidle0'] });
    } catch (err) {
      page.close();
      return retry();
    }

    while (!this.foundAppointment && refreshCount < 10) {
      try {
        let nextSlotButton;

        await this.fillInInputs(source, page);

        if (localOptions.expandScopeToNext) {
          try {
            nextSlotButton = await page.waitForSelector('.availabilities-next-slot', { timeout: localOptions.elementTimeout });
            await nextSlotButton.click();

            this.alertLater();
            this.switchToPage(page);
          } catch (err) { }
        }

        const slot = await page.waitForSelector('.availabilities-slot',
          { timeout: localOptions.elementTimeout + (nextSlotButton ? localOptions.elementTimeoutOffset : 0) });

        await slot.click();

        this.switchToPage(page);
        this.foundAppointment = true;
        appointmentIsHere = true;

        this.alert();
      } catch (err) {
        refreshCount++;

        try {
          await page.reload({ waitUntil: ['domcontentloaded', 'networkidle0'] });
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

    if (this.foundAppointment) {
      if (appointmentIsHere) {
        const input = await this.requestInput('Continue searching? (y/n)');

        this.foundAppointment = false;
        page.close();

        if (input) {
          return retry();
        } else {
          process.exit();
        }
      } else {
        page.close();
      }
    }
  }

  requestInput(query) {
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

module.exports = ImpfDaemon;