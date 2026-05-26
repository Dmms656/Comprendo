"use client"

import { useRouter } from "next/navigation"
import { Users, BookOpen, BarChart3, ChevronRight } from "lucide-react"

export type FlowStep = "estudiantes" | "lecciones" | "dashboard"

interface CourseFlowHeaderProps {
  gradeId: string | number
  subject: string
  activeStep: FlowStep
}

const steps = [
  {
    key: "estudiantes" as FlowStep,
    label: "1. Registrar Estudiantes",
    icon: Users,
    desc: "Invita alumnos y comparte el link de Telegram",
  },
  {
    key: "lecciones" as FlowStep,
    label: "2. Crear Evaluación",
    icon: BookOpen,
    desc: "Genera lecciones interactivas con IA",
  },
  {
    key: "dashboard" as FlowStep,
    label: "3. Monitorear Resultados",
    icon: BarChart3,
    desc: "Visualiza estadísticas y puntos críticos",
  },
]

export function CourseFlowHeader({
  gradeId,
  subject,
  activeStep,
}: CourseFlowHeaderProps) {
  const router = useRouter()

  const handleStepClick = (stepKey: FlowStep) => {
    router.push(`/curso/${gradeId}/${encodeURIComponent(subject)}/${stepKey}`)
  }

  return (
    <div className="w-full bg-[#fdfdf1] rounded-3xl p-5 mb-6 border border-[#F1D87C]/30 shadow-sm relative overflow-hidden">
      {/* Absolute decorative gradient highlights */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-[#5B9B95]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-20 h-20 bg-[#9E5A78]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Steps layout */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 relative z-10">
        {steps.map((step, idx) => {
          const isActive = activeStep === step.key
          const Icon = step.icon
          
          return (
            <div key={step.key} className="flex-1 flex items-center gap-3">
              <button
                onClick={() => handleStepClick(step.key)}
                className={`flex-1 flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all duration-300 transform active:scale-[0.99] border cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#9E5A78] to-[#C66B86] border-transparent text-white shadow-md shadow-[#9E5A78]/25"
                    : "bg-white hover:bg-gray-50 border-gray-100 text-[#9E5A78] hover:border-[#F1D87C]/60"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isActive 
                      ? "bg-white text-[#9E5A78] shadow-sm" 
                      : "bg-[#5B9B95]/10 text-[#5B9B95]"
                  }`}
                >
                  <Icon size={18} />
                </div>
                
                <div className="space-y-0.5">
                  <p className={`text-xs font-black ${isActive ? "text-white" : "text-[#9E5A78]"}`}>
                    {step.label}
                  </p>
                  <p className={`text-[10px] ${isActive ? "text-white/80" : "text-[#C66B86]"}`}>
                    {step.desc}
                  </p>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center text-[#C66B86]/60">
                  <ChevronRight size={18} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
