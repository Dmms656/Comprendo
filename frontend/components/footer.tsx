import { Instagram, Mail, Heart } from "lucide-react"

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
                href="https://youtube.com/playlist?list=PLOA2IrwMSMTuWNRpzeLwWv9M1MnG9D93s&si=NNeSL2U0ywEgbsbg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-11 h-11 rounded-2xl border border-[#7297C9]/35 text-[#7297C9] bg-white hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]/50 transition-all duration-300 hover:shadow-md hover:scale-105"
                aria-label="YouTube"
              >
                <YouTubeIcon className="w-5 h-5" />
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
