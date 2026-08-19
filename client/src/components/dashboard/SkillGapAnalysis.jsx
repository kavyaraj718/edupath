import { useState } from "react"
import { Zap, Loader2 } from "lucide-react"
import { aiApi } from "../../services/api"
import toast from "react-hot-toast"

export default function SkillGapAnalysis() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const analyze = async () => {
    setLoading(true)
    try {
      const res = await aiApi.getSkillGap()
      setResult(res.data)
    } catch {
      toast.error("Failed to analyze skill gap")
    } finally {
      setLoading(false)
    }
  }

  const importanceColor = { critical: "bg-red-900/50 text-red-300 border border-red-800", important: "bg-yellow-900/50 text-yellow-300 border border-yellow-800", "nice-to-have": "bg-gray-800 text-gray-300 border border-gray-700" }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-400" />Skill Gap Analysis</h3>
        {!result && (
          <button onClick={analyze} disabled={loading} className="btn-secondary text-sm flex items-center gap-2">
            {loading ? <><Loader2 className="h-3 w-3 animate-spin" />Analyzing...</> : "Analyze Gaps"}
          </button>
        )}
      </div>
      {result ? (
        <div>
          <p className="text-gray-400 text-sm mb-3">{result.gapSummary}</p>
          <div className="flex flex-wrap gap-2">
            {result.requiredSkills?.map((s) => (
              <div key={s.name} className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${importanceColor[s.importance] || importanceColor["nice-to-have"]}`}>
                {s.userHas ? "?" : "?"} {s.name}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />Critical</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" />Important</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-500 inline-block" />Nice to have</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Click "Analyze Gaps" to see which skills you need to reach your target role.</p>
      )}
    </div>
  )
}
