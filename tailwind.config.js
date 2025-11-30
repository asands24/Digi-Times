/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                paper: {
                    DEFAULT: '#FAF8F5',
                    soft: '#F2EFE9',
                    white: '#FFFFFF',
                },
                ink: {
                    DEFAULT: '#0B1D36',
                    soft: '#4A5568',
                    muted: '#718096',
                    black: '#0B1D36',
                },
                accent: {
                    gold: '#C5A065',
                    'gold-dark': '#A68550',
                    border: '#E2E8F0',
                    highlight: 'rgba(11, 29, 54, 0.05)',
                },
                surface: {
                    DEFAULT: '#FFFFFF',
                    alt: '#F7FAFC',
                },
            },
            fontFamily: {
                display: ['"Playfair Display"', 'serif'],
                serif: ['"Libre Baskerville"', 'serif'],
                news: ['"Newsreader"', '"Libre Baskerville"', 'serif'],
                sans: ['"Inter"', 'sans-serif'],
            },
            borderRadius: {
                soft: '12px',
                pill: '999px',
            },
            boxShadow: {
                soft: '0 4px 12px rgba(11, 29, 54, 0.08)',
                hard: '0 8px 24px rgba(11, 29, 54, 0.12)',
            },
        },
    },
    plugins: [],
}
