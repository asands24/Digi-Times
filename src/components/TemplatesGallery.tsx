import { useEffect, useMemo, useState } from 'react';
import { Sparkles, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAllTemplates } from '../lib/templates';
import type { TemplateRow } from '../lib/templates';
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

  useEffect(() => {
    let cancelled = false;

    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const data = await fetchAllTemplates();

        if (cancelled) {
          return;
        }

        const mapped = data.map<StoryTemplate>((row: TemplateRow) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          html: row.html,
          css: row.css,
          isSystem: Boolean(row.is_system),
          owner: null,
        }));

        setTemplates(mapped);
        setLoading(false);
      } catch (error) {
        if (!cancelled) {
          toast.error('Could not load templates.');
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

      {loading ? (
        <div className="template-gallery__empty">Loading templates…</div>
      ) : templates.length === 0 ? (
        <div className="template-gallery__empty">
          <p>No templates available yet.</p>
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
