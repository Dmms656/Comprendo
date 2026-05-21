"use client"

import { useRouter } from "next/navigation"

export type CourseTab = "dashboard" | "lecciones" | "estudiantes"

interface CourseSidebarProps {
  gradeId: string | number
  subject: string
  gradeName: string
  section: string
  activeTab: CourseTab
}

const navItems: { key: CourseTab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "lecciones", label: "Lecciones" },
  { key: "estudiantes", label: "Estudiantes" },
]

export function CourseSidebar({
  gradeId,
  subject,
  gradeName,
  section,
  activeTab,
}: CourseSidebarProps) {
  const router = useRouter()
  const sidebarTitle = `${subject} ${gradeName} '${section}'`

  const handleNav = (tab: CourseTab) => {
    const base = `/curso/${gradeId}/${encodeURIComponent(subject)}`
    if (tab === "dashboard") router.push(base)
    else router.push(`${base}/${tab}`)
  }

  return (
    <aside
      className="flex-shrink-0 flex flex-col pt-8 pb-6 gap-6"
      style={{ width: 130, backgroundColor: "#9E5A78" }}
    >
      {/* Labels */}
      <div className="px-4">
        <p className="text-white font-bold text-sm leading-tight">Menú</p>
        <p className="text-white/70 text-xs mt-0.5 leading-snug">{sidebarTitle}</p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleNav(key)}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-white font-semibold text-sm transition-all duration-150 ${
              activeTab === key ? "bg-white/20" : "hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
