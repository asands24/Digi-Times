import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../hooks/useStoryLibrary', () => ({
  loadStories: jest.fn().mockResolvedValue({ stories: [] }),
  useStoryLibrary: jest.fn().mockReturnValue({
    stories: [],
    isLoading: false,
    errorMessage: null,
    refreshStories: jest.fn(),
    saveDraftToArchive: jest.fn(),
  }),
}));

const useAuth = jest.requireMock('../providers/AuthProvider').useAuth as jest.Mock;
const loadStories = jest.requireMock('../hooks/useStoryLibrary').loadStories as jest.Mock;

describe('Hybrid auth gating', () => {
  afterEach(() => {
    process.env.APP_ACCESS_MODE = 'public';
    jest.resetModules();
  });

  it('skips archive fetches when logged out and login is required', async () => {
    process.env.APP_ACCESS_MODE = 'login';
    useAuth.mockReturnValue({ user: null, loading: false });

    const App = (await import('../App')).default;

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(loadStories).not.toHaveBeenCalled();
    });
  });
});
