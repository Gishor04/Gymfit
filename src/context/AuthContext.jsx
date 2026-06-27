import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import API_BASE from '../config/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('gymfit_auth')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('gymfit_auth')
      }
    }
    setLoading(false)
  }, [])

  const saveUser = (userData) => {
    localStorage.setItem('gymfit_auth', JSON.stringify(userData))
    setUser(userData)
  }

  const login = useCallback(async (email, password) => {
    const res  = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Login failed.')
    saveUser(data.user)
    return data.user
  }, [])

  const adminLogin = useCallback(async (email, password) => {
    const res  = await fetch(`${API_BASE}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Admin login failed.')
    saveUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res  = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Registration failed.')
    return data
  }, [])

  const forgotPassword = useCallback(async (email) => {
    const res  = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Request failed.')
    return data
  }, [])

  const resetPassword = useCallback(async (token, password) => {
    const res  = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Reset failed.')
    return data
  }, [])

  const verifyEmail = useCallback(async (token) => {
    const res  = await fetch(`${API_BASE}/api/auth/verify-email/${token}`)
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Verification failed.')
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('gymfit_auth')
    setUser(null)
  }, [])

  const getAuthHeader = useCallback(() => {
    if (!user?.token) return {}
    return { Authorization: `Bearer ${user.token}` }
  }, [user])


  const updateUser = useCallback((updatedData) => {
    const currentStored = localStorage.getItem('gymfit_auth')
    const current = currentStored ? JSON.parse(currentStored) : {}
    const merged = { ...current, ...updatedData, token: current.token }
    localStorage.setItem('gymfit_auth', JSON.stringify(merged))
    setUser(merged)
  }, [])
  return (
    <AuthContext.Provider value={{
      user, loading,
      login, adminLogin, register, logout,
      forgotPassword, resetPassword, verifyEmail,
      getAuthHeader,
      updateUser,
      isAdmin:  user?.role === 'admin',
      isMember: user?.role === 'member' || user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

