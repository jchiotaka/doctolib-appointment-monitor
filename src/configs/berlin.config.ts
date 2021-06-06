import { ElementType, Sources } from "../types/daemon.types";


export const berlinConfig: Sources = {
  sources: [
    // {
    //   bookingLink: 'https://www.doctolib.de/impfung-covid-19-corona/munchen?ref_visit_motive_ids[]=6768&ref_visit_motive_ids[]=6936&ref_visit_motive_ids[]=7109&ref_visit_motive_ids[]=7978',
    // },
    // {
    //   bookingLink: 'https://www.doctolib.de/gemeinschaftspraxis/muenchen/hausaerzte-dr-weber?insurance_sector=public',
    //   elementsToInteract: [
    //     {
    //       type: ElementType.SELECT,
    //       selector: '#booking_speciality',
    //       value: '5593',
    //     },
    //     {
    //       type: ElementType.BUTTON,
    //       selector: '[for="all_visit_motives-0"]',
    //       value: 'Ja',
    //     },
    //     {
    //       type: ElementType.SELECT,
    //       selector: '#booking_motive',
    //       value: 'Erstimpfung Covid-19 (BioNTech-Pfizer)-5593',
    //     },
    //   ]
    // },
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
    overkill: true,
    // host: 'ws://161.97.178.243:4000/?token=4c0a2b83-fd5b-4d15-9404-ae78865b9b29&--window-size=768,1024',
  },
};