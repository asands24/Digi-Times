import { Home, Sparkles, Layout, Image } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/#create-story', label: 'Create', Icon: Sparkles },
  { to: '/templates', label: 'Styles', Icon: Layout },
  { to: '/gallery', label: 'Photos', Icon: Image },
];

export function MobileNav() {
  const { pathname, hash } = useLocation();
  if (pathname === '/login' || pathname === '/logout' || pathname === '/edition' || pathname.startsWith('/auth/') || pathname.startsWith('/s/')) return null;
  return (
    <nav className="mobile-dock" aria-label="Quick navigation">
      {tabs.map(({ to, label, Icon }) => {
        const active = to.includes('#') ? pathname === '/' && hash === '#create-story'
          : pathname === to && (to !== '/' || hash !== '#create-story');
        return (
          <Link key={to} to={to} className={`mobile-dock__tab${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (to.includes('#') && pathname === '/') {
                document.getElementById('create-story')?.scrollIntoView({
                  behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                  block: 'start',
                });
              }
            }}>
            <Icon size={19} strokeWidth={1.7} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
