interface StoryGeneratorOptions {
  prompt?: string;
  fileName?: string;
  capturedAt?: Date;
}

interface GeneratedArticle {
  headline: string;
  subheadline: string;
  byline: string;
  dateline: string;
  body: string[];
  quote: string;
  tags: string[];
}

interface StoryPalette {
  id: string;
  keywords: string[];
  headline: string[];
  subheadline: string[];
  openers: string[];
  developments: string[];
  closings: string[];
  quotes: string[];
  tags: string[];
  locations: string[];
  tones: string[];
}

const storyPalettes: StoryPalette[] = [
  {
    id: 'celebration',
    keywords: [
      'celebrat',
      'birthday',
      'anniversary',
      'wedding',
      'party',
      'fest',
      'toast',
      'milestone',
    ],
    headline: [
      '{subject} Marks a {tonal} Milestone',
      '{tonal} Celebration Unites {subject}',
      '{subject} Honors Tradition with {tonal} Festivities',
    ],
    subheadline: [
      'Family and friends gather as {subjectLower} fills the air with joy.',
      'A {tonal} evening blends heartfelt speeches and warm embraces.',
      'Generations convene to witness {subjectLower} remembered in print.',
    ],
    openers: [
      'Against a backdrop of {location}, the gathering unfolded like a keepsake in motion, every cheer a ribbon of memory for {subjectLower}.',
      'It began with a quiet hush before the applause, as {subjectLower} welcomed loved ones into a night tailored for remembrance.',
      'Long tables gleamed beneath soft lights while {subjectLower} anchored the room, each smile a thread stitching the family lore.',
    ],
    developments: [
      'Guests traded stories that spanned decades, weaving together a living scrapbook dotted with inside jokes, shared tears, and a few well-loved songs.',
      'Cameras flashed as heirloom recipes and improvised playlists merged into a soundtrack that could only belong to this family.',
      'Children darted between grandparents while the honorees lingered mid-room, soaking in the reverent laughter that followed every toast.',
    ],
    closings: [
      'By the final clinking of glasses, the room agreed on one certainty: this moment will be recounted for years, each retelling a little brighter.',
      'As candles dwindled, promises rose—to meet again, to keep traditions alive, and to ensure {subjectLower} remains headline news in the family archive.',
      'When the evening dissolved into late-night coffees, the story had already entered the family record: a {tonal} celebration bound by affection.',
    ],
    quotes: [
      '“Nights like these remind us why we keep gathering, no matter how full the calendar looks,” shared a beaming cousin.',
      '“You could feel the past and future shaking hands—this is one for the front page,” said the family matriarch.',
      '“We didn’t just celebrate—we made a promise to remember,” whispered an attendee between hugs.',
    ],
    tags: ['Celebrations', 'Family Archive', 'Milestones'],
    locations: [
      'Aurora Ballroom',
      'Willow & Vine Social Club',
      'Harborlight Conservatory',
      'Crescent Hall',
      'Celestial Terrace',
    ],
    tones: ['glittering', 'nostalgic', 'heartfelt', 'radiant'],
  },
  {
    id: 'adventure',
    keywords: [
      'travel',
      'adventure',
      'journey',
      'hike',
      'trail',
      'road trip',
      'explor',
      'camp',
      'voyage',
    ],
    headline: [
      '{subject} Charts a {tonal} Course',
      'Trailblazers Capture {tonal} Expedition',
      '{tonal} Horizons Beckon as {subject} Unfolds',
    ],
    subheadline: [
      'A field team chronicles {subjectLower}, trading comforts for unforgettable vistas.',
      'Maps, laughter, and a few daring detours define the {tonal} outing.',
      'The expedition reads like a serialized epic, each vista fueling the next plot twist.',
    ],
    openers: [
      'Morning mist lifted just as {subjectLower} pushed off, boots crunching over gravel that hadn’t seen this much excitement in years.',
      'They plotted the route on napkins and intuition, and when {subjectLower} began, the horizon obliged with a postcard in every direction.',
      'Compass needles steadied while {subjectLower} marched forward, the kind of day when clouds offer applause and the wind writes captions.',
    ],
    developments: [
      'What followed were trail markers of perseverance: makeshift bridges, summit selfies, and the quick choreography of setting up camp before dusk.',
      'Between the miles, they swapped legends of past treks, each tale fueling the next climb up uncharted ridges.',
      'The crew embraced trail etiquette and spirited debate over who packed the better snacks, settling it with panoramic peace offerings.',
    ],
    closings: [
      'By the time twilight painted the sky, they carried more than souvenirs—they carried a story ready-made for tomorrow’s briefing.',
      'When the last ember dimmed, a new vow ignited: {subjectLower} is only chapter one.',
      'As they traced their steps back to base, every tired muscle was balanced by the boldness of a fresh headline.',
    ],
    quotes: [
      '“We came for the views and left with a manifesto,” laughed one explorer while reviewing the day’s snapshots.',
      '“If this is what adventure looks like, give me the assignment every week,” said the team lead, only half joking.',
      '“The trail gave us everything—including a better version of ourselves,” remarked a hiker while coiling rope.',
    ],
    tags: ['Adventure Log', 'Field Notes', 'On Assignment'],
    locations: [
      'Ridgepoint Overlook',
      'Summit Station',
      'Solstice Canyon',
      'Echo Valley Outpost',
      'Lantern Pass Shelter',
    ],
    tones: ['trailblazing', 'skyline', 'untamed', 'windswept'],
  },
  {
    id: 'community',
    keywords: [
      'community',
      'neighbors',
      'volunteer',
      'school',
      'parade',
      'local',
      'fundraiser',
      'block party',
      'market',
    ],
    headline: [
      '{subject} Builds a {tonal} Commons',
      'Neighbors Rally as {subject} Takes Center Stage',
      '{subject} Threads a {tonal} Community Story',
    ],
    subheadline: [
      'Unity headlines the day as {subjectLower} sparks fresh connections.',
      'Shared purpose and homemade banners anchor the {tonal} initiative.',
      'The gathering reaffirms a simple truth: {subjectLower} thrives when told together.',
    ],
    openers: [
      'From the moment the first folding chair unfolded, {subjectLower} felt destined for the society page.',
      'The street transformed into a living newsroom, each neighbor supplying a quote, a smile, and a potluck dish.',
      'Bunting waved overhead while {subjectLower} turned volunteers into hometown heroes.',
    ],
    developments: [
      'Craft tables doubled as planning desks while kids drafted chalk manifestos that the adults happily endorsed.',
      'Between the music sets and raffle calls, organizers scribbled down lessons for the next neighborhood headline.',
      'A pop-up gallery of handmade posters narrated the mission, and passersby signed their names beneath each declaration.',
    ],
    closings: [
      'By dusk the clean-up crew worked in harmony, proof that shared stories keep streets lit long after the event.',
      'They promised to reconvene, already debating the theme for the sequel headline.',
      'When the last chord faded, the sense of purpose stayed put, ready for the next edition.',
    ],
    quotes: [
      '“We showed up for each other—and that’s the story I want my kids to read,” said a volunteer while stacking chairs.',
      '“Every neighbor brought a headline; together we printed a legacy,” smiled the event lead.',
      '“This isn’t just a day—it’s the prologue to our next chapter,” declared a student emcee.',
    ],
    tags: ['Community Desk', 'Local Spotlight', 'Civic Pride'],
    locations: [
      'Market Square Pavilion',
      'Maple & Fifth Commons',
      'Riverside Green',
      'Unity Hall Atrium',
      'Brighton Lane Courtyard',
    ],
    tones: ['neighborly', 'uplifting', 'bright', 'civic'],
  },
  {
    id: 'spotlight',
    keywords: [],
    headline: [
      '{subject} Captures a {tonal} Moment in Time',
      'All Eyes on {subject} in {tonal} Feature',
      '{subject} Inspires a {tonal} Chronicle',
    ],
    subheadline: [
      'A quiet scene becomes headline news as {subjectLower} unfolds.',
      'Details and expressions combine to deliver a {tonal} portrait.',
      'The lens captures more than light—it preserves {subjectLower}.',
    ],
    openers: [
      'Sometimes the newsroom hushes when a single image arrives, and tonight {subjectLower} delivered that pause.',
      'With a gentle click of the shutter, {subjectLower} leapt from everyday moment to historic archive.',
      'Framed against the ordinary, {subjectLower} insisted on being anything but.',
    ],
    developments: [
      'Every detail—from the tilt of a smile to the echo of a gesture—invited editors to lean in closer.',
      'Witnesses exchanged knowing nods; this was the sort of moment that threads through generations.',
      'What began as a casual capture blossomed into a feature spread, complete with memories and meaning.',
    ],
    closings: [
      'Long after the flash faded, the newsroom buzz lingered; {subjectLower} had earned a permanent dateline.',
      'The story closes for now, sealed with ink and affection, ready for its place in the family anthology.',
      'In the ledger of family lore, {subjectLower} now owns a full column and a proud headline.',
    ],
    quotes: [
      '“I knew we were witnessing something tender, and I didn’t want it to slip away,” shared the photographer.',
      '“This is why we keep the presses running,” whispered an editor while adjusting the layout.',
      '“The details may fade, but this feeling won’t,” promised a relative nearby.',
    ],
    tags: ['Spotlight', 'Feature Desk', 'Everyday Legends'],
    locations: [
      'Atrium Newsroom',
      'Sunlit Studio',
      'Heritage Gallery',
      'Liberty Pressroom',
      'Chronicle Loft',
    ],
    tones: ['poetic', 'timeless', 'tender', 'quiet'],
  },
];

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const STAFF_BYLINES = [
  'By DigiTimes Staff Writer',
  'By Chronicle Desk',
  'By Evening Edition Team',
  'By Family Features Bureau',
];

const sanitize = (value: string | undefined) =>
  (value ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const toSentenceCase = (value: string) => {
  if (!value) {
    return '';
  }
  const normalized = value.trim();
  const firstChar = normalized.charAt(0).toUpperCase();
  return `${firstChar}${normalized.slice(1)}`;
};

const detectPalette = (text: string): StoryPalette => {
  const lowered = text.toLowerCase();
  for (const palette of storyPalettes) {
    if (palette.keywords.some((keyword) => lowered.includes(keyword))) {
      return palette;
    }
  }
  return storyPalettes.find((palette) => palette.id === 'spotlight')!;
};

const computeSeed = (prompt: string, fileName: string) => {
  const text = `${prompt}|${fileName}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pick = <T,>(items: T[], seed: number, offset: number) =>
  items[(seed + offset) % items.length];

const formatDate = (value: Date) => {
  const month = months[value.getMonth()];
  const day = value.getDate();
  const year = value.getFullYear();
  return `${month} ${day}, ${year}`;
};

export const generateArticle = (
  options: StoryGeneratorOptions,
): GeneratedArticle => {
  const prompt = sanitize(options.prompt) || 'Captured celebration';
  const fileName =
    sanitize(options.fileName?.replace(/\.[^.]+$/, '')) || 'family moment';
  const combinedSubject = prompt || fileName;
  const seed = computeSeed(prompt, fileName);
  const palette = detectPalette(prompt);
  const subject = toTitleCase(
    combinedSubject
      .split(' ')
      .slice(0, 6)
      .join(' ')
      .trim() || 'Family Spotlight',
  );
  const subjectLower = toSentenceCase(
    combinedSubject.replace(/[.?!]/g, '').toLowerCase(),
  );

  const tonal = pick(palette.tones, seed, 1);
  const headlineTemplate = pick(palette.headline, seed, 2);
  const subheadlineTemplate = pick(palette.subheadline, seed, 3);
  const opener = pick(palette.openers, seed, 4);
  const development = pick(palette.developments, seed, 5);
  const closing = pick(palette.closings, seed, 6);
  const quote = pick(palette.quotes, seed, 7);
  const location = pick(palette.locations, seed, 8);
  const byline = pick(STAFF_BYLINES, seed, 9);

  const capturedAt = options.capturedAt ?? new Date();
  const dateline = `${location.toUpperCase()} — ${formatDate(capturedAt)}`;

  const headline = headlineTemplate
    .replace('{subject}', subject)
    .replace('{subjectLower}', subjectLower)
    .replace('{tonal}', toTitleCase(tonal));

  const subheadline = subheadlineTemplate
    .replace('{subject}', subject)
    .replace('{subjectLower}', subjectLower)
    .replace('{tonal}', tonal);

  return {
    headline,
    subheadline,
    byline,
    dateline,
    body: [opener, development, closing],
    quote,
    tags: palette.tags,
  };
};

export type { GeneratedArticle };
