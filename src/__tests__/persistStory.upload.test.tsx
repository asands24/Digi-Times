import { persistStory } from '../hooks/useStoryLibrary';

jest.mock('../lib/supabaseClient', () => {
  const mockSupabase = {
    storage: {
      from: jest.fn(),
    },
    from: jest.fn(),
  };
  return {
    supabase: mockSupabase,
    getSupabase: jest.fn(() => mockSupabase),
  };
});

const supabaseModule = jest.requireMock('../lib/supabaseClient') as {
  supabase: {
    storage: { from: jest.Mock };
    from: jest.Mock;
  };
  getSupabase: jest.Mock;
};

const mockSupabase = supabaseModule.supabase;
const mockGetSupabase = supabaseModule.getSupabase;

describe('persistStory upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSupabase.mockReturnValue(mockSupabase);
    mockSupabase.storage.from.mockReset();
    mockSupabase.from.mockReset();
  });

  it('uploads file to storage and inserts archive record', async () => {
    const { getSupabase } = jest.requireMock('../lib/supabaseClient');
    const supabase = getSupabase();
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
