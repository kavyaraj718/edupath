import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"

const levelToNum = { beginner: 33, intermediate: 66, advanced: 100 }

export default function SkillRadar({ skills = [] }) {
  if (!skills.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Add skills in your profile to see radar chart
      </div>
    )
  }

  const data = skills.slice(0, 8).map((s) => ({
    skill: s.name,
    level: levelToNum[s.level] || 33
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <Radar name="Skills" dataKey="level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
        <Tooltip formatter={(v) => [`${v}%`, "Level"]} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#f9fafb" }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
