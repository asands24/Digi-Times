import { act, render, screen } from '@testing-library/react';
import { StoryPreviewDialog } from '../components/StoryPreviewDialog';
import type { StoryRecord } from '../types/story';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('StoryPreviewDialog print behaviour', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a sanitized print document without executing scripts', async () => {
    const story: StoryRecord = {
      id: 'story-1',
      prompt: 'Family picnic',
      article: {
        headline: 'Family Picnic Delights Crowd',
        subheadline: 'Neighbors join the celebration',
        byline: 'By Staff Reporter',
        dateline: 'June 10, 2024',
        quote: 'This day belongs in the family album.',
        body: [
          'Families gathered under the largest oak in the park.',
          '<script>window.__xss = true</script>',
        ],
        tags: ['family'],
      },
      image: {
        id: 'photo-1',
        fileName: 'picnic.jpg',
        filePath: 'users/user-1/picnic.jpg',
        publicUrl: 'https://cdn.example.com/picnic.jpg',
        caption: 'Family picnic spread',
        uploadedBy: 'user-1',
      },
      createdAt: '2024-06-10T12:00:00.000Z',
      updatedAt: '2024-06-10T12:00:00.000Z',
    };

    const printDocument = document.implementation.createHTMLDocument('Print');
    const focusMock = jest.fn();
    const printMock = jest.fn();
    const openSpy = jest
      .spyOn(window, 'open')
      .mockReturnValue({
        document: printDocument,
        focus: focusMock,
        print: printMock,
      } as unknown as Window);

    render(
      <StoryPreviewDialog story={story} open onOpenChange={() => {}} />,
    );

    const printButton = screen.getByRole('button', { name: /print layout/i });

    await act(async () => {
      printButton.click();
      jest.runAllTimers();
    });

    expect(openSpy).toHaveBeenCalledWith('', '_blank');
    expect(focusMock).toHaveBeenCalled();
    expect(printMock).toHaveBeenCalled();

    const styleTag = printDocument.head.querySelector('style');
    expect(styleTag).not.toBeNull();

    const scriptTag = printDocument.body.querySelector('script');
    expect(scriptTag).toBeNull();
    expect(printDocument.body.innerHTML).not.toContain('<script>');

    const meta = printDocument.body.querySelector('.meta');
    expect(meta?.textContent).toContain('June 10, 2024');

    const image = printDocument.body.querySelector(
      '.story-image',
    ) as HTMLImageElement | null;
    expect(image?.src).toContain('https://cdn.example.com/picnic.jpg');

    openSpy.mockRestore();
  });
});
