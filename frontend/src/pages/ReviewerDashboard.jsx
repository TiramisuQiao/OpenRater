import { useEffect, useMemo, useState } from 'react'
import apiClient from '../services/api'
import { useAuth } from '../hooks/useAuth'

const initialReview = {
  professor_id: '',
  course_id: '',
  summary: '',
  strengths: '',
  weaknesses: '',
  fairness: 3,
  clarity: 3,
  engagement: 3,
  workload: 3,
  confidence: 3
}

function ReviewerDashboard() {
  const { user } = useAuth()
  const [professors, setProfessors] = useState([])
  const [courses, setCourses] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState(initialReview)
  const [message, setMessage] = useState(null)

  const loadData = async () => {
    try {
      const [profRes, courseRes, reviewRes] = await Promise.all([
        apiClient.get('/professors'),
        apiClient.get('/courses'),
        apiClient.get('/reviews')
      ])
      setProfessors(profRes.data)
      setCourses(courseRes.data)
      setReviews(reviewRes.data)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? '加载失败' })
    }
  }

  useEffect(() => {
    if (user?.role === 'reviewer') {
      loadData()
    }
  }, [user])

  const professorCourses = useMemo(() => {
    const prof = professors.find((p) => p.id === Number(reviewForm.professor_id))
    return prof?.courses ?? []
  }, [professors, reviewForm.professor_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...reviewForm,
        professor_id: Number(reviewForm.professor_id),
        course_id: Number(reviewForm.course_id),
        fairness: Number(reviewForm.fairness),
        clarity: Number(reviewForm.clarity),
        engagement: Number(reviewForm.engagement),
        workload: Number(reviewForm.workload),
        confidence: Number(reviewForm.confidence)
      }
      await apiClient.post('/reviews', payload)
      setMessage({ type: 'success', text: '评审提交成功' })
      setReviewForm({ ...initialReview })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? '提交失败' })
    }
  }

  if (user?.role !== 'reviewer') {
    return <div className="card">无访问权限。</div>
  }

  return (
    <div>
      <div className="card">
        <h2>提交评审</h2>
        {message && <div className={`alert ${message.type}`}>{message.text}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>教授</label>
            <select
              value={reviewForm.professor_id}
              onChange={(e) => setReviewForm({ ...reviewForm, professor_id: e.target.value, course_id: '' })}
              required
            >
              <option value="" disabled>
                请选择教授
              </option>
              {professors.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}（{prof.department}）
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>课程</label>
            <select
              value={reviewForm.course_id}
              onChange={(e) => setReviewForm({ ...reviewForm, course_id: e.target.value })}
              required
            >
              <option value="" disabled>
                请选择课程
              </option>
              {professorCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>评审总结</label>
            <textarea
              value={reviewForm.summary}
              onChange={(e) => setReviewForm({ ...reviewForm, summary: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>课程亮点</label>
            <textarea value={reviewForm.strengths} onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })} />
          </div>
          <div className="form-group">
            <label>改进建议</label>
            <textarea
              value={reviewForm.weaknesses}
              onChange={(e) => setReviewForm({ ...reviewForm, weaknesses: e.target.value })}
            />
          </div>
          <div className="rating-grid">
            {['fairness', 'clarity', 'engagement', 'workload', 'confidence'].map((field) => (
              <label key={field}>
                {field === 'fairness'
                  ? '公平性'
                  : field === 'clarity'
                  ? '授课清晰度'
                  : field === 'engagement'
                  ? '课堂互动'
                  : field === 'workload'
                  ? '作业负担'
                  : '信心指数'}
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={reviewForm[field]}
                  onChange={(e) => setReviewForm({ ...reviewForm, [field]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <button type="submit" className="primary" style={{ marginTop: '1rem' }}>
            提交
          </button>
        </form>
      </div>

      <div className="card">
        <h2>已提交评审</h2>
        <table className="table">
          <thead>
            <tr>
              <th>教授</th>
              <th>课程</th>
              <th>评分</th>
              <th>信心指数</th>
              <th>总结</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{professors.find((prof) => prof.id === review.professor_id)?.name ?? '未知'}</td>
                <td>{courses.find((course) => course.id === review.course_id)?.name ?? '未知'}</td>
                <td>
                  公平 {review.fairness} / 清晰 {review.clarity} / 互动 {review.engagement} / 负担 {review.workload}
                </td>
                <td>{review.confidence}</td>
                <td>{review.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReviewerDashboard
