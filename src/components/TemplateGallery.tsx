import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { groupTemplates } from '../data/templates';
import type { Template } from '../types/template';
import { TemplateCard } from './TemplateCard';
import { Button } from './ui/button';

const ALL_CATEGORY = 'ALL';

function normalizeCategory(category: string) {
  return category.trim().toUpperCase();
}

function formatCategory(category: string) {
  if (category === ALL_CATEGORY) {
    return 'All Templates';
  }

  return category
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function TemplateGallery() {
  const templates = groupTemplates as Template[];
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    templates.forEach((template) => {
      unique.add(normalizeCategory(template.category));
    });
    return [ALL_CATEGORY, ...Array.from(unique)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY) {
      return templates;
    }

    return templates.filter(
      (template) => normalizeCategory(template.category) === selectedCategory
    );
  }, [templates, selectedCategory]);

  return (
    <section className="template-gallery">
      <div className="template-gallery__heading">
        <div className="template-gallery__title">
          <Sparkles size={22} strokeWidth={1.75} />
          <h2>Template Gallery</h2>
          <Sparkles size={22} strokeWidth={1.75} />
        </div>
        <p>Get inspired with these pre-designed group ideas</p>
      </div>

      <div className="template-gallery__filters">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <Button
              key={category}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className="template-gallery__filter"
              onClick={() => setSelectedCategory(category)}
            >
              {formatCategory(category)}
            </Button>
          );
        })}
      </div>

      <div className="template-gallery__grid">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="template-gallery__empty">
          No templates found in this category.
        </div>
      ) : null}
    </section>
  );
}
