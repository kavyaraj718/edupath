import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react"

const SUGGESTED_PROMPTS = [
  "Generate a learning path for Machine Learning",
  "I want to become a Full Stack Developer in 3 months",
  "Help me learn Data Science from scratch",
  "Create a Python roadmap for beginners",
  "I already know React, what should I learn next?"
]

function Message({ msg }) {
  const isUser = msg.role === "user"
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-primary-600" : "bg-gray-700"}`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-300" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? "bg-primary-600 text-white rounded-tr-sm" : "bg-gray-800 text-gray-100 rounded-tl-sm"} ${msg.streaming ? "streaming-cursor" : ""}`}>
        {msg.content || (msg.streaming ? "" : "...")}
      </div>
    </div>
  )
}

export default function ChatInterface({ contextPath }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I am PathAI, your personal learning coach. Tell me your learning goal and I will create a personalized roadmap for you. What do you want to learn?"
  }])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg || isStreaming) return
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setIsStreaming(true)

    const assistantMsgId = Date.now()
    setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "", streaming: true }])

    try {
      const token = localStorage.getItem("edupath_token")
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg, contextPathId: contextPath?._id })
      })

      if (!response.ok) throw new Error("Stream failed")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))
        for (const line of lines) {
          const data = line.replace("data: ", "").trim()
          if (data === "[DONE]") continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.delta) {
              fullContent += parsed.delta
              setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: fullContent } : m))
            }
          } catch {}
        }
      }
      setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, streaming: false } : m))
    } catch {
      setMessages((prev) => prev.map((m) => m.id === assistantMsgId ? { ...m, content: "Sorry, I encountered an error. Please try again.", streaming: false } : m))
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {messages.length === 1 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />Try a suggestion
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)} className="text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your learning journey..."
            className="input resize-none min-h-[44px] max-h-32 py-2.5" rows={1} />
          <button onClick={() => sendMessage()} disabled={!input.trim() || isStreaming}
            className="btn-primary px-3 shrink-0 flex items-center justify-center">
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
