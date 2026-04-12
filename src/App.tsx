import { lazy, Suspense, useCallback, useRef, useState, type RefObject } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
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
import PublicStoryPage from './pages/PublicStoryPage';
import { IssuesList } from './components/IssuesList';
import NewspaperPage from './pages/NewspaperPage';
import PrivacyPage from './pages/PrivacyPage';
import GuidelinesPage from './pages/GuidelinesPage';

const DebugTemplates = lazy(() => import('./pages/DebugTemplates'));
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

          <div className="welcome-hero__content">
            <p className="welcome-hero__kicker">📰 DigiTimes</p>
            <h1 className="welcome-hero__title">
              Your photo deserves a front page
            </h1>
            <p className="welcome-hero__subtitle">
              Upload any photo — a birthday, a school project, a family trip — and DigiTimes turns it into a
              real newspaper story in seconds. Print it, share the link, or bundle it into an issue to send to grandma.
            </p>
            <div className="welcome-hero__actions">
              <Button size="lg" onClick={() => scrollToSection(builderRef)}>
                Make My Story — It's Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection(archiveRef)}
              >
                View My Stories
              </Button>
            </div>
            <p className="welcome-hero__hint">
              No sign-up needed to try it. Stories save when you create an account.
            </p>
          </div>

          <div className="welcome-hero__pillars">
            <div className="welcome-hero__pillar">
              <span className="welcome-hero__pillar-icon">📸</span>
              <div>
                <h3>1. Upload a photo</h3>
                <p>Any moment worth remembering — birthday, trip, milestone, everyday magic.</p>
              </div>
            </div>
            <div className="welcome-hero__pillar">
              <span className="welcome-hero__pillar-icon">✨</span>
              <div>
                <h3>2. AI writes the story</h3>
                <p>A kid-friendly headline and article appears in seconds. Edit anything you like.</p>
              </div>
            </div>
            <div className="welcome-hero__pillar">
              <span className="welcome-hero__pillar-icon">📬</span>
              <div>
                <h3>3. Print or share</h3>
                <p>Download a print-ready newspaper, share a link, or bundle stories into an issue.</p>
              </div>
            </div>
          </div>
        </section>

        <OnboardingBanner />
        <section ref={builderRef} className="creation-section">
          <div className="section-label">
            <span className="section-label__line" />
            <span className="section-label__text">Create a Story</span>
            <span className="section-label__line" />
          </div>
          <EventBuilder />
        </section>
        <section ref={archiveRef} className="archive-section">
          <div className="section-label">
            <span className="section-label__line" />
            <span className="section-label__text">Your Stories</span>
            <span className="section-label__line" />
          </div>
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

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <span className="site-footer__name">📰 DIGITIMES</span>
            <p className="site-footer__tagline">Everyday life, front-page worthy.</p>
          </div>
          <div className="site-footer__links">
            <Link to="/" className="site-footer__link">Home</Link>
            <Link to="/templates" className="site-footer__link">Templates</Link>
            <Link to="/gallery" className="site-footer__link">Gallery</Link>
            <Link to="/privacy" className="site-footer__link">Privacy</Link>
            <Link to="/guidelines" className="site-footer__link">Guidelines</Link>
            <a href="mailto:asands44@gmail.com" className="site-footer__link">Contact</a>
          </div>
          <p className="site-footer__copy">
            © {new Date().getFullYear()} DigiTimes · Made with ☕ and a love of stories
          </p>
        </div>
      </footer>

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
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        {IS_DEV ? (
          <Route
            path="/debug/templates"
            element={
              <Suspense fallback={null}>
                <DebugTemplates />
              </Suspense>
            }
          />
        ) : null}
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
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/guidelines" element={<GuidelinesPage />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppErrorBoundary>
  );
}
