const ImpfDaemon = require('./services/daemon');

const berlinImpf = {
  sources: [
    {
      bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158431`,
    },
    {
      bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158434`,
    },
    {
      bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158435`,
    },
    {
      bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158436`,
    },
    {
      bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158435`,
    },
  ],
  options: {
    expandScopeToNext: true,
  },
};

const hausaertzte = {
  sources:
    [
      {
        bookingLink: `https://www.doctolib.de/kardiologie/berlin/shwan-hussein?insurance_sector=public`,

        /**
         * You can override individual options here. Keep in mind this does not affect window size and other
         * global options. to change this add an options parameter at the root object
         */
        options: {
          expandScopeToNext: false,
        },

        /**
         * You can modify select boxes here
         */
        selects: [
          {
            selector: '#booking_motive',
            value: 'Echokardiographie-1295-4'
          }
        ],

        inputs: [
          {

          }
        ]
      },
      {
        bookingLink: `https://www.doctolib.de/allgemeinmedizin/berlin/irina-raileanu`,

        /**
         * You can override individual options here. Keep in mind this does not affect window size and other
         * global options. to change this add an options parameter at the root object
         */
        options: {
          expandScopeToNext: true,
        },

        /**
         * You can modify select boxes here
         * buttons and input fields to be added (I didn't need them so far)
         */
        selects: [
          {
            selector: '#booking_motive',
            value: 'Folgebehandlung Allgemeinarzt-1286'
          }
        ]
      }
    ],

  /**
   * Global options go here.
   */
  options: {
    expandScopeToNext: false,
  },
}
const daemonInstance = new ImpfDaemon(berlinImpf);
daemonInstance.browserMonitoring();
