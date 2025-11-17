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

const supabase = jest.requireMock('../lib/supabaseClient').supabase as {
  from: jest.Mock;
};

describe('templates local fallback', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns local templates when Supabase errors', async () => {
    const order = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('missing view'),
    });
    const select = jest.fn(() => ({ order }));
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const { fetchAllTemplates } = await import('../lib/templates');
    const rows = await fetchAllTemplates();

    expect(rows).toHaveLength(expect.any(Number));
    expect(rows[0]).toHaveProperty('isSystem', true);
    expect(order).toHaveBeenCalled();
  });

  it('maps remote templates when Supabase returns rows', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'remote-1',
          slug: 'remote-welcome',
          title: 'Remote Welcome',
          html: '<article/>',
          css: '.news { }',
          is_system: false,
          owner: 'user-1',
        },
      ],
      error: null,
    });
    const select = jest.fn(() => ({ order }));
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const { fetchAllTemplates } = await import('../lib/templates');
    const rows = await fetchAllTemplates();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'remote-1',
      title: 'Remote Welcome',
      slug: 'remote-welcome',
      html: '<article/>',
      css: '.news { }',
      isSystem: false,
      owner: 'user-1',
    });
  });
});
