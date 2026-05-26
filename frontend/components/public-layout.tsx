import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface PublicLayoutProps {
  children: React.ReactNode
  /** Pass false if you don't want the yellow accent bars (e.g. home) */
  accentBars?: boolean
}

export function PublicLayout({ children, accentBars = true }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdf1]">
      <Navbar isLoggedIn={false} />
      {accentBars && <div className="h-2 w-full bg-[#F1D87C]" />}
      <div className="flex-1 flex flex-col">{children}</div>
      {accentBars && <div className="h-2 w-full bg-[#F1D87C]" />}
      <Footer />
    </div>
  )
}
