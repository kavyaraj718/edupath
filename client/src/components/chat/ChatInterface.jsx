import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useAuthStore } from "../../store/authStore"

// Define your API base URL for the fetch call
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const SUGGESTED_PROMPTS = [
  "Generate a learning path for Machine Learning",
  "I want to become a Full Stack Developer in 3 months",
  "Help me learn Data Science from scratch",
  "Create a Python roadmap for beginners",
  "I already know React, what should I learn next?"
]

const DEFAULT_WELCOME = {
  role: "assistant",
  content: "Hi! I am PathAI, your personal learning coach. Tell me your learning goal and I will create a personalized roadmap for you. What do you want to learn?"
}

function Message({ msg }) {
  const isUser = msg.role === "user"
  const markdownComponents = {
    h1: ({ children }) => <h1 className="mb-3 mt-1 text-lg font-bold text-white border-b border-gray-700 pb-1">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold text-white first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-semibold text-primary-400 first:mt-0">{children}</h3>,
    h4: ({ children }) => <h4 className="mb-1 mt-2 text-xs font-semibold text-gray-300 uppercase tracking-wide">{children}</h4>,
    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>,
    li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-2 border-primary-500 bg-gray-900/60 pl-3 py-1 text-gray-300 italic rounded-r">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-gray-700" />,
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-left text-xs border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-900 text-gray-200 border-b border-gray-700">{children}</thead>,
    th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
    td: ({ children }) => <td className="px-3 py-2 border-t border-gray-800 text-gray-300">{children}</td>,
    pre: ({ children }) => (
      <pre className="my-3 max-w-full overflow-x-auto rounded-lg bg-gray-950 p-3 text-xs leading-relaxed border border-gray-800 text-gray-200">
        {children}
      </pre>
    ),
    code: ({ className, children }) =>
      className ? (
        <code className={`${className} font-mono`}>{children}</code>
      ) : (
        <code className="rounded bg-gray-900 px-1.5 py-0.5 text-xs text-primary-300 font-mono break-words border border-gray-800">
          {children}
        </code>
      ),
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
        {children}
      </a>
    ),
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-primary-600" : "bg-gray-700"}`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-300" />}
      </div>
      <div className={`min-w-0 max-w-[85%] break-words px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? "whitespace-pre-wrap bg-primary-600 text-white rounded-tr-sm" : "bg-gray-800 text-gray-100 rounded-tl-sm shadow-sm"} ${msg.streaming ? "streaming-cursor" : ""}`}>
        {isUser ? (
          msg.content
        ) : msg.content ? (
          <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
        ) : msg.streaming ? (
          <span className="text-gray-400">PathAI is thinking...</span>
        ) : (
          "..."
        )}
      </div>
    </div>
  )
}

export default function ChatInterface({ contextPath }) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState(() => {
    if (user?.chatHistory && user.chatHistory.length > 0) {
      return user.chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    }
    return [DEFAULT_WELCOME]
  })
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      
      // Updated fetch call using API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg, activePathId: contextPath?._id })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let fullContent = ""
      let buffer = ""

      const parseSSELines = (rawChunk) => {
        const events = rawChunk.split("\n\n")
        const completeEvents = events.slice(0, -1)
        const remainder = events[events.length - 1]

        for (const evt of completeEvents) {
          const lines = evt.split("\n")
          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine.startsWith("data:")) continue

            const dataStr = trimmedLine.replace(/^data:\s*/, "")
            if (!dataStr || dataStr === "[DONE]") continue

            try {
              const parsed = JSON.parse(dataStr)
              if (parsed.error) {
                console.error("Server streaming error:", parsed.error)
                if (!fullContent) {
                  fullContent = parsed.error
                }
              } else if (parsed.delta) {
                fullContent += parsed.delta
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: fullContent } : m
                )
              )
            } catch (err) {
              console.warn("Could not parse SSE JSON chunk:", dataStr, err)
            }
          }
        }

        return remainder
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        buffer = parseSSELines(buffer)
      }

      // Flush any remaining buffered data at stream end
      if (buffer.trim()) {
        parseSSELines(buffer + "\n\n")
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: fullContent || m.content || "No response received.", streaming: false }
            : m
        )
      )
    } catch (err) {
      console.error("Chat error:", err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  m.content ||
                  "Sorry, I encountered an issue connecting to the AI coach. Please try again.",
                streaming: false,
              }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <Message key={msg.id || i} msg={msg} />
        ))}
        {messages.length === 1 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />Try a suggestion
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-800 p-4 bg-gray-950">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your learning journey..."
            className="input resize-none min-h-[44px] max-h-32 py-2.5"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="btn-primary px-3 shrink-0 flex items-center justify-center"
          >
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}