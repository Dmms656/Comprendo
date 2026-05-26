"use client"

import { PublicLayout } from "./public-layout"
import { BarChart3, Target, Zap, TrendingUp, Sparkles, BookOpen, Heart, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function HomePage() {
  const router = useRouter()

  return (
    <PublicLayout accentBars={false}>
      
      {/* SECTION 1 - HERO */}
      <section className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#faf6df] via-[#fdfdf1] to-[#f5efd3] py-16 px-6">
        {/* Background decorative blurry circles */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#5B9B95]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#9E5A78]/10 blur-3xl" />
        
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10 w-full">
          {/* Left Hero - Text Content */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#9E5A78]/10 text-[#9E5A78] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider animate-pulse">
              <Sparkles size={14} /> Retroalimentación Educativa Instantánea
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black text-[#9E5A78] tracking-tight leading-none">
              Entiende el progreso de tu clase en <span className="text-[#5B9B95] italic">tiempo real</span>
            </h1>
            
            <p className="text-[#5B5B5B] text-base lg:text-lg leading-relaxed max-w-xl">
              Comprendo centraliza el rendimiento de tus estudiantes mediante lecciones rápidas e interactivas por Telegram, ayudándote a cerrar brechas pedagógicas al instante.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={() => router.push("/registro")}
                className="w-full sm:w-auto bg-[#9E5A78] hover:bg-[#864b64] text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-[#9E5A78]/25 hover:shadow-xl hover:shadow-[#9E5A78]/35 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group cursor-pointer"
              >
                Comenzar gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => router.push("/login")}
                className="w-full sm:w-auto bg-white/80 hover:bg-white text-[#5B9B95] border border-[#5B9B95]/30 hover:border-[#5B9B95] font-semibold px-8 py-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                Iniciar sesión
              </button>
            </div>
          </div>

          {/* Right Hero - Premium 3D Art */}
          <div className="flex-1 w-full max-w-md lg:max-w-none flex justify-center">
            <div className="relative group overflow-hidden rounded-3xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#9E5A78]/25 via-[#7297C9]/35 to-[#5B9B95]/15 mix-blend-multiply z-20 pointer-events-none rounded-3xl" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#9BC294]/30 to-[#F1D87C]/30 rounded-3xl blur-2xl group-hover:scale-105 transition-all duration-500" />
              <img 
                src="/images/img-homeuno.jpg" 
                alt="Comprendo educational premium creative toys 3D illustration"
                className="relative z-10 w-full h-[380px] object-cover rounded-3xl transform hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - QUÉ HACEMOS */}
      <section className="bg-[#fdfdf1] py-20 px-8 relative overflow-hidden">
        {/* Subtle decorative background wave or grid */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#9E5A78_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-bold text-[#5B9B95] uppercase tracking-wider">Conectando Docentes y Estudiantes</span>
            <h2 className="text-[#9E5A78] font-black text-4xl mt-2">
              ¿Qué es Comprendo?
            </h2>
            <div className="w-16 h-1 bg-[#F1D87C] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Left - Description Card */}
            <div className="flex-1 space-y-6">
              <div className="bg-[#9BC294]/15 border border-[#9BC294]/30 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <p className="text-[#5B5B5B] text-base leading-relaxed">
                  Optimiza la gestión académica con datos estadísticos reales. 
                  Comprendo te brinda visibilidad instantánea para entender el rendimiento 
                  estudiantil mediante evaluaciones dinámicas por clase a través de Telegram.
                </p>
                <p className="text-[#5B5B5B] text-base leading-relaxed mt-4">
                  Nuestra solución centraliza toda la información, facilitando la detección oportuna de puntos críticos y el diseño de intervenciones pedagógicas específicas para cada grupo, garantizando que ningún estudiante se quede atrás.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#5B9B95]/10 text-[#5B9B95]">📱</div>
                  <span className="text-xs font-bold text-[#9E5A78]">Bot de Telegram</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#7297C9]/10 text-[#7297C9]">📊</div>
                  <span className="text-xs font-bold text-[#9E5A78]">Stats en Vivo</span>
                </div>
              </div>
            </div>
            
            {/* Right - Illustration */}
            <div className="flex-1 flex justify-center w-full">
              <div className="relative group overflow-hidden rounded-3xl shadow-xl w-full max-w-md">
                {/* Gamut Color overlay filter */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#9E5A78]/25 via-[#7297C9]/35 to-[#5B9B95]/15 mix-blend-multiply z-20 pointer-events-none rounded-3xl" />
                {/* Premium back glow blur */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#9BC294]/30 to-[#F1D87C]/30 rounded-3xl blur-2xl group-hover:scale-105 transition-all duration-500" />
                <img 
                  src="/images/img-homedos.jpg" 
                  alt="Educational concept vector illustration representing collaboration"
                  className="relative z-10 w-full h-[380px] object-cover rounded-3xl transform hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - MISIÓN Y VISIÓN */}
      <section className="w-full flex flex-col lg:flex-row shadow-inner">
        {/* Misión */}
        <div className="flex-1 bg-gradient-to-br from-[#7297C9] to-[#5b7ea8] p-12 lg:p-16 flex flex-col justify-center text-white relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-2xl"><BookOpen size={24} /></div>
            <h3 className="font-black text-3xl tracking-tight">Misión</h3>
          </div>
          <p className="text-white/95 text-base leading-relaxed max-w-md">
            Empoderar a los educadores con datos en tiempo real para transformar 
            la experiencia de aprendizaje. A través de tecnología accesible y feedback 
            inmediato, facilitamos la identificación de brechas académicas, permitiendo 
            una enseñanza personalizada y un seguimiento oportuno que garantice el 
            éxito de cada estudiante.
          </p>
        </div>
        
        {/* Visión */}
        <div className="flex-1 bg-gradient-to-br from-[#9E5A78] to-[#804861] p-12 lg:p-16 flex flex-col justify-center text-white relative overflow-hidden group">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-2xl"><Heart size={24} /></div>
            <h3 className="font-black text-3xl tracking-tight">Visión</h3>
          </div>
          <p className="text-white/95 text-base leading-relaxed max-w-md">
            Convertirnos en el estándar latinoamericano de retroalimentación 
            pedagógica, siendo la herramienta clave para que las instituciones educativas 
            evolucionen hacia un modelo basado en la evidencia, donde ningún estudiante 
            se quede atrás gracias a la intervención docente precisa, eficiente y humana.
          </p>
        </div>
      </section>

      {/* SECTION 4 - BENEFICIOS */}
      <section className="bg-[#fdfdf1] py-24 px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-sm font-bold text-[#9E5A78] uppercase tracking-wider">¿Por qué elegir Comprendo?</span>
            <h2 className="text-[#9E5A78] font-black text-4xl mt-2">
              Nuestros Beneficios
            </h2>
            <div className="w-16 h-1 bg-[#F1D87C] mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-10">
              {/* Benefit 1 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-x-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#5B9B95]/10 text-[#5B9B95]">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h4 className="text-[#9E5A78] font-bold text-lg">Ahorro en Calificación</h4>
                </div>
                <p className="text-[#5B5B5B] text-sm leading-relaxed pl-12">
                  Reduce drásticamente el tiempo de evaluación y recolección de notas con nuestra automatización inteligente en Telegram.
                </p>
              </div>
              
              {/* Benefit 2 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-x-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#C66B86]/10 text-[#C66B86]">
                    <Target className="w-6 h-6" />
                  </div>
                  <h4 className="text-[#9E5A78] font-bold text-lg">Identificación de &quot;Puntos Ciegos&quot;</h4>
                </div>
                <p className="text-[#5B5B5B] text-sm leading-relaxed pl-12">
                  Detecta de forma inmediata los conceptos y temas donde tus estudiantes cometen más errores recurrentes.
                </p>
              </div>
            </div>
            
            {/* Center Column - Image */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative group overflow-hidden rounded-3xl shadow-xl w-72">
                {/* Gamut Color overlay filter */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#9E5A78]/25 via-[#7297C9]/35 to-[#5B9B95]/15 mix-blend-multiply z-20 pointer-events-none rounded-3xl" />
                {/* Premium back glow blur */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#9BC294]/30 to-[#F1D87C]/30 rounded-3xl blur-2xl group-hover:scale-105 transition-all duration-500" />
                <img 
                  src="/images/img-hometres.jpg" 
                  alt="Teacher helping student 3D friendly illustration representing benefits"
                  className="relative z-10 w-full h-[420px] object-cover rounded-3xl transform hover:scale-[1.03] transition-all duration-500"
                />
              </div>
            </div>
            
            {/* Right Column */}
            <div className="flex-1 flex flex-col gap-10">
              {/* Benefit 3 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:translate-x-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#F1D87C]/10 text-[#c2ab44]">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h4 className="text-[#9E5A78] font-bold text-lg">Diagnóstico Instantáneo</h4>
                </div>
                <p className="text-[#5B5B5B] text-sm leading-relaxed pl-12">
                  Recibe y visualiza reportes dinámicos de comprensión de inmediato tras la finalización de cada lección por clase.
                </p>
              </div>
              
              {/* Benefit 4 */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:translate-x-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-[#9BC294]/10 text-[#5a8c55]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h4 className="text-[#9E5A78] font-bold text-lg">Personalización Pedagógica</h4>
                </div>
                <p className="text-[#5B5B5B] text-sm leading-relaxed pl-12">
                  Diseña estrategias de intervención y explicaciones personalizadas según las necesidades detectadas en el grupo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </PublicLayout>
  )
}
