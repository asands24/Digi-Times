import { LogOut, Settings, User } from 'lucide-react';
import { useCallback } from 'react';
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
import { supabase } from '../lib/supabaseClient';

export function Header() {
  const navigate = useNavigate();

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const handleNavigateSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
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
              aria-label="Open account menu"
            >
              <User size={16} strokeWidth={1.75} />
              <span className="editorial-user__name">Demo User</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleNavigateSettings}>
              <Settings size={16} strokeWidth={1.75} />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="editorial-user__logout"
              onClick={handleSignOut}
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
