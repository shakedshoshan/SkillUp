import { create } from 'zustand'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '@/lib/supabase/types'

interface AuthState {
  user: SupabaseUser | null
  userProfile: User | null
  loading: boolean
  setUser: (user: SupabaseUser | null) => void
  setUserProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userProfile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ user: null, userProfile: null, loading: false }),
})) 