import { Home, Sparkles, BookOpen, Layout, Newspaper } from 'lucide-react';

// Primary destinations are identical across the header, menu, and mobile dock.
export const primaryNavigation = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/create', label: 'Create', Icon: Sparkles },
  { to: '/library', label: 'Library', Icon: BookOpen },
  { to: '/templates', label: 'Templates', Icon: Layout },
  { to: '/issues', label: 'Issues', Icon: Newspaper },
];
export const secondaryNavigation = [
  { to: '/gallery', label: 'Photo gallery' },
  { to: '/pricing', label: 'Plans' },
];
