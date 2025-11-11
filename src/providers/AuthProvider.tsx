import { AuthProvider as BaseAuthProvider, useAuth as useAuthBase } from '../contexts/AuthContext';

type AuthUser = {
  id: string;
  email?: string | null;
  [key: string]: unknown;
};

type UseAuthReturn = {
  user: AuthUser | null;
  profile?: Record<string, unknown> | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
  updateProfile: (updates: Record<string, unknown>) => Promise<{ error: unknown }>;
  fetchProfile: (id: string) => Promise<void>;
};

export function useAuth(): UseAuthReturn {
  return useAuthBase() as UseAuthReturn;
}

export const AuthProvider = BaseAuthProvider;
