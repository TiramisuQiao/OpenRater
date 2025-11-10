import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function LoginPage() {
  const { login, error, setError, fetchProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const success = await login(email, password)
    if (success) {
      await fetchProfile()
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="card" style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <h2>Login</h2>
      <p>Please enter your credentials provided by the system administrator.</p>
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button className="link-button" style={{ marginLeft: '1rem' }} onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
