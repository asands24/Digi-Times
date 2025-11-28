import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Header } from './components/Header';
import { EventBuilder } from './components/EventBuilder';
import { StoryArchive } from './components/StoryArchive';
import { StoryPreviewDialog } from './components/StoryPreviewDialog';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { OnboardingBanner } from './components/OnboardingBanner';
import {
  type ArchiveItem,
  updateStoryVisibility,
  useStoryLibrary,
} from './hooks/useStoryLibrary';
import Logout from './pages/Logout';
import TemplatesPage from './pages/Templates';
import UploadPhoto from './components/UploadPhoto';
import PhotoGallery from './components/PhotoGallery';
import { useAuth } from './providers/AuthProvider';
import LoginPage from './pages/LoginPage';
import { REQUIRE_LOGIN } from './lib/config';
import AuthCallback from './pages/AuthCallback';
import DebugTemplates from './pages/DebugTemplates';
import PublicStoryPage from './pages/PublicStoryPage';
import NewspaperPage from './pages/NewspaperPage';
import LandingPage from './pages/LandingPage';
const IS_DEV = process.env.NODE_ENV === 'development';

function HomePage() {
  const { user } = useAuth();
  const {
    stories,
    isLoading,
    errorMessage,
    refreshStories: refreshArchive,
    saveDraftToArchive,
  } = useStoryLibrary(user?.id);
  const [previewStory, setPreviewStory] = useState<ArchiveItem | null>(null);

  const handleToggleShare = useCallback(
    async (storyId: string, nextValue: boolean) => {
      try {
        await updateStoryVisibility(storyId, nextValue);
        await refreshArchive();
        toast.success(nextValue ? 'Story is now public.' : 'Story set to private.');
      } catch (error) {
        console.error('Failed to update visibility', error);
        toast.error('Could not update sharing setting.');
      }
    },
    [refreshArchive],
  );

  return (
    <div className="app-shell">
      <Header />
      <main className="editorial-main">
        <OnboardingBanner />
        <EventBuilder
          onArchiveSaved={async () => {
            await refreshArchive();
          }}
          hasArchivedStories={stories.length > 0}
          saveDraftToArchive={saveDraftToArchive}
        />
        <StoryArchive
          stories={stories}
          isLoading={isLoading}
          errorMessage={errorMessage}
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
      <AppErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/read/:id" element={<PublicStoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <nav style={{ display: 'flex', gap: 12, padding: 12, flexWrap: 'wrap' }}>
        <Link to="/">Home</Link>
        <Link to="/templates">Templates</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/gallery">Gallery</Link>
        {IS_DEV ? <Link to="/debug/templates">Template Debug</Link> : null}
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        {IS_DEV ? <Route path="/debug/templates" element={<DebugTemplates />} /> : null}
        <Route path="/upload" element={<UploadPhoto />} />
        <Route path="/gallery" element={<PhotoGallery />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/read/:id" element={<PublicStoryPage />} />
        <Route path="/newspaper" element={<NewspaperPage />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppErrorBoundary>
  );
}
