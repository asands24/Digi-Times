import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { EventBuilder } from '../components/EventBuilder';

jest.mock('../hooks/useStoryLibrary', () => ({
  persistStory: jest.fn().mockResolvedValue({ filePath: 'stories/user/file.jpg' }),
  loadStories: jest.fn(),
}));

jest.mock('../components/TemplatesGallery', () => ({
  TemplatesGallery: ({ onSelect }: { onSelect: (template: any) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          id: 'template-123',
          title: 'Broadsheet',
          slug: 'broadsheet',
          html: '<article>{{bodyHtml}}</article>',
          css: '',
          isSystem: true,
          owner: null,
        })
      }
    >
      Select Template
    </button>
  ),
}));

jest.mock('../utils/storyGenerator', () => ({
  generateArticle: jest.fn(),
}));

const persistStoryMock = jest.requireMock('../hooks/useStoryLibrary')
  .persistStory as jest.Mock;

const generateArticleMock = jest.requireMock('../utils/storyGenerator')
  .generateArticle as jest.Mock;

jest.mock('../lib/supabaseClient', () => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  };
  return {
    supabase: mockSupabase,
    supabaseClient: mockSupabase,
    getSupabase: jest.fn(() => mockSupabase),
  };
});

const supabaseModule = jest.requireMock('../lib/supabaseClient') as {
  supabase: {
    auth: {
      getSession: jest.Mock;
      getUser: jest.Mock;
      signOut: jest.Mock;
    };
    from: jest.Mock;
    storage: { from: jest.Mock };
  };
  getSupabase: jest.Mock;
};

const mockSupabase = supabaseModule.supabase;
const mockGetSupabase = supabaseModule.getSupabase;
const mockGetUser = mockSupabase.auth.getUser;

const setupUser = () =>
  typeof (userEvent as any).setup === 'function'
    ? (userEvent as any).setup({ advanceTimers: jest.advanceTimersByTime })
    : userEvent;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSupabase.mockReturnValue(mockSupabase);

  generateArticleMock.mockReturnValue({
    headline: 'Headline',
    subheadline: 'Subheadline',
    byline: 'Byline',
    dateline: 'Dateline',
    quote: 'A great quote',
    body: ['Paragraph one', 'Paragraph two'],
    tags: ['tag'],
  });

  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'smoke@example.com' } },
    error: null,
  });
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'user-123', email: 'smoke@example.com' } } },
    error: null,
  });
  mockSupabase.auth.signOut.mockResolvedValue({ error: null });

  (mockSupabase.storage.from as jest.Mock).mockReturnValue({
    upload: jest.fn().mockResolvedValue({
      data: { path: 'photos/smoke.png' },
      error: null,
    }),
    getPublicUrl: jest.fn(() => ({
      data: { publicUrl: 'https://example.com/photos/smoke.png' },
    })),
  });

  (mockSupabase.from as jest.Mock).mockReturnValue({
    insert: jest.fn().mockReturnValue({ error: null }),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'row-1' }, error: null }),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  });
});

describe('EventBuilder archive flow', () => {
  it('requires a template before enabling save and persists with template id', async () => {
    const user = setupUser();

    const { container } = render(<EventBuilder onArchiveSaved={jest.fn()} />);

    const promptBox = screen.getByPlaceholderText(
      "e.g. Sunset picnic celebrating grandma's 80th birthday",
    );
    await user.type(promptBox, 'Family picnic');

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', {
      type: 'image/jpeg',
    });

    await act(async () => {
      await user.upload(fileInput, file);
    });

    await waitFor(() => {
      expect(container.querySelector('.story-card')).not.toBeNull();
    });

    const cardElement = container.querySelector('.story-card') as HTMLElement;
    expect(cardElement).not.toBeNull();

    const generateButton = within(cardElement).getByRole('button', {
      name: /generate article/i,
    });
    await act(async () => {
      await user.click(generateButton);
    });
    expect(generateArticleMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        within(cardElement).queryByRole('button', { name: /regenerate article/i }),
      ).toBeTruthy();
    });

    const selectTemplateButton = screen.getByRole('button', {
      name: /select template/i,
    });
    await user.click(selectTemplateButton);

    const saveButton = await within(cardElement).findByRole('button', {
      name: /save to archive/i,
    });
    expect(saveButton).toBeEnabled();
    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => expect(persistStoryMock).toHaveBeenCalledTimes(1));
    expect(mockGetUser).toHaveBeenCalled();
    const callArgs = persistStoryMock.mock.calls[0][0];
    expect(callArgs.templateId).toBe('template-123');
  });
});
