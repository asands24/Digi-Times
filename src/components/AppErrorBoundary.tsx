import React, { Component, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary catches React errors anywhere in the component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen">
          <div className="error-boundary-shell">
            <h1>Something went wrong</h1>
            <p>
              DigiTimes encountered an unexpected error. Don't worry—your stories are safe!
              Try reloading the page to continue.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error details (dev only)</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <div className="error-boundary-actions">
              <Button onClick={this.handleReload} size="lg">
                Reload page
              </Button>
              <Button onClick={this.handleReset} variant="outline">
                Try again
              </Button>
            </div>
          </div>
          <style>{`
            .error-boundary-screen {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background: linear-gradient(135deg, #f5f0e6 0%, #e8ddc8 100%);
              font-family: 'Libre Baskerville', Georgia, serif;
            }

            .error-boundary-shell {
              max-width: 600px;
              padding: 3rem;
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
              text-align: center;
            }

            .error-boundary-shell h1 {
              margin: 0 0 1rem;
              font-size: 2rem;
              color: #2b241c;
            }

            .error-boundary-shell p {
              margin: 0 0 2rem;
              line-height: 1.6;
              color: #5c4322;
            }

            .error-boundary-actions {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
            }

            .error-boundary-details {
              text-align: left;
              margin: 2rem 0;
              padding: 1rem;
              background: #f9f6f0;
              border-radius: 6px;
              font-size: 0.85rem;
            }

            .error-boundary-details summary {
              cursor: pointer;
              font-weight: 600;
              margin-bottom: 0.5rem;
            }

            .error-boundary-details pre {
              margin: 0.5rem 0 0;
              padding: 0.75rem;
              background: white;
              border: 1px solid #ddd;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.75rem;
              line-height: 1.4;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
