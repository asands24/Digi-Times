import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useInvite } from '../hooks/useInvite'
import { Camera, Mail, Users } from 'lucide-react'

const LoginPage = () => {
  const { signInWithMagicLink, loading } = useAuth()
  const { joinGroupWithInvite, loading: inviteLoading } = useInvite()
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Photo Newsletter
          </h1>
          <p className="text-gray-600">
            Create beautiful newsletters with your friends
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
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