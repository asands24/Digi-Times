import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Camera, Mail } from 'lucide-react'
import { getRandomPhotos } from '../data/stockPhotos'

const LoginPage = () => {
  const { signInWithMagicLink, loading } = useAuth()
  const [email, setEmail] = useState('')

  // Get sample photos to display
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

  return (
    <div className="login-page">
      <div className="login-page__wrapper">
        <section className="login-page__story">
          <div className="login-page__badge">Evening edition</div>
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
        </section>

        <section className="login-page__form-card">
          <div className="login-page__icon">
            <Camera size={28} strokeWidth={1.8} />
          </div>
          <h2>Sign in to DigiTimes</h2>
          <p>We&rsquo;ll send you a passwordless magic link to your inbox.</p>
          <form onSubmit={handleSignIn} className="login-page__form">
            <label htmlFor="email">Email address</label>
            <div className="login-page__input">
              <Mail size={18} strokeWidth={1.7} />
              <input
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
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="dt-button dt-button--primary login-page__submit"
            >
              {loading ? 'Sending magic link…' : 'Send magic link'}
            </button>
          </form>
          <p className="login-page__legal">
            By signing in you agree to our newsroom-style community guidelines and privacy policy.
          </p>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
