import { Link, Route, Routes } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Header } from './components/Header';
import { EventBuilder } from './components/EventBuilder';
import { StoryArchive } from './components/StoryArchive';
import { StoryPreviewDialog } from './components/StoryPreviewDialog';
import { loadStories, type ArchiveItem } from './hooks/useStoryLibrary';
import DebugEnv from './pages/DebugEnv';
import DebugTemplates from './pages/DebugTemplates';
import Logout from './pages/Logout';
import Templates from './pages/Templates';
import UploadPhoto from './components/UploadPhoto';
import PhotoGallery from './components/PhotoGallery';

function HomePage() {
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

export default function App() {
  return (
    <>
      <nav style={{ display: 'flex', gap: 12, padding: 12, flexWrap: 'wrap' }}>
        <Link to="/">Home</Link>
        <Link to="/templates">Templates</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/debug/env">Debug Env</Link>
        <Link to="/debug/templates">Debug Templates</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/upload" element={<UploadPhoto />} />
        <Route path="/gallery" element={<PhotoGallery />} />
        <Route path="/debug/env" element={<DebugEnv />} />
        <Route path="/debug/templates" element={<DebugTemplates />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}
