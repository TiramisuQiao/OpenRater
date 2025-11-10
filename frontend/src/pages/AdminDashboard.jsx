import { useEffect, useState } from 'react'
import apiClient from '../services/api'
import { useAuth } from '../hooks/useAuth'

function AdminDashboard() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [professors, setProfessors] = useState([])
  const [form, setForm] = useState({ name: '', code: '', term: '' })
  const [profForm, setProfForm] = useState({ name: '', department: '', user_id: '', course_ids: [] })
  const [message, setMessage] = useState(null)

  const loadData = async () => {
    try {
      const [coursesRes, profRes] = await Promise.all([apiClient.get('/courses'), apiClient.get('/professors')])
      setCourses(coursesRes.data)
      setProfessors(profRes.data)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? '加载失败' })
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
      setMessage({ type: 'success', text: '课程创建成功' })
      setForm({ name: '', code: '', term: '' })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? '创建失败' })
    }
  }

  const handleProfessorSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...profForm,
        user_id: profForm.user_id ? Number(profForm.user_id) : undefined,
        course_ids: profForm.course_ids.map(Number)
      }
      await apiClient.post('/professors', payload)
      setMessage({ type: 'success', text: '教授已添加' })
      setProfForm({ name: '', department: '', user_id: '', course_ids: [] })
      loadData()
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail ?? '操作失败' })
    }
  }

  const toggleCourseSelection = (courseId) => {
    setProfForm((prev) => {
      const hasCourse = prev.course_ids.includes(courseId)
      return {
        ...prev,
        course_ids: hasCourse ? prev.course_ids.filter((id) => id !== courseId) : [...prev.course_ids, courseId]
      }
    })
  }

  if (user?.role !== 'admin') {
    return <div className="card">无访问权限。</div>
  }

  return (
    <div>
      <div className="card">
        <h2>创建课程</h2>
        {message && (
          <div className={`alert ${message.type}`}>{message.text}</div>
        )}
        <form className="flex wrap" onSubmit={handleCourseSubmit}>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>课程名称</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>课程代码</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>开课学期</label>
            <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} required />
          </div>
          <button type="submit" className="primary" style={{ alignSelf: 'flex-end' }}>
            创建
          </button>
        </form>
      </div>

      <div className="card">
        <h2>添加教授</h2>
        <form onSubmit={handleProfessorSubmit}>
          <div className="form-group">
            <label>姓名</label>
            <input value={profForm.name} onChange={(e) => setProfForm({ ...profForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>院系</label>
            <input
              value={profForm.department}
              onChange={(e) => setProfForm({ ...profForm, department: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>关联教授账号（可选，填写用户ID）</label>
            <input
              value={profForm.user_id}
              onChange={(e) => setProfForm({ ...profForm, user_id: e.target.value })}
              placeholder="例如：5"
            />
          </div>
          <div className="form-group">
            <label>授课课程</label>
            <div className="flex wrap">
              {courses.map((course) => (
                <button
                  type="button"
                  key={course.id}
                  className={profForm.course_ids.includes(course.id) ? 'primary' : 'secondary'}
                  onClick={() => toggleCourseSelection(course.id)}
                >
                  {course.name} ({course.code})
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="primary">
            保存
          </button>
        </form>
      </div>

      <div className="card">
        <h2>教授列表</h2>
        <table className="table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>院系</th>
              <th>关联账号</th>
              <th>课程</th>
            </tr>
          </thead>
          <tbody>
            {professors.map((prof) => (
              <tr key={prof.id}>
                <td>{prof.name}</td>
                <td>{prof.department}</td>
                <td>{prof.user_id ?? '未关联'}</td>
                <td>
                  {prof.courses.map((course) => (
                    <span key={course.id} className="badge" style={{ marginRight: '0.5rem' }}>
                      {course.code}
                    </span>
                  ))}
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
