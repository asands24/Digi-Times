// Curated, kid-safe milestones. Sources are editorial references, not runtime APIs.
export interface HistoricalEvent {
  month: number;
  day: number;
  year: number;
  description: string;
  category: 'science' | 'humanitarian' | 'cultural' | 'space' | 'environmental' | 'wholesome';
  templates: string[];
  source: string;
}
const parksSource = 'https://home.nps.gov/subjects/npscelebrates/park-anniversaries.htm';
const park = (month: number, day: number, year: number, description: string): HistoricalEvent => ({ month, day, year, description, category: 'environmental', templates: ['family', 'pets', 'travel', 'holidays'], source: parksSource });
export const historicalEvents: HistoricalEvent[] = [
  park(1, 9, 1908, 'Muir Woods becomes a national monument, protecting towering redwoods.'),
  park(1, 8, 1971, 'Voyageurs National Park is established in Minnesota.'),
  park(2, 7, 1908, 'Jewel Cave becomes a national monument.'),
  park(2, 26, 1929, 'Grand Teton National Park is established.'),
  park(3, 1, 1872, 'Yellowstone becomes a national park.'),
  park(3, 2, 1899, 'Mount Rainier National Park is established.'),
  { month: 4, day: 16, year: 1972, description: 'Giant pandas Ling-Ling and Hsing-Hsing arrive in Washington, D.C.', category: 'wholesome', templates: ['family', 'pets', 'baby'], source: 'https://siarchives.si.edu/history/this-day-smithsonian-history/april-16' },
  { month: 4, day: 24, year: 1990, description: 'The Hubble Space Telescope launches, opening a new window on the stars.', category: 'space', templates: ['baby', 'travel', 'family'], source: 'https://www.nasa.gov/history/hubble/' },
  park(5, 22, 1902, 'Crater Lake National Park is established.'),
  park(5, 2, 1924, 'Craters of the Moon becomes a national monument.'),
  { month: 6, day: 18, year: 1983, description: 'Sally Ride becomes the first American woman in space.', category: 'space', templates: ['baby', 'family', 'travel'], source: 'https://science.nasa.gov/people/sally-ride/' },
  park(6, 29, 1906, 'Mesa Verde National Park is established to preserve cultural treasures.'),
  { month: 7, day: 20, year: 1969, description: 'Apollo 11 lands on the Moon, a giant milestone in exploration.', category: 'space', templates: ['baby', 'travel', 'family'], source: 'https://www.nasa.gov/mission/apollo-11/' },
  park(7, 12, 1909, 'Oregon Caves becomes a national monument.'),
  park(8, 10, 1936, 'Joshua Tree is protected as a national monument.'),
  park(8, 7, 1961, 'Cape Cod National Seashore is established.'),
  park(9, 25, 1890, 'Sequoia National Park is established.'),
  park(9, 27, 1890, 'Rock Creek Park is established in Washington, D.C.'),
  park(10, 1, 1890, 'Yosemite National Park is established.'),
  park(10, 2, 1968, 'Redwood National Park is established.'),
  park(11, 21, 1925, 'Lava Beds becomes a national monument.'),
  park(11, 14, 1936, 'Catoctin is established as a recreation area, later becoming a park.'),
  { month: 12, day: 17, year: 1903, description: 'The Wright brothers make their first powered airplane flights.', category: 'science', templates: ['baby', 'travel', 'family'], source: 'https://www.nasa.gov/history/120-years-ago-the-first-powered-flight-at-kitty-hawk/' },
  park(12, 8, 1906, 'Petrified Forest is protected as a national monument.'),
];

const getTheme = (template: string) => /pet|paw|animal/i.test(template) ? 'pets' : /travel|adventure/i.test(template) ? 'travel' : /baby/i.test(template) ? 'baby' : /holiday/i.test(template) ? 'holidays' : 'family';

export function getEventsForDate(month: number, day: number, count = 3, template = 'family'): HistoricalEvent[] {
  const theme = getTheme(template);
  return historicalEvents.filter(event => event.month === month && event.day === day)
    .sort((a, b) => Number(b.templates.includes(theme)) - Number(a.templates.includes(theme)))
    .slice(0, Math.max(0, count));
}

export function getHistorySelection(date: Date, template = 'family') {
  if (Number.isNaN(date.getTime())) return { exact: [], nearby: [] };
  const exact = getEventsForDate(date.getMonth() + 1, date.getDate(), 3, template);
  const nearby = historicalEvents.filter(event => event.month === date.getMonth() + 1 && !exact.includes(event))
    .sort((a, b) => Number(b.templates.includes(getTheme(template))) - Number(a.templates.includes(getTheme(template))))
    .slice(0, 3 - exact.length);
  return { exact, nearby };
}
