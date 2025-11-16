import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

const buildProfileSnapshot = (profileData = null, fallbackUser = null) => {
  const fallbackEmail =
    profileData?.email || fallbackUser?.email || 'guest@digitimes.app'

  return {
    id: profileData?.id || fallbackUser?.id || 'guest-user',
    email: fallbackEmail,
    display_name: profileData?.display_name || fallbackUser?.user_metadata?.display_name || fallbackEmail || 'Guest Reporter',
    avatar_url: profileData?.avatar_url || null
  }
}

const buildRedirectTo = () => {
  if (typeof window === 'undefined') {
    return undefined
  }
  return `${window.location.origin}/auth/callback`
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [useMockAuth] = useState(process.env.REACT_APP_USE_MOCK_AUTH === 'true')
  const [shouldForceGuest, setShouldForceGuest] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    const params = new URLSearchParams(window.location.search)
    return params.get('guest') === '1'
  })
  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch (error) {
      console.error('Auth provider missing Supabase client:', error)
      return null
    }
  }, [])

  const fetchProfile = async (userId, fallbackUser = null) => {
    if (!supabase) {
      return
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          await createProfile(userId, fallbackUser)
        }
        setProfile(buildProfileSnapshot(null, fallbackUser || user))
        return
      }

      setProfile(buildProfileSnapshot(data, fallbackUser || user))
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(buildProfileSnapshot(null, fallbackUser || user))
    }
  }

  const createProfile = async (userId, fallbackUser = null) => {
    if (!supabase) {
      return
    }
    try {
      const { data: userData } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData?.user?.email || '',
          display_name: userData?.user?.email || 'User'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        setProfile(buildProfileSnapshot(null, fallbackUser || userData?.user || user))
        return
      }

      setProfile(buildProfileSnapshot(data, fallbackUser || userData?.user || user))
    } catch (error) {
      console.error('Error creating profile:', error)
      setProfile(buildProfileSnapshot(null, fallbackUser || user))
    }
  }

  useEffect(() => {
    const getSession = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }
      try {
        if (shouldForceGuest) {
          await supabase.auth.signOut()
          setUser(null)
          setProfile(null)
          setShouldForceGuest(false)
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            params.delete('guest')
            const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
            window.history.replaceState({}, '', next)
          }
        }
        // Use mock auth if enabled
        if (useMockAuth) {
          const mockUser = {
            id: 'mock-user-id',
            email: 'demo@example.com',
            user_metadata: {}
          }
          const mockProfile = {
            id: 'mock-user-id',
            email: 'demo@example.com',
            display_name: 'Demo User',
            avatar_url: null
          }
          setUser(mockUser)
          setProfile(buildProfileSnapshot(mockProfile, mockUser))
          setLoading(false)
          if (process.env.NODE_ENV !== 'production') {
            console.info('Mock auth enabled - using demo user')
          }
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id, session.user)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        toast.error('Error loading session')
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Skip auth state listener if using mock auth
    if (useMockAuth) {
      return
    }

    if (!supabase) {
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id, session.user)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldForceGuest])

  const signInWithMagicLink = async (email) => {
    if (!supabase) {
      toast.error('Supabase is not configured')
      return { error: new Error('Supabase not configured') }
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: buildRedirectTo()
        }
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      toast.success('Check your email for the magic link!')
      return { error: null }
    } catch (error) {
      toast.error('Failed to send magic link')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signInWithOAuth = async (provider) => {
    if (!supabase) {
      toast.error('Supabase is not configured')
      return { error: new Error('Supabase not configured') }
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: buildRedirectTo()
        }
      })

      if (error) {
        toast.error(error.message)
        return { error }
      }

      toast.success('Continue in the popup to finish signing in.')
      return { error: null }
    } catch (error) {
      toast.error('Failed to start OAuth flow')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabase) {
      toast.error('Supabase is not configured')
      return { error: new Error('Supabase not configured') }
    }
    if (useMockAuth) {
      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully')
      return { error: null }
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error(error.message)
        return { error }
      }

      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully')
      return { error: null }
    } catch (error) {
      toast.error('Failed to sign out')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    if (!supabase) {
      toast.error('Supabase is not configured')
      return { error: new Error('Supabase not configured') }
    }
    try {
      setLoading(true)

      if (!user) {
        throw new Error('No user logged in')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        return { error }
      }

      setProfile(buildProfileSnapshot(data, user))
      toast.success('Profile updated successfully')
      return { data, error: null }
    } catch (error) {
      toast.error('Failed to update profile')
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signInWithMagicLink,
    signInWithOAuth,
    signOut,
    updateProfile,
    fetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
