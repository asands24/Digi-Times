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
    supabaseClient: mockSupabase,
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
    const selectMock = jest.fn().mockReturnThis();
    const singleMock = jest.fn().mockResolvedValue({
      data: {
        id: 'story-1',
        user_id: 'user-1',
        title: 'Smoke Test',
        article: '<p>Body</p>',
        prompt: 'Prompt',
        image_path: 'stories/user-1/foo.png',
        template_id: 'tpl-1',
        is_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });
    tableFrom.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: selectMock,
      single: singleMock,
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
    expect(result.story).toBeTruthy();
    expect(result.story?.template_id).toBe('tpl-1');
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
