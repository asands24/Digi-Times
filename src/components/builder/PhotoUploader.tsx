import React, { useRef, ChangeEvent } from 'react';
import { Camera, ImageIcon, Upload } from 'lucide-react';
import { Button } from '../ui/button';

interface PhotoUploaderProps {
    onFilesSelected: (files: FileList | null) => void;
    hasEntries: boolean;
}

export function PhotoUploader({ onFilesSelected, hasEntries }: PhotoUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onFilesSelected(event.target.files);
        event.target.value = '';
    };



    return (
        <div className="photo-uploader photo-dropzone border-2 border-dashed border-accent-border rounded-xl p-8 text-center bg-paper-soft hover:bg-paper hover:border-accent-gold transition-colors cursor-pointer"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); onFilesSelected(event.dataTransfer.files); }}>
            <div className="mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-accent-gold">
                    <Upload size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-display text-ink-black mb-2">{hasEntries ? 'Add another memory' : 'Start with a moment you love'}</h2>
                <p className="text-ink-muted">Choose a photo or drop it here. Birthdays, big adventures, little everyday joys.</p>
            </div>

            <div className="flex justify-center gap-4 mb-6" onClick={(e) => e.stopPropagation()}>
                <Button
                    type="button"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-ink text-white hover:bg-ink-soft"
                >
                    <ImageIcon size={20} strokeWidth={1.75} className="mr-2" />
                    Upload Photos
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => cameraInputRef.current?.click()}
                    className="border-accent-border text-ink hover:bg-paper-soft"
                >
                    <Camera size={20} strokeWidth={1.75} className="mr-2" />
                    Take Photo
                </Button>
            </div>

            <p className="text-sm text-ink-muted">
                Images up to 10 MB each. One photo becomes one story.
            </p>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                aria-label="Upload story photos"
                className="hidden"
                onChange={onFileInputChange}
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                aria-label="Take a story photo"
                className="hidden"
                onChange={onFileInputChange}
            />
        </div>
    );
}
