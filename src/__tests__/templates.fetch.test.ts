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

const supabaseModule = jest.requireMock('../lib/supabaseClient') as {
  supabase: { from: jest.Mock };
};
const supabaseMock = supabaseModule.supabase;

describe('templates_public view fetch', () => {
  it('queries the public view sorted by title', async () => {
    supabaseMock.from.mockReset();

    const order = jest.fn().mockResolvedValue({ data: [] satisfies TemplateRow[], error: null });
    const select = jest.fn(() => ({ order }));
    supabaseMock.from.mockReturnValue({ select });

    const { fetchAllTemplates } = require('../lib/templates') as typeof import('../lib/templates');
    await fetchAllTemplates();

    expect(supabaseMock.from).toHaveBeenCalledWith('templates_public');
    expect(select).toHaveBeenCalledWith('*');
    expect(order).toHaveBeenCalledWith('title', { ascending: true });
  });
});
