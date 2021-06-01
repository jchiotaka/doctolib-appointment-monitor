const open = require('open');
const axios = require('axios');
const audio = require('play-sound')(opts = {});
const readline = require('readline');

class ImpfDaemon {
  sources;
  standardTimeout = 1000;

  constructor(sources) {
    this.sources = sources;
  }

  async hasAppointments(xhrLink) {
    try {
      const response = await axios.get(xhrLink);

      if (response?.data?.total > 0) {
        return true;
      }

      return false;
    }

    catch (err) {
      console.log(err);
    }

  }

  async monitorAppointments() {
    let continueSearch = true;
    console.log('\n\nMonitoring\n');

    do {
      for (let { xhrLink, bookingLink } of this.sources) {
        if (continueSearch) {
          const hasAppointments = await this.hasAppointments(xhrLink);

          process.stdout.write('.');
  
          if (hasAppointments) {
            open(bookingLink);
  
            audio.play('./alert.mp3');
            process.stdout.write('√');
  
            continueSearch = await this.requestInput('Appointment found, continue searching? (Y/n)');
          }
        }
        
      }
      await this.cooldown(1000);
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