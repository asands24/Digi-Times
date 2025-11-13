import { supabase } from './supabaseClient';

export type TemplateRow = {
  id: string;
  slug: string;
  title: string;
  html: string;
  css?: string | null;
  is_system: boolean;
  created_at?: string;
};

export async function fetchAllTemplates(): Promise<TemplateRow[]> {
  const view = await supabase
    .from('templates_public')
    .select('*')
    .order('title', { ascending: true });

  if (!view.error && view.data) {
    return view.data.map(mapToTemplateRow);
  }

  if (view.error) {
    console.warn('templates_public view unavailable, falling back to legacy query', view.error);
  }

  const fallback = await supabase
    .from('templates')
    .select('id,name,description,html,css,is_system,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!fallback.error && fallback.data) {
    return fallback.data.map((row: any) => ({
      id: row.id,
      slug: row.name ?? row.description ?? `template-${row.id}`,
      title: row.title ?? row.name ?? row.description ?? 'Untitled',
      html: row.html ?? '',
      css: row.css ?? '',
      is_system: Boolean(row.is_system),
      created_at: row.created_at ?? new Date().toISOString(),
    }));
  }

  if (view.error) {
    throw view.error;
  }

  throw fallback.error ?? new Error('Unable to fetch templates.');
}

export async function getTemplateById(id: string): Promise<TemplateRow> {
  const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();
  if (error) throw error;
  return data as TemplateRow;
}

function mapToTemplateRow(row: any): TemplateRow {
  return {
    id: row.id,
    slug: row.slug ?? row.name ?? `template-${row.id}`,
    title: row.title ?? 'Untitled',
    html: row.html ?? '',
    css: row.css ?? '',
    is_system: Boolean(row.is_system),
    created_at: row.created_at,
  };
}
