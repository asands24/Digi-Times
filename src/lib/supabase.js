import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

const createStubClient = () => {
  const message =
    'Supabase environment variables are missing. Provide REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to enable remote features.'

  const throwConfigError = () => {
    throw new Error(message)
  }

  return {
    from: throwConfigError,
    storage: {
      from: throwConfigError,
    },
    auth: {
      signInWithOtp: throwConfigError,
      getSession: throwConfigError,
      signOut: throwConfigError,
    },
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : createStubClient()

export default supabase
