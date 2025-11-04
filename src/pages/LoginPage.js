import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useInvite } from '../hooks/useInvite'
import { Camera, Mail, Users } from 'lucide-react'
import { getRandomPhotos } from '../data/stockPhotos'
import DemoLoginButton from '../components/DemoLoginButton'

const LoginPage = () => {
  const { signInWithMagicLink, loading } = useAuth()
  const { loading: inviteLoading } = useInvite()
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  // Get sample photos to display
  const samplePhotos = getRandomPhotos(4)

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    const { error } = await signInWithMagicLink(email)
    if (!error) {
      setEmail('')
    }
  }

  const handleInviteSignIn = async (e) => {
    e.preventDefault()
    if (!email.trim() || !inviteCode.trim()) return

    const { error: signInError } = await signInWithMagicLink(email)
    if (!signInError) {
      setEmail('')
      setInviteCode('')
    }
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(to bottom right, var(--paper-cream), var(--paper-white))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Photo Collage */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        pointerEvents: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        padding: '1rem'
      }}>
        {samplePhotos.map((photo, i) => (
          <img
            key={photo.id}
            src={photo.thumbnail}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'grayscale(100%)',
              animation: `fadeIn ${1 + i * 0.2}s ease-out`
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full" style={{ position: 'relative', zIndex: 1 }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div style={{
              backgroundColor: 'var(--paper-white)',
              padding: '1rem',
              borderRadius: '50%',
              border: '3px solid var(--ink-black)',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.2)'
            }}>
              <Camera style={{ width: '2rem', height: '2rem', color: 'var(--accent-gold)' }} />
            </div>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '2.5rem',
            fontWeight: 900,
            color: 'var(--ink-black)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            DigiTimes
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}>
            Create beautiful photo newsletters with your loved ones
          </p>

          {/* Sample Photo Strip */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'var(--paper-white)',
            border: '2px solid var(--border-gray)',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}>
            {samplePhotos.slice(0, 3).map((photo) => (
              <div key={photo.id} style={{
                width: '80px',
                height: '80px',
                border: '2px solid var(--ink-black)',
                boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                transform: 'rotate(-2deg)',
                overflow: 'hidden'
              }}>
                <img
                  src={photo.thumbnail}
                  alt={photo.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--paper-white)',
          borderRadius: '8px',
          border: '3px solid var(--ink-black)',
          boxShadow: '6px 6px 0 rgba(0,0,0,0.2)',
          padding: '2rem'
        }}>
          {!showInviteForm ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Sign In
              </h2>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="label">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="input pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <div className="loading w-4 h-4" />
                      Sending Magic Link...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <DemoLoginButton />
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <Users className="w-4 h-4" />
                  Have an invite code?
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Join with Invite
              </h2>

              <form onSubmit={handleInviteSignIn} className="space-y-4">
                <div>
                  <label htmlFor="invite-email" className="label">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="invite-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="input pl-10"
                      required
                      disabled={loading || inviteLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="invite-code" className="label">
                    Invite Code
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="invite-code"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Enter invite code"
                      className="input pl-10 uppercase"
                      required
                      disabled={loading || inviteLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || inviteLoading || !email.trim() || !inviteCode.trim()}
                  className="btn btn-primary w-full"
                >
                  {loading || inviteLoading ? (
                    <>
                      <div className="loading w-4 h-4" />
                      Sending Magic Link...
                    </>
                  ) : (
                    'Join Group & Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Back to regular sign in
                </button>
              </div>
            </>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              We'll send you a magic link to sign in securely without a password.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
