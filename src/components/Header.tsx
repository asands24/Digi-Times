import { LogOut, Settings, User } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Header() {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

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
            <DropdownMenuItem>
              <Settings size={16} strokeWidth={1.75} />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="editorial-user__logout">
              <LogOut size={16} strokeWidth={1.75} />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
