import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Map, Clock, TrendingUp, Award, Plus, ArrowRight, Loader2 } from "lucide-react"
import Sidebar from "../components/layout/Sidebar"
import ProgressCard from "../components/dashboard/ProgressCard"
import SkillRadar from "../components/dashboard/SkillRadar"
import SkillGapAnalysis from "../components/dashboard/SkillGapAnalysis"
import { useAuthStore } from "../store/authStore"
import { usePathStore } from "../store/pathStore"
import { progress as progressApi } from "../services/api"

export default function Dashboard() {
  const { user } = useAuthStore()
  const { paths, loadPaths, isLoading } = usePathStore()
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadPaths()
    progressApi.getDashboard().then((r) => setStats(r.data)).catch(() => {})
  }, [loadPaths])

  const activePaths = paths.filter((p) => p.status === "active")

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Good morning, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-gray-400 mt-1">Here's your learning progress</p>
          </div>
          <button onClick={() => navigate("/chat")} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Path
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProgressCard title="Total Paths" value={paths.length} subtitle="all time" icon={Map} color="primary" />
          <ProgressCard title="Active Paths" value={activePaths.length} subtitle="in progress" icon={TrendingUp} color="green" />
          <ProgressCard title="Hours Learned" value={stats?.totalHoursSpent || 0} subtitle="total" icon={Clock} color="purple" />
          <ProgressCard title="Skills Acquired" value={stats?.skillsAcquired || user?.skills?.length || 0} subtitle="verified" icon={Award} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Active Learning Paths</h2>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary-400" /></div>
            ) : activePaths.length === 0 ? (
              <div className="card text-center py-12">
                <Map className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No active paths yet. Start a conversation with your AI coach!</p>
                <Link to="/chat" className="btn-primary inline-flex items-center gap-2">Generate My First Path <ArrowRight className="h-4 w-4" /></Link>
              </div>
            ) : (
              activePaths.map((path) => (
                <div key={path._id} className="card hover:border-gray-600 transition-colors cursor-pointer" onClick={() => navigate(`/path/${path._id}`)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{path.title}</h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{path.goal}</p>
                    </div>
                    <span className={`badge shrink-0 ${path.completionPct === 100 ? "bg-green-900 text-green-300" : "bg-primary-900 text-primary-300"}`}>
                      {path.completionPct}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{path.milestones?.filter((m) => m.isCompleted).length || 0} / {path.milestones?.length || 0} milestones</span>
                      <span>{path.totalWeeks} weeks</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full">
                      <div className="h-1.5 bg-primary-600 rounded-full transition-all" style={{ width: `${path.completionPct}%` }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold mb-4">Skill Profile</h2>
              <SkillRadar skills={user?.skills || []} />
            </div>
            <SkillGapAnalysis />
          </div>
        </div>
      </main>
    </div>
  )
}
