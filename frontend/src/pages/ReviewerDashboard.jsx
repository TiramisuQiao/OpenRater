import { useEffect, useMemo, useState } from 'react'
import apiClient from '../services/api'
import { useAuth } from '../hooks/useAuth'

const initialReview = {
  professor_id: '',
  course_id: '',
  rating: 5,
  content: ''
}

function ReviewerDashboard() {
  const { user } = useAuth()
  const [professors, setProfessors] = useState([])
  const [courses, setCourses] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState(initialReview)
  const [message, setMessage] = useState(null)
  const [editingReview, setEditingReview] = useState(null)
  const [editForm, setEditForm] = useState({ rating: 5, content: '' })

  const loadData = async () => {
    try {
      const [professorsRes, courseRes, reviewRes] = await Promise.all([
        apiClient.get('/professors'),
        apiClient.get('/courses'),
        apiClient.get('/reviews')
      ])
      setProfessors(professorsRes.data)
      setCourses(courseRes.data)
      setReviews(reviewRes.data)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? 'Load failed' })
    }
  }

  useEffect(() => {
    if (user?.role === 'reviewer' || user?.role === 'admin') {
      loadData()
    }
  }, [user])

  const professorCourses = useMemo(() => {
    const professor = professors.find((p) => p.id === Number(reviewForm.professor_id))
    return professor?.courses ?? []
  }, [professors, reviewForm.professor_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        professor_id: Number(reviewForm.professor_id),
        course_id: Number(reviewForm.course_id),
        rating: Number(reviewForm.rating),
        content: reviewForm.content
      }
      await apiClient.post('/reviews', payload)
      setMessage({ type: 'success', text: 'Review submitted successfully' })
      setReviewForm({ ...initialReview })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? 'Submission failed' })
    }
  }

  const handleEdit = (review) => {
    setEditingReview(review.id)
    setEditForm({ rating: review.rating, content: review.content })
  }

  const handleUpdate = async (reviewId) => {
    try {
      await apiClient.put(`/reviews/${reviewId}`, editForm)
      setMessage({ type: 'success', text: 'Review updated successfully' })
      setEditingReview(null)
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? 'Update failed' })
    }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    try {
      await apiClient.delete(`/reviews/${reviewId}`)
      setMessage({ type: 'success', text: 'Review deleted successfully' })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? 'Deletion failed' })
    }
  }

  if (user?.role !== 'reviewer' && user?.role !== 'admin') {
    return <div className="card">Access denied.</div>
  }

  return (
    <div>
      <div className="card">
        <h2>Submit Review</h2>
        {message && <div className={`alert ${message.type}`}>{message.text}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Professor</label>
            <select
              value={reviewForm.professor_id}
              onChange={(e) => setReviewForm({ ...reviewForm, professor_id: e.target.value, course_id: '' })}
              required
            >
              <option value="" disabled>
                Select Professor
              </option>
              {professors.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.name} ({professor.department})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Course</label>
            <select
              value={reviewForm.course_id}
              onChange={(e) => setReviewForm({ ...reviewForm, course_id: e.target.value })}
              required
            >
              <option value="" disabled>
                Select Course
              </option>
              {professorCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Rating (1-5):</label>
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
              required
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Very Poor</option>
            </select>
          </div>
          <div className="form-group">
            <label>Review Content:</label>
            <textarea
              value={reviewForm.content}
              onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
              rows="5"
              required
              placeholder="Enter detailed review content..."
            />
          </div>
          <button type="submit" className="primary" style={{ marginTop: '1rem' }}>
            Submit
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Submitted Reviews</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Anonymous ID</th>
              <th>Professor</th>
              <th>Course</th>
              <th>Rating</th>
              <th>Version</th>
              <th>Content</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>{review.anonymous_id}</td>
                <td>{professors.find((p) => p.id === review.professor_id)?.name ?? 'Unknown'}</td>
                <td>{review.course?.code} - {review.course?.name}</td>
                <td>
                  {editingReview === review.id ? (
                    <select value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })}>
                      <option value="5">5</option>
                      <option value="4">4</option>
                      <option value="3">3</option>
                      <option value="2">2</option>
                      <option value="1">1</option>
                    </select>
                  ) : (
                    `${review.rating}/5`
                  )}
                </td>
                <td>v{review.version}</td>
                <td>
                  {editingReview === review.id ? (
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      rows="3"
                      style={{ width: '100%' }}
                    />
                  ) : (
                    review.content
                  )}
                </td>
                <td>
                  {editingReview === review.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      <button className="primary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleUpdate(review.id)}>Save</button>
                      <button className="secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => setEditingReview(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      <button className="secondary" style={{ padding: '0.3rem 0.8rem' }} onClick={() => handleEdit(review)}>Edit</button>
                      <button className="secondary" style={{ padding: '0.3rem 0.8rem' }} onClick={() => handleDelete(review.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReviewerDashboard
