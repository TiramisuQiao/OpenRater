import { useEffect } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import LoginPage from './pages/LoginPage'
import ReviewerDashboard from './pages/ReviewerDashboard'
import HomePage from './pages/HomePage'
import ProfessorDetail from './pages/ProfessorDetail'
import { useAuth } from './hooks/useAuth'

const roleLabels = {
  admin: 'Administrator',
  reviewer: 'Reviewer',
  professor: 'Professor'  // 保留兼容性
}

function App() {
  const { token, user, logout, fetchProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token && !user) {
      fetchProfile()
    }
  }, [token, user, fetchProfile])

  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <div className="header-left">
            <h1><Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>OpenRater</Link></h1>
            <p>Fair and Just Professor Review Platform</p>
          </div>
          <nav>
            <Link to="/">Home</Link>
            {token ? (
              <>
                {user?.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
                {(user?.role === 'admin' || user?.role === 'reviewer') && <Link to="/reviewer">Reviewer Panel</Link>}
              </>
            ) : (
              <Link to="/login">Login</Link>
            )}
          </nav>
          {user && (
            <div className="header-right">
              <div>{user.name}</div>
              <div className="badge">{roleLabels[user.role]}</div>
              <button className="secondary" style={{ marginTop: '0.5rem' }} onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/professors/:id" element={<ProfessorDetail />} />
        <Route path="/login" element={<LoginPage />} />
        {token && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/reviewer" element={<ReviewerDashboard />} />
          </>
        )}
      </Routes>
    </div>
  )
}

export default App
