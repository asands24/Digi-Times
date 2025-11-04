import { act, render } from '@testing-library/react';
import { StoryPreviewDialog } from '../components/StoryPreviewDialog';
import type { ArchiveItem } from '../hooks/useStoryLibrary';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../lib/templates', () => ({
  getTemplateById: jest.fn(),
  fetchAllTemplates: jest.fn(),
}));

const mockGetTemplateById = jest.requireMock('../lib/templates')
  .getTemplateById as jest.Mock;

describe('StoryPreviewDialog print behaviour', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetTemplateById.mockResolvedValue({
      id: 'template-123',
      title: 'Template',
      slug: 'template',
      html: '<article><h1>{{headline}}</h1><div class="body">{{bodyHtml}}</div><div class="meta">{{dateline}}</div></article>',
      css: '.meta { font-weight: bold; }',
      is_system: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    mockGetTemplateById.mockClear();
  });

  it('creates a sanitized print document without executing scripts', async () => {
    const story: ArchiveItem = {
      id: 'story-1',
      title: 'Family Picnic Delights Crowd',
      template_id: 'template-123',
      image_path: 'stories/user-1/picnic.jpg',
      created_at: new Date().toISOString(),
      article: `<h1>Family Picnic</h1><p>Families gathered under the largest oak in the park.</p><script>alert('xss')</script>`,
      prompt: 'Family picnic',
      imageUrl: 'https://cdn.example.com/picnic.jpg',
    };

    const printDocument = document.implementation.createHTMLDocument('Print');
    const focusMock = jest.fn();
    const openSpy = jest
      .spyOn(window, 'open')
      .mockReturnValue({
        document: printDocument,
        focus: focusMock,
      } as unknown as Window);

    const { rerender } = render(
      <StoryPreviewDialog story={story} open={false} onOpenChange={() => {}} />,
    );

    await act(async () => {
      rerender(<StoryPreviewDialog story={story} open onOpenChange={() => {}} />);
      jest.runAllTimers();
    });

    expect(openSpy).toHaveBeenCalledWith('', '_blank', 'noopener,noreferrer');
    expect(focusMock).toHaveBeenCalled();

    const styleTag = printDocument.head.querySelector('style');
    expect(styleTag).not.toBeNull();

    const scriptTag = printDocument.body.querySelector('script');
    expect(scriptTag).toBeNull();
    expect(printDocument.body.innerHTML).not.toContain('<script>');

    expect(printDocument.body.innerHTML).toContain('Family Picnic');

    const image = printDocument.body.querySelector('img');
    expect(image?.getAttribute('src')).toContain('https://cdn.example.com/picnic.jpg');

    openSpy.mockRestore();
  });
});
