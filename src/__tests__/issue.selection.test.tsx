import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { StoryArchive } from '../components/StoryArchive';
import type { ArchiveItem } from '../types/story';
jest.mock('../providers/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
const makeStory = (id: string, title: string): ArchiveItem => ({ id, title, created_by: 'user-1', created_at: '2026-04-16T12:00:00Z', updated_at: '2026-04-16T12:00:00Z', article: '<p>Family adventures</p>', prompt: 'Family', image_path: null, photo_id: null, template_id: null, is_public: false, public_slug: null });
function Location() { return <output>{useLocation().search}</output>; }
it('builds only selected memories, preserving selection order through filters', async () => {
  render(<MemoryRouter><StoryArchive stories={[makeStory('one', 'First memory'), makeStory('two', 'Second memory')]} isLoading={false} onPreview={jest.fn()} onRefresh={jest.fn()} onToggleShare={jest.fn()} onDelete={jest.fn()} onLoadMore={jest.fn()} hasMore={false} /><Location /></MemoryRouter>);
  const choices = screen.getAllByRole('checkbox', { name: /Add to this issue/ });
  await userEvent.click(choices[1]);
  await userEvent.click(choices[0]);
  await userEvent.type(screen.getByRole('searchbox'), 'First');
  await userEvent.click(await screen.findByRole('button', { name: 'Build Newspaper (2)' }));
  expect(await screen.findByText('?ids=two,one')).toBeInTheDocument();
});

it('allows an untitled saved story to be reused in another issue', async () => {
  render(<MemoryRouter><StoryArchive stories={[makeStory('untitled', '')]} isLoading={false} onPreview={jest.fn()} onRefresh={jest.fn()} onToggleShare={jest.fn()} onDelete={jest.fn()} onLoadMore={jest.fn()} hasMore={false} /><Location /></MemoryRouter>);
  await userEvent.click(screen.getByRole('checkbox', { name: /Add to this issue/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Preview selected issue →' }));
  expect(await screen.findByText('?ids=untitled')).toBeInTheDocument();
});

it('routes library exports through the full photo-aware newspaper', async () => {
  const popup = jest.spyOn(window, 'open');
  render(<MemoryRouter><StoryArchive stories={[makeStory('saved', 'Saved memory')]} isLoading={false} onPreview={jest.fn()} onRefresh={jest.fn()} onToggleShare={jest.fn()} onDelete={jest.fn()} onLoadMore={jest.fn()} hasMore={false} /><Location /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: 'Preview & export' }));
  expect(await screen.findByText('?ids=saved')).toBeInTheDocument();
  expect(popup).not.toHaveBeenCalled(); popup.mockRestore();
});
