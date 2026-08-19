import { create } from "zustand"
import { auth as authApi } from "../services/api"
import toast from "react-hot-toast"

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    const res = await authApi.login(credentials)
    const { token, user } = res.data
    localStorage.setItem("edupath_token", token)
    set({ user, token, isAuthenticated: true })
    return user
  },

  register: async (data) => {
    const res = await authApi.register(data)
    const { token, user } = res.data
    localStorage.setItem("edupath_token", token)
    set({ user, token, isAuthenticated: true })
    return user
  },

  logout: () => {
    localStorage.removeItem("edupath_token")
    set({ user: null, token: null, isAuthenticated: false })
    toast.success("Logged out successfully")
  },

  loadUser: async () => {
    const token = localStorage.getItem("edupath_token")
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const res = await authApi.getMe()
      set({ user: res.data.user, token, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem("edupath_token")
      set({ isLoading: false })
    }
  },

  updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } }))
}))
