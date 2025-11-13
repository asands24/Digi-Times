import { LogOut, Settings, User } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getSupabase } from '../lib/supabaseClient';
import { useAuth } from '../providers/AuthProvider';

export function Header() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const displayName = useMemo(() => {
    const profileName =
      typeof profile?.display_name === 'string' ? profile.display_name.trim() : '';
    if (profileName) {
      return profileName;
    }
    if (typeof user?.email === 'string' && user.email.length > 0) {
      return user.email;
    }
    return 'Guest Reporter';
  }, [profile?.display_name, user?.email]);

  const handleNavigateSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut();
    if (error) {
      toast.error('Failed to log out. Please try again.');
      return;
    }
    navigate('/login');
  }, [navigate]);

  return (
    <header className="editorial-header">
      <div className="editorial-header__inner">
        <div className="editorial-header__date">
          {formattedDate}
        </div>

        <div className="editorial-header__logo" role="banner">
          <span className="editorial-header__name">DIGITIMES</span>
          <span className="editorial-header__tagline">
            Your Family Stories, Beautifully Preserved
          </span>
        </div>

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
            <DropdownMenuItem onSelect={handleNavigateSettings}>
              <Settings size={16} strokeWidth={1.75} />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="editorial-user__logout"
              onSelect={handleSignOut}
            >
              <LogOut size={16} strokeWidth={1.75} />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
