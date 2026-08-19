import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Briefcase,
  Code,
  Clock,
  Target,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  UserCheck,
  Zap,
  Star,
  Shuffle,
  Play,
  FileText,
  Eye,
} from "lucide-react"
import toast from "react-hot-toast"
import { users } from "../services/api"
import { useAuthStore } from "../store/authStore"

const EXPERIENCE_OPTIONS = [
  { value: "student", label: "Student", icon: <User />, desc: "Currently studying" },
  { value: "junior", label: "Junior", icon: <UserCheck />, desc: "0-2 years exp" },
  { value: "mid", label: "Mid-level", icon: <Zap />, desc: "2-5 years exp" },
  { value: "senior", label: "Senior", icon: <Star />, desc: "5+ years exp" },
  { value: "career-changer", label: "Career Changer", icon: <Shuffle />, desc: "Switching fields" },
]

const COMMON_SKILLS = ["Python", "JavaScript", "React", "Node.js", "SQL", "Java", "C++", "Machine Learning", "Data Analysis", "AWS", "Docker", "Git", "TypeScript", "MongoDB"]
const LEARNING_STYLES = [
  { value: "video", label: "Video Courses", icon: <Play /> },
  { value: "reading", label: "Reading", icon: <BookOpen /> },
  { value: "project-based", label: "Projects", icon: <FileText /> },
  { value: "visual", label: "Visual Diagrams", icon: <Eye /> },
]
const TIMEFRAMES = [{ value: 4, label: "1 Month" }, { value: 8, label: "2 Months" }, { value: 12, label: "3 Months" }, { value: 24, label: "6 Months" }]

export default function Onboarding() {
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    currentRole: "", targetRole: "", experience: "", skills: [],
    learningPreferences: { style: "video", dailyMinutes: 30 },
    initialGoal: "", timeframeWeeks: 12
  })

  const steps = ["Roles", "Experience", "Skills", "Preferences", "Your Goal"]

  const toggleSkill = (skill) => {
    setData((d) => ({
      ...d,
      skills: d.skills.includes(skill) ? d.skills.filter((s) => s !== skill) : [...d.skills, skill]
    }))
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      await users.completeOnboarding({
        currentRole: data.currentRole, targetRole: data.targetRole,
        experience: data.experience,
        skills: data.skills.map((s) => ({ name: s, level: "beginner" })),
        learningPreferences: data.learningPreferences,
        initialGoal: data.initialGoal
      })
      updateUser({ onboardingComplete: true, currentRole: data.currentRole, targetRole: data.targetRole })
      toast.success("Profile set up! Generating your path...")
      navigate("/dashboard")
    } catch {
      toast.error("Failed to save profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-7 w-7 text-primary-400" />
            <span className="text-xl font-bold">EduPath Setup</span>
          </div>
          <div className="flex gap-2 justify-center">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-1 text-xs ${i === step ? "text-primary-400" : i < step ? "text-green-400" : "text-gray-600"}`}>
                <div className={`h-2 w-2 rounded-full ${i === step ? "bg-primary-500" : i < step ? "bg-green-500" : "bg-gray-700"}`} />
                {s}
              </div>
            ))}
          </div>
          <div className="mt-2 h-1 bg-gray-800 rounded-full">
            <div className="h-1 bg-primary-600 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="card">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary-400" />Your Roles</h2>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Current Role</label>
                  <input className="input" placeholder="e.g. Software Engineer" value={data.currentRole} onChange={(e) => setData({ ...data, currentRole: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Target Role</label>
                  <input className="input" placeholder="e.g. ML Engineer, Full Stack Dev" value={data.targetRole} onChange={(e) => setData({ ...data, targetRole: e.target.value })} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {["ML Engineer", "Data Scientist", "Full Stack Dev", "DevOps Engineer", "Product Manager"].map((r) => (
                    <button key={r} type="button" onClick={() => setData({ ...data, targetRole: r })}
                      className={`badge px-3 py-1 cursor-pointer transition-colors ${data.targetRole === r ? "bg-primary-700 text-primary-200" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{r}</button>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Experience Level</h2>
                <div className="grid grid-cols-1 gap-2">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setData({ ...data, experience: opt.value })}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${data.experience === opt.value ? "border-primary-500 bg-primary-900/30" : "border-gray-700 hover:border-gray-500"}`}>
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                      {data.experience === opt.value && <Check className="ml-auto h-4 w-4 text-primary-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Code className="h-5 w-5 text-primary-400" />Current Skills</h2>
                <p className="text-gray-400 text-sm">Select all technologies you already know</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.map((skill) => (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                      className={`badge px-3 py-1.5 cursor-pointer transition-all ${data.skills.includes(skill) ? "bg-primary-700 text-primary-100" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                      {data.skills.includes(skill) && <Check className="inline-block h-4 w-4 mr-1" />}{skill}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{data.skills.length} selected</p>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary-400" />Learning Preferences</h2>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Daily commitment: <span className="text-white font-medium">{data.learningPreferences.dailyMinutes} min</span></label>
                  <input type="range" min="15" max="120" step="15" value={data.learningPreferences.dailyMinutes}
                    onChange={(e) => setData({ ...data, learningPreferences: { ...data.learningPreferences, dailyMinutes: +e.target.value } })}
                    className="w-full accent-primary-500" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>15 min</span><span>2 hours</span></div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Learning Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LEARNING_STYLES.map((s) => (
                      <button key={s.value} type="button" onClick={() => setData({ ...data, learningPreferences: { ...data.learningPreferences, style: s.value } })}
                        className={`p-3 rounded-lg border text-sm text-center transition-all ${data.learningPreferences.style === s.value ? "border-primary-500 bg-primary-900/30 text-primary-300" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                        <div className="text-xl mb-1">{s.icon}</div>{s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary-400" />Your Learning Goal</h2>
                <textarea className="input min-h-[100px] resize-none" placeholder="e.g. I want to become a machine learning engineer and get a job at a tech company within 3 months..."
                  value={data.initialGoal} onChange={(e) => setData({ ...data, initialGoal: e.target.value })} />
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Timeframe</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIMEFRAMES.map((t) => (
                      <button key={t.value} type="button" onClick={() => setData({ ...data, timeframeWeeks: t.value })}
                        className={`p-2 rounded-lg border text-sm text-center transition-all ${data.timeframeWeeks === t.value ? "border-primary-500 bg-primary-900/30 text-primary-300" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <button onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="btn-secondary flex items-center gap-2 disabled:opacity-0">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary flex items-center gap-2">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? "Setting up..." : "Finish Setup"} {!loading && <Check className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
