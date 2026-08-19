import { create } from "zustand"
import { paths, aiApi } from "../services/api"
import toast from "react-hot-toast"

export const usePathStore = create((set, get) => ({
  paths: [],
  activePath: null,
  isGenerating: false,
  isLoading: false,

  generatePath: async (data) => {
    set({ isGenerating: true })
    try {
      const res = await aiApi.generatePath(data)
      const newPath = res.data.path
      set((state) => ({ paths: [newPath, ...state.paths], activePath: newPath, isGenerating: false }))
      toast.success("Learning path generated!")
      return newPath
    } catch (err) {
      set({ isGenerating: false })
      toast.error(err.response?.data?.message || "Failed to generate path")
      throw err
    }
  },

  loadPaths: async () => {
    set({ isLoading: true })
    try {
      const res = await paths.getAll()
      set({ paths: res.data.paths, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  loadPath: async (id) => {
    set({ isLoading: true })
    try {
      const res = await paths.getOne(id)
      set({ activePath: res.data.path, isLoading: false })
      return res.data.path
    } catch {
      set({ isLoading: false })
    }
  },

  setActivePath: (path) => set({ activePath: path }),

  updateMilestone: (milestoneId, data) =>
    set((state) => ({
      activePath: state.activePath
        ? {
            ...state.activePath,
            milestones: state.activePath.milestones.map((m) =>
              m._id === milestoneId ? { ...m, ...data } : m
            )
          }
        : null
    })),

  deletePath: async (id) => {
    await paths.deletePath(id)
    set((state) => ({
      paths: state.paths.filter((p) => p._id !== id),
      activePath: state.activePath?._id === id ? null : state.activePath
    }))
    toast.success("Path deleted")
  }
}))
