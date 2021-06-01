const open = require('open');
const axios = require('axios');
const audio = require('play-sound')(opts = {});
const readline = require('readline');
const fs = require('fs');

const error = fs.createWriteStream('./daemon.error.log', { flags: 'a' });

class ImpfDaemon {
  sources;
  standardTimeout = 1000;

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
  async monitorAppointments() {
    let continueSearch = true;
    console.log('\n\nMonitoring\n');

    do {
      for (let { xhrLink, bookingLink } of this.sources) {
        if (continueSearch) {
          const appointments = await this.getAppointments(xhrLink);
          
          if (!appointments || appointments.error) {
            process.stdout.write('e');  
          } else {
            process.stdout.write(`${appointments.total ? appointments.total : '.'}`);
          }
  
          if (Boolean(appointments.total)) {
            open(bookingLink);
  
            audio.play('./alert.mp3');
            process.stdout.write('√');

            console.log('\n\n');
            console.log(bookingLink);

            continueSearch = await this.requestInput('Appointment found, continue searching? (Y/n)');
          }
        }
      }
      
      await this.cooldown(100);
    } while (continueSearch);
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