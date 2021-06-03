import {Sources} from "./types/daemon.types";
import ImpfDaemon from "./services/daemon.service";

const berlinImpf: Sources = {
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

new ImpfDaemon(berlinImpf).start();