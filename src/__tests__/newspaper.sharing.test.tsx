import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NewspaperPage from '../pages/NewspaperPage';
import { supaRest } from '../lib/supaRest';
import { copyToClipboard } from '../utils/clipboard';
import { createIssue, fetchIssueById } from '../lib/storiesApi';
import { useAuth } from '../providers/AuthProvider';

jest.mock('../lib/supaRest', () => ({ supaRest: jest.fn() }));
jest.mock('../lib/storiesApi', () => ({ createIssue: jest.fn(), fetchIssueById: jest.fn() }));
jest.mock('../utils/clipboard', () => ({ copyToClipboard: jest.fn() }));
jest.mock('../providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../lib/supabaseClient', () => ({ supabase: { storage: { from: jest.fn(() => ({ getPublicUrl: jest.fn(() => ({ data: { publicUrl: null } })) })) } } }));
const first = { id: '11111111-1111-4111-8111-111111111111', title: 'Family picnic', article: '<p>A lovely afternoon.</p>', prompt: null, image_path: null, created_at: '2026-04-16T12:00:00Z', is_public: true, created_by: 'owner' };
const second = { ...first, id: '22222222-2222-4222-8222-222222222222', title: 'Private birthday', is_public: false };
const rest = supaRest as jest.Mock;
const copy = copyToClipboard as jest.Mock;
const auth = useAuth as jest.Mock;
const save = createIssue as jest.Mock;
const fetchIssue = fetchIssueById as jest.Mock;
beforeEach(() => { jest.clearAllMocks(); auth.mockReturnValue({ user: { id: 'owner' } }); copy.mockResolvedValue(true); });
const open = (query: string, reader = false) => render(<MemoryRouter initialEntries={[`/newspaper?${query}`]}><NewspaperPage reader={reader} /></MemoryRouter>);

it('shares the chosen name, story order, date, paper size and history without exposing editing controls to readers', async () => {
  rest.mockResolvedValue([first]);
  open(`ids=${first.id}&title=Birthday%20Edition&paper=letter&showHistory=false&date=2026-09-30`);
  await screen.findByLabelText('Edition name');
  await userEvent.click(screen.getByRole('button', { name: 'Share edition' }));
  await userEvent.click(screen.getByRole('button', { name: 'Copy edition link' }));
  await waitFor(() => expect(copy).toHaveBeenCalledTimes(1));
  const url = new URL(copy.mock.calls[0][0]);
  expect(url.pathname).toBe('/edition');
  expect(url.searchParams.get('title')).toBe('Birthday Edition');
  expect(url.searchParams.get('paper')).toBe('letter');
  expect(url.searchParams.get('showHistory')).toBe('false');
  expect(url.searchParams.get('date')).toBe('2026-09-30');
});
it('blocks sharing private or incomplete editions and never changes privacy', async () => {
  rest.mockResolvedValue([first, second]);
  open(`ids=${first.id},${second.id}`);
  await screen.findByLabelText('Edition name');
  await userEvent.click(screen.getByRole('button', { name: 'Share edition' }));
  expect(screen.getByRole('button', { name: 'Copy edition link' })).toBeDisabled();
  expect(screen.getByText('Private')).toBeInTheDocument();
  expect(copy).not.toHaveBeenCalled();
  expect(rest).toHaveBeenCalledTimes(1);
});
it('filters out private stories in reader mode even for their signed-in owner', async () => {
  rest.mockResolvedValue([first, second]);
  open(`ids=${first.id},${second.id}&title=Family%20Edition`, true);
  await screen.findByRole('heading', { name: 'Family Edition' });
  expect(rest.mock.calls[0][1]).toContain('&is_public=eq.true');
  expect(screen.queryByText('Private birthday')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Edition name')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Save Issue' })).not.toBeInTheDocument();
  expect(screen.getByText(/Some stories could not be loaded/)).toBeInTheDocument();
});
it('blocks copying a partial edition even if the remaining stories are public', async () => {
  rest.mockResolvedValue([first]);
  open(`ids=${first.id},${second.id}`);
  await screen.findByLabelText('Edition name');
  await userEvent.click(screen.getByRole('button', { name: 'Share edition' }));
  expect(screen.getByRole('button', { name: 'Copy edition link' })).toBeDisabled();
});
it('restores saved edition settings and includes them when saving a new issue', async () => {
  fetchIssue.mockResolvedValue({ title: 'Saved Edition', description: JSON.stringify({ type: 'digitimes-edition', version: 1, paper: 'letter', showHistory: false, date: '2026-08-10' }), stories: [first], created_at: first.created_at });
  rest.mockResolvedValue([first]); save.mockResolvedValue({ id: 'new-issue' });
  open('issueId=33333333-3333-4333-8333-333333333333');
  expect(await screen.findByLabelText('Edition name')).toHaveValue('Saved Edition');
  expect(screen.getByLabelText('Paper size')).toHaveValue('letter');
  expect(screen.getByRole('button', { name: 'Show History' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Save Issue' }));
  await userEvent.click(screen.getAllByRole('button', { name: 'Save Issue' }).slice(-1)[0]);
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(JSON.parse(save.mock.calls[0][0].description)).toMatchObject({ paper: 'letter', showHistory: false, date: '2026-08-10' });
});
