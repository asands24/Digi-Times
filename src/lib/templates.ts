import { supabase } from './supabaseClient';

export type TemplateRow = {
  id: string;
  slug: string;
  title: string;
  html: string;
  css?: string | null;
  is_system: boolean;
};

export async function fetchAllTemplates(): Promise<TemplateRow[]> {
  const { data: system, error: sysErr } = await supabase
    .from('templates')
    .select('*')
    .eq('is_system', true)
    .order('title');
  if (sysErr) throw sysErr;

  const { data: mine, error: mineErr } = await supabase
    .from('templates')
    .select('*')
    .is('is_system', false)
    .order('title');
  if (mineErr) throw mineErr;

  return [...(system ?? []), ...(mine ?? [])];
}

export async function getTemplateById(id: string): Promise<TemplateRow> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as TemplateRow;
}
