import { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { EventBuilder } from './components/EventBuilder';
import { StoryArchive } from './components/StoryArchive';
import { StoryPreviewDialog } from './components/StoryPreviewDialog';
import { StoryEditorDialog } from './components/StoryEditorDialog';
import { useStoryLibrary } from './hooks/useStoryLibrary';

export default function App() {
  const {
    stories,
    saveStory,
    removeStory,
    updateStory,
    clearStories,
    exportStories,
    stats,
  } = useStoryLibrary();

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);

  const previewStory = useMemo(
    () => stories.find((story) => story.id === previewId) ?? null,
    [stories, previewId],
  );

  const editorStory = useMemo(
    () => stories.find((story) => story.id === editorId) ?? null,
    [stories, editorId],
  );

  return (
    <div className="app-shell">
      <Header />
      <main className="editorial-main">
        <EventBuilder
          onStoryArchive={(payload) => {
            const story = saveStory(payload);
            setPreviewId(story.id);
          }}
        />
        <StoryArchive
          stories={stories}
          onPreview={(storyId) => setPreviewId(storyId)}
          onEdit={(storyId) => setEditorId(storyId)}
          onRemove={removeStory}
          onClear={clearStories}
          onExport={exportStories}
          stats={stats}
        />
      </main>
      <StoryPreviewDialog
        story={previewStory}
        open={Boolean(previewStory)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewId(null);
          }
        }}
      />
      <StoryEditorDialog
        story={editorStory}
        open={Boolean(editorStory)}
        onOpenChange={(open) => {
          if (!open) {
            setEditorId(null);
          }
        }}
        onSave={(id, payload) => {
          updateStory(id, (current) => ({
            ...current,
            prompt: payload.prompt,
            article: { ...payload.article },
          }));
        }}
      />
    </div>
  );
}
