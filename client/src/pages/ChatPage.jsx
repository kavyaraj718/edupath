import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bot, Map, Plus, Loader2 } from "lucide-react"
import Sidebar from "../components/layout/Sidebar"
import ChatInterface from "../components/chat/ChatInterface"
import { usePathStore } from "../store/pathStore"
import { useAuthStore } from "../store/authStore"

export default function ChatPage() {
  const { paths, loadPaths, activePath, setActivePath, isLoading } = usePathStore()
  const { user, loadUser } = useAuthStore()
  const navigate = useNavigate()
  const legacySession = user?.chatHistory?.length
    ? [{ _id: "legacy", title: "Previous chat", messages: user.chatHistory }]
    : []
  const initialSessions = user?.chatSessions?.length ? user.chatSessions : legacySession
  const [chatSessions, setChatSessions] = useState(() => initialSessions)
  const [activeSessionId, setActiveSessionId] = useState(() =>
    initialSessions[0]?._id || crypto.randomUUID()
  )

  useEffect(() => {
    loadPaths()
    loadUser()
  }, [loadPaths, loadUser])

  useEffect(() => {
    const sessions = user?.chatSessions?.length ? user.chatSessions : legacySession
    if (!sessions.length) return

    setChatSessions(sessions)
    setActiveSessionId((currentId) =>
      sessions.some((session) => session._id === currentId)
        ? currentId
        : sessions[0]._id
    )
  }, [user?.chatSessions, user?.chatHistory])

  const startNewChat = () => {
    setActivePath(null)
    setActiveSessionId(crypto.randomUUID())
    navigate("/chat")
  }

  const selectChat = (sessionId) => {
    setActivePath(null)
    setActiveSessionId(sessionId)
    navigate("/chat")
  }

  const updateSession = (message, response) => {
    setChatSessions((current) => {
      const existingSession = current.find((session) => session._id === activeSessionId)
      const newMessages = [
        { role: "user", content: message },
        { role: "assistant", content: response },
      ]

      if (existingSession) {
        return current.map((session) => session._id === activeSessionId
          ? { ...session, messages: [...(session.messages || []), ...newMessages] }
          : session)
      }

      return [...current, { _id: activeSessionId, title: message.slice(0, 80), messages: newMessages }]
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col md:flex-row h-screen">
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-800 p-4 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-300">Your Paths</h2>
            
            <button onClick={startNewChat} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              <Plus className="h-3 w-3" /> New
            </button>
          </div>
          {chatSessions.length > 0 && (
            <div className="space-y-1 border-b border-gray-800 pb-3">
              {chatSessions.map((session) => (
                <button key={session._id} onClick={() => selectChat(session._id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${activeSessionId === session._id ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                  <Bot className="h-3 w-3 shrink-0" />
                  <span className="truncate">{session.title || "New chat"}</span>
                </button>
              ))}
            </div>
          )}
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
            
            <ChatInterface
              key={`${activeSessionId}-${activePath?._id || "none"}`}
              contextPath={activePath}
              sessionId={activeSessionId}
              chatSession={chatSessions.find((session) => session._id === activeSessionId)}
              onSessionTitle={updateSession}
            />
          </div>
        </div>
      </div>
    </div>
  )
}