import type { TemplateRow } from '../lib/templates';

jest.mock('../lib/supabaseClient', () => {
  const supabase = {
    from: jest.fn(),
  };
  return {
    supabase,
    getSupabase: jest.fn(() => supabase),
  };
});

const supabase = jest.requireMock('../lib/supabaseClient').supabase as {
  from: jest.Mock;
};

describe('templates view fallback', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to the legacy templates table when the view errors', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const viewOrder = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('missing view'),
    });

    const fallbackLimit = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'legacy-1',
          slug: null,
          title: null,
          name: 'Legacy Template',
          description: 'Desc',
          html: '<p>Legacy</p>',
          css: null,
          is_system: false,
          is_public: true,
          inserted_at: '2025-01-01T00:00:00.000Z',
          created_at: null,
        },
      ],
      error: null,
    });

    const fallbackOrder = jest.fn().mockReturnValue({
      limit: fallbackLimit,
    });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'templates_public') {
        return {
          select: jest.fn().mockReturnValue({
            order: viewOrder,
          }),
        };
      }

      if (table === 'templates') {
        return {
          select: jest.fn().mockReturnValue({
            order: fallbackOrder,
          }),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const { fetchAllTemplates } = await import('../lib/templates');
    const rows = (await fetchAllTemplates()) as TemplateRow[];

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'legacy-1',
      title: 'Legacy Template',
      slug: 'Legacy Template',
      html: '<p>Legacy</p>',
      css: '',
      is_system: true,
    });

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
