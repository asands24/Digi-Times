import { ArrowUpRight, Sparkles } from 'lucide-react';

// A local, decorative example: no stock-photo requests or fabricated user data.
export function EditorialCover({ onCreate }: { onCreate: () => void }) {
  return (
    <button className="editorial-cover" type="button" onClick={onCreate} aria-label="Create your own front page">
      <span className="editorial-cover__back" aria-hidden />
      <span className="editorial-cover__paper" aria-hidden>
        <span className="editorial-cover__masthead">The Everyday Times</span>
        <span className="editorial-cover__dateline">Small moments. Big stories.</span>
        <span className="editorial-cover__image">
          <img src={`${process.env.PUBLIC_URL || ''}/images/placeholders/newspaper2.jpeg`} alt="" />
          <span>A little everyday magic</span>
        </span>
        <span className="editorial-cover__headline">Life happens.<br />Make headlines.</span>
        <span className="editorial-cover__columns">
          <span>Your photos hold the stories only you can tell. Give them a place on the front page.</span>
          <span>The birthdays. The big adventures. The perfectly ordinary days worth keeping.</span>
        </span>
      </span>
      <span className="editorial-cover__badge"><Sparkles size={15} aria-hidden /> Your next keepsake <ArrowUpRight size={16} aria-hidden /></span>
    </button>
  );
}
