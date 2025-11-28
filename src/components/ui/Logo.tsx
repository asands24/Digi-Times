import React from 'react';

export const Logo: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => {
    const sizeMap = {
        small: { box: 32, text: 16 },
        medium: { box: 48, text: 24 },
        large: { box: 64, text: 32 },
    };

    const { box, text } = sizeMap[size];

    return (
        <div
            className="logo"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: box,
                height: box,
                background: 'var(--brand-accent)',
                border: '2px solid var(--ink)',
                borderRadius: '4px',
                fontFamily: 'var(--font-display)',
                fontSize: text,
                fontWeight: 700,
                color: 'var(--ink-black)',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
        >
            DT
        </div>
    );
};
