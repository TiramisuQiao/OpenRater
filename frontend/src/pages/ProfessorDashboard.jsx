import { useEffect, useMemo, useState } from 'react'
import apiClient from '../services/api'
import { useAuth } from '../hooks/useAuth'

function ProfessorDashboard() {
  const { user } = useAuth()
  const [professors, setProfessors] = useState([])
  const [reviews, setReviews] = useState([])
  const [rebuttals, setRebuttals] = useState({})
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  const professor = useMemo(() => professors.find((prof) => prof.user_id === user?.id), [professors, user])

  const loadData = async () => {
    try {
      const profRes = await apiClient.get('/professors')
      setProfessors(profRes.data)
      if (user?.role === 'professor') {
        const prof = profRes.data.find((p) => p.user_id === user.id)
        if (prof) {
          const reviewsRes = await apiClient.get(`/professors/${prof.id}/reviews`)
          setReviews(reviewsRes.data)
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? '加载失败' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'professor') {
      setLoading(true)
      loadData()
    }
  }, [user])

  const handleRebuttal = async (reviewId) => {
    const content = rebuttals[reviewId]
    if (!content) return
    try {
      await apiClient.post(`/reviews/${reviewId}/rebuttal`, { content })
      setMessage({ type: 'success', text: '答辩提交成功' })
      setRebuttals((prev) => ({ ...prev, [reviewId]: '' }))
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? '提交失败' })
    }
  }

  if (user?.role !== 'professor') {
    return <div className="card">无访问权限。</div>
  }

  if (loading) {
    return <div className="card">加载中…</div>
  }

  if (!professor) {
    return <div className="card">尚未关联教授信息，请联系管理员。</div>
  }

  return (
    <div>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}
      <div className="card">
        <h2>{professor.name} 教授</h2>
        <p>院系：{professor.department}</p>
        <div>
          课程：{' '}
          {professor.courses.map((course) => (
            <span key={course.id} className="badge" style={{ marginRight: '0.5rem' }}>
              {course.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>收到的评审</h2>
        {reviews.length === 0 ? (
          <p>尚未收到评审。</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="card" style={{ background: '#fdfdff' }}>
              <h3>{review.course.name}</h3>
              <p>
                公平 {review.fairness} | 清晰 {review.clarity} | 互动 {review.engagement} | 负担 {review.workload} |
                信心 {review.confidence}
              </p>
              <p>总结：{review.summary}</p>
              {review.strengths && <p>亮点：{review.strengths}</p>}
              {review.weaknesses && <p>建议：{review.weaknesses}</p>}
              {review.rebuttal ? (
                <div className="alert success">
                  <strong>已提交答辩：</strong>
                  <p>{review.rebuttal.content}</p>
                </div>
              ) : (
                <div className="form-group">
                  <label>提交答辩</label>
                  <textarea
                    value={rebuttals[review.id] ?? ''}
                    onChange={(e) => setRebuttals((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  />
                  <button className="primary" onClick={() => handleRebuttal(review.id)}>
                    提交
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ProfessorDashboard
