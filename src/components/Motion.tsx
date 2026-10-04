import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// Reveal once, close to the viewport. Content stays visible when the browser
// lacks IntersectionObserver or the reader requests reduced motion.
export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !window.IntersectionObserver ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    element.classList.add('dt-reveal--waiting');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.remove('dt-reveal--waiting');
        observer.disconnect();
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.classList.remove('dt-reveal--waiting');
    };
  }, []);
  return <div ref={ref} className={`dt-reveal ${className}`}>{children}</div>;
}

export function RouteMotion({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return <div key={pathname} className="dt-route">{children}</div>;
}
