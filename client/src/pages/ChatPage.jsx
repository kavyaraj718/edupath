import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Map, Plus, Loader2 } from "lucide-react"
import Sidebar from "../components/layout/Sidebar"
import ChatInterface from "../components/chat/ChatInterface"
import { usePathStore } from "../store/pathStore"

export default function ChatPage() {
  const { paths, loadPaths, activePath, setActivePath, isLoading } = usePathStore()
  const navigate = useNavigate()

  useEffect(() => { loadPaths() }, [loadPaths])

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col md:flex-row h-screen">
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-800 p-4 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-300">Your Paths</h2>
            <button onClick={() => setActivePath(null)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              <Plus className="h-3 w-3" /> New
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>
          ) : paths.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-4">No paths yet. Start chatting!</p>
          ) : (
            <div className="space-y-1 overflow-y-auto flex-1">
              {paths.map((p) => (
                <button key={p._id} onClick={() => { setActivePath(p); navigate(`/path/${p._id}`) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activePath?._id === p._id ? "bg-primary-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                  <div className="flex items-center gap-2">
                    <Map className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  <div className="ml-5 mt-0.5 h-1 bg-gray-700 rounded-full">
                    <div className="h-1 bg-primary-600 rounded-full" style={{ width: `${p.completionPct}%` }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium text-sm">PathAI</span>
            <span className="text-gray-500 text-xs">· Your personal learning coach</span>
          </div>
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
            <ChatInterface contextPath={activePath} />
          </div>
        </div>
      </div>
    </div>
  )
}
