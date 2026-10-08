import { groupTemplates } from '../data/templates';
import type { StoryTemplate } from '../types/story';
import { TEMPLATE_SOURCE_MODE } from './appConfig';
import { supabaseClient } from './supabaseClient';
import { templateLayout } from './templateLayouts';

const localTemplates: StoryTemplate[] = groupTemplates.map((template, index) => ({
  id: template.id, slug: template.id, title: template.title,
  description: template.description, ...templateLayout(template.title, index),
  isSystem: true, owner: null,
}));
export function getLocalTemplates(): StoryTemplate[] { return localTemplates.map(template => ({ ...template })); }
export function findLocalTemplate(id: string): StoryTemplate | undefined {
  const template = localTemplates.find(item => item.id === id || item.slug === id);
  return template ? { ...template } : undefined;
}
function mapRemoteTemplate(row: Record<string, any>): StoryTemplate {
  const title = row.title || row.name || 'Untitled template';
  const fallback = templateLayout(title);
  return { id: String(row.id), slug: row.slug || String(row.id), title,
    description: row.description || '', html: row.html || fallback.html, css: row.html ? row.css || '' : fallback.css,
    isSystem: Boolean(row.is_system), owner: row.owner || row.created_by || null };
}

async function boundedQuery<T>(query: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([query, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Template loading timed out.')), 10000);
    })]);
  } finally { if (timer) clearTimeout(timer); }
}

export async function fetchAllTemplates(): Promise<StoryTemplate[]> {
  const local = getLocalTemplates();
  if (TEMPLATE_SOURCE_MODE === 'local-only') return local;
  try {
    // The deployed legacy view has no slug/html/css and includes private system
    // drafts. Query explicitly public rows; tolerate both legacy and new schemas.
    const { data, error } = await boundedQuery(supabaseClient.from('templates').select('*')
      .eq('is_public', true).order('title', { ascending: true }));
    if (error) return local;
    const remote = (data || []).map(mapRemoteTemplate);
    return [...local, ...remote.filter(item => !local.some(builtIn => builtIn.id === item.id))];
  } catch { return local; }
}

export async function getTemplateById(id: string): Promise<StoryTemplate> {
  const local = findLocalTemplate(id);
  if (local) return local;
  if (TEMPLATE_SOURCE_MODE === 'local-only') throw new Error('This template is unavailable. Choose another layout.');
  const { data, error } = await boundedQuery(supabaseClient.from('templates').select('*')
    .eq('id', id).eq('is_public', true).single());
  if (error || !data) throw new Error('This template is unavailable. Choose another layout.');
  return mapRemoteTemplate(data);
}
