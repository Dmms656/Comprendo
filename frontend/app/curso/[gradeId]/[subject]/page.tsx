import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ gradeId: string; subject: string }>
}

export default async function CourseRootRoute({ params }: PageProps) {
  const resolvedParams = await params
  const gradeId = resolvedParams.gradeId
  const subject = resolvedParams.subject

  redirect(`/curso/${gradeId}/${subject}/estudiantes`)
}
