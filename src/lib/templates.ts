import { supabase } from './supabaseClient';
import type { Database } from '../types/supabase';

const shouldLogWarnings = process.env.NODE_ENV !== 'production';

type TemplateViewRow = Database['public']['Views']['templates_public']['Row'];
type TemplateTableRow = Database['public']['Tables']['templates']['Row'];

export type TemplateRow = TemplateViewRow;

export async function fetchAllTemplates(): Promise<TemplateRow[]> {
  const view = await supabase
    .from('templates_public')
    .select('*')
    .order('title', { ascending: true });

  if (!view.error && view.data) {
    return view.data.map(mapToTemplateRow);
  }

  if (view.error && shouldLogWarnings) {
    console.warn('templates_public view unavailable, falling back to legacy query', view.error);
  }

  const fallback = await supabase
    .from('templates')
    .select('id,slug,title,html,css,is_system,created_at,updated_at,owner,is_public')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!fallback.error && fallback.data) {
    return fallback.data.map((row: TemplateTableRow) => {
      const legacy = row as TemplateTableRow & {
        name?: string | null;
        description?: string | null;
      };
      const fallbackTitle = legacy.name ?? legacy.description ?? `template-${row.id}`;
      return {
        id: row.id,
        slug: row.slug ?? fallbackTitle,
        title: row.title ?? fallbackTitle ?? 'Untitled',
        html: row.html ?? '',
        css: row.css ?? '',
        is_system: Boolean(row.is_system),
        created_at: row.created_at ?? row.updated_at ?? new Date().toISOString(),
      };
    });
  }

  if (view.error) {
    throw view.error;
  }

  throw fallback.error ?? new Error('Unable to fetch templates.');
}

export async function getTemplateById(id: string): Promise<TemplateRow> {
  const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();
  if (error) throw error;
  return mapToTemplateRow(data as TemplateTableRow);
}

function mapToTemplateRow(row: TemplateViewRow | TemplateTableRow): TemplateRow {
  return {
    id: row.id,
    slug: row.slug ?? row.title ?? `template-${row.id}`,
    title: row.title ?? 'Untitled',
    html: row.html ?? '',
    css: row.css ?? '',
    is_system: Boolean(row.is_system),
    created_at: row.created_at ?? ('updated_at' in row ? row.updated_at ?? null : null),
  };
}
