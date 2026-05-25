"use client"

import { useRouter } from "next/navigation"
import { Users, BookOpen, BarChart3 } from "lucide-react"

export type CourseTab = "dashboard" | "lecciones" | "estudiantes"

interface CourseSidebarProps {
  gradeId: string | number
  subject: string
  gradeName: string
  section: string
  activeTab: CourseTab
}

const navItems: { key: CourseTab; label: string; icon: any }[] = [
  { key: "estudiantes", label: "Estudiantes", icon: Users },
  { key: "lecciones", label: "Lecciones", icon: BookOpen },
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
]

export function CourseSidebar({
  gradeId,
  subject,
  gradeName,
  section,
  activeTab,
}: CourseSidebarProps) {
  const router = useRouter()
  const sidebarTitle = `${subject} — ${gradeName} '${section}'`

  const handleNav = (tab: CourseTab) => {
    const base = `/curso/${gradeId}/${encodeURIComponent(subject)}`
    router.push(`${base}/${tab}`)
  }

  return (
    <aside
      className="flex-shrink-0 flex flex-col pt-8 pb-6 gap-6 shadow-xl border-r border-[#9E5A78]/10"
      style={{ width: 180, backgroundColor: "#9E5A78" }}
    >
      {/* Title / Info */}
      <div className="px-4 border-b border-white/10 pb-4 text-center md:text-left">
        <p className="text-white font-bold text-xs uppercase tracking-wider opacity-65">Curso</p>
        <p className="text-white font-black text-sm mt-1 leading-snug break-words">{sidebarTitle}</p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1.5 px-3">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleNav(key)}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-white font-bold text-xs transition-all duration-300 transform active:scale-95 text-left cursor-pointer ${
              activeTab === key 
                ? "bg-white/20 shadow-md border border-white/10" 
                : "hover:bg-white/10 opacity-80 hover:opacity-100"
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
