import { useMemo, useState } from 'react'
import { Camera, Mail } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../providers/AuthProvider'
import { getRandomPhotos } from '../data/stockPhotos'
import toast from 'react-hot-toast'



const LoginPage = () => {
  const { signInWithMagicLink, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const samplePhotos = useMemo(() => getRandomPhotos(4), [])

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    const result = await signInWithMagicLink(email)
    if (!result?.error) {
      setSent(true)
      toast.success('Magic link sent! Check your inbox.')
    }
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
            <p>No password needed — we'll email you a magic link to sign in instantly.</p>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="login-page__sent">
                <span className="login-page__sent-icon">📬</span>
                <h3>Check your inbox!</h3>
                <p>We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.</p>
                <button
                  type="button"
                  className="login-page__resend"
                  onClick={() => setSent(false)}
                >
                  Use a different email
                </button>
              </div>
            ) : (
            <>{/* Magic link */}
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
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
