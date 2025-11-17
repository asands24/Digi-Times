import React, { useCallback, useState } from 'react';
import TemplatesGallery from '../components/TemplatesGallery';
import type { StoryTemplate } from '../types/story';

export function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null);

  const handleSelect = useCallback((template: StoryTemplate) => {
    setSelectedTemplate(template);
  }, []);

  return (
    <main className="container" style={{ padding: '2.5rem 1rem' }}>
      <div className="template-gallery template-gallery--page">
        <header className="template-gallery__heading">
          <div>
            <h1 className="template-gallery__title">Public Templates</h1>
            <p>
              Explore featured newsroom layouts curated by DigiTimes editors. Pick a template to
              inspire your next edition.
            </p>
          </div>
        </header>
        <TemplatesGallery
          selectedTemplateId={selectedTemplate?.id ?? null}
          onSelect={handleSelect}
          autoSelectFirst={false}
        />
      </div>
    </main>
  );
}

export default TemplatesPage;
