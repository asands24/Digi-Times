import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StoryPreviewDialog } from '../components/StoryPreviewDialog';
import type { ArchiveItem } from '../types/story';
jest.mock('../providers/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('../lib/templates', () => ({ getTemplateById: jest.fn().mockResolvedValue({ title: 'Family', html: '<h1>{{headline}}</h1>{{bodyHtml}}<img src="{{imageUrl}}">', css: 'body{color:black}' }) }));
beforeEach(() => {
  jest.requireMock('../lib/templates').getTemplateById.mockResolvedValue({ title: 'Family', html: '<h1>{{headline}}</h1>{{bodyHtml}}<img src="{{imageUrl}}">', css: 'body{color:black}' });
});
const story: ArchiveItem = { id: 'story-1', created_by: 'user-1', title: '<img src=x onerror=alert(1)>', article: '<p>Welcome</p><script>alert(1)</script><img src="x" onerror="alert(1)">', image_path: null, imageUrl: 'https://example.com/photo.jpg', photo_id: null, template_id: 'template-1', created_at: '2026-04-16T12:00:00Z', updated_at: '2026-04-16T12:00:00Z', prompt: null, is_public: false, public_slug: null };
it('sanitizes the in-app story and isolates custom templates with a sandbox and CSP', async () => {
  const { container } = render(<MemoryRouter><StoryPreviewDialog story={story} open onOpenChange={jest.fn()} /></MemoryRouter>);
  await screen.findByText('Welcome');
  expect(document.querySelector('.story-paper script')).toBeNull();
  expect(document.querySelector('.story-paper__body [onerror]')).toBeNull();
  expect(screen.getByRole('heading', { name: story.title! })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Original template' })).toBeInTheDocument());
  await userEvent.click(screen.getByRole('button', { name: 'Original template' }));
  const frame = await screen.findByTitle('Original story template');
  expect(frame).toHaveAttribute('sandbox', '');
  expect(frame.getAttribute('srcdoc')).not.toContain('<script>');
  expect(frame.getAttribute('srcdoc')).toContain("default-src 'none'");
  expect(container.querySelector('iframe')).toBeNull(); // dialog is rendered in a portal
});
