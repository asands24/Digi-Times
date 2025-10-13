import { useState } from 'react';
import { Header } from './components/Header';
import { HeroActions } from './components/HeroActions';
import { TemplateGallery } from './components/TemplateGallery';

export default function App() {
  const [showGallery, setShowGallery] = useState(true);

  return (
    <div className="app-shell">
      <Header />
      <main className="editorial-main">
        <HeroActions
          showGallery={showGallery}
          onToggleGallery={() => setShowGallery((prev) => !prev)}
        />
        {showGallery ? <TemplateGallery /> : null}
      </main>
    </div>
  );
}
