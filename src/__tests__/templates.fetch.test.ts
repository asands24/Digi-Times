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

describe('public template catalog', () => {
  it('queries explicitly public rows and tolerates legacy columns', async () => {
    supabaseMock.from.mockReset();

    const order = jest.fn().mockResolvedValue({ data: [], error: null });
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    supabaseMock.from.mockReturnValue({ select });

    const { fetchAllTemplates } = require('../lib/templates') as typeof import('../lib/templates');
    await fetchAllTemplates();

    expect(supabaseMock.from).toHaveBeenCalledWith('templates');
    expect(select).toHaveBeenCalledWith(
      '*',
    );
    expect(eq).toHaveBeenCalledWith('is_public', true);
    expect(order).toHaveBeenCalledWith('title', { ascending: true });
  });
});

export {};
