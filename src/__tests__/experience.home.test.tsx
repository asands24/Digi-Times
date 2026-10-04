import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

jest.mock('../providers/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'owner' }, loading: false }) }));
jest.mock('../hooks/useStoryLibrary', () => ({ useStoryLibrary: jest.fn(), updateStoryVisibility: jest.fn() }));
jest.mock('../components/EventBuilder', () => ({ __esModule: true, default: ({ onArchiveSaved }: { onArchiveSaved: () => void }) => <button onClick={onArchiveSaved}>Complete confirmed story save</button> }));

it('refreshes the visible library after the builder confirms a successful save', () => {
  const refresh = jest.fn();
  jest.requireMock('../hooks/useStoryLibrary').useStoryLibrary.mockReturnValue({ stories: [], isLoading: false, errorMessage: null, refreshStories: refresh, deleteStory: jest.fn(), loadMore: jest.fn(), hasMore: false });
  render(<MemoryRouter><App /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Complete confirmed story save' }));
  expect(refresh).toHaveBeenCalledTimes(1);
});
