import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function HomeRedirect() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    if (user.role === 'admin') {
      navigate('/admin', { replace: true })
    } else if (user.role === 'reviewer') {
      navigate('/reviewer', { replace: true })
    } else if (user.role === 'professor') {
      navigate('/professor', { replace: true })
    }
  }, [user, navigate])

  return null
}

export default HomeRedirect
