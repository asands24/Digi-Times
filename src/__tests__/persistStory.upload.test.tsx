import { persistStory } from '../hooks/useStoryLibrary';
import { supabase } from '../lib/supabaseClient';

jest.mock('../lib/supabaseClient', () => {
  const mockUser = { id: 'user-1' };
  const insertMock = jest.fn().mockResolvedValue({ error: null });

  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'photos/user-1/foo.png' },
            error: null,
          }),
          getPublicUrl: jest.fn(() => ({
            data: { publicUrl: 'https://example.com/photos/user-1/foo.png' },
          })),
        })),
      },
      from: jest.fn(() => ({
        insert: insertMock,
      })),
    },
  };
});

describe('persistStory upload', () => {
  it('uploads file to storage and inserts archive record', async () => {
    const storageFrom = supabase.storage.from as jest.Mock;
    const tableFrom = supabase.from as jest.Mock;

    const uploadMock = jest.fn().mockResolvedValue({
      data: { path: 'photos/user-1/foo.png' },
      error: null,
    });
    storageFrom.mockReturnValue({
      upload: uploadMock,
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://example.com/photos/user-1/foo.png' },
      })),
    });
    tableFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    const file = new File([new Uint8Array([1, 2, 3])], 'foo.png', {
      type: 'image/png',
    });

    const result = await persistStory({
      file,
      meta: {
        headline: 'Smoke Test',
        bodyHtml: '<p>Body</p>',
        prompt: 'Prompt',
      },
      templateId: 'tpl-1',
      userId: 'user-1',
    });

    expect(result.filePath).toMatch(/^stories\/user-1\/.+foo\.png$/);
    expect(storageFrom).toHaveBeenCalledWith('photos');
    const uploadPath = uploadMock.mock.calls[0][0];
    expect(uploadPath).toMatch(/^stories\/user-1\/\d+-foo\.png$/);
    expect(uploadMock).toHaveBeenCalledWith(
      uploadPath,
      file,
      expect.objectContaining({ upsert: false }),
    );
    expect(tableFrom).toHaveBeenCalledWith('story_archives');
  });
});
