import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ProfessorDetail() {
  const { id } = useParams()
  const { token, user } = useAuth()
  const [professor, setProfessor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    course_id: '',
    rating: 5,
    content: ''
  })
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [showVersions, setShowVersions] = useState({})
  const [commentForm, setCommentForm] = useState({})
  const [showCommentForm, setShowCommentForm] = useState({})
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentContent, setEditCommentContent] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = () => {
    Promise.all([
      axios.get(`${API_BASE}/professors/${id}`),
      axios.get(`${API_BASE}/professors/${id}/reviews`)
    ])
      .then(([profRes, revRes]) => {
        setProfessor(profRes.data)
        setReviews(revRes.data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching data:', error)
        setLoading(false)
      })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      await axios.post(
        `${API_BASE}/reviews`,
        {
          professor_id: parseInt(id),
          course_id: parseInt(formData.course_id),
          rating: parseInt(formData.rating),
          content: formData.content
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setSubmitSuccess(true)
      setFormData({ course_id: '', rating: 5, content: '' })
      setShowForm(false)
      loadData()
    } catch (error) {
      setSubmitError(error.response?.data?.detail || 'Submission failed')
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return
    try {
      await axios.delete(`${API_BASE}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadData()
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const handleCommentSubmit = async (reviewId) => {
    try {
      await axios.post(
        `${API_BASE}/comments`,
        {
          review_id: reviewId,
          content: commentForm[reviewId]?.content || '',
          visibility: commentForm[reviewId]?.visibility || 'public'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setCommentForm({ ...commentForm, [reviewId]: { content: '', visibility: 'public' } })
      setShowCommentForm({ ...showCommentForm, [reviewId]: false })
      loadData()
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  const handleEditComment = (commentId, content) => {
    setEditingComment(commentId)
    setEditCommentContent(content)
  }

  const handleUpdateComment = async (commentId) => {
    try {
      const params = new URLSearchParams()
      params.append('content', editCommentContent)
      
      await axios.put(
        `${API_BASE}/comments/${commentId}?content=${encodeURIComponent(editCommentContent)}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setEditingComment(null)
      loadData()
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    try {
      await axios.delete(`${API_BASE}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadData()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!professor) return <div>Professor not found</div>

  return (
    <div className="page-content">
      <h2>{professor.name}</h2>
      <p>Department: {professor.department}</p>
      
      {submitSuccess && <div className="alert success">Review submitted successfully!</div>}
      
      {user && (user.role === 'reviewer' || user.role === 'admin') && (
        <div style={{ marginBottom: '2rem' }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)}>Add Review</button>
          ) : (
            <div className="card">
              <h3>Add New Review</h3>
              {submitError && <div className="alert error">{submitError}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Select Course:</label>
                  <select value={formData.course_id} onChange={(e) => setFormData({ ...formData, course_id: e.target.value })} required>
                    <option value="">-- Select Course --</option>
                    {professor.courses && professor.courses.map(course => (
                      <option key={course.id} value={course.id}>{course.code} - {course.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Rating (1-5):</label>
                  <select value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })} required>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Very Poor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Review Content:</label>
                  <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows="5" required placeholder="Enter detailed review content..." />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="primary">Submit Review</button>
                  <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
      
      <h3>All Reviews</h3>
      {reviews.length === 0 ? (
        <p>No reviews yet</p>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span><strong>Reviewer:</strong> {review.anonymous_id}</span>
                <span><strong>Rating:</strong> {review.rating}/5</span>
              </div>
              <p><strong>Course:</strong> {review.course?.code} - {review.course?.name}</p>
              <p>{review.content}</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                Version {review.version} | Created: {new Date(review.created_at).toLocaleString()} | 
                Updated: {new Date(review.updated_at).toLocaleString()}
              </p>
              
              {user && review.reviewer_id === user.id && (
                <button 
                  className="secondary" 
                  style={{ padding: '0.3rem 0.8rem', marginTop: '0.5rem' }}
                  onClick={() => handleDeleteReview(review.id)}
                >
                  Delete Review
                </button>
              )}
              
              {review.versions && review.versions.length > 1 && (
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    className="secondary" 
                    style={{ padding: '0.3rem 0.8rem' }}
                    onClick={() => setShowVersions({ ...showVersions, [review.id]: !showVersions[review.id] })}
                  >
                    {showVersions[review.id] ? 'Hide' : 'Show'} Version History ({review.versions.length})
                  </button>
                  
                  {showVersions[review.id] && (
                    <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #ddd' }}>
                      {review.versions.map(version => (
                        <div key={version.id} style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f9f9f9', borderRadius: '0.25rem' }}>
                          <strong>Version {version.version}</strong> - {new Date(version.created_at).toLocaleString()}
                          <p>Rating: {version.rating}/5</p>
                          <p>{version.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Comments Section */}
              <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <strong>Comments ({review.comments?.length || 0})</strong>
                {review.comments && review.comments.map(comment => (
                  <div key={comment.id} style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                      <span>{comment.user_name}</span>
                      <span>{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div style={{ marginTop: '0.5rem' }}>
                        <textarea 
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          rows="2"
                          style={{ width: '100%' }}
                        />
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button className="primary" style={{ padding: '0.2rem 0.6rem' }} onClick={() => handleUpdateComment(comment.id)}>Save</button>
                          <button className="secondary" style={{ padding: '0.2rem 0.6rem' }} onClick={() => setEditingComment(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p>{comment.content}</p>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>Visibility: {comment.visibility}</span>
                      {user && comment.user_id === user.id && !editingComment && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="secondary" 
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => handleEditComment(comment.id, comment.content)}
                          >
                            Edit
                          </button>
                          <button 
                            className="secondary" 
                            style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {user && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {!showCommentForm[review.id] ? (
                      <button 
                        className="secondary" 
                        style={{ padding: '0.3rem 0.8rem' }}
                        onClick={() => setShowCommentForm({ ...showCommentForm, [review.id]: true })}
                      >
                        Add Comment
                      </button>
                    ) : (
                      <div style={{ marginTop: '0.5rem' }}>
                        <textarea 
                          value={commentForm[review.id]?.content || ''}
                          onChange={(e) => setCommentForm({ ...commentForm, [review.id]: { ...commentForm[review.id], content: e.target.value } })}
                          rows="2"
                          placeholder="Enter comment..."
                          style={{ width: '100%' }}
                        />
                        <div style={{ marginTop: '0.5rem' }}>
                          <label>Visibility: </label>
                          <select 
                            value={commentForm[review.id]?.visibility || 'public'}
                            onChange={(e) => setCommentForm({ ...commentForm, [review.id]: { ...commentForm[review.id], visibility: e.target.value } })}
                          >
                            <option value="public">Public</option>
                            <option value="reviewer_only">Reviewer Only</option>
                            <option value="professor_only">Professor Only</option>
                            <option value="admin_only">Admin Only</option>
                          </select>
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button className="primary" style={{ padding: '0.3rem 0.8rem' }} onClick={() => handleCommentSubmit(review.id)}>Submit</button>
                          <button className="secondary" style={{ padding: '0.3rem 0.8rem' }} onClick={() => setShowCommentForm({ ...showCommentForm, [review.id]: false })}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProfessorDetail
