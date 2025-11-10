import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function HomePage() {
  const [professors, setProfessors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_BASE}/professors`)
      .then(response => {
        setProfessors(response.data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching professors:', error)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="page-content">
      <h2>Professors</h2>
      <div className="professor-list">
        {professors.map(professor => (
          <div key={professor.id} className="professor-card">
            <h3>{professor.name}</h3>
            <p className="department">{professor.department}</p>
            {professor.review_count > 0 ? (
              <div className="rating-summary">
                <span className="rating-score">⭐ {professor.average_rating.toFixed(1)}</span>
                <span className="review-count">({professor.review_count} reviews)</span>
              </div>
            ) : (
              <div className="rating-summary">
                <span className="no-reviews">No reviews yet</span>
              </div>
            )}
            <Link to={`/professors/${professor.id}`}>
              <button className="primary">View Reviews</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomePage
