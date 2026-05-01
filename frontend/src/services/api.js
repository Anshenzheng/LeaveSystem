import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  initSystem: () => api.post('/init')
}

export const departmentApi = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`)
}

export const userApi = {
  getAll: () => api.get('/users'),
  update: (id, data) => api.put(`/users/${id}`, data)
}

export const leaveTypeApi = {
  getAll: () => api.get('/leave-types'),
  create: (data) => api.post('/leave-types', data),
  update: (id, data) => api.put(`/leave-types/${id}`, data)
}

export const quotaApi = {
  getAll: (params) => api.get('/quotas', { params }),
  getMy: (params) => api.get('/quotas/my', { params }),
  create: (data) => api.post('/quotas', data),
  createBatch: (data) => api.post('/quotas/batch', data),
  update: (id, data) => api.put(`/quotas/${id}`, data)
}

export const applicationApi = {
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  review: (id, data) => api.post(`/applications/${id}/review`, data),
  cancel: (id) => api.delete(`/applications/${id}`)
}

export const calendarApi = {
  getCalendarData: (params) => api.get('/calendar', { params })
}

export default api
