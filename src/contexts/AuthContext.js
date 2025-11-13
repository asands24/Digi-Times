import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

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
  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch (error) {
      console.error('Auth provider missing Supabase client:', error)
      return null
    }
  }, [])

  const fetchProfile = async (userId) => {
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
          await createProfile(userId)
        }
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const createProfile = async (userId) => {
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
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  useEffect(() => {
    const getSession = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }
      try {
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
          setProfile(mockProfile)
          setLoading(false)
          console.log('Mock auth enabled - using demo user')
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
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
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      setProfile(data)
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
