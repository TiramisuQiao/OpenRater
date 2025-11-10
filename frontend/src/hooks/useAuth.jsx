import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import apiClient from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const existingToken = localStorage.getItem('token')
  const [token, setToken] = useState(existingToken)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  const login = useCallback(async (email, password) => {
    try {
      setError(null)
      const params = new URLSearchParams()
      params.append('username', email)
      params.append('password', password)
      const response = await apiClient.post('/auth/token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      localStorage.setItem('token', response.data.access_token)
      setToken(response.data.access_token)
      return true
    } catch (err) {
      setError(err.response?.data?.detail ?? '登录失败')
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  const fetchProfile = useCallback(async () => {
    if (!token) return
    try {
      const response = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (err) {
      logout()
    }
  }, [token, logout])

  const value = useMemo(
    () => ({ token, user, login, logout, error, fetchProfile, setError }),
    [token, user, login, logout, error, fetchProfile, setError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
