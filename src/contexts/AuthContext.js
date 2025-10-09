import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

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

  useEffect(() => {
    // Temporary: Auto-login with mock user to bypass database issues
    console.log('Using mock authentication to bypass database error')
    const mockUser = {
      id: 'mock-user-id',
      email: 'demo@example.com'
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

    // Original code commented out to bypass database
    /*
    const getSession = async () => {
      try {
        console.log('Getting session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session:', session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Temporarily skip profile fetching to bypass database error
          setProfile({
            id: session.user.id,
            email: session.user.email,
            display_name: session.user.email,
            avatar_url: null
          })
          // await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        toast.error('Error loading session')
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          // Temporarily skip profile fetching to bypass database error
          setProfile({
            id: session.user.id,
            email: session.user.email,
            display_name: session.user.email,
            avatar_url: null
          })
          // await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
    */
  }, [])

  const fetchProfile = async (userId) => {
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

  const signInWithMagicLink = async (email) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
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

  const signOut = async () => {
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