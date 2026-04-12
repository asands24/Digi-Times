import { LogOut, User } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
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
      <div className="editorial-header__inner">
        <Link to="/" className="editorial-header__logo" aria-label="DigiTimes home">
          <span className="editorial-header__name">DIGITIMES</span>
          <span className="editorial-header__tagline">
            Your Family Stories, Beautifully Preserved
          </span>
        </Link>

        <nav className="editorial-header__nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'editorial-header__nav-link editorial-header__nav-link--active' : 'editorial-header__nav-link'}>Home</NavLink>
          <NavLink to="/templates" className={({ isActive }) => isActive ? 'editorial-header__nav-link editorial-header__nav-link--active' : 'editorial-header__nav-link'}>Templates</NavLink>
          <NavLink to="/gallery" className={({ isActive }) => isActive ? 'editorial-header__nav-link editorial-header__nav-link--active' : 'editorial-header__nav-link'}>Gallery</NavLink>
        </nav>

        <div className="editorial-header__actions">
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
