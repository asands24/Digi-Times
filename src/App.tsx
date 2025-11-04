import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Header } from './components/Header';
import { EventBuilder } from './components/EventBuilder';
import { StoryArchive } from './components/StoryArchive';
import { StoryPreviewDialog } from './components/StoryPreviewDialog';
import { loadStories, type ArchiveItem } from './hooks/useStoryLibrary';

export default function App() {
  const [stories, setStories] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewStory, setPreviewStory] = useState<ArchiveItem | null>(null);

  const refreshArchive = useCallback(async () => {
    setLoading(true);
    try {
      const items = await loadStories();
      setStories(items);
    } catch (error) {
      console.error('Failed to load archive', error);
      toast.error('Could not load archive.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshArchive();
  }, [refreshArchive]);

  return (
    <div className="app-shell">
      <Header />
      <main className="editorial-main">
        <EventBuilder
          onArchiveSaved={async () => {
            await refreshArchive();
          }}
        />
        <StoryArchive
          stories={stories}
          loading={loading}
          onPreview={(story) => setPreviewStory(story)}
          onRefresh={refreshArchive}
        />
      </main>
      <StoryPreviewDialog
        story={previewStory}
        open={Boolean(previewStory)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewStory(null);
          }
        }}
      />
    </div>
  );
}
