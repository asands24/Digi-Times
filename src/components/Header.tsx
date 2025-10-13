import { Camera, LogOut, Settings, User } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Header() {
  return (
    <header className="editorial-header">
      <div className="editorial-header__inner">
        <div className="editorial-header__date">
          Monday, October 13, 2025
        </div>

        <div className="editorial-header__logo">
          <div className="editorial-header__mark">
            <Camera size={20} strokeWidth={1.75} />
          </div>
          <div className="editorial-header__title">
            <span className="editorial-header__name">DIGITIMES</span>
            <span className="editorial-header__tagline">
              Your Family Stories, Beautifully Preserved
            </span>
          </div>
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
