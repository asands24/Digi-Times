import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--paper-white)',
            color: 'var(--ink-black)',
            border: '3px double var(--ink-black)',
            borderRadius: 0,
            boxShadow: '4px 4px 0 rgba(0, 0, 0, 0.2)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '1rem 1.5rem',
            maxWidth: '500px'
          },
          success: {
            iconTheme: {
              primary: 'var(--accent-gold)',
              secondary: 'var(--ink-black)',
            },
            style: {
              borderColor: 'var(--accent-gold)',
            }
          },
          error: {
            iconTheme: {
              primary: 'var(--accent-red)',
              secondary: 'var(--paper-white)',
            },
            style: {
              borderColor: 'var(--accent-red)',
              background: '#fff5f5'
            }
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);