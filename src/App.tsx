import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Header } from './components/Header';
import { EventBuilder } from './components/EventBuilder';
import { StoryArchive } from './components/StoryArchive';
import { StoryPreviewDialog } from './components/StoryPreviewDialog';
import { loadStories, type ArchiveItem, updateStoryVisibility } from './hooks/useStoryLibrary';
import Logout from './pages/Logout';
import Templates from './pages/Templates';
import UploadPhoto from './components/UploadPhoto';
import PhotoGallery from './components/PhotoGallery';
import { useAuth } from './providers/AuthProvider';
import LoginPage from './pages/LoginPage';
import { REQUIRE_LOGIN } from './lib/config';
import AuthCallback from './pages/AuthCallback';

function HomePage() {
  const [stories, setStories] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewStory, setPreviewStory] = useState<ArchiveItem | null>(null);
  const { user } = useAuth();

  const refreshArchive = useCallback(async () => {
    if (!user) {
      setStories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const items = await loadStories(user.id);
      setStories(items ?? []);
    } catch (error) {
      console.error('Failed to load archive', error);
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't load your archive. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleToggleShare = useCallback(
    async (storyId: string, nextValue: boolean) => {
      try {
        await updateStoryVisibility(storyId, nextValue);
        setStories((prev) =>
          prev.map((story) =>
            story.id === storyId ? { ...story, is_public: nextValue } : story,
          ),
        );
        toast.success(nextValue ? 'Story is now public.' : 'Story set to private.');
      } catch (error) {
        console.error('Failed to update visibility', error);
        toast.error('Could not update sharing setting.');
      }
    },
    [],
  );

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
          onToggleShare={handleToggleShare}
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
  const { user, loading } = useAuth();

  if (REQUIRE_LOGIN && loading) {
    return (
      <div className="app-shell" style={{ padding: 32 }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (REQUIRE_LOGIN && !user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <nav style={{ display: 'flex', gap: 12, padding: 12, flexWrap: 'wrap' }}>
        <Link to="/">Home</Link>
        <Link to="/templates">Templates</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/gallery">Gallery</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/upload" element={<UploadPhoto />} />
        <Route path="/gallery" element={<PhotoGallery />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}
