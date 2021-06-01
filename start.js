const Daemon = require('./daemon');

const limit = 10;
const dateStart = new Date().toISOString().split('T')[0];

console.log('Start Date: ', dateStart);
console.log('Days in the future: ', limit);

const sources = [
  {
    bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158431`,
    xhrLink: `https://www.doctolib.de/availabilities.json?start_date=${dateStart}&visit_motive_ids=2495719&agenda_ids=397800-397776-402408-397766&insurance_sector=public&practice_ids=158431&destroy_temporary=true&limit=${limit}`,
  },
  {
    bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158434`,
    xhrLink: `https://www.doctolib.de/availabilities.json?start_date=${dateStart}&visit_motive_ids=2495719&agenda_ids=457479-457450-457475-457455-457459-457454-457447-457446-457458-457456-457472-457476-457452-457480-457461-457451-457468-457473&insurance_sector=public&practice_ids=158434&destroy_temporary=true&limit=${limit}`,
  },
  {
    bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158435`,
    xhrLink: `https://www.doctolib.de/availabilities.json?start_date=${dateStart}&visit_motive_ids=2495719&agenda_ids=404654-457215-457244-397972-457210-457239-457213-457278-457283-457304-457306-457229-457234-457299-457212-457216-457288-457291-457315-457227-457204-457237-457296-397974-457312-457280-457206-457310-457319-397973-457243-457208-457218-457245-457274-457321&insurance_sector=public&practice_ids=158435&destroy_temporary=true&limit=${limit}`,
  },
  {
    bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158436`,
    xhrLink: `https://www.doctolib.de/availabilities.json?start_date=${dateStart}&visit_motive_ids=2495719&agenda_ids=457379-457323-457329-457334-457346-457253-457255-457256-457294-457317-457335-457399-457514-457350-457326-457330-457254-457267-457303-457275-457276-457281-457289-457300-457301-457302-457307-457309-457314-457331-457388-457515-457338-457263-457266-457277-457286-457287-457308-457320-457343-457268-457500-397841-457512-457382-457385-457324-457460-457513-457285-457392-457395-457251-397843-457252-457264-457271-457279-457290-457292-457318-457358-457327-457341-457293-457250-457305-457377-457396-457333-457349-457265-457313-457316-457295-457390-457363-457282-457297-397842-457336-457337-457413-404656-457510&insurance_sector=public&practice_ids=158436&destroy_temporary=true&limit=${limit}`,
  },
  {
    xhrLink: `https://www.doctolib.de/availabilities.json?start_date=${dateStart}&visit_motive_ids=2495719&agenda_ids=457195-457211-457201-457991-457205-457193&insurance_sector=public&practice_ids=158435&destroy_temporary=true&limit=${limit}`,
    bookingLink: `https://www.doctolib.de/institut/berlin/ciz-berlin-berlin?pid=practice-158435`,
  },
];

const instance = new Daemon(sources);
instance.monitorAppointments();

