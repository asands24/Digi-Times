import { act, render } from '@testing-library/react';
import toast from 'react-hot-toast';
import { useStoryLibrary } from '../hooks/useStoryLibrary';
import type { GeneratedArticle } from '../utils/storyGenerator';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const uploadMock = jest.fn();
const getPublicUrlMock = jest.fn();
const removeMock = jest.fn();
const photoInsertMock = jest.fn();
const storyInsertMock = jest.fn();
const storySelectMock = jest.fn();

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
        remove: removeMock,
        download: jest.fn(),
      })),
    },
    from: jest.fn((table: string) => {
      if (table === 'photos') {
        return {
          insert: photoInsertMock,
          delete: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null }),
            in: jest.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
      if (table === 'story_archives') {
        return {
          insert: storyInsertMock,
          delete: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null }),
          })),
          select: storySelectMock,
        };
      }
      return {
        insert: jest.fn(),
        delete: jest.fn(),
        select: jest.fn(),
      };
    }),
  },
}));

const { supabase } = jest.requireMock('../lib/supabaseClient') as {
  supabase: {
    auth: { getUser: jest.Mock };
  };
};

const toastMock = toast as unknown as {
  success: jest.Mock;
  error: jest.Mock;
};

const renderUseStoryLibrary = () => {
  const hookRef: { current: ReturnType<typeof useStoryLibrary> | null } = {
    current: null,
  };

  function HookContainer() {
    hookRef.current = useStoryLibrary();
    return null;
  }

  render(<HookContainer />);
  if (!hookRef.current) {
    throw new Error('Hook did not initialise');
  }

  return hookRef;
};

const articleStub: GeneratedArticle = {
  headline: 'Family Reunion Delight',
  subheadline: 'Neighbors join the fun',
  byline: 'By Staff Reporter',
  dateline: 'June 10, 2024',
  quote: 'This is the best day!',
  body: ['Paragraph one', 'Paragraph two'],
  tags: ['family', 'celebration'],
};

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  });

  storySelectMock.mockImplementation(() => ({
    eq: jest.fn(() => ({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  }));

  getPublicUrlMock.mockReturnValue({
    data: { publicUrl: 'https://cdn.example.com/photo.jpg' },
  });

  uploadMock.mockResolvedValue({ error: null });

  const photoRow = {
    id: 'photo-123',
    file_path: 'users/user-123/photo.jpg',
    file_name: 'photo.jpg',
    caption: null,
    uploaded_by: 'user-123',
  };

  photoInsertMock.mockImplementation(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: photoRow,
        error: null,
      }),
    })),
  }));

  storyInsertMock.mockImplementation((payload: Record<string, unknown>) => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'story-123',
          user_id: payload.user_id,
          prompt: payload.prompt,
          article: payload.article,
          created_at: payload.created_at,
          updated_at: payload.updated_at,
          photo: {
            id: 'photo-123',
            file_path: 'users/user-123/photo.jpg',
            file_name: 'photo.jpg',
            caption: null,
            uploaded_by: 'user-123',
          },
        },
        error: null,
      }),
    })),
  }));
});

describe('useStoryLibrary uploads', () => {
  it('surfaces oversize photo errors to the user', async () => {
    const hook = renderUseStoryLibrary();
    const largeFile = new File(
      [new Uint8Array(4 * 1024 * 1024 + 1)],
      'large.jpg',
      { type: 'image/jpeg' },
    );

    let caught: unknown;
    await act(async () => {
      try {
        await hook.current!.saveStory({
          prompt: 'Family picnic',
          article: articleStub,
          file: largeFile,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        caught = error;
      }
    });

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toContain('File is too large');
    expect(uploadMock).not.toHaveBeenCalled();
    expect(photoInsertMock).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith('Photo is too large. Max 4MB.');
  });

  it('uploads photos and persists metadata on success', async () => {
    const hook = renderUseStoryLibrary();
    const file = new File([new Uint8Array(1024)], 'photo.jpg', {
      type: 'image/jpeg',
    });

    let savedStory: ReturnType<typeof useStoryLibrary>['stories'][number] | null =
      null;

    await act(async () => {
      savedStory = await hook.current!.saveStory({
        prompt: 'Family picnic',
        article: articleStub,
        file,
        createdAt: '2024-06-01T00:00:00.000Z',
      });
    });

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(photoInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        file_name: 'photo.jpg',
        uploaded_by: 'user-123',
      }),
    );
    expect(storyInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Family picnic',
        photo_id: 'photo-123',
      }),
    );
    expect(savedStory).toMatchObject({
      id: 'story-123',
      prompt: 'Family picnic',
      image: {
        id: 'photo-123',
        publicUrl: 'https://cdn.example.com/photo.jpg',
      },
    });
    expect(toastMock.error).not.toHaveBeenCalled();
  });
});
