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
      <h2>登录</h2>
      <p>请输入系统管理员分发的账户信息。</p>
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button className="link-button" style={{ marginLeft: '1rem' }} onClick={() => setError(null)}>
            关闭
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">邮箱</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
