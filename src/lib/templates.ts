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

  console.log('[Templates] 📋 fetchAllTemplates() started', {
    templateSourceMode: TEMPLATE_SOURCE_MODE,
    localTemplatesCount: localTemplates.length,
    timestamp: new Date().toISOString(),
  });

  if (TEMPLATE_SOURCE_MODE === 'local-only') {
    console.log('[Templates] ✅ Using local-only mode, skipping remote fetch', {
      count: localTemplates.length,
      templates: localTemplates.map(t => ({ id: t.id, title: t.title })),
    });
    return localTemplates;
  }

  try {
    console.log('[Templates] 🌐 Fetching templates from Supabase...');
    const { data, error } = await supabaseClient
      .from('templates_public')
      .select(TEMPLATE_VIEW_COLUMNS)
      .order('title', { ascending: true });

    if (error) {
      console.error('[Templates] ❌ Supabase fetch error:', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        fallbackToLocal: true,
      });
      logWarning('Supabase template fetch failed, using local templates.', error);
      return localTemplates;
    }

    if (!data || data.length === 0) {
      console.warn('[Templates] ⚠️ Supabase returned empty data, using local templates', {
        dataIsNull: !data,
        dataLength: data?.length ?? 0,
      });
      return localTemplates;
    }

    const remoteTemplates = data.map((row) => mapRemoteTemplate(row as TemplateViewRow));

    console.log('[Templates] ✅ Successfully fetched remote templates', {
      remoteCount: remoteTemplates.length,
      templates: remoteTemplates.map(t => ({ id: t.id, title: t.title, isSystem: t.isSystem })),
    });
    return remoteTemplates.length > 0 ? remoteTemplates : localTemplates;
  } catch (error) {
    console.error('[Templates] ❌ Unexpected error fetching templates:', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      fallbackToLocal: true,
    });
    logWarning('Unexpected error fetching templates, using local templates.', error);
    return localTemplates;
  }
}

export async function getTemplateById(id: string): Promise<StoryTemplate> {
  console.log('[Templates] 🔍 getTemplateById() called', { id });

  const localMatch = findLocalTemplate(id);
  if (localMatch) {
    console.log('[Templates] ✅ Template found in local cache', {
      id,
      title: localMatch.title,
      slug: localMatch.slug,
    });
    return localMatch;
  }

  console.log('[Templates] ⚠️ Template not found in local cache, checking remote...', { id });

  if (TEMPLATE_SOURCE_MODE === 'local-only') {
    console.error('[Templates] ❌ Template not found (local-only mode)', { id });
    throw new Error('Template not found locally.');
  }

  try {
    console.log('[Templates] 🌐 Querying Supabase for template...', { id });

    const { data, error } = await supabaseClient
      .from('templates')
      .select(TEMPLATE_TABLE_COLUMNS)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('[Templates] ❌ Supabase query failed', {
        id,
        error,
        errorMessage: error?.message,
        dataIsNull: !data,
      });
      throw error ?? new Error('Template not found.');
    }

    const template = mapRemoteTemplate(data as TemplateTableRow);
    console.log('[Templates] ✅ Template loaded from Supabase', {
      id,
      slug: template.slug,
      title: template.title,
      isSystem: template.isSystem,
    });
    return template;
  } catch (error) {
    console.error('[Templates] ❌ Failed to load template by id', {
      id,
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    logWarning('Unable to load template by id.', error);
    throw error instanceof Error ? error : new Error('Unable to load template.');
  }
}
