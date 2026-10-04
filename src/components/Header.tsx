import { LogOut, User, Menu } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { SectionLink } from './SectionLink';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../providers/AuthProvider';

export function Header() {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const { user, profile, signOut } = useAuth();

  const displayName = useMemo(() => {
    const profileName =
      typeof profile?.display_name === 'string' ? profile.display_name.trim() : '';
    if (profileName) return profileName;

    const profileEmail =
      typeof profile?.email === 'string' ? profile.email.trim() : '';
    if (profileEmail) return profileEmail;

    const userEmail = typeof user?.email === 'string' ? user.email.trim() : '';
    if (userEmail) return userEmail;

    return '';
  }, [profile?.display_name, profile?.email, user?.email]);

  const handleSignOut = useCallback(
    async (event?: Event) => {
      event?.preventDefault();
      event?.stopPropagation();
      const { error } = await signOut();
      if (error) {
        toast.error('Failed to log out. Please try again.');
        return;
      }
      navigate('/login');
    },
    [navigate, signOut]
  );

  return (
    <header className="editorial-header">
      {pathname === '/' && <a className="skip-link" href="#page-content">Skip to content</a>}
      <div className="editorial-header__inner">
        <Link to="/" className="editorial-header__logo" aria-label="DigiTimes home">
          <span className="editorial-header__name">DIGITIMES</span>
          <span className="editorial-header__tagline">
            The newspaper of your life
          </span>
        </Link>

        <nav className="editorial-header__nav" aria-label="Main navigation">
          <SectionLink section="create-story" className={`editorial-header__nav-link${pathname === '/' && hash === '#create-story' ? ' editorial-header__nav-link--active' : ''}`} aria-current={pathname === '/' && hash === '#create-story' ? 'location' : undefined}>Create</SectionLink>
          <SectionLink section="my-stories" className={`editorial-header__nav-link${pathname === '/' && hash === '#my-stories' ? ' editorial-header__nav-link--active' : ''}`} aria-current={pathname === '/' && hash === '#my-stories' ? 'location' : undefined}>Library</SectionLink>
          <NavLink to="/templates" className={({ isActive }) => isActive ? 'editorial-header__nav-link editorial-header__nav-link--active' : 'editorial-header__nav-link'}>Templates</NavLink>
          <NavLink to="/gallery" className={({ isActive }) => isActive ? 'editorial-header__nav-link editorial-header__nav-link--active' : 'editorial-header__nav-link'}>Gallery</NavLink>
          <NavLink to="/issues" className={({ isActive }) => `editorial-header__nav-link${isActive ? ' editorial-header__nav-link--active' : ''}`}>Issues</NavLink>
          <NavLink to="/pricing" className={({ isActive }) => `editorial-header__nav-link${isActive ? ' editorial-header__nav-link--active' : ''}`}>Plans</NavLink>
        </nav>

        <div className="editorial-header__actions">
          <div className="editorial-header__mobile-menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" aria-label="Open navigation menu"><Menu size={20} aria-hidden /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[['/', 'Home'], ['/#create-story', 'Create a story'], ['/#my-stories', 'Story library'], ['/templates', 'Templates'], ['/gallery', 'Photo gallery'], ['/issues', 'Saved issues'], ['/pricing', 'Plans']].map(([to, label]) => <DropdownMenuItem key={to} onSelect={() => navigate(to)}>{label}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="editorial-user"
                  aria-label={`Open account menu for ${displayName}`}
                >
                  <User size={16} strokeWidth={1.75} />
                  <span className="editorial-user__name">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="editorial-user__logout"
                  onSelect={handleSignOut}
                >
                  <LogOut size={16} strokeWidth={1.75} />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button size="sm" className="editorial-header__signin">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
