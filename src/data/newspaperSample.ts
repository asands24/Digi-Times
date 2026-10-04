import type { EditionStory } from '../lib/newspaperLayout';

/** Fictional development fixture for export and layout regression checks. */
export const newspaperSample: EditionStory[] = [
    { id: 'sample-one', title: 'A little adventure becomes a big family memory', article: '<p>Saturday began with a picnic blanket, a basket of sandwiches and a plan to spend the whole afternoon together. The best part was having nowhere else to be.</p><p>A small moment became the story everyone wanted to tell again at dinner. There were new discoveries, familiar jokes and enough time for one more walk before heading home.</p>', prompt: null, imageUrl: '/images/placeholders/newspapers1.jpeg', created_at: '2026-04-16T12:00:00Z' },
    { id: 'sample-two', title: 'The day we kept exploring', article: Array.from({ length: 22 }, (_, index) => `<p>Memory ${index + 1}: We followed the trail together, looking for the next small wonder. Every turn offered a new view, and every pause gave us another reason to smile. These are the details we will remember when we tell the story years from now.</p>`).join(''), prompt: null, imageUrl: null, created_at: '2026-04-16T12:00:00Z' },
    { id: 'sample-three', title: 'Back home, the celebration continued', article: '<p>After the adventure, everyone gathered at the table to share their favorite part of the day. A warm meal and a familiar room made the perfect ending.</p>', prompt: null, imageUrl: null, created_at: '2026-04-16T12:00:00Z' },
  ];
