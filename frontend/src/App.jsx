import { useEffect } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import LoginPage from './pages/LoginPage'
import ReviewerDashboard from './pages/ReviewerDashboard'
import ProfessorDashboard from './pages/ProfessorDashboard'
import HomeRedirect from './components/HomeRedirect'
import { useAuth } from './hooks/useAuth'

const roleLabels = {
  admin: 'Administrator',
  reviewer: 'Reviewer',
  professor: 'Professor'
}

function App() {
  const { token, user, logout, fetchProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token && !user) {
      fetchProfile()
    }
  }, [token, user, fetchProfile])

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [token, navigate])

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>OpenRater</h1>
          <p>公平、公正的教授评审平台</p>
        </div>
        {user && (
          <div style={{ textAlign: 'right' }}>
            <div>{user.name}</div>
            <div className="badge">{roleLabels[user.role]}</div>
            <button className="secondary" style={{ marginTop: '0.5rem' }} onClick={logout}>
              退出
            </button>
          </div>
        )}
      </header>

      {token && (
        <nav>
          <Link to="/admin" hidden={user?.role !== 'admin'}>
            管理后台
          </Link>
          <Link to="/reviewer" hidden={user?.role !== 'reviewer'}>
            评审工作台
          </Link>
          <Link to="/professor" hidden={user?.role !== 'professor'}>
            教授面板
          </Link>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/reviewer" element={<ReviewerDashboard />} />
        <Route path="/professor" element={<ProfessorDashboard />} />
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </div>
  )
}

export default App
