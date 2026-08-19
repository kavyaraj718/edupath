import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { BookOpen, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"
import { useAuthStore } from "../store/authStore"

function PasswordStrength({ password }) {
  if (!password) return null
  const strength = password.length >= 12 ? 3 : password.length >= 8 ? 2 : 1
  const labels = ["", "Weak", "Medium", "Strong"]
  const colors = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"]
  return (
    <div className="mt-1">
      <div className="flex gap-1 h-1">
        {[1,2,3].map((i) => <div key={i} className={`flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : "bg-gray-700"}`} />)}
      </div>
      <p className="text-xs mt-0.5 text-gray-400">{labels[strength]}</p>
    </div>
  )
}

export default function Register() {
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch("password", "")

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password })
      toast.success("Account created! Let's set up your profile.")
      navigate("/onboarding")
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-950 via-gray-950 to-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 bg-primary-600 rounded-2xl mb-4">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Create account</h1>
          <p className="text-gray-400 mt-2">Start your personalized learning journey</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1">Full Name</label>
              <input {...register("name", { required: "Name is required", minLength: { value: 2, message: "At least 2 chars" } })}
                className="input" placeholder="Jane Smith" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1">Email</label>
              <input {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })}
                className="input" placeholder="you@example.com" type="email" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1">Password</label>
              <div className="relative">
                <input {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
                  className="input pr-10" placeholder="••••••••" type={showPass ? "text" : "password"} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1">Confirm Password</label>
              <input {...register("confirmPassword", { required: "Please confirm", validate: (v) => v === password || "Passwords do not match" })}
                className="input" placeholder="••••••••" type="password" />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="text-center text-gray-400 text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
