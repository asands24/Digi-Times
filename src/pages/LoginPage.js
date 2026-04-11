import { useMemo, useState } from 'react'
import { Camera, Mail } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../providers/AuthProvider'
import { getRandomPhotos } from '../data/stockPhotos'

// Google icon as inline SVG — no extra dependency needed
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
)

const LoginPage = () => {
  const { signInWithMagicLink, signInWithOAuth, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [oauthLoading, setOauthLoading] = useState(false)

  const samplePhotos = useMemo(() => getRandomPhotos(4), [])

  const sendMagicLink = async () => {
    if (!email.trim()) {
      return { error: new Error('Email is required') }
    }
    const result = await signInWithMagicLink(email)
    if (!result?.error) {
      setEmail('')
    }
    return result
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    await sendMagicLink()
  }

  const handleGoogleSignIn = async () => {
    setOauthLoading(true)
    await signInWithOAuth('google')
    setOauthLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-page__wrapper">
        <section className="login-page__story">
          <Badge className="login-page__badge" variant="secondary">
            Evening edition
          </Badge>
          <h1>Bring your family&rsquo;s stories to the front page.</h1>
          <p>
            DigiTimes turns camera roll moments into beautifully typeset spreads, ready to
            share with everyone you love.
          </p>
          <div className="login-page__photos">
            {samplePhotos.slice(0, 3).map((photo, index) => (
              <figure
                key={photo.id}
                className={`login-page__photo login-page__photo--${index}`}
              >
                <img src={photo.thumbnail} alt={photo.alt} />
                <figcaption>{photo.category}</figcaption>
              </figure>
            ))}
          </div>
          <p className="login-page__hint">
            Featured photos rotate with every visit, so everyone gets their moment to shine.
          </p>

          <div className="login-page__features">
            <h3 className="login-page__features-title">What You Can Do</h3>
            <div className="login-page__features-grid">
              <div className="login-page__feature">
                <span className="login-page__feature-icon">📸</span>
                <h4>Photo to Story</h4>
                <p>Upload any photo and watch it transform into a newspaper-style article with AI-powered storytelling.</p>
              </div>
              <div className="login-page__feature">
                <span className="login-page__feature-icon">✨</span>
                <h4>Smart Generation</h4>
                <p>Our AI creates kid-friendly, engaging stories that turn everyday moments into front-page news.</p>
              </div>
              <div className="login-page__feature">
                <span className="login-page__feature-icon">📰</span>
                <h4>Print &amp; Share</h4>
                <p>Build beautiful newspaper layouts, save as PDF, and share memorable editions with family and friends.</p>
              </div>
              <div className="login-page__feature">
                <span className="login-page__feature-icon">📦</span>
                <h4>Archive &amp; Organize</h4>
                <p>Keep all your stories in one place, organize by category, and create newspaper issues anytime.</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="login-page__form-card">
          <CardHeader>
            <div className="login-page__icon">
              <Camera size={28} strokeWidth={1.8} />
            </div>
            <h2>Sign in to DigiTimes</h2>
            <p>No password needed — choose your preferred sign-in method.</p>
          </CardHeader>
          <CardContent>
            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="login-page__google"
              onClick={handleGoogleSignIn}
              disabled={loading || oauthLoading}
            >
              <GoogleIcon />
              {oauthLoading ? 'Redirecting…' : 'Continue with Google'}
            </Button>

            <div className="login-page__divider">
              <span className="login-page__divider-line" />
              <span className="login-page__divider-text">or use email</span>
              <span className="login-page__divider-line" />
            </div>

            {/* Magic link */}
            <form onSubmit={handleSignIn} className="login-page__form">
              <Label htmlFor="email">Email address</Label>
              <div className="login-page__input">
                <Mail size={18} strokeWidth={1.7} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="login-page__field"
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="login-page__submit"
              >
                {loading ? 'Sending magic link…' : 'Send magic link'}
              </Button>
            </form>

            <p className="login-page__legal">
              By signing in you agree to our{' '}
              <a href="/privacy" className="login-page__legal-link">Privacy Policy</a>
              {' '}and{' '}
              <a href="/guidelines" className="login-page__legal-link">Community Guidelines</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
