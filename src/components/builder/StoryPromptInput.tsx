import React from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';

interface StoryPromptInputProps {
    value: string;
    onChange: (value: string) => void;
    onApplyToAll: () => void;
    canApplyToAll: boolean;
}

const INSPIRATION_PROMPTS = [
    "A wonderful day at the park with the family...",
    "Celebrating a special birthday with cake and balloons...",
    "Our weekend adventure hiking in the mountains...",
    "Sunday morning pancakes and cartoons...",
    "First day of school excitement...",
    "A cozy rainy day spent reading and playing games...",
    "Summer vacation memories at the beach...",
    "Holiday traditions and festive cheer...",
];

export function StoryPromptInput({ value, onChange, onApplyToAll, canApplyToAll }: StoryPromptInputProps) {
    const inspireMe = () => {
        const random = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
        onChange(random);
    };

    return (
        <section className="bg-surface p-6 rounded-xl border border-accent-border shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium uppercase tracking-wider text-ink-muted">
                    What's the Scoop?
                </label>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={inspireMe}
                    className="text-accent-gold hover:text-accent-gold-dark hover:bg-yellow-50 h-8 px-2 text-xs"
                >
                    <Sparkles size={14} className="mr-1" />
                    Inspire Me
                </Button>
            </div>

            <textarea
                className="w-full p-4 rounded-lg border border-accent-border bg-yellow-50/50 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold transition-all font-serif text-lg leading-relaxed placeholder:text-ink-muted/40 resize-none"
                placeholder="e.g. Halloween in Navy Yard with the kids..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
            />

            <div className="flex justify-between items-start mt-2">
                <p className="text-xs text-ink-muted">
                    1–2 sentences is perfect.
                </p>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onApplyToAll}
                    disabled={!canApplyToAll}
                    className="text-ink-muted hover:text-ink"
                >
                    <RefreshCcw size={14} className="mr-2" />
                    Apply to all drafts
                </Button>
            </div>
        </section>
    );
}
