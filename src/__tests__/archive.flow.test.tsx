import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EventBuilder from '../components/EventBuilder';

jest.mock('../providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useStoryLibrary', () => ({ useStoryLibrary: jest.fn() }));
jest.mock('../components/TemplatesGallery', () => ({ TemplatesGallery: ({ onSelect }: any) => <button onClick={() => onSelect({ id: 'template-123', title: 'Family', slug: 'family' })}>Family layout</button> }));
jest.mock('../utils/storyGenerator', () => ({ ...jest.requireActual('../utils/storyGenerator'), generateStoryFromPrompt: jest.fn() }));
const save = jest.fn();
const auth = jest.requireMock('../providers/AuthProvider').useAuth;
const generator = jest.requireMock('../utils/storyGenerator').generateStoryFromPrompt;

beforeEach(() => {
  jest.clearAllMocks();
  auth.mockReturnValue({ user: { id: 'user-123' } });
  jest.requireMock('../hooks/useStoryLibrary').useStoryLibrary.mockReturnValue({ saveDraftToArchive: save });
  save.mockResolvedValue({ story: { id: 'saved-1' }, error: null });
});
it('shows generation progress, previews edited copy, saves with template, and offers an issue next step', async () => {
  let resolve!: (body: string) => void;
  generator.mockReturnValue(new Promise<string>(done => { resolve = done; }));
  const onSaved = jest.fn();
  const { container } = render(<MemoryRouter><EventBuilder onArchiveSaved={onSaved} /></MemoryRouter>);
  await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement, new File(['image'], 'picnic.jpg', { type: 'image/jpeg' }));
  await userEvent.type(await screen.findByLabelText("What's the Scoop?"), 'Picnic with Grandma');
  await userEvent.click(screen.getByText('Family layout'));
  await userEvent.click(await screen.findByRole('button', { name: 'Generate Stories' }));
  expect(screen.getByText(/Drafting|Interviewing|Checking|Calling|Developing|Setting/)).toBeInTheDocument();
  await act(async () => resolve('A lovely picnic.\n\nEveryone shared cake.'));
  await userEvent.clear(screen.getByLabelText('Headline'));
  await userEvent.type(screen.getByLabelText('Headline'), 'Grandma makes the front page');
  await userEvent.click(screen.getByRole('button', { name: 'Newspaper preview' }));
  expect(screen.getByRole('heading', { name: 'Grandma makes the front page' })).toBeInTheDocument();
  expect(screen.getByText('A lovely picnic.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Save Story' }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save.mock.calls[0][0]).toMatchObject({ userId: 'user-123', template: { id: 'template-123' }, headline: 'Grandma makes the front page', bodyHtml: '<p>A lovely picnic.</p><p>Everyone shared cake.</p>' });
  expect(onSaved).toHaveBeenCalled();
  expect(await screen.findByRole('link', { name: /Add to Newspaper/ })).toHaveAttribute('href', '/newspaper?ids=saved-1');
});
it('keeps anonymous drafts editable while saving requires sign in', async () => {
  auth.mockReturnValue({ user: null });
  generator.mockResolvedValue('Our family made pancakes.');
  const { container } = render(<MemoryRouter><EventBuilder /></MemoryRouter>);
  await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement, new File(['image'], 'breakfast.jpg', { type: 'image/jpeg' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Generate Stories' }));
  expect(await screen.findByRole('button', { name: 'Save Story' })).toBeDisabled();
  expect(screen.getByLabelText('The story')).toBeEnabled();
  expect(save).not.toHaveBeenCalled();
});
