import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useStoryLibrary', () => ({
  loadStories: jest.fn().mockResolvedValue({ stories: [] }),
  updateStoryVisibility: jest.fn(),
  useStoryLibrary: jest.fn().mockReturnValue({
    stories: [],
    isLoading: false,
    errorMessage: null,
    refreshStories: jest.fn(),
    saveDraftToArchive: jest.fn(),
  }),
}));

jest.mock('../lib/supaRest', () => ({ supaRest: jest.fn().mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', title: 'A public family memory', article: '<p>A day to remember.</p>', prompt: null, image_path: null, created_at: '2026-04-16T12:00:00Z', is_public: true, created_by: 'owner' }]) }));

jest.mock('../lib/templates', () => ({
  fetchAllTemplates: jest.fn(),
  getLocalTemplates: jest.fn(),
  findLocalTemplate: jest.fn(),
}));

const useAuth = jest.requireMock('../providers/AuthProvider').useAuth as jest.Mock;
const templatesModule = jest.requireMock('../lib/templates') as {
  fetchAllTemplates: jest.Mock;
  getLocalTemplates: jest.Mock;
  findLocalTemplate: jest.Mock;
};

const mockTemplate = {
  id: 'mock-template',
  slug: 'mock-template',
  title: 'Mock Template',
  description: '',
  html: '<div></div>',
  css: '',
  isSystem: true,
  owner: null,
};

beforeEach(() => {
  jest.requireMock('../lib/supaRest').supaRest.mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', title: 'A public family memory', article: '<p>A day to remember.</p>', prompt: null, image_path: null, created_at: '2026-04-16T12:00:00Z', is_public: true, created_by: 'owner' }]);
  jest.requireMock('../hooks/useStoryLibrary').useStoryLibrary.mockReturnValue({ stories: [], isLoading: false, errorMessage: null, refreshStories: jest.fn(), saveDraftToArchive: jest.fn(), deleteStory: jest.fn(), loadMore: jest.fn(), hasMore: false });
  templatesModule.fetchAllTemplates.mockResolvedValue([mockTemplate]);
  templatesModule.getLocalTemplates.mockReturnValue([mockTemplate]);
  templatesModule.findLocalTemplate.mockReturnValue(mockTemplate);
});

describe('/login route', () => {
  afterEach(() => {
    process.env.REACT_APP_ACCESS_MODE = 'public';
    jest.clearAllMocks();
  });

  it('shows the login page when logged out and login is required', async () => {
    process.env.REACT_APP_ACCESS_MODE = 'login';
    useAuth.mockReturnValue({ user: null, loading: false });

    const App = (await import('../App')).default;

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('redirects logged-in visitors away from /login', async () => {
    process.env.REACT_APP_ACCESS_MODE = 'login';
    useAuth.mockReturnValue({ user: { id: 'user-123' }, loading: false });

    const App = (await import('../App')).default;

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect((await screen.findAllByRole('link', { name: /^Templates$/i })).length).toBeGreaterThan(0);
  });
  it('lets signed-out readers open a shared edition when the app requires login', async () => {
    process.env.REACT_APP_ACCESS_MODE = 'login';
    useAuth.mockReturnValue({ user: null, loading: false });
    const App = (await import('../App')).default;
    render(<MemoryRouter initialEntries={['/edition?ids=11111111-1111-4111-8111-111111111111&title=Family%20Gazette']}><App /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Family Gazette' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /sign in/i })).not.toBeInTheDocument();
  });

});
