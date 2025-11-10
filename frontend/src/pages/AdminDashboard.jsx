import { useEffect, useState } from 'react'
import apiClient from '../services/api'
import { useAuth } from '../hooks/useAuth'

function AdminDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [professors, setProfessors] = useState([])
  const [form, setForm] = useState({ name: '', code: '', term: '' })
  const [professorForm, setProfessorForm] = useState({ name: '', department: '', user_id: '', course_ids: [] })
  const [message, setMessage] = useState(null)

  const loadData = async () => {
    try {
      const [coursesRes, professorsRes] = await Promise.all([apiClient.get('/courses'), apiClient.get('/professors')])
      setCourses(coursesRes.data)
      setProfessors(professorsRes.data)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? 'Load failed' })
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
    }
  }, [user])

  const handleCourseSubmit = async (e) => {
    e.preventDefault()
    try {
      await apiClient.post('/courses', form)
      setMessage({ type: 'success', text: 'Course created successfully' })
      setForm({ name: '', code: '', term: '' })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? 'Creation failed' })
    }
  }

  const handleProfessorSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...professorForm,
        user_id: professorForm.user_id ? Number(professorForm.user_id) : undefined,
        course_ids: professorForm.course_ids.map(Number)
      }
      await apiClient.post('/professors', payload)
      setMessage({ type: 'success', text: 'Professor added' })
      setProfessorForm({ name: '', department: '', user_id: '', course_ids: [] })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? 'Operation failed' })
    }
  }

  const toggleCourseSelection = (courseId) => {
    setProfessorForm((prev) => {
      const hasCourse = prev.course_ids.includes(courseId)
      return {
        ...prev,
        course_ids: hasCourse ? prev.course_ids.filter((id) => id !== courseId) : [...prev.course_ids, courseId]
      }
    })
  }

  const handleDeleteProfessor = async (professorId, professorName) => {
    if (!window.confirm(`Are you sure you want to delete professor ${professorName}? This will also delete all their review data.`)) {
      return
    }
    try {
      await apiClient.delete(`/professors/${professorId}`)
      setMessage({ type: 'success', text: 'Professor deleted' })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? 'Deletion failed' })
    }
  }

  if (user?.role !== 'admin') {
    return <div className="card">Access denied.</div>
  }

  return (
    <div>
      <div className="card">
        <h2>Create Course</h2>
        {message && (
          <div className={`alert ${message.type}`}>{message.text}</div>
        )}
        <form className="flex wrap" onSubmit={handleCourseSubmit}>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Course Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Course Code</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Term</label>
            <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} required />
          </div>
          <button type="submit" className="primary" style={{ alignSelf: 'flex-end' }}>
            Create
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Add Professor</h2>
        <form onSubmit={handleProfessorSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input value={professorForm.name} onChange={(e) => setProfessorForm({ ...professorForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              value={professorForm.department}
              onChange={(e) => setProfessorForm({ ...professorForm, department: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Link Professor Account (Optional, enter user ID)</label>
            <input
              value={professorForm.user_id}
              onChange={(e) => setProfessorForm({ ...professorForm, user_id: e.target.value })}
              placeholder="e.g.: 5"
            />
          </div>
          <div className="form-group">
            <label>Teaching Courses</label>
            <div className="flex wrap">
              {courses.map((course) => (
                <button
                  type="button"
                  key={course.id}
                  className={professorForm.course_ids.includes(course.id) ? 'primary' : 'secondary'}
                  onClick={() => toggleCourseSelection(course.id)}
                >
                  {course.name} ({course.code})
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="primary">
            Save
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Professor List</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Linked Account</th>
              <th>Courses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {professors.map((professor) => (
              <tr key={professor.id}>
                <td>{professor.name}</td>
                <td>{professor.department}</td>
                <td>{professor.user_id ?? 'Not linked'}</td>
                <td>
                  {professor.courses.map((course) => (
                    <span key={course.id} className="badge" style={{ marginRight: '0.5rem' }}>
                      {course.code}
                    </span>
                  ))}
                </td>
                <td>
                  <button
                    className="secondary"
                    onClick={() => handleDeleteProfessor(professor.id, professor.name)}
                    style={{ padding: '0.3rem 0.8rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard
