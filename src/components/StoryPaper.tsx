import { sanitizeHtml, escapeHtml } from '../utils/sanitizeHtml';
import { storyPhotos, type StoryPhoto } from '../lib/storyPhotos';
import { OnThisDayBox } from './OnThisDayBox';

interface StoryPaperProps {
  headline: string;
  body: string;
  imageUrl?: string | null;
  imageUrls?: StoryPhoto[];
  date?: string;
  templateName?: string;
  byline?: string;
  showHistory?: boolean;
}

export function StoryPaper({ headline, body, imageUrl, imageUrls, date, templateName = 'Family edition', byline = 'By the DigiTimes family desk', showHistory = true }: StoryPaperProps) {
  const parsed = date ? new Date(date) : new Date();
  const storyDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const edition = /pet|paw/i.test(templateName) ? 'pets' : /travel|adventure/i.test(templateName) ? 'travel' : /baby/i.test(templateName) ? 'baby' : /holiday/i.test(templateName) ? 'holidays' : 'family';
  return (
    <article className="story-paper ink-reveal" data-edition={edition}>
      <div className="story-paper__edition"><span>{templateName}</span><span>A memory worth keeping</span></div>
      <div className="story-paper__masthead">DigiTimes</div>
      <div className="story-paper__date">The newspaper of your life · {storyDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
      <h2>{headline || 'Your next great headline'}</h2>
      <p className="story-paper__byline">{byline}</p>
      <div className="story-paper__photos">{storyPhotos({ imageUrl, imageUrls }).map((photo, index) => <figure key={`${index}-${photo.url}`}><img src={photo.url} alt={index === 0 ? headline || 'A memory' : `${headline || 'A memory'} — photo ${index + 1}`} /><figcaption>From the photo album · {index + 1}</figcaption></figure>)}</div>
      <div className="story-paper__body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) || `<p>${escapeHtml('Your story will appear here.')}</p>` }} />
      {showHistory && <OnThisDayBox date={storyDate} template={templateName} />}
      <footer>Small moments. Big headlines. Cherished forever.</footer>
    </article>
  );
}
