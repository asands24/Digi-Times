import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/login')
          return
        }

        if (data.session) {
          navigate('/dashboard')
        } else {
          navigate('/login')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return <LoadingSpinner message="Completing sign in..." />
}

export default AuthCallback