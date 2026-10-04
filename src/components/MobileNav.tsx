import { Link, useLocation } from 'react-router-dom';
import { primaryNavigation } from '../lib/navigation';

export function MobileNav() {
  const { pathname } = useLocation();
  if (pathname === '/login' || pathname === '/logout' || pathname === '/edition' || pathname.startsWith('/auth/') || pathname.startsWith('/s/')) return null;
  return (
    <nav className="mobile-dock" aria-label="Quick navigation">
      {primaryNavigation.map(({ to, label, Icon }) => {
        const active = pathname === to;
        const content = <><Icon size={19} strokeWidth={1.7} aria-hidden /><span>{label}</span></>;
        return (
          <Link key={to} to={to} className={`mobile-dock__tab${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
