import { useEffect, useState } from "react"

export default function ProgressCard({ title, value, subtitle, icon: Icon, trend, color = "primary" }) {
  const [displayed, setDisplayed] = useState(0)
  const numericValue = typeof value === "number" ? value : 0

  useEffect(() => {
    let start = 0
    const step = numericValue / 30
    const timer = setInterval(() => {
      start += step
      if (start >= numericValue) { setDisplayed(numericValue); clearInterval(timer) }
      else setDisplayed(Math.floor(start))
    }, 20)
    return () => clearInterval(timer)
  }, [numericValue])

  const colors = {
    primary: "border-primary-500 text-primary-400 bg-primary-500/10",
    green: "border-green-500 text-green-400 bg-green-500/10",
    purple: "border-purple-500 text-purple-400 bg-purple-500/10",
    orange: "border-orange-500 text-orange-400 bg-orange-500/10"
  }

  return (
    <div className={`card border-l-4 ${colors[color].split(" ")[0]} flex items-start gap-4`}>
      {Icon && (
        <div className={`p-2.5 rounded-lg ${colors[color].split(" ").slice(1).join(" ")}`}>
          <Icon className={`h-5 w-5 ${colors[color].split(" ")[1]}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-0.5">
          {typeof value === "number" ? displayed : value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && <span className={`text-xs font-medium ${trend > 0 ? "text-green-400" : "text-red-400"}`}>{trend > 0 ? "+" : ""}{trend}%</span>}
        </div>
      </div>
    </div>
  )
}
