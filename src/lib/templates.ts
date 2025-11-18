import { groupTemplates } from '../data/templates';
import type { StoryTemplate } from '../types/story';
import type { Database } from '../types/supabase';
import { TEMPLATE_SOURCE_MODE } from './appConfig';
import { supabaseClient } from './supabaseClient';

const LOG_WARNINGS = process.env.NODE_ENV === 'development';
const TEMPLATE_VIEW_COLUMNS =
  'id, slug, title, description, html, css, is_system, owner, created_at';
const TEMPLATE_TABLE_COLUMNS =
  'id, slug, title, description, html, css, is_system, owner, created_at, updated_at, is_public';

type TemplateViewRow = Database['public']['Views']['templates_public']['Row'];
type TemplateTableRow = Database['public']['Tables']['templates']['Row'];

const LOCAL_TEMPLATE_CACHE: StoryTemplate[] = groupTemplates.map((template, index) => {
  const slugSource = template.id ?? template.name ?? template.title ?? `template-${index}`;
  const normalizedSlug = String(slugSource).toLowerCase().replace(/\s+/g, '-');
  const templateId =
    typeof template.id === 'string' && template.id.trim().length > 0
      ? template.id
      : `local-${normalizedSlug}-${index}`;
  const localHtml = (template as { html?: string }).html ?? '';
  const localCss = (template as { css?: string }).css ?? '';

  return {
    id: templateId,
    slug: normalizedSlug,
    title: template.title ?? template.name ?? 'Untitled template',
    description: template.description ?? '',
    html: localHtml,
    css: localCss,
    isSystem: true,
    owner: null,
  };
});

const LOCAL_TEMPLATE_LOOKUP = new Map<string, StoryTemplate>();
LOCAL_TEMPLATE_CACHE.forEach((template) => {
  LOCAL_TEMPLATE_LOOKUP.set(template.id, template);
  if (template.slug) {
    LOCAL_TEMPLATE_LOOKUP.set(template.slug, template);
  }
});

const cloneTemplate = (template: StoryTemplate): StoryTemplate => ({ ...template });

const mapRemoteTemplate = (row: TemplateViewRow | TemplateTableRow): StoryTemplate => {
  const fallbackSlug = row.slug ?? row.title ?? `template-${row.id}`;
  const fallbackTitle = row.title ?? fallbackSlug ?? 'Untitled';
  const description = (row as { description?: string | null }).description ?? '';
  const owner = (row as { owner?: string | null }).owner ?? null;
  return {
    id: String(row.id),
    slug: fallbackSlug,
    title: fallbackTitle,
    description,
    html: row.html ?? '',
    css: row.css ?? '',
    isSystem: Boolean(row.is_system ?? true),
    owner,
  };
};

function logWarning(message: string, error?: unknown) {
  if (!LOG_WARNINGS) {
    return;
  }
  if (error) {
    console.error(message, error);
  } else {
    console.error(message);
  }
}

export function getLocalTemplates(): StoryTemplate[] {
  return LOCAL_TEMPLATE_CACHE.map(cloneTemplate);
}

export function findLocalTemplate(idOrSlug: string): StoryTemplate | undefined {
  const match = LOCAL_TEMPLATE_LOOKUP.get(idOrSlug);
  return match ? cloneTemplate(match) : undefined;
}

export async function fetchAllTemplates(): Promise<StoryTemplate[]> {
  const localTemplates = getLocalTemplates();

  if (TEMPLATE_SOURCE_MODE === 'local-only') {
    return localTemplates;
  }

  try {
    const { data, error } = await supabaseClient
      .from('templates_public')
      .select(TEMPLATE_VIEW_COLUMNS)
      .order('title', { ascending: true });

    if (error || !data || data.length === 0) {
      logWarning('Supabase template fetch failed or empty, using local templates.', error);
      return localTemplates;
    }

    const remoteTemplates = data.map((row) => mapRemoteTemplate(row as TemplateViewRow));
    return remoteTemplates.length > 0 ? remoteTemplates : localTemplates;
  } catch (error) {
    logWarning('Unexpected error fetching templates, using local templates.', error);
    return localTemplates;
  }
}

export async function getTemplateById(id: string): Promise<StoryTemplate> {
  const localMatch = findLocalTemplate(id);
  if (localMatch) {
    return localMatch;
  }

  if (TEMPLATE_SOURCE_MODE === 'local-only') {
    throw new Error('Template not found locally.');
  }

  try {
    const { data, error } = await supabaseClient
      .from('templates')
      .select(TEMPLATE_TABLE_COLUMNS)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw error ?? new Error('Template not found.');
    }

    return mapRemoteTemplate(data as TemplateTableRow);
  } catch (error) {
    logWarning('Unable to load template by id.', error);
    throw error instanceof Error ? error : new Error('Unable to load template.');
  }
}
