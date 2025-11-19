import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';

const STORAGE_KEY = 'digitimes_onboarding_dismissed';

/**
 * OnboardingBanner shows helpful steps for first-time users.
 * Dismissible and stored in localStorage.
 */
export function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="onboarding-banner" role="region" aria-label="Getting started guide">
      <div className="onboarding-banner__content">
        <div className="onboarding-banner__icon">
          <Lightbulb size={24} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="onboarding-banner__text">
          <h3>Welcome to DigiTimes!</h3>
          <ol className="onboarding-banner__steps">
            <li>Write a story idea or prompt</li>
            <li>Add a photo from your device or camera</li>
            <li>Generate your kid-friendly article</li>
            <li>Build and print your newspaper</li>
          </ol>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="onboarding-banner__close"
          aria-label="Dismiss welcome message"
        >
          <X size={18} strokeWidth={1.75} />
          Got it
        </Button>
      </div>
      <style>{`
        .onboarding-banner {
          background: linear-gradient(135deg, #fef9f1 0%, #f7edd5 100%);
          border: 1px solid #e8d9b8;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(139, 93, 22, 0.08);
        }

        .onboarding-banner__content {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
        }

        .onboarding-banner__icon {
          flex-shrink: 0;
          color: #c28e3a;
          margin-top: 0.25rem;
        }

        .onboarding-banner__text {
          flex: 1;
        }

        .onboarding-banner__text h3 {
          margin: 0 0 0.75rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #2b241c;
        }

        .onboarding-banner__steps {
          margin: 0;
          padding-left: 1.5rem;
          list-style: decimal;
          color: #5c4322;
          line-height: 1.6;
        }

        .onboarding-banner__steps li {
          margin: 0.25rem 0;
        }

        .onboarding-banner__close {
          flex-shrink: 0;
          gap: 0.5rem;
        }

        @media (max-width: 640px) {
          .onboarding-banner__content {
            flex-direction: column;
          }

          .onboarding-banner__close {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
