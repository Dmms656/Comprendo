import { PublicLayout } from "./public-layout"
import { BarChart3, Target, Zap, TrendingUp } from "lucide-react"

export function HomePage() {
  return (
    <PublicLayout accentBars={false}>
      
      {/* SECTION 1 - HERO */}
      <section className="relative w-full h-[380px]">
        <img 
          src="/images/img-home1.jpg" 
          alt="Educational toys and learning materials"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#C8B5B5]/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 
            className="text-6xl font-bold text-[#9E5A78]"
            style={{ textShadow: "2px 2px 4px rgba(255,255,255,0.5)" }}
          >
            Comprendo
          </h1>
        </div>
      </section>

      {/* SECTION 2 - QUÉ HACEMOS */}
      <section className="bg-[#fdfdf1] py-14 px-8">
        <h2 className="text-center text-[#9E5A78] font-bold text-3xl mb-10">
          + Que hacemos +
        </h2>
        
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          {/* Left - Description Card */}
          <div className="flex-1">
            <div className="bg-[#9BC294]/30 p-6 rounded-2xl">
              <p className="text-[#5B9B95] text-sm leading-relaxed">
                Optimiza la gestión académica con datos históricos y estadísticas. 
                Comprendo te da visibilidad en tiempo real para entender el rendimiento 
                estudiantil mediante evaluaciones rápidas por clase en Telegram. 
                Nuestra solución está centralizada: todos los estudiantes en plataforma, 
                facilitando la detección de puntos críticos y el diseño de intervenciones 
                pedagógicas específicas para cada grupo, garantizando que ningún estudiante 
                se quede atrás.
              </p>
            </div>
          </div>
          
          {/* Right - Illustration */}
          <div className="flex-1 flex justify-center">
            <img 
              src="/images/img-home3.png" 
              alt="Diverse group of people illustration"
              className="w-full max-w-xs mx-auto"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3 - MISIÓN Y VISIÓN */}
      <section className="w-full flex flex-col md:flex-row">
        {/* Misión */}
        <div className="flex-1 bg-[#7297C9] p-10 min-h-[200px]">
          <h3 className="text-white font-bold text-2xl mb-3">Misión</h3>
          <p className="text-white text-sm leading-relaxed">
            Empoderar a los educadores con datos en tiempo real para transformar 
            la experiencia de aprendizaje. A través de tecnología accesible y feedback 
            inmediato, facilitamos la identificación de brechas académicas, permitiendo 
            una enseñanza personalizada y un seguimiento oportuno que garantice el 
            éxito de cada estudiante.
          </p>
        </div>
        
        {/* Visión */}
        <div className="flex-1 bg-[#9E5A78] p-10 min-h-[200px]">
          <h3 className="text-white font-bold text-2xl mb-3">Visión</h3>
          <p className="text-white text-sm leading-relaxed">
            Convertirnos en el estándar latinoamericano de retroalimentación 
            pedagógica, siendo la herramienta clave para que las instituciones educativas 
            evolucionen hacia un modelo basado en la evidencia, donde ningún estudiante 
            se quede atrás gracias a la intervención docente precisa y humana.
          </p>
        </div>
      </section>

      {/* SECTION 4 - BENEFICIOS */}
      <section className="bg-[#fdfdf1] py-16 px-8">
        <h2 className="text-center text-[#9E5A78] font-bold text-3xl mb-10">
          Beneficios
        </h2>
        
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-12 justify-center">
            {/* Benefit 1 */}
            <div className="border-l-4 border-[#5B9B95] pl-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-[#5B9B95]" />
                <h4 className="text-[#9E5A78] font-semibold">Ahorro en Calificación</h4>
              </div>
              <p className="text-[#5B9B95] text-sm">
                Reduce el tiempo de evaluación con automatización inteligente.
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="border-l-4 border-[#C66B86] pl-3">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-5 h-5 text-[#C66B86]" />
                <h4 className="text-[#9E5A78] font-semibold">{"Identificación de \"Puntos Ciegos\""}</h4>
              </div>
              <p className="text-[#5B9B95] text-sm">
                Detecta los temas donde más estudiantes fallan.
              </p>
            </div>
          </div>
          
          {/* Center Column - Image */}
          <div className="flex-1 flex items-center justify-center">
            <img 
              src="/images/img-home2.png" 
              alt="Teacher helping student illustration"
              className="w-48 mx-auto drop-shadow-md"
            />
          </div>
          
          {/* Right Column */}
          <div className="flex-1 flex flex-col gap-12 justify-center">
            {/* Benefit 3 */}
            <div className="border-l-4 border-[#F1D87C] pl-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-[#F1D87C]" />
                <h4 className="text-[#9E5A78] font-semibold">Diagnóstico Instantáneo</h4>
              </div>
              <p className="text-[#5B9B95] text-sm">
                Resultados en tiempo real tras cada evaluación.
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="border-l-4 border-[#9BC294] pl-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-[#9BC294]" />
                <h4 className="text-[#9E5A78] font-semibold">Personalización del Seguimiento</h4>
              </div>
              <p className="text-[#5B9B95] text-sm">
                Intervenciones adaptadas a cada estudiante.
              </p>
            </div>
          </div>
        </div>
      </section>

    </PublicLayout>
  )
}
