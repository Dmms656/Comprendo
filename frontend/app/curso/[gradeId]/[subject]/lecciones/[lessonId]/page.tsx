import { LeccionDetallePage } from "@/components/leccion-detalle-page"

const gradeNames: Record<string, string> = {
  "1": "Primero",
  "2": "Segundo",
  "3": "Tercero",
  "4": "Octavo",
  "5": "Noveno",
  "6": "Décimo",
}

interface PageProps {
  params: Promise<{ gradeId: string; subject: string; lessonId: string }>
}

export default async function LeccionDetalleRoute({ params }: PageProps) {
  const resolvedParams = await params
  const gradeName = gradeNames[resolvedParams.gradeId] ?? "Grado"
  const subject = decodeURIComponent(resolvedParams.subject)
  const lessonNumber = Number(resolvedParams.lessonId) || 1

  return (
    <LeccionDetallePage
      gradeId={resolvedParams.gradeId}
      gradeName={gradeName}
      section="D"
      subject={subject}
      lessonNumber={lessonNumber}
    />
  )
}
