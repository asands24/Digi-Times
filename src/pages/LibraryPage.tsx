import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { StoryArchive } from '../components/StoryArchive';
import { StoryPreviewDialog } from '../components/StoryPreviewDialog';
import { useAuth } from '../providers/AuthProvider';
import { useStoryLibrary, updateStoryVisibility, type ArchiveItem } from '../hooks/useStoryLibrary';

export default function LibraryPage() {
  const { user } = useAuth();
  const { stories, isLoading, errorMessage, refreshStories, deleteStory, loadMore, hasMore } = useStoryLibrary(user?.id);
  const [previewStory, setPreviewStory] = useState<ArchiveItem | null>(null);
  const toggleShare = useCallback(async (id: string, nextValue: boolean) => {
    try {
      await updateStoryVisibility(id, nextValue);
      await refreshStories();
      toast.success(nextValue ? 'Story is now public.' : 'Story set to private.');
    } catch (error) {
      console.error('Failed to update visibility', error);
      toast.error('Could not update sharing setting.');
    }
  }, [refreshStories]);

  return <div className="app-shell">
    <Header />
    <main id="library-content" tabIndex={-1} className="workspace-main">
      <header className="workspace-heading"><p className="editorial-kicker">Your newsroom</p><h1>Story library</h1><p>Revisit a memory, share a story, or bring a collection together in an issue.</p></header>
      <StoryArchive stories={stories} isLoading={isLoading} errorMessage={errorMessage} onPreview={setPreviewStory} onRefresh={refreshStories} onToggleShare={toggleShare} onDelete={deleteStory} onLoadMore={loadMore} hasMore={hasMore} />
    </main>
    <StoryPreviewDialog story={previewStory} open={Boolean(previewStory)} onOpenChange={open => { if (!open) setPreviewStory(null); }} />
  </div>;
}
