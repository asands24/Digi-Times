import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { AuthProvider } from './providers/AuthProvider';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '2px solid var(--accent-border)',
              borderRadius: 12,
              boxShadow: '0 12px 24px rgba(45, 38, 31, 0.18)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.18em',
              padding: '1rem 1.5rem',
              maxWidth: '440px',
            },
            success: {
              iconTheme: {
                primary: 'var(--accent-gold)',
                secondary: '#1f160b',
              },
              style: {
                borderColor: 'var(--accent-gold)',
                background: 'var(--surface-alt)',
              },
            },
            error: {
              iconTheme: {
                primary: '#a14533',
                secondary: '#fff5f0',
              },
              style: {
                borderColor: '#b75a46',
                background: '#fff5f0',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
