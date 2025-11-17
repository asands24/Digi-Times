import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StoryPreviewDialog } from '../components/StoryPreviewDialog';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('../lib/templates', () => ({
  getTemplateById: jest.fn(),
  fetchAllTemplates: jest.fn(),
}));

const mockGetTemplateById = jest.requireMock('../lib/templates')
  .getTemplateById as jest.Mock;

let windowOpenSpy: jest.SpyInstance | null = null;

beforeEach(() => {
  mockGetTemplateById.mockResolvedValue({
    id: 'template-123',
    title: 'Template',
    slug: 'template',
    html: '<article><h1>{{headline}}</h1><div class="body">{{bodyHtml}}</div><img src="{{imageUrl}}" /></article>',
    css: 'article { font-family: sans-serif; }',
    isSystem: true,
    owner: null,
  });
});

afterEach(() => {
  mockGetTemplateById.mockReset();
  if (windowOpenSpy) {
    windowOpenSpy.mockRestore();
    windowOpenSpy = null;
  }
});

describe('StoryPreviewDialog sanitization', () => {
  it('sanitizes unsafe markup before rendering into preview window', async () => {
    const previewDocument = document.implementation.createHTMLDocument('Preview');
    const focusMock = jest.fn();
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => ({
      document: previewDocument,
      focus: focusMock,
    }) as unknown as Window);

    const onOpenChange = jest.fn();

    render(
      <StoryPreviewDialog
        story={{
          id: 'story-1',
          title: 'Malicious',
          template_id: 'template-123',
          image_path: 'stories/user/photo.jpg',
          created_at: new Date().toISOString(),
          article: `<p>Welcome</p><script>alert('hi')</script><img src="x" onerror="alert(1)" />`,
          imageUrl: 'https://cdn.example.com/photo.jpg',
        }}
        open
        onOpenChange={onOpenChange}
      />,
    );

    await waitFor(() => expect(windowOpenSpy).toHaveBeenCalled());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const article = previewDocument.body.querySelector('article');
    expect(article).not.toBeNull();
    expect(article?.innerHTML).not.toContain('<script');
    expect(article?.innerHTML).not.toContain('onerror');
    expect(article?.innerHTML).toContain('<p>Welcome</p>');
    const images = Array.from(article?.querySelectorAll('img') ?? []);
    expect(
      images.some((img) => img.getAttribute('src')?.includes('https://cdn.example.com/photo.jpg')),
    ).toBe(true);
    expect(focusMock).toHaveBeenCalled();
    expect(mockGetTemplateById).toHaveBeenCalledWith('template-123');
  });
});
