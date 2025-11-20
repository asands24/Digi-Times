import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useStoryLibrary', () => ({
  loadStories: jest.fn().mockResolvedValue({ stories: [] }),
  updateStoryVisibility: jest.fn(),
  useStoryLibraryArchive: jest.fn().mockReturnValue({
    stories: [],
    status: 'loaded',
    errorMessage: null,
    refresh: jest.fn(),
    updateStories: jest.fn(),
  }),
}));

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
  templatesModule.fetchAllTemplates.mockResolvedValue([mockTemplate]);
  templatesModule.getLocalTemplates.mockReturnValue([mockTemplate]);
  templatesModule.findLocalTemplate.mockReturnValue(mockTemplate);
});

describe('/login route', () => {
  afterEach(() => {
    process.env.APP_ACCESS_MODE = 'public';
    jest.clearAllMocks();
  });

  it('shows the login page when logged out and login is required', async () => {
    process.env.APP_ACCESS_MODE = 'login';
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
    process.env.APP_ACCESS_MODE = 'login';
    useAuth.mockReturnValue({ user: { id: 'user-123' }, loading: false });

    const App = (await import('../App')).default;

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: /^Templates$/i })).toBeInTheDocument();
  });
});
