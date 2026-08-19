import { motion } from "framer-motion"
import { Check, ChevronDown, ChevronUp, ExternalLink, Clock, BookOpen, Code } from "lucide-react"
import { useState } from "react"

const typeIcons = { course: BookOpen, project: Code, video: BookOpen, article: BookOpen, quiz: Check }
const typeBadgeColors = { course: "bg-blue-900 text-blue-300", project: "bg-purple-900 text-purple-300", video: "bg-red-900 text-red-300", article: "bg-green-900 text-green-300", quiz: "bg-yellow-900 text-yellow-300" }

export default function RoadmapViewer({ path, onResourceComplete, onMilestoneClick }) {
  const [expanded, setExpanded] = useState({})
  if (!path) return null

  const completedMilestones = path.milestones?.filter((m) => m.isCompleted).length || 0

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>{completedMilestones} of {path.milestones?.length} milestones complete</span>
          <span>{path.completionPct || 0}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full">
          <div className="h-2 bg-gradient-to-r from-primary-600 to-accent-500 rounded-full transition-all duration-700" style={{ width: `${path.completionPct || 0}%` }} />
        </div>
      </div>

      {path.prerequisites?.length > 0 && (
        <div className="card border-yellow-800 bg-yellow-900/10">
          <p className="text-yellow-400 text-sm font-medium mb-1">Prerequisites</p>
          <div className="flex flex-wrap gap-2">
            {path.prerequisites.map((p, i) => <span key={i} className="badge bg-yellow-900/50 text-yellow-300">{p}</span>)}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800" />
        <div className="space-y-4">
          {path.milestones?.map((milestone, idx) => {
            const isExpanded = expanded[milestone._id]
            const statusColor = milestone.isCompleted ? "bg-green-600 border-green-500" : idx === completedMilestones ? "bg-primary-600 border-primary-500 animate-pulse" : "bg-gray-700 border-gray-600"
            return (
              <motion.div key={milestone._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="relative pl-16">
                <div className={`absolute left-3.5 top-4 h-5 w-5 rounded-full border-2 flex items-center justify-center z-10 ${statusColor}`}>
                  {milestone.isCompleted && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <div className={`card cursor-pointer hover:border-gray-600 transition-all ${milestone.isCompleted ? "opacity-70" : ""}`}>
                  <div className="flex items-start justify-between gap-3" onClick={() => setExpanded((e) => ({ ...e, [milestone._id]: !e[milestone._id] }))}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge bg-gray-800 text-gray-300 shrink-0">Week {milestone.week}</span>
                        {milestone.isCompleted && <span className="badge bg-green-900 text-green-300">Complete</span>}
                      </div>
                      <h3 className="font-semibold">{milestone.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{milestone.description}</p>
                      {milestone.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {milestone.skills.map((s) => <span key={s} className="badge bg-primary-900/50 text-primary-300 text-xs">{s}</span>)}
                        </div>
                      )}
                    </div>
                    <button className="text-gray-400 shrink-0 mt-1">{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                  </div>

                  {isExpanded && milestone.resources?.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 space-y-2 border-t border-gray-800 pt-4">
                      {milestone.resources.map((res, rIdx) => {
                        const TypeIcon = typeIcons[res.type] || BookOpen
                        return (
                          <div key={rIdx} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg group">
                            {onResourceComplete && (
                              <input type="checkbox" className="mt-0.5 accent-primary-500 h-4 w-4 shrink-0"
                                onChange={(e) => onResourceComplete(milestone._id, res, e.target.checked)} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <a href={res.url} target="_blank" rel="noreferrer" className="font-medium text-sm hover:text-primary-400 flex items-center gap-1 transition-colors">
                                  {res.title} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                                <span className={`badge text-xs ${typeBadgeColors[res.type] || "bg-gray-700 text-gray-300"}`}>{res.type}</span>
                              </div>
                              {res.whyRecommended && <p className="text-gray-500 text-xs mt-1 italic">"{res.whyRecommended}"</p>}
                            </div>
                            {res.estimatedHours && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                                <Clock className="h-3 w-3" />{res.estimatedHours}h
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
