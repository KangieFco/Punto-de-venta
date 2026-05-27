import { create } from 'zustand'
import type { UserSession } from '../types/auth'

interface AuthState {
  token:   string | null
  user:    UserSession | null
  isAuth:  boolean
  setAuth: (token: string, user: UserSession) => void
  logout:  () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token:  localStorage.getItem('pos_token'),
  user:   JSON.parse(localStorage.getItem('pos_user') ?? 'null'),
  isAuth: !!localStorage.getItem('pos_token'),

  setAuth: (token, user) => {
    localStorage.setItem('pos_token', token)
    localStorage.setItem('pos_user', JSON.stringify(user))
    set({ token, user, isAuth: true })
  },

  logout: () => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    set({ token: null, user: null, isAuth: false })
  },
}))