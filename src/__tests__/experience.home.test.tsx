import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from '../App';

jest.mock('../providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useStoryLibrary', () => ({ useStoryLibrary: jest.fn(), updateStoryVisibility: jest.fn() }));
jest.mock('../components/TemplatesGallery', () => ({ __esModule: true, default: () => <p>Browse newspaper templates</p>, TemplatesGallery: () => <p>Choose a newspaper template</p> }));
const auth = jest.requireMock('../providers/AuthProvider').useAuth;
const library = jest.requireMock('../hooks/useStoryLibrary').useStoryLibrary;
function Location() { return <output data-testid="path">{useLocation().pathname}</output>; }
function appAt(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><App /><Location /></MemoryRouter>);
}
function nav(label: string) { return within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: label }); }

beforeEach(() => {
  auth.mockReturnValue({ user: { id: 'owner' }, loading: false });
  library.mockReturnValue({ stories: [], isLoading: false, errorMessage: null, refreshStories: jest.fn(), saveDraftToArchive: jest.fn(), deleteStory: jest.fn(), loadMore: jest.fn(), hasMore: false });
});

it('keeps Home introductory and opens the studio as its own page', async () => {
  const { container } = appAt();
  expect(screen.getByRole('heading', { name: /Your life/ })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Story library' })).not.toBeInTheDocument();
  expect(container.querySelector('input[type="file"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Create a story' }));
  expect(await screen.findByRole('heading', { name: 'Create a story' })).toBeInTheDocument();
  expect(screen.getByTestId('path')).toHaveTextContent('/create');
  expect(nav('Create')).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByRole('heading', { name: /Your life/ })).not.toBeInTheDocument();
});

it('retains photos and descriptions when browsing away and returning to Create', async () => {
  const { container } = appAt('/create');
  await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement, new File(['image'], 'picnic.jpg', { type: 'image/jpeg' }));
  await userEvent.type(await screen.findByLabelText("What's the Scoop?"), 'Picnic with Grandma');
  fireEvent.click(nav('Templates'));
  expect(screen.getByTestId('path')).toHaveTextContent('/templates');
  expect(screen.queryByLabelText("What's the Scoop?")).not.toBeVisible();
  fireEvent.click(nav('Create'));
  expect(await screen.findByLabelText("What's the Scoop?")).toHaveValue('Picnic with Grandma');
  expect(screen.getByAltText('picnic.jpg')).toBeVisible();
});

it('redirects legacy library bookmarks to the dedicated library', async () => {
  appAt('/#story-library');
  expect(await screen.findByRole('heading', { name: 'Story library' })).toBeInTheDocument();
  expect(screen.getByTestId('path')).toHaveTextContent('/library');
  expect(library).toHaveBeenCalledWith('owner');
});

it('releases signed-in drafts after an account switch', async () => {
  const { container, rerender } = appAt('/create');
  await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement, new File(['image'], 'private.jpg', { type: 'image/jpeg' }));
  expect(await screen.findByAltText('private.jpg')).toBeInTheDocument();
  auth.mockReturnValue({ user: { id: 'other-owner' }, loading: false });
  rerender(<MemoryRouter initialEntries={['/create']}><App /><Location /></MemoryRouter>);
  expect(screen.queryByAltText('private.jpg')).not.toBeInTheDocument();
  expect(screen.queryByLabelText("What's the Scoop?")).not.toBeInTheDocument();
});

it('requires sign-in before opening the studio and returns after authentication', async () => {
  auth.mockReturnValue({ user: null, loading: false });
  const { container, rerender } = appAt('/create');
  expect(await screen.findByRole('heading', { name: 'Sign in to create your stories' })).toBeVisible();
  expect(screen.getByTestId('path')).toHaveTextContent('/login');
  expect(container.querySelector('input[type="file"]')).toBeNull();
  auth.mockReturnValue({ user: { id: 'owner' }, loading: false });
  rerender(<MemoryRouter initialEntries={['/create']}><App /><Location /></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'Create a story' })).toBeVisible();
  expect(screen.getByTestId('path')).toHaveTextContent('/create');
});
