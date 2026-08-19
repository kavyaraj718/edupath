import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Plus, X, Save, Loader2, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import Sidebar from "../components/layout/Sidebar"
import { useAuthStore } from "../store/authStore"
import { users } from "../services/api"
import { useNavigate } from "react-router-dom"

const LEVELS = ["beginner", "intermediate", "advanced"]
const EXPERIENCE_OPTIONS = ["student", "junior", "mid", "senior", "career-changer"]

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [skills, setSkills] = useState(user?.skills || [])
  const [newSkill, setNewSkill] = useState("")
  const [newSkillLevel, setNewSkillLevel] = useState("beginner")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || "", bio: user?.bio || "", currentRole: user?.currentRole || "",
      targetRole: user?.targetRole || "", experience: user?.experience || "student", timezone: user?.timezone || "UTC",
      dailyMinutes: user?.learningPreferences?.dailyMinutes || 30,
      style: user?.learningPreferences?.style || "video"
    }
  })

  const addSkill = () => {
    if (!newSkill.trim()) return
    if (skills.find((s) => s.name.toLowerCase() === newSkill.toLowerCase())) { toast.error("Skill already added"); return }
    setSkills([...skills, { name: newSkill.trim(), level: newSkillLevel }])
    setNewSkill("")
  }

  const removeSkill = (name) => setSkills(skills.filter((s) => s.name !== name))

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await users.updateProfile({ ...data, learningPreferences: { dailyMinutes: +data.dailyMinutes, style: data.style } })
      await users.updateSkills({ skills })
      updateUser({ ...data, skills, learningPreferences: { dailyMinutes: +data.dailyMinutes, style: data.style } })
      toast.success("Profile updated!")
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await users.updateProfile({ name: "deleted" }) // placeholder - real delete needs endpoint
      logout()
      navigate("/login")
      toast.success("Account deleted")
    } catch { toast.error("Failed to delete account") }
    finally { setDeleting(false) }
  }

  const levelColors = { beginner: "bg-green-900 text-green-300", intermediate: "bg-yellow-900 text-yellow-300", advanced: "bg-red-900 text-red-300" }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card space-y-4">
            <h2 className="font-semibold">Personal Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Full Name</label>
                <input {...register("name", { required: true })} className="input" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Timezone</label>
                <input {...register("timezone")} className="input" placeholder="UTC" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Current Role</label>
                <input {...register("currentRole")} className="input" placeholder="Software Engineer" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Target Role</label>
                <input {...register("targetRole")} className="input" placeholder="ML Engineer" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Experience</label>
                <select {...register("experience")} className="input">
                  {EXPERIENCE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Bio</label>
              <textarea {...register("bio")} className="input resize-none" rows={3} placeholder="Tell us about yourself..." />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <div key={s.name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${levelColors[s.level]}`}>
                  {s.name}
                  <button type="button" onClick={() => removeSkill(s.name)} className="hover:text-white ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                className="input flex-1" placeholder="Add a skill" />
              <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)} className="input w-36">
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button type="button" onClick={addSkill} className="btn-secondary flex items-center gap-1 shrink-0">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold">Learning Preferences</h2>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Daily Commitment (minutes)</label>
              <input type="number" {...register("dailyMinutes")} className="input" min="15" max="480" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Learning Style</label>
              <select {...register("style")} className="input">
                {["video", "reading", "project-based", "visual"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="card border-red-900 bg-red-950/20">
          <h2 className="font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-gray-400 text-sm mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-4 py-2 rounded-lg text-sm transition-colors">
              <Trash2 className="h-4 w-4" /> Delete Account
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Yes, delete everything
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
