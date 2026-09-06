// Filter vocabulary for the Eksploratè, shared by the server page (counts +
// filtering) and the client filter controls.

export const PARTS: [string, string][] = [
  ['fey', 'Fèy'], ['rasin', 'Rasin'], ['ekos', 'Ekòs'],
  ['fle', 'Flè'], ['grenn', 'Grenn'], ['fwi', 'Fwi'],
];
export const PREPS: [string, string][] = [
  ['te', 'Te'], ['tranpe', 'Tranpe'], ['bouyi', 'Bouyi'], ['konpes', 'Konpès'],
  ['benyen', 'Benyen'], ['siwo', 'Siwo'], ['luil', 'Luil'],
];
export const REGIONS: [string, string][] = [
  ['AR', 'Latibonit'], ['CE', 'Sant'], ['GA', 'Grandans'], ['NI', 'Nip'],
  ['NO', 'Nò'], ['NE', 'Nòdès'], ['NW', 'Nòdwès'], ['OU', 'Lwès'],
  ['SU', 'Sid'], ['SE', 'Sidès'],
];
export const MONTHS = ['JAN', 'FEV', 'MAS', 'AVR', 'ME', 'JEN', 'JIY', 'OUT', 'SEP', 'OKT', 'NOV', 'DES'];

export type PlantRow = {
  slug: string;
  name_kr: string;
  name_fr: string | null;
  name_en: string | null;
  name_sci: string;
  family: string | null;
  parts_used: string[];
  preparations: string[] | null;
  season_months: number[] | null;
  regions: string[] | null;
  summary_kr: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photos: any;
};

export type Facet = 'pati' | 'prep' | 'sezon' | 'rejyon';
