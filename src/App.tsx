import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useCallback, useRef, useState, type RefObject } from 'react';
import toast from 'react-hot-toast';
import { Header } from './components/Header';
import EventBuilder from './components/EventBuilder';
import { StoryArchive } from './components/StoryArchive';
import { StoryPreviewDialog } from './components/StoryPreviewDialog';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { OnboardingBanner } from './components/OnboardingBanner';
import { Button } from './components/ui/button';
import {
  type ArchiveItem,
  updateStoryVisibility,
  useStoryLibrary,
} from './hooks/useStoryLibrary';
import Logout from './pages/Logout';
import TemplatesPage from './pages/Templates';
import PhotoGallery from './components/PhotoGallery';
import { useAuth } from './providers/AuthProvider';
import LoginPage from './pages/LoginPage';
import { REQUIRE_LOGIN } from './lib/config';
import AuthCallback from './pages/AuthCallback';
import DebugTemplates from './pages/DebugTemplates';
import PublicStoryPage from './pages/PublicStoryPage';
import { IssuesList } from './components/IssuesList';
import NewspaperPage from './pages/NewspaperPage';
const IS_DEV = process.env.NODE_ENV === 'development';

function HomePage() {
  const { user } = useAuth();
  const {
    stories,
    isLoading,
    errorMessage,
    refreshStories: refreshArchive,
    deleteStory,
    loadMore,
    hasMore,
  } = useStoryLibrary(user?.id);
  const [previewStory, setPreviewStory] = useState<ArchiveItem | null>(null);
  // Anchor points for the guided flow
  const builderRef = useRef<HTMLElement | null>(null);
  const archiveRef = useRef<HTMLElement | null>(null);

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

  const scrollToSection = useCallback((ref: RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);



  return (
    <div className="app-shell">
      <Header />
      <main className="editorial-main">
        <section className="welcome-hero">

          <div>
            <p className="welcome-hero__kicker">DigiTimes</p>
            <h1 className="welcome-hero__title">
              Turn Your Moments into Front-Page Stories
            </h1>
            <p className="welcome-hero__subtitle">
              Upload a photo → we turn it into a newspaper-style story you can save, print, or share.
              Story · Newspaper · Issue — all in one guided flow.
            </p>
            <div className="welcome-hero__actions">
              <Button size="lg" onClick={() => scrollToSection(builderRef)}>
                Create a Story
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection(archiveRef)}
              >
                View My Stories
              </Button>
            </div>
          </div>
          <div className="welcome-hero__pillars">
            <div className="welcome-hero__pillar">
              <span className="welcome-hero__pillar-icon">📰</span>
              <div>
                <h3>Front Page Ready</h3>
                <p>Serif headlines, print-worthy layouts, and a cozy masthead vibe.</p>
              </div>
            </div>
            <div className="welcome-hero__pillar">
              <span className="welcome-hero__pillar-icon">✨</span>
              <div>
                <h3>Guided in 3 Steps</h3>
                <p>Add photo, tell the story, review &amp; save — no guesswork.</p>
              </div>
            </div>
            <div className="welcome-hero__pillar">
              <span className="welcome-hero__pillar-icon">📦</span>
              <div>
                <h3>Issues to Share</h3>
                <p>Bundle stories into an issue for printing or sending to family.</p>
              </div>
            </div>
          </div>
        </section>

        <OnboardingBanner />
        <section ref={builderRef} className="creation-section">
          <EventBuilder />
        </section>
        <section ref={archiveRef} className="archive-section">
          <StoryArchive
            stories={stories}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onPreview={setPreviewStory}
            onRefresh={refreshArchive}
            onToggleShare={handleToggleShare}
            onDelete={deleteStory}
            onLoadMore={loadMore}
            hasMore={hasMore}
          />
        </section>
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
      <div className="app-shell" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--paper)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }} className="animate-bounce">📰</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            DigiTimes
          </h2>
          <p style={{ color: 'var(--ink-soft)' }}>Loading DigiTimes...</p>
        </div>
      </div>
    );
  }

  if (REQUIRE_LOGIN && !user) {
    return (
      <AppErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/s/:slug" element={<PublicStoryPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <nav className="app-nav">
        <Link to="/">Home</Link>
        <Link to="/templates">Templates</Link>
        <Link to="/gallery">Gallery</Link>
        {IS_DEV ? <Link to="/debug/templates">Template Debug</Link> : null}
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        {IS_DEV ? <Route path="/debug/templates" element={<DebugTemplates />} /> : null}
        <Route path="/gallery" element={<PhotoGallery />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/s/:slug" element={<PublicStoryPage />} />
        <Route
          path="/issues"
          element={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <header className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-ink mb-2">My Newspaper Issues</h1>
                <p className="text-ink-muted">View and reprint your saved editions.</p>
              </header>
              <IssuesList />
            </div>
          }
        />
        <Route
          path="/newspaper" element={<NewspaperPage />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppErrorBoundary>
  );
}
