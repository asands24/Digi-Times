import { Link, useLocation, type LinkProps } from 'react-router-dom';

/** Repeated clicks on an existing hash still return to the requested section. */
export function SectionLink({ section, onClick, ...props }: Omit<LinkProps, 'to'> & { section: 'create-story' | 'my-stories' }) {
  const { pathname } = useLocation();
  return <Link {...props} to={`/#${section}`} onClick={event => {
    onClick?.(event);
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && pathname === '/') {
      document.getElementById(section)?.scrollIntoView({
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }} />;
}
