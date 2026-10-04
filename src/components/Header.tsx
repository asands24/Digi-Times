import { LogOut, User, Menu } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { primaryNavigation, secondaryNavigation } from '../lib/navigation';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { useAuth } from '../providers/AuthProvider';

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const contentId = pathname === '/' ? 'page-content' : pathname === '/create' ? 'studio-content' : pathname === '/library' ? 'library-content' : null;
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
      {contentId && <a className="skip-link" href={`#${contentId}`}>Skip to content</a>}
      <div className="editorial-header__inner">
        <Link to="/" className="editorial-header__logo" aria-label="DigiTimes home">
          <span className="editorial-header__name">DIGITIMES</span>
          <span className="editorial-header__tagline">
            The newspaper of your life
          </span>
        </Link>

        <nav className="editorial-header__nav" aria-label="Main navigation">
          {primaryNavigation.map(({ to, label }) => <NavLink key={to} to={to} end className={({ isActive }) => `editorial-header__nav-link${isActive ? ' editorial-header__nav-link--active' : ''}`}>{label}</NavLink>)}
        </nav>

        <div className="editorial-header__actions">
          <div className="editorial-header__mobile-menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" aria-label="More navigation"><Menu size={20} aria-hidden /><span className="editorial-header__menu-label">More</span></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="navigation-menu__primary">
                  {primaryNavigation.map(({ to, label }) => <DropdownMenuItem key={to} onSelect={() => navigate(to)}>{label}</DropdownMenuItem>)}
                  <DropdownMenuSeparator />
                </div>
                {secondaryNavigation.map(({ to, label }) => <DropdownMenuItem key={to} onSelect={() => navigate(to)}>{label}</DropdownMenuItem>)}
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
            <Link to="/login" className="dt-button dt-button--primary dt-button--sm editorial-header__signin">Sign In</Link>
          )}
        </div>
      </div>
    </header>
  );
}
