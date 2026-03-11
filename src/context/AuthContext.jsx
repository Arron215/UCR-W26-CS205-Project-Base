import { createContext, useContext, useState, useEffect } from 'react'
import { hashCredential } from '../utils/encryption'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [password, setPassword] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('healthAppUser')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser({
        email: userData.email,
        credentialHash: userData.credentialHash,
        loginTime: userData.loginTime
      })
    }
    setIsLoading(false)
  }, [])

  const login = async (email, pwd) => {
    const credentialHash = await hashCredential(email, pwd)
    const userData = { 
      email, 
      credentialHash, 
      loginTime: new Date().toISOString() 
    }
    localStorage.setItem('healthAppUser', JSON.stringify(userData))
    setUser(userData)
    setPassword(pwd)
  }

  const logout = () => {
    localStorage.removeItem('healthAppUser')
    setUser(null)
    setPassword(null)
  }

  return (
    <AuthContext.Provider value={{ user, password, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
