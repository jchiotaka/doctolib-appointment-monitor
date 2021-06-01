const open = require('open');
const axios = require('axios');
const audio = require('play-sound')(opts = {});
const readline = require('readline');
const fs = require('fs');
const puppeteer = require('puppeteer');

const error = fs.createWriteStream('./daemon.error.log', { flags: 'a' });

class ImpfDaemon {
  sources;
  foundAppointment = false;
  standardTimeout = 1000;
  browser;
  page;

  constructor(sources) {
    this.sources = sources;
  }

  async getAppointments(xhrLink) {
    try {
      const response = await axios.get(xhrLink);

      if (response?.data) {
        return response.data;
      }

      return {};
    }

    catch (err) {
      error.write(`\n${JSON.stringify(err)}\n`);

      return { error: true };
    }
  }

  /**
   * Will start monitoring the appointments.
   * Change cooldown for less or more requests per second.
   * (Lower number greater chances to get an appointment notification, or blocked :D)
   */
  async prepareBrowser() {
    this.browser = await puppeteer.launch(
      { headless: false, 
        defaultViewport: null,
        args: [`--window-size=768,1024`],
      });
    this.page = await this.browser.newPage();
    
    await this.page.goto('https://www.doctolib.de');

    try {
      return (await this.page.waitForSelector('#didomi-notice-agree-button')).click();
    } catch (err) {
      console.log(err);
    }
  }

  alert() {
    audio.play('./notify.wav');
  }

  foundLater() {
    audio.play('./subtle.wav');
  }

  async browserMonitoring() {
    console.log('Monitoring in browser');
    
    if (!this.browser) {
      await this.prepareBrowser();
    }

    const pages = [];

    for (const source of this.sources) {
      const page = await this.browser.newPage();

      page.goto(source.bookingLink);
      pages.push(page);
    }

    this.switchToPage(this.page);
    this.cooldown(3000);

    for (const page of pages) {
      this.monitorPage(page);
    }
  }

  switchToPage(page) {
    page.bringToFront();
  }

  async monitorPage(page) {
    try {
      let offset = 0;
      try {
        (await page.waitForSelector('.availabilities-next-slot', { timeout: 400 })).click();
        
        this.foundLater();
        offset = 1000;
        this.switchToPage(page);
      } catch (err) {}
      
      const slot = (await page.waitForSelector('.availabilities-slot', { timeout: 400 + offset }));

      slot.click();
      this.switchToPage(page);
      
      this.alert();
      this.foundAppointment = true;

      if (await this.requestInput('Appointment found, continue searching? (Y/n)')) {
        this.foundAppointment = false;

        this.page.bringToFront();
        await page.reload({ waitUntil: ['domcontentloaded', 'networkidle0'] });
        this.monitorPage(page);
      }
    } catch (err) {
      if (!this.foundAppointment) {
        await page.reload({ waitUntil: ['domcontentloaded', 'networkidle0'] });
      }

      this.monitorPage(page);
    }
  }

  showProgress(string) {
    process.stdout.write(string || '.');
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

  cooldown(timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, timeout || 1000);
    });
  }
}

module.exports = ImpfDaemon;