import { Instagram } from "lucide-react"

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
  return (
    <footer className="w-full bg-[#fdfdf1] py-8">
      {/* Dotted top border */}
      <div className="border-t-2 border-dotted border-[#7297C9]/40 mb-6" />
      
      <div className="flex flex-col items-center gap-6 px-4">
        {/* Title */}
        <h2 className="text-lg font-bold text-[#9E5A78]">Comprendo</h2>
        
        {/* Two columns */}
        <div className="flex flex-wrap justify-center gap-16 md:gap-24">
          {/* Left Column - Social */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-semibold italic text-[#C66B86]">
              Encuéntranos en...
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/comprendoia_26/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#7297C9] text-[#7297C9] hover:bg-[#7297C9]/10 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#7297C9] text-[#7297C9] hover:bg-[#7297C9]/10 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Right Column - Contact */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold italic text-[#C66B86]">
              Contáctanos
            </span>
            <a 
              href="mailto:comprendo@gmail.com"
              className="text-sm text-[#7297C9] hover:underline"
            >
              comprendo@gmail.com
            </a>
            <span className="text-sm italic text-[#7297C9]">
              telf. 0998352043
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
