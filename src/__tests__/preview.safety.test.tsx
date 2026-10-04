import { fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
const render = (ui: ReactElement) => rtlRender(ui, { wrapper: MemoryRouter });
async function openTemplate() { fireEvent.click(await screen.findByRole('button', { name: 'Original template' })); }
import { StoryPreviewDialog } from '../components/StoryPreviewDialog';
import type { ArchiveItem } from '../types/story';

jest.mock('../providers/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
jest.mock('../lib/templates', () => ({ getTemplateById: jest.fn() }));
jest.mock('../hooks/useStoryLibrary', () => ({ loadStoryDetails: jest.fn() }));
const mockGetTemplate = jest.requireMock('../lib/templates').getTemplateById as jest.Mock;
const mockLoadDetails = jest.requireMock('../hooks/useStoryLibrary').loadStoryDetails as jest.Mock;
const story = {
  id: 'story-1', created_by: 'user-1', title: 'A family adventure', template_id: 'template-123',
  article: '<p>Welcome</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
  imageUrl: 'https://cdn.example.com/photo.jpg',
} as ArchiveItem;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetTemplate.mockResolvedValue({
    html: '<article><h1>{{headline}}</h1>{{bodyHtml}}<img src="{{imageUrl}}"></article>',
    css: 'article { font-family: serif; }',
  });
});

test('keeps the preview in a sandboxed reader and sanitizes story and template markup', async () => {
  const windowOpen = jest.spyOn(window, 'open');
  render(<StoryPreviewDialog story={story} open onOpenChange={jest.fn()} />);
  await openTemplate();
  const frame = await screen.findByTitle('Newspaper preview: A family adventure');
  expect(frame).toHaveAttribute('sandbox', '');
  const markup = frame.getAttribute('srcdoc') || '';
  const document = new DOMParser().parseFromString(markup, 'text/html');
  expect(document.querySelector('script')).toBeNull();
  expect(document.querySelector('[onerror]')).toBeNull();
  expect(document.body.innerHTML).toContain('<p>Welcome</p>');
  expect(document.body.innerHTML).toContain('https://cdn.example.com/photo.jpg');
  expect(document.querySelector('meta[http-equiv]')?.getAttribute('content')).toContain("default-src 'none'");
  expect(mockGetTemplate).toHaveBeenCalledWith('template-123');
  expect(windowOpen).not.toHaveBeenCalled();
  windowOpen.mockRestore();
});

test('loads missing saved-story content and surfaces errors with retry', async () => {
  mockLoadDetails.mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(story);
  render(<StoryPreviewDialog story={{ ...story, article: null, prompt: null }} open onOpenChange={jest.fn()} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await openTemplate();
  expect(await screen.findByTitle('Newspaper preview: A family adventure')).toBeInTheDocument();
  expect(mockLoadDetails).toHaveBeenCalledWith('story-1', 'user-1');
});

test('does not display a stale result when the selected story changes during loading', async () => {
  let resolveFirst!: (value: unknown) => void;
  mockGetTemplate.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }));
  const { rerender } = render(<StoryPreviewDialog story={story} open onOpenChange={jest.fn()} />);
  await waitFor(() => expect(mockGetTemplate).toHaveBeenCalled());
  rerender(<StoryPreviewDialog story={{ ...story, id: 'story-2', title: 'The new story' }} open onOpenChange={jest.fn()} />);
  await openTemplate();
  const frame = await screen.findByTitle('Newspaper preview: The new story');
  resolveFirst({ html: '<article>Old story</article>', css: '' });
  await waitFor(() => expect(frame.getAttribute('srcdoc')).toContain('The new story'));
  expect(frame.getAttribute('srcdoc')).not.toContain('Old story');
});

test('keeps user-provided template tokens as text and prevents style-tag injection', async () => {
  mockGetTemplate.mockResolvedValue({ html: '<article>{{headline}}<script>bad()</script></article>', css: '</style><script>bad()</script>' });
  render(<StoryPreviewDialog story={{ ...story, title: '{{bodyHtml}}' }} open onOpenChange={jest.fn()} />);
  await openTemplate();
  const frame = await screen.findByTitle('Newspaper preview: {{bodyHtml}}');
  const document = new DOMParser().parseFromString(frame.getAttribute('srcdoc')!, 'text/html');
  expect(document.body.textContent).toBe('{{bodyHtml}}');
  expect(document.querySelector('script')).toBeNull();
});

test('keeps the accessible newspaper readable when its custom template cannot load', async () => {
  mockGetTemplate.mockRejectedValue(new Error('Template unavailable'));
  render(<StoryPreviewDialog story={story} open onOpenChange={jest.fn()} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Template unavailable');
  expect(screen.getByText('Welcome')).toBeInTheDocument();
  expect(document.querySelector('.story-paper script')).toBeNull();
  expect(document.querySelector('.story-paper [onerror]')).toBeNull();
});
test('does not show another account’s private story from a retained selection', async () => {
  render(<StoryPreviewDialog story={{...story,created_by:'another-owner',is_public:false}} open onOpenChange={jest.fn()} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Sign in as the story owner');
  expect(screen.queryByText('Welcome')).toBeNull();
  expect(mockGetTemplate).not.toHaveBeenCalled();
});
