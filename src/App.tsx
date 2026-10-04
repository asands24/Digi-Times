import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { Camera, Sparkles, Send, Lock, PencilLine } from 'lucide-react';
import { Header } from './components/Header';
import EventBuilder from './components/EventBuilder';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { OnboardingBanner } from './components/OnboardingBanner';
import { Button } from './components/ui/button';
import LibraryPage from './pages/LibraryPage';
import Logout from './pages/Logout';
import TemplatesPage from './pages/Templates';
import PhotoGallery from './components/PhotoGallery';
import { useAuth } from './providers/AuthProvider';
import LoginPage from './pages/LoginPage';
import { REQUIRE_LOGIN } from './lib/config';
import AuthCallback from './pages/AuthCallback';
import PublicStoryPage from './pages/PublicStoryPage';
import PrivacyPage from './pages/PrivacyPage';
import GuidelinesPage from './pages/GuidelinesPage';
import PricingPage from './pages/PricingPage';
import { Reveal, RouteMotion } from './components/Motion';
import { MobileNav } from './components/MobileNav';
import { EditorialCover } from './components/EditorialCover';

const DebugTemplates = process.env.NODE_ENV === 'development' ? lazy(() => import('./pages/DebugTemplates')) : () => null;
const DebugNewspaper = process.env.NODE_ENV === 'development' ? lazy(() => import('./pages/DebugNewspaper')) : () => null;
const DebugMotion = process.env.NODE_ENV === 'development' ? lazy(() => import('./pages/DebugMotion')) : () => null;
const IS_DEV = process.env.NODE_ENV === 'development';
// Load the measured newspaper/PDF tools when someone opens an edition.
const NewspaperPage = lazy(() => import('./pages/NewspaperPage'));
const IssuesList = lazy(() => import('./components/IssuesList').then(module => ({ default: module.IssuesList })));

function PageLoading() {
  return <div className="route-loading" role="status"><span className="route-loading__mark" aria-hidden>📰</span><p>Opening your newsroom…</p></div>;
}

function HomePage() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  // Preserve previously shared/bookmarked studio and library destinations.
  if (hash === '#create-story') return <Navigate to="/create" replace />;
  if (hash === '#my-stories' || hash === '#story-library') return <Navigate to="/library" replace />;

  return (
    <div className="app-shell">
      <Header />
      <main id="page-content" tabIndex={-1} className="editorial-main">
        <section className="welcome-hero">

          <div className="welcome-hero__content">
            <p className="welcome-hero__kicker">A home for your memories</p>
            <h1 className="welcome-hero__title">
              Your life.
              <em>Front-page worthy.</em>
            </h1>
            <p className="welcome-hero__subtitle">
              Turn the little moments into something you can keep. Your photos, an AI-written story, and a beautiful newspaper to print or share.
            </p>
            <div className="welcome-hero__actions">
              <Button size="lg" onClick={() => navigate('/create')}>
                Create a story
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/library')}
              >
                My stories
              </Button>
            </div>
            <p className="welcome-hero__hint">
              Try a draft without signing in. Sign in when you’re ready to save.
            </p>
            <div className="welcome-hero__assurances"><span><Lock size={14} aria-hidden /> Private until you share</span><span><PencilLine size={14} aria-hidden /> Every word is yours to edit</span></div>
          </div>

          <EditorialCover onCreate={() => navigate('/create')} />
        </section>

        <Reveal>
          <div className="welcome-hero__pillars">
            <div className="welcome-hero__pillar">
              <Camera className="welcome-hero__pillar-icon" size={23} aria-hidden />
              <div>
                <h3>1. Upload a photo</h3>
                <p>Any moment worth remembering — birthday, trip, milestone, everyday magic.</p>
              </div>
            </div>
            <div className="welcome-hero__pillar">
              <Sparkles className="welcome-hero__pillar-icon" size={23} aria-hidden />
              <div>
                <h3>2. AI writes the story</h3>
                <p>A kid-friendly headline and article appears in seconds. Edit anything you like.</p>
              </div>
            </div>
            <div className="welcome-hero__pillar">
              <Send className="welcome-hero__pillar-icon" size={23} aria-hidden />
              <div>
                <h3>3. Print or share</h3>
                <p>Download a print-ready newspaper, share a link, or bundle stories into an issue.</p>
              </div>
            </div>
          </div>
        </Reveal>

      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <span className="site-footer__name">📰 DIGITIMES</span>
            <p className="site-footer__tagline">Everyday life, front-page worthy.</p>
          </div>
          <div className="site-footer__links">
            <Link to="/" className="site-footer__link">Home</Link>
            <Link to="/create" className="site-footer__link">Create</Link>
            <Link to="/library" className="site-footer__link">Library</Link>
            <Link to="/templates" className="site-footer__link">Templates</Link>
            <Link to="/gallery" className="site-footer__link">Gallery</Link>
            <Link to="/pricing" className="site-footer__link">Plans</Link>
            <Link to="/privacy" className="site-footer__link">Privacy</Link>
            <Link to="/guidelines" className="site-footer__link">Guidelines</Link>
            <a href="mailto:asands44@gmail.com" className="site-footer__link">Contact</a>
          </div>
          <p className="site-footer__copy">
            © {new Date().getFullYear()} DigiTimes · Made with ☕ and a love of stories
          </p>
        </div>
      </footer>

    </div>
  );
}

// Keep a visited studio mounted so exploring the app doesn't throw away photos
// or edits. Hidden workspaces are excluded from layout, focus and accessibility.
function CreateWorkspace({ active }: { active: boolean }) {
  return <div className="app-shell studio-workspace" hidden={!active}>
    <Header />
    <main id="studio-content" tabIndex={-1} className="workspace-main">
      <header className="workspace-heading"><p className="editorial-kicker">Your newsroom</p><h1>Create a story</h1><p>From a favorite photo to a front-page memory.</p></header>
      <EventBuilder compactHeading />
      <OnboardingBanner />
    </main>
  </div>;
}

export default function App() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [hasOpenedStudio, setHasOpenedStudio] = useState(pathname === '/create');
  useEffect(() => { if (pathname === '/create') setHasOpenedStudio(true); }, [pathname]);

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
        <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/s/:slug" element={<PublicStoryPage />} />
          <Route path="/edition" element={<NewspaperPage reader />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Suspense>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      {(hasOpenedStudio || pathname === '/create') && <CreateWorkspace active={pathname === '/create'} />}
      <div hidden={pathname === '/create'}>
      <RouteMotion>
        <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={null} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/templates" element={<div className="app-shell"><Header /><TemplatesPage /></div>} />
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
          {IS_DEV && <Route path="/debug/newspaper" element={<Suspense fallback={null}><DebugNewspaper /></Suspense>} />}
          {IS_DEV && <Route path="/debug/motion" element={<Suspense fallback={null}><DebugMotion /></Suspense>} />}
          <Route path="/gallery" element={<div className="app-shell"><Header /><PhotoGallery /></div>} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/s/:slug" element={<PublicStoryPage />} />
          <Route
            path="/issues"
            element={
              <div className="app-shell"><Header /><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8">
                  <h1 className="text-3xl font-serif font-bold text-ink mb-2">My Newspaper Issues</h1>
                  <p className="text-ink-muted">View and reprint your saved editions.</p>
                </header>
                <IssuesList />
              </div></div>
            }
          />
          <Route
            path="/newspaper" element={<NewspaperPage />} />
          <Route path="/edition" element={<NewspaperPage reader />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route path="*" element={<HomePage />} />
        </Routes>
        </Suspense>
      </RouteMotion>
      </div>
      <MobileNav />
    </AppErrorBoundary>
  );
}
