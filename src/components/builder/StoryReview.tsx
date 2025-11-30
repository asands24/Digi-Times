import React from 'react';
import { Loader2, RefreshCcw, Archive } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GeneratedArticle } from '../../utils/storyGenerator';

// We need to define or import StoryEntry type. 
// For now, I'll redefine a subset interface to avoid circular deps or large refactors
// In a real app, this should be in types/story.ts
export interface StoryEntry {
    id: string;
    file: File;
    previewUrl: string;
    status: 'idle' | 'generating' | 'ready';
    loadingLabel?: string;
    headlineDraft?: string;
    bodyDraft?: string;
    article?: GeneratedArticle;
    prompt: string;
}

interface StoryReviewProps {
    entry: StoryEntry;
    onUpdate: (id: string, updates: Partial<StoryEntry>) => void;
    onRegenerate: (id: string) => void;
    onSave: (entry: StoryEntry) => void;
    isSaving: boolean;
    toEditableBody: (article: GeneratedArticle) => string;
}

export function StoryReview({
    entry,
    onUpdate,
    onRegenerate,
    onSave,
    isSaving,
    toEditableBody
}: StoryReviewProps) {

    const editableArticle = entry.article;

    return (
        <article className="bg-white border border-accent-border rounded-xl overflow-hidden shadow-soft hover:shadow-hard transition-all duration-300 transform hover:-translate-y-1">
            <div className="aspect-video bg-paper-soft relative overflow-hidden border-b border-accent-border">
                <img
                    src={entry.previewUrl}
                    alt={entry.file.name}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="p-6">
                {entry.status === 'generating' ? (
                    <div className="py-12 text-center">
                        <Loader2 className="animate-spin mx-auto mb-4 text-accent-gold" size={32} />
                        <p className="text-lg font-display animate-pulse text-ink">
                            {entry.loadingLabel || 'Writing your story...'}
                        </p>
                    </div>
                ) : entry.status === 'ready' && editableArticle ? (
                    <div className="story-article">
                        <div className="mb-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                Ready to Publish
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            <input
                                className="w-full font-display text-2xl font-bold text-ink bg-transparent border-none p-0 focus:ring-0 placeholder-ink-muted/50"
                                value={entry.headlineDraft ?? editableArticle.headline}
                                onChange={(e) => onUpdate(entry.id, { headlineDraft: e.target.value })}
                                placeholder="Headline"
                            />
                            <textarea
                                className="w-full font-serif text-base leading-relaxed text-ink-soft bg-transparent border-none p-0 focus:ring-0 resize-none placeholder-ink-muted/50"
                                value={entry.bodyDraft ?? toEditableBody(editableArticle)}
                                onChange={(e) => onUpdate(entry.id, { bodyDraft: e.target.value })}
                                rows={6}
                                placeholder="Story body..."
                            />
                        </div>

                        <div className="mt-6 pt-4 border-t border-accent-border flex justify-between items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRegenerate(entry.id)}
                                className="text-ink-muted hover:text-ink"
                            >
                                <RefreshCcw size={14} className="mr-2" />
                                Regenerate
                            </Button>
                            <Button
                                size="sm"
                                disabled={isSaving}
                                className="min-w-[140px] bg-ink text-white hover:bg-ink-soft"
                                onClick={() => onSave(entry)}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Save Story
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="mb-4 text-ink-muted">Ready to write?</p>
                        <Button onClick={() => onRegenerate(entry.id)}>Generate</Button>
                    </div>
                )}
            </div>
        </article>
    );
}
