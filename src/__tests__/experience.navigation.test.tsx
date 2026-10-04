import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { MobileNav } from '../components/MobileNav';
import { RouteMotion } from '../components/Motion';
import { StoryArchive } from '../components/StoryArchive';
import type { ArchiveItem } from '../types/story';

jest.mock('../providers/AuthProvider', () => ({ useAuth: jest.fn() }));
const auth = jest.requireMock('../providers/AuthProvider').useAuth;
const callbacks = { onPreview: jest.fn(), onRefresh: jest.fn(), onToggleShare: jest.fn(), onDelete: jest.fn(), onLoadMore: jest.fn() };
const story: ArchiveItem = { id: 'one', title: 'A family picnic', article: '<p>A day together.</p>', prompt: 'family picnic', created_at: '2026-10-04', updated_at: '2026-10-04', created_by: 'owner', is_public: false, public_slug: null, image_path: null, photo_id: null, template_id: null };

beforeEach(() => auth.mockReturnValue({ user: { id: 'owner' } }));

it('makes the library active and scrolls back to it on a repeated dock click under reduced motion', () => {
  const scroll = jest.fn();
  const previousScroll = HTMLElement.prototype.scrollIntoView;
  const previousMedia = window.matchMedia;
  HTMLElement.prototype.scrollIntoView = scroll;
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  try {
    render(<MemoryRouter initialEntries={['/#my-stories']}><section id="my-stories" /><MobileNav /></MemoryRouter>);
    const library = screen.getByRole('link', { name: 'Library' });
    expect(library).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    fireEvent.click(library);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  } finally { HTMLElement.prototype.scrollIntoView = previousScroll; window.matchMedia = previousMedia; }
});

it('returns to the top when changing pages without a section destination', () => {
  const scroll = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  try {
    render(<MemoryRouter><RouteMotion><Link to="/templates">Browse styles</Link></RouteMotion></MemoryRouter>);
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('link', { name: 'Browse styles' }));
    expect(scroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  } finally { scroll.mockRestore(); }
});

it('shows signed-out visitors useful library actions without empty filters or export controls', () => {
  auth.mockReturnValue({ user: null });
  render(<MemoryRouter><StoryArchive {...callbacks} stories={[]} isLoading={false} hasMore={false} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Sign in to your library' })).toHaveAttribute('href', '/login');
  expect(screen.getByRole('link', { name: /Create your first story/ })).toHaveAttribute('href', '#create-story');
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Export edition/ })).not.toBeInTheDocument();
});

it('keeps selection controls out of the pagination button and displays loading with existing stories', () => {
  const { container, rerender } = render(<MemoryRouter><StoryArchive {...callbacks} stories={[story]} isLoading={false} hasMore /></MemoryRouter>);
  fireEvent.click(screen.getByRole('checkbox', { name: /Add to this issue/ }));
  expect(container.querySelector('button button')).toBeNull();
  expect(screen.getAllByText(/memory in your next edition/)).toHaveLength(1);
  rerender(<MemoryRouter><StoryArchive {...callbacks} stories={[story]} isLoading hasMore /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
});
