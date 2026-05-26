import { Instagram, Mail, Phone, Heart } from "lucide-react"

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-gradient-to-t from-[#ebe7cb] to-[#f4f0d5] pt-12 pb-8 border-t border-[#F1D87C]/30">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-8 border-b border-[#F1D87C]/20">
          
          {/* Col 1 - Brand description */}
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-2xl font-black text-[#9E5A78] tracking-tight">
              Comprendo
            </h2>
            <p className="text-[#5B5B5B] text-xs leading-relaxed max-w-xs mx-auto md:mx-0">
              Transformando la retroalimentación pedagógica en las aulas con el poder de la tecnología accesible y el feedback inmediato.
            </p>
          </div>

          {/* Col 2 - Encuéntranos en... */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-wider text-[#C66B86]">
              Redes Sociales
            </span>
            <div className="flex items-center gap-4 mt-1">
              <a
                href="https://www.instagram.com/comprendoia_26/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-11 h-11 rounded-2xl border border-[#7297C9]/35 text-[#7297C9] bg-white hover:bg-[#7297C9] hover:text-white transition-all duration-300 hover:shadow-md hover:scale-105"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-11 h-11 rounded-2xl border border-[#7297C9]/35 text-[#7297C9] bg-white hover:bg-[#7297C9] hover:text-white transition-all duration-300 hover:shadow-md hover:scale-105"
                aria-label="X (Twitter)"
              >
                <XIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Col 3 - Contáctanos */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <span className="text-sm font-bold uppercase tracking-wider text-[#C66B86]">
              Contacto
            </span>
            <div className="space-y-2 text-center md:text-right">
              <a 
                href="mailto:comprendo@gmail.com"
                className="flex items-center justify-center md:justify-end gap-2 text-sm text-[#7297C9] hover:text-[#9E5A78] transition-colors group"
              >
                <Mail size={14} className="group-hover:scale-110 transition-transform" />
                comprendo@gmail.com
              </a>
              <p className="flex items-center justify-center md:justify-end gap-2 text-sm text-[#5B5B5B]">
                <Phone size={14} />
                0998352043
              </p>
            </div>
          </div>

        </div>

        {/* Footer bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-[#5B5B5B]/70">
          <p>© {currentYear} Comprendo. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart size={10} className="fill-[#C66B86] text-[#C66B86] animate-pulse" /> para docentes innovadores.
          </p>
        </div>

      </div>
    </footer>
  )
}
