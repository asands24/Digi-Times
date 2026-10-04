import { useState } from 'react';
import { Button } from '../components/ui/button';
import { StoryPreviewDialog } from '../components/StoryPreviewDialog';
import { Reveal } from '../components/Motion';
import { newspaperSample } from '../data/newspaperSample';
import type { ArchiveItem } from '../types/story';

// Fictional fixture; only imported by the development branch in App.tsx.
const samples: ArchiveItem[] = newspaperSample.map(story => ({
  ...story, created_by: 'motion-fixture', updated_at: story.created_at,
  template_id: 'family-memories', image_path: null, photo_id: null,
  is_public: false, public_slug: null, isSample: true,
}));
export default function DebugMotion() {
  const [selected, setSelected] = useState<ArchiveItem | null>(null);
  return <main className="editorial-main"><h1>Editorial motion check</h1>
    <p>Fictional stories for reader, keyboard and mobile checks. No saved data is read or changed.</p>
    {samples.map(story => <Reveal key={story.id}><Button onClick={() => setSelected(story)}>Read {story.title}</Button></Reveal>)}
    <StoryPreviewDialog story={selected} open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }} />
  </main>;
}
