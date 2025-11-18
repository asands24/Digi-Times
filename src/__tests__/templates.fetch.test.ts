jest.mock('../lib/supabaseClient', () => {
  const supabase = {
    from: jest.fn(),
  };
  return {
    supabase,
    supabaseClient: supabase,
    getSupabase: jest.fn(() => supabase),
  };
});

const supabaseModule = jest.requireMock('../lib/supabaseClient') as {
  supabase: { from: jest.Mock };
  supabaseClient: { from: jest.Mock };
};
const supabaseMock = supabaseModule.supabaseClient;

describe('templates_public view fetch', () => {
  it('queries the public view sorted by title', async () => {
    supabaseMock.from.mockReset();

    const order = jest.fn().mockResolvedValue({ data: [], error: null });
    const select = jest.fn(() => ({ order }));
    supabaseMock.from.mockReturnValue({ select });

    const { fetchAllTemplates } = require('../lib/templates') as typeof import('../lib/templates');
    await fetchAllTemplates();

    expect(supabaseMock.from).toHaveBeenCalledWith('templates_public');
    expect(select).toHaveBeenCalledWith(
      'id, slug, title, description, html, css, is_system, owner, created_at',
    );
    expect(order).toHaveBeenCalledWith('title', { ascending: true });
  });
});
