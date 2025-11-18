import { useEffect, useMemo, useState } from 'react';
import { Sparkles, User } from 'lucide-react';
import { fetchAllTemplates, getLocalTemplates } from '../lib/templates';
import type { StoryTemplate } from '../types/story';
import { cn } from '../utils/cn';

interface TemplatesGalleryProps {
  selectedTemplateId: string | null;
  onSelect: (template: StoryTemplate) => void;
  autoSelectFirst?: boolean;
}

export function TemplatesGallery({
  selectedTemplateId,
  onSelect,
  autoSelectFirst = true,
}: TemplatesGalleryProps) {
  const initialTemplates = useMemo(() => getLocalTemplates(), []);
  const [templates, setTemplates] = useState<StoryTemplate[]>(initialTemplates);
  const [loading, setLoading] = useState(initialTemplates.length === 0);
  const [error, setError] = useState<Error | null>(null);
  const hasInitialTemplates = initialTemplates.length > 0;

  useEffect(() => {
    let cancelled = false;

    const fetchTemplates = async () => {
      console.log('[TemplatesGallery] 🎨 Fetching templates...', {
        hasInitialTemplates,
        initialTemplatesCount: initialTemplates.length,
      });

      if (!hasInitialTemplates) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await fetchAllTemplates();
        if (cancelled) {
          console.log('[TemplatesGallery] ⚠️ Fetch cancelled');
          return;
        }

        console.log('[TemplatesGallery] ✅ Templates fetched successfully', {
          count: data.length,
          systemCount: data.filter(t => t.isSystem).length,
          personalCount: data.filter(t => !t.isSystem).length,
        });

        setTemplates(data);
      } catch (error) {
        if (!cancelled) {
          console.error('[TemplatesGallery] ❌ Template fetch failed', {
            error,
            errorMessage: error instanceof Error ? error.message : String(error),
            hasInitialTemplates,
          });
          if (!hasInitialTemplates) {
            setTemplates([]);
          }
          const normalized =
            error instanceof Error
              ? error
              : new Error('No templates available right now. Please try again later.');
          setError(normalized);
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
  }, [hasInitialTemplates, initialTemplates.length]);

  const [systemTemplates, personalTemplates] = useMemo(() => {
    const system = templates.filter((template) => template.isSystem);
    const personal = templates.filter((template) => !template.isSystem);
    return [system, personal];
  }, [templates]);

  const hasSelection = useMemo(
    () => templates.some((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    if (!autoSelectFirst) {
      console.log('[TemplatesGallery] ⏭️ Auto-select disabled');
      return;
    }

    if (templates.length === 0) {
      console.log('[TemplatesGallery] ⚠️ No templates to auto-select');
      return;
    }

    if (!selectedTemplateId || !hasSelection) {
      console.log('[TemplatesGallery] 🎯 Auto-selecting first template', {
        templateId: templates[0].id,
        templateTitle: templates[0].title,
      });
      onSelect(templates[0]);
    } else {
      console.log('[TemplatesGallery] ✅ Template already selected', {
        selectedTemplateId,
      });
    }
  }, [autoSelectFirst, hasSelection, onSelect, selectedTemplateId, templates]);

  const handleTemplateSelect = (template: StoryTemplate) => {
    console.log('[TemplatesGallery] 👆 Template selected by user', {
      templateId: template.id,
      templateTitle: template.title,
      isSystem: template.isSystem,
    });
    onSelect(template);
  };

  if (loading) {
    return (
      <section className="template-gallery">
        <div className="templates-loading">Loading templates…</div>
      </section>
    );
  }

  if (error && (!templates || templates.length === 0)) {
    return (
      <section className="template-gallery">
        <div className="templates-error">
          <p>We couldn’t load templates. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <section className="template-gallery">
        <div className="templates-empty">
          <p>No templates available right now.</p>
        </div>
      </section>
    );
  }

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
                  onClick={() => handleTemplateSelect(template)}
                  aria-pressed={template.id === selectedTemplateId}
                >
                  <div className="template-card__badge">Featured</div>
                  <h4 className="template-card__title">{template.title}</h4>
                  <p className="template-card__body">
                    {template.description ?? 'Designed by DigiTimes editors for polished spreads.'}
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
                  onClick={() => handleTemplateSelect(template)}
                  aria-pressed={template.id === selectedTemplateId}
                >
                  <div className="template-card__badge template-card__badge--personal">
                    <User size={14} strokeWidth={1.8} />
                    Yours
                  </div>
                  <h4 className="template-card__title">{template.title}</h4>
                  <p className="template-card__body">
                    {template.description ??
                      'Saved layouts you can tweak for recurring editions.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </>
    </section>
  );
}

export default TemplatesGallery;
