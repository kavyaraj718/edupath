import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("edupath_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("edupath_token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

export const auth = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me")
}

export const users = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  updateSkills: (data) => api.put("/users/skills", data),
  addCompletedCourse: (courseId) => api.post("/users/completed-courses", { courseId }),
  completeOnboarding: (data) => api.post("/users/complete-onboarding", data)
}

export const aiApi = {
  generatePath: (data) => api.post("/ai/generate-path", data),
  explainConcept: (data) => api.post("/ai/explain-concept", data),
  getSkillGap: () => api.get("/ai/skill-gap"),
  adaptMilestone: (data) => api.post("/ai/adapt-milestone", data),
  chat: (data) => api.post("/ai/chat", data)
}

export const progress = {
  update: (data) => api.put("/progress/update", data),
  getPathProgress: (pathId) => api.get(`/progress/path/${pathId}`),
  getDashboard: () => api.get("/progress/dashboard"),
  completeMilestone: (milestoneId) => api.post(`/progress/milestone/${milestoneId}/complete`)
}

export const paths = {
  getAll: () => api.get("/learning-paths"),
  getOne: (id) => api.get(`/learning-paths/${id}`),
  deletePath: (id) => api.delete(`/learning-paths/${id}`),
  addFeedback: (id, data) => api.put(`/learning-paths/${id}/feedback`, data)
}

export const courses = {
  getAll: (params) => api.get("/courses", { params }),
  search: (query) => api.get("/courses/search", { params: { q: query } })
}

export default api
