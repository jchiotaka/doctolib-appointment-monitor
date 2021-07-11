import { Sources } from '../types/daemon.types';

const berlinConfig: Sources = {
  sources: [
    {
      bookingLink: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158431',
    },
    {
      bookingLink: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158434',
    },
    {
      bookingLink: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158435',
    },
    {
      bookingLink: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158436',
    },
    {
      bookingLink: 'https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158435',
    },
  ],
  options: {
    expandScopeToNext: true,
    overkill: true,
    // host: 'wss://chrome.browserless.com/?--window-size=768,1024',
  },
};

export default berlinConfig;
