interface StoryGeneratorOptions {
  prompt?: string;
  fileName?: string;
  capturedAt?: Date;
  templateName?: string;
  storyIndex?: number;
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
      'At {location}, everyone gathered for {subjectLower}. The room filled with happy cheers and big smiles as the celebration began.',
      'The party started with excitement as {subjectLower} brought together family and friends for a special day no one will forget.',
      'Tables were set and lights were bright as {subjectLower} kicked off, with every person there ready to celebrate something amazing.',
    ],
    developments: [
      'People shared fun stories and memories, laughing about good times and making new ones. Music played while everyone enjoyed being together.',
      'Cameras clicked as families posed for pictures. There were favorite foods, sing-alongs, and lots of hugs all around.',
      'Kids played games while grown-ups chatted. Everyone agreed this was a celebration worth remembering.',
    ],
    closings: [
      'When the party ended, everyone knew this was a day they would talk about for a long time. Smiles were everywhere.',
      'As the celebration wrapped up, families promised to get together again soon. {subjectLower} was a huge success.',
      'The evening ended with happy hearts. This {tonal} celebration brought everyone closer together.',
    ],
    quotes: [
      '"This is why we love getting together as a family," said one happy cousin with a big smile.',
      '"Today was so special. We\'ll remember this forever," said a family member.',
      '"We didn\'t just have a party—we made memories that will last a lifetime," said one guest.',
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
      'The adventure began early in the morning as {subjectLower} started. Everyone was excited to explore new places and see amazing sights.',
      'With maps in hand and backpacks ready, {subjectLower} kicked off. The team was pumped for the journey ahead.',
      'The day started perfectly for {subjectLower}. Clear skies and a good trail made everyone smile.',
    ],
    developments: [
      'The explorers hiked up hills, crossed streams, and took tons of photos. They helped each other over tricky spots and cheered when they reached the top.',
      'Along the way, everyone shared stories about past adventures. They munched on trail snacks and laughed at funny moments.',
      'The team worked together like pros, setting up camp and cooking dinner as the sun started to set.',
    ],
    closings: [
      'By the end of the day, everyone was tired but happy. They had explored amazing places and made great memories.',
      'As night fell, the adventurers agreed: this was just the first of many trips. {subjectLower} was a big win.',
      'Heading home, every member of the team felt proud. They had conquered the trail and had an awesome time doing it.',
    ],
    quotes: [
      '"We came for the adventure and got way more than we expected," said one explorer looking at photos.',
      '"This was so cool! I can\'t wait for the next trip," said the team leader with a grin.',
      '"The trail was tough but totally worth it. We did it!" said one hiker proudly.',
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
      'When {subjectLower} started, neighbors came together with big plans. Everyone wanted to help make the community better.',
      'The street filled with people as {subjectLower} brought out families and friends. Everyone had a job to do.',
      'Colorful banners waved as {subjectLower} turned the neighborhood into a celebration of teamwork.',
    ],
    developments: [
      'Kids made posters and painted signs while grown-ups organized games and activities. Everyone pitched in.',
      'Music played between raffles and games. People shared ideas about how to make the next event even better.',
      'Handmade decorations filled the area. Neighbors who just met became friends, all working toward the same goal.',
    ],
    closings: [
      'When the event ended, the clean-up crew worked together perfectly. Everyone felt proud of what they built.',
      'Before leaving, neighbors already started planning the next gathering. This was just the beginning.',
      'As the music faded, the community spirit stayed strong. This neighborhood knows how to come together.',
    ],
    quotes: [
      '"We helped each other and that\'s what matters most," said one volunteer while cleaning up.',
      '"Everyone worked together to make this happen. That\'s what community is all about," said the event organizer.',
      '"This was amazing! I hope we do it again soon," said a young helper.',
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
      'Today, {subjectLower} caught everyone\'s attention. It was one of those special moments worth remembering.',
      'With a quick snap of the camera, {subjectLower} became an instant classic. This moment was too good not to share.',
      'What seemed like a normal day turned into something amazing when {subjectLower} happened.',
    ],
    developments: [
      'Every small detail made this moment special. Smiles, gestures, and happy faces filled the scene.',
      'People watching knew they were seeing something great. This was a moment families would talk about for years.',
      'What started as a simple photo turned into a memory everyone wanted to keep forever.',
    ],
    closings: [
      'Even after the camera stopped clicking, people kept talking about it. {subjectLower} was truly special.',
      'This story ends here, but the memory will last forever. It\'s ready for the family photo album.',
      'In the book of family memories, {subjectLower} just earned its own chapter and a big headline.',
    ],
    quotes: [
      '"I knew this moment was special and wanted to capture it," said the photographer.',
      '"This is exactly what makes a great story," said someone reviewing the photo.',
      '"We might forget some details, but we\'ll always remember how this felt," said a family member.',
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

const FALLBACK_SUBJECTS = [
  'Front Page Moment',
  'Neighborhood Chronicle',
  'Family Spotlight',
  'Morning Edition Feature',
  'Evening Dispatch',
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
  console.log('[StoryGenerator] 📝 Starting article generation', {
    hasPrompt: !!options.prompt,
    promptLength: options.prompt?.length ?? 0,
    fileName: options.fileName,
    templateName: options.templateName,
    storyIndex: options.storyIndex,
  });
  const prompt = sanitize(options.prompt);
  const fileName =
    sanitize(options.fileName?.replace(/\.[^.]+$/, '')) || 'family moment';
  const looksGeneric =
    /^((img|dsc|photo|p|image)[-_]?\d+)$/i.test(fileName) ||
    fileName.replace(/\s+/g, '').length <= 2;
  const baseSeed = computeSeed(prompt || 'family moment', fileName);
  const fallbackSubject = pick(FALLBACK_SUBJECTS, baseSeed, 0);
  let combinedSubject =
    prompt ||
    (!looksGeneric ? fileName : '') ||
    fallbackSubject ||
    'Front Page Moment';
  const seed = baseSeed + (options.storyIndex ?? 0);
  const palette = detectPalette(prompt);
  console.log('[StoryGenerator] 🎨 Detected story palette', {
    paletteId: palette.id,
    paletteKeywords: palette.keywords,
  });

  const subject = toTitleCase(
    combinedSubject
      .split(' ')
      .slice(0, 6)
      .join(' ')
      .trim() || fallbackSubject,
  );
  const subjectLower = subject.toLowerCase();

  console.log('[StoryGenerator] 📰 Generated subject', {
    subject,
    usedFallback: combinedSubject === fallbackSubject,
  });

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

  const layoutPhrase = options.templateName
    ? `Presented in the ${options.templateName} layout.`
    : '';

  const subheadline = subheadlineTemplate
    .replace('{subject}', subject)
    .replace('{subjectLower}', subjectLower)
    .replace('{tonal}', tonal);

  const article = {
    headline,
    subheadline: layoutPhrase
      ? `${subheadline} ${layoutPhrase}`.trim()
      : subheadline,
    byline,
    dateline,
    body: [
      opener,
      development,
      layoutPhrase ? `${closing} ${layoutPhrase}`.trim() : closing,
    ],
    quote,
    tags: palette.tags,
  };

  console.log('[StoryGenerator] ✅ Article generation complete', {
    headline: article.headline,
    bodyParagraphs: article.body.length,
    tags: article.tags,
  });

  return article;
};

export type { GeneratedArticle };

const buildLocalStoryText = (article: GeneratedArticle) =>
  [
    article.headline,
    article.subheadline,
    article.body.join('\n\n'),
    article.quote,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join('\n\n');

const LocalStoryGenerator = (prompt: string) => {
  const article = generateArticle({
    prompt,
    fileName: prompt,
    capturedAt: new Date(),
  });
  return buildLocalStoryText(article);
};

export async function generateStoryWithOpenAI(prompt: string): Promise<string> {
  console.log('[StoryGenerator] 🤖 Calling OpenAI API...', {
    promptLength: prompt.length,
    endpoint: '/.netlify/functions/generateStory',
  });

  const startTime = Date.now();
  const res = await fetch('/.netlify/functions/generateStory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });
  const duration = Date.now() - startTime;

  console.log('[StoryGenerator] 📡 OpenAI API response received', {
    status: res.status,
    statusText: res.statusText,
    duration,
    ok: res.ok,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error('[StoryGenerator] ❌ OpenAI API error', {
      status: res.status,
      statusText: res.statusText,
      errorText,
      duration,
    });
    throw new Error('Failed to generate story with OpenAI');
  }

  const data = (await res.json()) as { article?: string };
  if (!data || typeof data.article !== 'string' || !data.article.trim()) {
    console.error('[StoryGenerator] ❌ Invalid OpenAI response payload', {
      hasData: !!data,
      hasArticle: !!data?.article,
      articleType: typeof data?.article,
      articleLength: data?.article?.length ?? 0,
    });
    throw new Error('Invalid story payload from OpenAI');
  }

  console.log('[StoryGenerator] ✅ OpenAI story generated successfully', {
    articleLength: data.article.length,
    duration,
  });

  return data.article.trim();
}

export async function generateStoryFromPrompt(prompt: string): Promise<string> {
  console.log('[StoryGenerator] 🚀 generateStoryFromPrompt called', {
    promptLength: prompt.length,
  });

  const trimmed = prompt.trim();
  if (!trimmed) {
    console.error('[StoryGenerator] ❌ Empty prompt provided');
    throw new Error('Prompt is empty');
  }

  try {
    console.log('[StoryGenerator] 🔄 Attempting OpenAI generation...');
    const article = await generateStoryWithOpenAI(trimmed);
    console.log('[StoryGenerator] ✅ Using OpenAI-generated story');
    return article;
  } catch (err) {
    console.warn('[StoryGenerator] ⚠️ OpenAI failed, falling back to local generator', {
      error: err,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    const fallbackArticle = LocalStoryGenerator(trimmed);
    console.log('[StoryGenerator] ✅ Using locally-generated story', {
      articleLength: fallbackArticle.length,
    });
    return fallbackArticle;
  }
}

export const toStoryParagraphs = (text: string): string[] => {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
};

export const toEditableBody = (article: GeneratedArticle): string => {
  return article.body.join('\n\n');
};

export const parseBodyDraft = (draft: string | undefined, originalBody: string[]): string[] => {
  if (!draft) return originalBody;
  return toStoryParagraphs(draft);
};

export const buildBodyHtml = (article: GeneratedArticle): string => {
  return article.body.map(p => `<p>${p}</p>`).join('');
};
