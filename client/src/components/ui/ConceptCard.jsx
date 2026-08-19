import { useState } from "react"
import { Loader2, X } from "lucide-react"
import { aiApi } from "../../services/api"
import { useAuthStore } from "../../store/authStore"

export default function ConceptCard({ concept, children }) {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const explain = async () => {
    if (data) { setOpen(true); return }
    setOpen(true)
    setLoading(true)
    try {
      const res = await aiApi.explainConcept({ concept, userLevel: user?.experience || "beginner" })
      setData(res.data)
    } catch { setData({ definition: "Could not load explanation. Try again.", analogy: "", example: "", whyItMatters: "" }) }
    finally { setLoading(false) }
  }

  return (
    <>
      <span onClick={explain} className="border-b border-dashed border-primary-600 text-primary-400 cursor-pointer hover:text-primary-300 transition-colors">
        {children || concept}
      </span>
      {open && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="card max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-bold text-primary-400 mb-3">{concept}</h3>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary-400" /></div>
            ) : data ? (
              <div className="space-y-3 text-sm">
                <div><p className="text-gray-400 text-xs font-medium uppercase mb-1">Definition</p><p>{data.definition}</p></div>
                {data.analogy && <div><p className="text-gray-400 text-xs font-medium uppercase mb-1">Think of it as...</p><p className="text-gray-300">{data.analogy}</p></div>}
                {data.example && <div><p className="text-gray-400 text-xs font-medium uppercase mb-1">Example</p><p className="bg-gray-800 rounded p-2 text-green-300 font-mono text-xs">{data.example}</p></div>}
                {data.whyItMatters && <div><p className="text-gray-400 text-xs font-medium uppercase mb-1">Why it matters</p><p className="text-gray-300">{data.whyItMatters}</p></div>}
                {data.nextConcepts?.length > 0 && (
                  <div><p className="text-gray-400 text-xs font-medium uppercase mb-1">Learn next</p>
                    <div className="flex flex-wrap gap-1">{data.nextConcepts.map((c) => <ConceptCard key={c} concept={c}><span className="badge bg-gray-800 text-gray-300 text-xs">{c}</span></ConceptCard>)}</div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
