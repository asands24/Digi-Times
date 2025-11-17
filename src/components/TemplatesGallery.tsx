import { useEffect, useMemo, useState } from 'react';
import { Sparkles, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAllTemplates } from '../lib/templates';
import type { TemplateRow } from '../lib/templates';
import type { StoryTemplate } from '../types/story';
import { cn } from '../utils/cn';
import { groupTemplates } from '../data/templates';
import { formatSupabaseError } from '../utils/errorMessage';

const IS_DEV = process.env.NODE_ENV === 'development';

interface TemplatesGalleryProps {
  selectedTemplateId: string | null;
  onSelect: (template: StoryTemplate) => void;
  autoSelectFirst?: boolean;
}

const STATIC_TEMPLATE_FALLBACK: StoryTemplate[] = groupTemplates.map((template) => ({
  id: template.id,
  title: template.title ?? template.name ?? 'Template',
  slug: template.name ?? template.title ?? template.id,
  html: '',
  css: '',
  isSystem: true,
  owner: null,
}));

function mapTemplateRow(row: TemplateRow): StoryTemplate {
  const fallbackSlug = row.slug ?? row.title ?? `template-${row.id}`;
  const fallbackTitle = row.title ?? fallbackSlug ?? 'Untitled';
  return {
    id: row.id,
    title: fallbackTitle,
    slug: fallbackSlug,
    html: row.html ?? '',
    css: row.css ?? '',
    isSystem: Boolean(row.is_system),
    owner: null,
  };
}

export function TemplatesGallery({
  selectedTemplateId,
  onSelect,
  autoSelectFirst = true,
}: TemplatesGalleryProps) {
  const [templates, setTemplates] = useState<StoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTemplates = async () => {
      setLoading(true);
      setStatusMessage(null);
      if (IS_DEV) {
        setDebugMessage(null);
      }
      try {
        const data = await fetchAllTemplates();

        if (cancelled) {
          return;
        }

        const mapped = data.map((row: TemplateRow) => mapTemplateRow(row));

        if (mapped.length === 0) {
          setTemplates(STATIC_TEMPLATE_FALLBACK);
          if (STATIC_TEMPLATE_FALLBACK.length === 0) {
            setStatusMessage('No templates available right now.');
          } else {
            setStatusMessage('Showing featured templates.');
          }
          if (IS_DEV) {
            setDebugMessage('Supabase returned 0 templates (using featured fallback).');
          }
          return;
        }

        setTemplates(mapped);
        setStatusMessage(null);
        if (IS_DEV) {
          setDebugMessage(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        toast.error('Could not load templates from Supabase. Showing featured layouts instead.');
        const fallback = STATIC_TEMPLATE_FALLBACK;
        setTemplates(fallback);
        if (fallback.length === 0) {
          setStatusMessage('No templates available right now.');
        } else {
          setStatusMessage('Showing featured templates.');
        }
        if (IS_DEV) {
          setDebugMessage(formatSupabaseError(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const [systemTemplates, personalTemplates] = useMemo(() => {
    const system = templates.filter((template) => template.isSystem);
    const personal = templates.filter((template) => !template.isSystem);
    return [system, personal];
  }, [templates]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    if (!autoSelectFirst) {
      return;
    }

    if (!selectedTemplateId && templates.length > 0) {
      onSelect(templates[0]);
    }
  }, [autoSelectFirst, onSelect, selectedTemplateId, templates]);

  return (
    <section className="template-gallery">
      <header className="template-gallery__heading">
        <div>
          <h2 className="template-gallery__title">
            <Sparkles size={20} strokeWidth={1.8} />
            Choose a layout template
          </h2>
          <p>Pick the layout you want to use for the next story you archive.</p>
        </div>
      </header>
      <div className="template-gallery__selection">
        {selectedTemplate ? (
          <>
            <span>Selected layout</span>
            <strong>{selectedTemplate.title}</strong>
          </>
        ) : (
          <span>Tap a template card to set it for your next story.</span>
        )}
      </div>

      {statusMessage ? (
        <div className="template-gallery__notice">{statusMessage}</div>
      ) : null}

      {IS_DEV && debugMessage ? (
        <p className="template-gallery__notice" style={{ fontSize: 12 }}>
          Debug: template fetch failed: {debugMessage}
        </p>
      ) : null}

      {loading ? (
        <div className="template-gallery__empty">Loading templates…</div>
      ) : templates.length === 0 ? (
        <div className="template-gallery__empty">
          <p>No templates available right now.</p>
        </div>
      ) : (
        <>
          {systemTemplates.length > 0 ? (
            <div className="template-gallery__group">
              <h3>System templates</h3>
              <div className="template-gallery__grid">
                {systemTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={cn('template-card', {
                      'template-card--active': template.id === selectedTemplateId,
                    })}
                    onClick={() => onSelect(template)}
                    aria-pressed={template.id === selectedTemplateId}
                  >
                    <div className="template-card__badge">Featured</div>
                    <h4 className="template-card__title">{template.title}</h4>
                    <p className="template-card__body">
                      Designed by DigiTimes editors for polished spreads.
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {personalTemplates.length > 0 ? (
            <div className="template-gallery__group">
              <h3>Your templates</h3>
              <div className="template-gallery__grid">
                {personalTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={cn('template-card', {
                      'template-card--active': template.id === selectedTemplateId,
                    })}
                    onClick={() => onSelect(template)}
                    aria-pressed={template.id === selectedTemplateId}
                  >
                    <div className="template-card__badge template-card__badge--personal">
                      <User size={14} strokeWidth={1.8} />
                      Yours
                    </div>
                    <h4 className="template-card__title">{template.title}</h4>
                    <p className="template-card__body">
                      Saved layouts you can tweak for recurring editions.
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

export default TemplatesGallery;
