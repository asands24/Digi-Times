// Curated positive historical events for "On This Day" feature
// Organized by month and day, focusing on uplifting moments in history

export interface HistoricalEvent {
  month: number; // 1-12
  day: number; // 1-31
  year: number;
  description: string;
  category: 'science' | 'humanitarian' | 'cultural' | 'space' | 'environmental' | 'wholesome';
  templates: ('family' | 'baby' | 'pets' | 'travel' | 'memories')[];
}

export const historicalEvents: HistoricalEvent[] = [
  // January
  { month: 1, day: 1, year: 2000, description: "The world celebrates the new millennium with joy and hope", category: 'cultural', templates: ['family', 'memories'] },
  { month: 1, day: 1, year: 1863, description: "Emancipation Proclamation takes effect, declaring freedom for enslaved people", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 1, day: 15, year: 2001, description: "Wikipedia launches, democratizing access to knowledge worldwide", category: 'cultural', templates: ['family', 'travel', 'memories'] },
  { month: 1, day: 20, year: 1981, description: "Iranian hostages released after 444 days, reuniting with their families", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 1, day: 27, year: 1945, description: "Auschwitz concentration camp liberated, ending years of suffering", category: 'humanitarian', templates: ['memories'] },
  
  // February
  { month: 2, day: 6, year: 1952, description: "Queen Elizabeth II ascends to the throne, beginning a historic reign", category: 'cultural', templates: ['family', 'memories'] },
  { month: 2, day: 11, year: 1990, description: "Nelson Mandela released from prison after 27 years", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 2, day: 14, year: 1876, description: "Alexander Graham Bell files patent for the telephone, connecting humanity", category: 'science', templates: ['family', 'memories'] },
  { month: 2, day: 20, year: 1962, description: "John Glenn becomes first American to orbit Earth", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 2, day: 28, year: 1953, description: "Watson and Crick discover DNA double helix structure", category: 'science', templates: ['family', 'memories'] },
  
  // March
  { month: 3, day: 10, year: 1876, description: "First successful telephone call made by Alexander Graham Bell", category: 'science', templates: ['family', 'memories'] },
  { month: 3, day: 15, year: 2019, description: "Global climate strikes inspire millions of young people worldwide", category: 'environmental', templates: ['family', 'travel'] },
  { month: 3, day: 20, year: 2015, description: "Solar eclipse viewed by millions across Europe", category: 'wholesome', templates: ['family', 'travel', 'memories'] },
  { month: 3, day: 22, year: 1933, description: "First drive-in theater opens, creating new family entertainment", category: 'cultural', templates: ['family', 'memories'] },
  { month: 3, day: 31, year: 1889, description: "Eiffel Tower officially opens in Paris", category: 'cultural', templates: ['family', 'travel', 'memories'] },
  
  // April
  { month: 4, day: 7, year: 1969, description: "Internet's symbolic birth date (publication of RFC 1)", category: 'science', templates: ['family', 'memories'] },
  { month: 4, day: 12, year: 1961, description: "Yuri Gagarin becomes first human in space", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 4, day: 15, year: 2019, description: "First image of a black hole captured, revealing cosmic wonder", category: 'science', templates: ['family', 'travel', 'memories'] },
  { month: 4, day: 22, year: 1970, description: "First Earth Day celebrated, inspiring environmental awareness", category: 'environmental', templates: ['family', 'travel', 'memories'] },
  { month: 4, day: 30, year: 1789, description: "George Washington inaugurated as first U.S. President", category: 'cultural', templates: ['family', 'memories'] },
  
  // May
  { month: 5, day: 5, year: 1961, description: "Alan Shepard becomes first American in space", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 5, day: 8, year: 1945, description: "V-E Day celebrated, marking end of World War II in Europe", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 5, day: 14, year: 1796, description: "Edward Jenner administers first smallpox vaccination", category: 'science', templates: ['family', 'baby', 'memories'] },
  { month: 5, day: 20, year: 1927, description: "Charles Lindbergh begins first solo transatlantic flight", category: 'wholesome', templates: ['family', 'travel', 'memories'] },
  { month: 5, day: 29, year: 1953, description: "Edmund Hillary and Tenzing Norgay summit Mount Everest", category: 'wholesome', templates: ['family', 'travel', 'memories'] },
  
  // June
  { month: 6, day: 5, year: 1947, description: "Marshall Plan announced, helping rebuild post-war Europe", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 6, day: 12, year: 1987, description: "President Reagan calls for Berlin Wall to be torn down", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 6, day: 18, year: 1983, description: "Sally Ride becomes first American woman in space", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 6, day: 21, year: 2004, description: "SpaceShipOne completes first private spaceflight", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 6, day: 26, year: 1997, description: "Harry Potter first published, enchanting readers worldwide", category: 'cultural', templates: ['family', 'baby', 'memories'] },
  
  // July
  { month: 7, day: 4, year: 1776, description: "United States Declaration of Independence signed", category: 'cultural', templates: ['family', 'memories'] },
  { month: 7, day: 17, year: 1955, description: "Disneyland opens in California, bringing joy to millions", category: 'cultural', templates: ['family', 'baby', 'travel'] },
  { month: 7, day: 20, year: 1969, description: "Apollo 11 lands on the Moon, Neil Armstrong walks on lunar surface", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 7, day: 25, year: 1978, description: "First IVF baby born, bringing hope to families worldwide", category: 'science', templates: ['family', 'baby', 'memories'] },
  { month: 7, day: 31, year: 1971, description: "Apollo 15 astronauts drive on the Moon", category: 'space', templates: ['family', 'travel', 'memories'] },
  
  // August
  { month: 8, day: 6, year: 1945, description: "Baseball Hall of Fame welcomes first African American players", category: 'cultural', templates: ['family', 'memories'] },
  { month: 8, day: 12, year: 1981, description: "IBM Personal Computer introduced, democratizing computing", category: 'science', templates: ['family', 'memories'] },
  { month: 8, day: 15, year: 1969, description: "Woodstock Music Festival begins, celebrating peace and love", category: 'cultural', templates: ['family', 'travel', 'memories'] },
  { month: 8, day: 24, year: 2006, description: "Pluto reclassified, sparking global science conversation", category: 'science', templates: ['family', 'memories'] },
  { month: 8, day: 28, year: 1963, description: "Martin Luther King Jr. delivers 'I Have a Dream' speech", category: 'humanitarian', templates: ['family', 'memories'] },
  
  // September
  { month: 9, day: 2, year: 1945, description: "World War II officially ends, bringing peace to millions", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 9, day: 12, year: 1962, description: "JFK announces Moon mission goal, inspiring a generation", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 9, day: 15, year: 1935, description: "Nuremberg Laws repealed after World War II", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 9, day: 20, year: 1964, description: "The Beatles appear on Ed Sullivan Show, changing music forever", category: 'cultural', templates: ['family', 'memories'] },
  { month: 9, day: 25, year: 2015, description: "UN adopts Sustainable Development Goals for better world", category: 'environmental', templates: ['family', 'travel', 'memories'] },
  
  // October
  { month: 10, day: 1, year: 1971, description: "Walt Disney World opens in Florida", category: 'cultural', templates: ['family', 'baby', 'travel'] },
  { month: 10, day: 4, year: 1957, description: "Sputnik 1 launches, beginning the space age", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 10, day: 16, year: 1962, description: "Cuban Missile Crisis resolved peacefully", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 10, day: 24, year: 1945, description: "United Nations officially established for world peace", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 10, day: 28, year: 1886, description: "Statue of Liberty dedicated in New York Harbor", category: 'cultural', templates: ['family', 'travel', 'memories'] },
  
  // November
  { month: 11, day: 9, year: 1989, description: "Berlin Wall falls, reuniting families and nations", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 11, day: 11, year: 1918, description: "World War I ends, bringing peace to Europe", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 11, day: 17, year: 1970, description: "Soviet Union lands first robotic rover on another world", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 11, day: 20, year: 1998, description: "International Space Station construction begins", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 11, day: 27, year: 1968, description: "First successful Mars flyby beams back images", category: 'space', templates: ['family', 'travel', 'memories'] },
  
  // December
  { month: 12, day: 1, year: 1955, description: "Rosa Parks sparks civil rights movement with bus stand", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 12, day: 10, year: 1948, description: "UN adopts Universal Declaration of Human Rights", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 12, day: 17, year: 1903, description: "Wright Brothers achieve first powered flight", category: 'science', templates: ['family', 'travel', 'memories'] },
  { month: 12, day: 21, year: 1968, description: "Apollo 8 astronauts become first humans to orbit the Moon", category: 'space', templates: ['family', 'travel', 'memories'] },
  { month: 12, day: 25, year: 1914, description: "WWI Christmas Truce brings brief peace to battlefields", category: 'humanitarian', templates: ['family', 'memories'] },
  
  // Additional events spread across the year
  { month: 1, day: 10, year: 1946, description: "First General Assembly of United Nations convenes", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 2, day: 4, year: 2004, description: "Facebook launches, connecting billions worldwide", category: 'cultural', templates: ['family', 'memories'] },
  { month: 3, day: 3, year: 1931, description: "Star-Spangled Banner becomes U.S. national anthem", category: 'cultural', templates: ['family', 'memories'] },
  { month: 4, day: 4, year: 1973, description: "World Trade Center Twin Towers officially open", category: 'cultural', templates: ['family', 'travel', 'memories'] },
  { month: 5, day: 25, year: 1977, description: "Star Wars premieres, inspiring generations", category: 'cultural', templates: ['family', 'baby', 'memories'] },
  { month: 6, day: 6, year: 1944, description: "D-Day landings begin liberation of Europe", category: 'humanitarian', templates: ['family', 'memories'] },
  { month: 7, day: 7, year: 2005, description: "London wins 2012 Olympics bid, celebrating sport", category: 'cultural', templates: ['family', 'travel', 'memories'] },
  { month: 8, day: 8, year: 2008, description: "Beijing Olympics opening ceremony amazes world", category: 'cultural', templates: ['family', 'travel', 'memories'] },
  { month: 9, day: 9, year: 1956, description: "Elvis Presley appears on Ed Sullivan Show", category: 'cultural', templates: ['family', 'memories'] },
  { month: 10, day: 10, year: 1913, description: "Panama Canal opens, connecting two oceans", category: 'wholesome', templates: ['family', 'travel', 'memories'] },
  { month: 11, day: 24, year: 1859, description: "Darwin publishes On the Origin of Species", category: 'science', templates: ['family', 'pets', 'memories'] },
  { month: 12, day: 31, year: 1999, description: "World celebrates new millennium with hope and excitement", category: 'cultural', templates: ['family', 'memories'] },
];

/**
 * Get historical events for a specific date
 * @param month Month (1-12)
 * @param day Day of month (1-31)
 * @param count Number of events to return (default 4, randomized if more available)
 * @returns Array of historical events
 */
export function getEventsForDate(month: number, day: number, count: number = 4): HistoricalEvent[] {
  const matchingEvents = historicalEvents.filter(
    event => event.month === month && event.day === day
  );
  
  if (matchingEvents.length <= count) {
    return matchingEvents;
  }
  
  // Randomize and return requested count
  const shuffled = [...matchingEvents].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
