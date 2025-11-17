import { useEffect, useMemo, useState } from 'react';
import { Sparkles, User } from 'lucide-react';
import { fetchAllTemplates } from '../lib/templates';
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
  const [templates, setTemplates] = useState<StoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTemplates = async () => {
      setLoading(true);
       setError(null);
      try {
        const data = await fetchAllTemplates();
        if (cancelled) {
          return;
        }

        setTemplates(data);
      } catch (error) {
        if (!cancelled) {
          if (process.env.NODE_ENV === 'development') {
            console.error('TemplatesGallery load failed:', error);
          }
          setTemplates([]);
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

  if (process.env.NODE_ENV === 'development') {
    console.log('TemplatesGallery state:', {
      loading,
      templatesCount: templates.length,
    });
  }

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
                  onClick={() => onSelect(template)}
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
                  onClick={() => onSelect(template)}
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
