import { Home, Sparkles, Layout, BookOpen, Newspaper } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { SectionLink } from './SectionLink';

const tabs = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/#create-story', label: 'Create', Icon: Sparkles },
  { to: '/#my-stories', label: 'Library', Icon: BookOpen },
  { to: '/templates', label: 'Styles', Icon: Layout },
  { to: '/issues', label: 'Issues', Icon: Newspaper },
];

export function MobileNav() {
  const { pathname, hash } = useLocation();
  if (pathname === '/login' || pathname === '/logout' || pathname === '/edition' || pathname.startsWith('/auth/') || pathname.startsWith('/s/')) return null;
  return (
    <nav className="mobile-dock" aria-label="Quick navigation">
      {tabs.map(({ to, label, Icon }) => {
        const active = to.includes('#') ? pathname === '/' && hash === `#${to.split('#')[1]}`
          : pathname === to && (to !== '/' || !hash);
        const content = <><Icon size={19} strokeWidth={1.7} aria-hidden /><span>{label}</span></>;
        if (to.includes('#')) return <SectionLink key={to} section={to === '/#create-story' ? 'create-story' : 'my-stories'} className={`mobile-dock__tab${active ? ' is-active' : ''}`} aria-current={active ? 'location' : undefined}>{content}</SectionLink>;
        return (
          <Link key={to} to={to} className={`mobile-dock__tab${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
