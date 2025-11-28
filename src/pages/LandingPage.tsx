import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, BookOpen } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/button';
import { useAuth } from '../providers/AuthProvider';

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Auto-redirect authenticated users to their archive
    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    return (
        <div className="landing-page">
            <div className="landing-container">
                <header className="landing-header">
                    <Logo size="large" />
                </header>

                <main className="landing-main">
                    <div className="landing-hero">
                        <h1 className="landing-title">
                            Turn Your Moments into Front-Page Stories
                        </h1>
                        <p className="landing-subtitle">
                            Upload a photo → we turn it into a newspaper-style story you can save, print, or share.
                        </p>
                    </div>

                    <div className="landing-actions">
                        <Button
                            onClick={() => navigate('/login')}
                            className="landing-cta landing-cta--primary"
                            size="lg"
                        >
                            <Newspaper size={20} />
                            Get Started
                        </Button>
                        <Button
                            onClick={() => navigate('/login')}
                            className="landing-cta landing-cta--secondary"
                            size="lg"
                            variant="outline"
                        >
                            <BookOpen size={20} />
                            Sign In
                        </Button>
                    </div>

                    <div className="landing-features">
                        <div className="landing-feature">
                            <div className="landing-feature-icon">📸</div>
                            <h3>Upload Photos</h3>
                            <p>Drop in your favorite moments</p>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon">✨</div>
                            <h3>AI Generation</h3>
                            <p>Kid-friendly newspaper stories</p>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon">📰</div>
                            <h3>Print & Share</h3>
                            <p>Create beautiful keepsakes</p>
                        </div>
                    </div>
                </main>

                <footer className="landing-footer">
                    <p>Everyday life, front-page worthy.</p>
                </footer>
            </div>
        </div>
    );
}
