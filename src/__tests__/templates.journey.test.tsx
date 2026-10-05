import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import TemplatesPage from '../pages/Templates';
import EventBuilder from '../components/EventBuilder';
import { TemplatesGallery } from '../components/TemplatesGallery';
import { templateLayout } from '../lib/templateLayouts';
import { StoryPreviewDialog } from '../components/StoryPreviewDialog';

jest.mock('../providers/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
jest.mock('../hooks/useStoryLibrary', () => ({ useStoryLibrary: jest.fn(), loadStoryDetails: jest.fn() }));
jest.mock('../lib/templates', () => ({ getLocalTemplates: jest.fn(), fetchAllTemplates: jest.fn(), getTemplateById: jest.fn() }));
jest.mock('../utils/storyGenerator', () => ({ ...jest.requireActual('../utils/storyGenerator'), generateStoryFromPrompt: jest.fn() }));
const catalog = jest.requireMock('../lib/templates');
const library = jest.requireMock('../hooks/useStoryLibrary');
const save = jest.fn();
const family = { id: 'family-memories', slug: 'family-memories', title: 'Family Memories', description: 'Family moments', isSystem: true, owner: null, ...templateLayout('Family Memories') };
const travel = { ...family, id: 'travel-adventures', slug: 'travel-adventures', title: 'Travel Adventures', description: 'Travel memories', ...templateLayout('Travel Adventures', 3) };
beforeEach(() => {
  catalog.getLocalTemplates.mockReturnValue([family, travel]);
  catalog.fetchAllTemplates.mockResolvedValue([family, travel]);
  catalog.getTemplateById.mockImplementation((id: string) => Promise.resolve(id === travel.id ? travel : family));
  library.useStoryLibrary.mockReturnValue({ saveDraftToArchive: save });
  save.mockResolvedValue({ story: { id: 'saved-story' }, error: null });
  jest.requireMock('../utils/storyGenerator').generateStoryFromPrompt.mockResolvedValue('We found a quiet beach. Everyone enjoyed the sunshine.');
});

it('searches, previews with keyboard dismissal, and uses a real template in Create', async () => {
  const { container } = render(<MemoryRouter initialEntries={['/templates']}><Routes><Route path="/templates" element={<TemplatesPage />} /><Route path="/create" element={<EventBuilder />} /></Routes></MemoryRouter>);
  await userEvent.type(screen.getByLabelText('Find your edition'), 'travel');
  expect(screen.queryByRole('button', { name: 'Use Family Memories' })).not.toBeInTheDocument();
  const previewButton = screen.getByRole('button', { name: 'Preview Travel Adventures' });
  await userEvent.click(previewButton);
  const frame = screen.getByTitle('Template preview: Travel Adventures');
  expect(frame).toHaveAttribute('sandbox', '');
  expect(frame.getAttribute('srcdoc')).toContain('Travel Adventures');
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(previewButton).toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Use Travel Adventures' }));
  expect(await within(screen.getByRole('region', { name: 'Story layout' })).findByRole('heading', { name: 'Travel Adventures' })).toBeInTheDocument();
  await userEvent.upload(container.querySelector('input[type="file"]')!, new File(['photo'], 'beach.jpg', { type: 'image/jpeg' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Generate Stories' }));
  const headline = await screen.findByLabelText('Headline');
  fireEvent.change(headline, { target: { value: 'Our seaside adventure' } });
  await userEvent.click(screen.getByRole('button', { name: 'Newspaper preview' }));
  const draft = screen.getByTitle('Draft preview: Travel Adventures');
  expect(draft.getAttribute('srcdoc')).toContain('Our seaside adventure');
  expect(draft.getAttribute('srcdoc')).toContain('quiet beach');
  await userEvent.click(screen.getByRole('button', { name: 'Change layout' }));
  await userEvent.click(screen.getByRole('button', { name: 'Select Family Memories' }));
  expect(screen.getByTitle('Draft preview: Family Memories').getAttribute('srcdoc')).toContain('Our seaside adventure');
  await userEvent.click(screen.getByRole('button', { name: 'Save Story' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ template: expect.objectContaining({ id: family.id }), headline: 'Our seaside adventure' })));
});

it('does not replace a selected layout when a late catalog response arrives', async () => {
  let resolve!: (value: unknown) => void;
  catalog.fetchAllTemplates.mockReturnValue(new Promise(done => { resolve = done; }));
  const select = jest.fn();
  render(<TemplatesGallery selectedTemplateId={travel.id} onSelect={select} />);
  await act(async () => resolve([{ ...family, id: 'remote-only' }]));
  expect(select).not.toHaveBeenCalled();
});

it('recovers from an invalid template link without losing the ability to create', async () => {
  catalog.getTemplateById.mockRejectedValue(new Error('Unavailable'));
  render(<MemoryRouter initialEntries={['/create?template=missing']}><EventBuilder /></MemoryRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Choose a layout below');
  await userEvent.click(screen.getByRole('button', { name: 'Select Family Memories' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(within(screen.getByRole('region', { name: 'Story layout' })).getByRole('heading')).toHaveTextContent('Family Memories');
});

it('reopens a saved story in its selected layout', async () => {
  render(<MemoryRouter><StoryPreviewDialog open onOpenChange={jest.fn()} story={{ id: 'saved-story', created_by: 'owner', template_id: travel.id, title: 'The coast', article: '<p>Our beach memory</p>' } as any} /></MemoryRouter>);
  const frame = await screen.findByTitle('Newspaper preview: The coast');
  expect(frame.getAttribute('srcdoc')).toContain('Travel Adventures');
  expect(frame.getAttribute('srcdoc')).toContain('Our beach memory');
});
