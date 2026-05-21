"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { AuthLayout } from "@/components/auth-layout"
import { CourseSidebar } from "@/components/course-sidebar"

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourseDashboardPageProps {
  gradeId?: string | number
  gradeName?: string
  section?: string
  subject?: string
}

// ─── Chart data ───────────────────────────────────────────────────────────────
const comprensionData = [
  { tema: "Mov.Proyectiles", s1: 8, s2: 4, s3: 2 },
  { tema: "MCU", s1: 3, s2: 7, s3: 5 },
  { tema: "MCUV", s1: 1, s2: 3, s3: 6 },
]

const conteoRespuestasData = [
  { tipo: "Correctas", value: 80 },
  { tipo: "Incorrectas", value: 40 },
]

const pieData = [
  { name: "Correctas", value: 68.6, fill: "#9BC294" },
  { name: "Incorrectas", value: 31.3, fill: "#C66B86" },
]

const parcialData = [
  { p: "Parcial 1", v: 5 },
  { p: "Parcial 2", v: 6 },
  { p: "Parcial 3", v: 3 },
  { p: "Parcial 4", v: 5 },
]

const parcialColors = ["#9E5A78", "#7297C9", "#5B9B95", "#9BC294"]

// ─── Shared card wrapper ───────────────────────────────────────────────────────
function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`bg-[#fdfdf1] rounded-2xl shadow-sm border border-[#F1D87C]/30 ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string
  value: number
  sublabel: string
  color: string
}) {
  return (
    <Card className="flex-1 px-6 py-5 text-center">
      <p className="text-xs font-semibold text-[#C66B86] mb-2">{label}</p>
      <p className="text-5xl font-bold leading-none mb-2" style={{ color }}>
        {value}
      </p>
      <p className="text-xs font-semibold text-[#C66B86]">{sublabel}</p>
    </Card>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg px-3 py-2 text-xs border border-[#F1D87C]/40">
      {label && <p className="font-semibold text-[#9E5A78] mb-1">{label}</p>}
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CourseDashboardPage({
  gradeId = "2",
  gradeName = "Segundo",
  section = "D",
  subject = "Física",
}: CourseDashboardPageProps) {
  const breadcrumb = `Grados/${gradeName}/${subject}/Dashboard`

  return (
    <AuthLayout>

      {/* Page body */}
      <div className="flex flex-1">
        <CourseSidebar
          gradeId={gradeId}
          subject={subject}
          gradeName={gradeName}
          section={section}
          activeTab="dashboard"
        />

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#faf6df] px-8 py-6 overflow-x-hidden">
          {/* Breadcrumb */}
          <p className="text-[#7297C9] text-sm mb-2">{breadcrumb}</p>

          {/* Heading */}
          <h1 className="text-4xl font-bold italic text-[#9E5A78] mb-6">
            Dashboard
          </h1>

          {/* ── ROW 1 ──────────────────────────────────────────────────────── */}
          <div className="flex gap-4 flex-wrap">
            {/* Stat cards */}
            <StatCard
              label="Conteo estudiantes"
              value={30}
              sublabel="Estudiantes"
              color="#5B9B95"
            />
            <StatCard
              label="Preguntas respondidas"
              value={160}
              sublabel="Preguntas"
              color="#C66B86"
            />
            <StatCard
              label="Lecciones realizadas"
              value={18}
              sublabel="Lecciones"
              color="#5B9B95"
            />

            {/* Comprensión X Tema chart */}
            <Card className="p-4" style={{ flex: "0 0 45%", minWidth: 260 }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#9E5A78]">
                  Nivel de Comprensión X Tema
                </p>
                <button className="bg-[#fdfdf1] border border-[#F1D87C] text-[#9E5A78] text-xs font-semibold rounded-full px-3 py-0.5 hover:bg-[#F1D87C]/10 transition-colors">
                  Parcial 1 ▼
                </button>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={comprensionData} barGap={2} barCategoryGap="30%">
                  <XAxis
                    dataKey="tema"
                    tick={{ fontSize: 9, fill: "#9E5A78" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#9E5A78" }}
                    axisLine={false}
                    tickLine={false}
                    width={20}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: 9, color: "#9E5A78" }}
                  />
                  <Bar dataKey="s1" name="Mov. de Proyectiles" fill="#5B9B95" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="s2" name="MCU" fill="#9E5A78" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="s3" name="MCUV" fill="#C66B86" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* ── ROW 2 ──────────────────────────────────────────────────────── */}
          <div className="flex gap-4 flex-wrap mt-4">
            {/* Card 1 – Conteo tipo de respuesta */}
            <Card className="flex-1 p-4" style={{ minWidth: 200 }}>
              <p className="text-xs font-semibold text-[#9E5A78] mb-3">
                Conteo tipo de respuesta
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={conteoRespuestasData} barCategoryGap="40%">
                  <XAxis
                    dataKey="tipo"
                    tick={{ fontSize: 9, fill: "#9E5A78" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#9E5A78" }}
                    axisLine={false}
                    tickLine={false}
                    width={22}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: 9, color: "#9E5A78" }}
                  />
                  <Bar dataKey="value" name="" radius={[4, 4, 0, 0]}>
                    {conteoRespuestasData.map((entry, i) => (
                      <Cell
                        key={entry.tipo}
                        fill={i === 0 ? "#9BC294" : "#d4776a"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Card 2 – Porcentaje tipo de respuesta (Pie) */}
            <Card className="flex-1 p-4" style={{ minWidth: 200 }}>
              <p className="text-xs font-semibold text-[#9E5A78] mb-3">
                Porcentaje tipo de respuesta
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, ""]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #F1D87C50",
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Card 3 – Resumen de comprensión x Parcial */}
            <Card className="flex-1 p-4" style={{ minWidth: 200 }}>
              <p className="text-xs font-semibold text-[#9E5A78] mb-3">
                Resumen de comprensión x Parcial
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={parcialData} barCategoryGap="35%">
                  <XAxis
                    dataKey="p"
                    tick={{ fontSize: 9, fill: "#9E5A78" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#9E5A78" }}
                    axisLine={false}
                    tickLine={false}
                    width={20}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: 9, color: "#9E5A78" }}
                    formatter={(value, entry: any) => entry.payload.p}
                  />
                  <Bar dataKey="v" name="" radius={[4, 4, 0, 0]}>
                    {parcialData.map((entry, i) => (
                      <Cell key={entry.p} fill={parcialColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </main>
      </div>
    </AuthLayout>
  )
}
