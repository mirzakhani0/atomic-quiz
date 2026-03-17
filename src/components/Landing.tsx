import { useNavigate } from 'react-router-dom';
import { Brain, Target, BookOpen, Settings, Cpu, Heart, Users, Sparkles, UserPlus, LogIn } from 'lucide-react';
import { AREA_INFO, AREAS } from '../types';
import { useAuth } from '../hooks/useAuth';

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleAction = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">ATOMIC QUIZ</span>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-300 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Plataforma de aprendizaje preuniversitario</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Domina tus estudios con
            <span className="block text-cyan-400">ATOMIC QUIZ</span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-8">
            Dos modos de práctica para tu preparación: Quizizz para memorizar y Simulacro para evaluar tu nivel real
          </p>

          {/* Auth Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl font-bold text-white hover:from-cyan-500 hover:to-cyan-600 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20"
              >
                <Target className="w-5 h-5" />
                Ir a mi panel
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-xl font-bold text-white hover:from-cyan-500 hover:to-cyan-600 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20"
                >
                  <LogIn className="w-5 h-5" />
                  Soy alumno
                </button>

                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl font-bold text-white hover:from-violet-500 hover:to-violet-600 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/20"
                >
                  <UserPlus className="w-5 h-5" />
                  Soy nuevo
                </button>
              </>
            )}
          </div>

          {/* Mode Cards */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
            <button
              onClick={() => handleAction('/quizizz')}
              className="group p-6 bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl text-left hover:from-violet-500 hover:to-violet-600 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/20"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Quizizz</h3>
              <p className="text-violet-200 text-sm">
                Aprende y memoriza con feedback inmediato. Repite las preguntas que fallaste.
              </p>
              <div className="mt-4 flex items-center gap-2 text-violet-300 text-sm">
                <span>Sin timer</span>
                <span>•</span>
                <span>Explicaciones</span>
              </div>
            </button>

            <button
              onClick={() => handleAction('/simulacro')}
              className="group p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl text-left hover:from-emerald-500 hover:to-emerald-600 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Simulacro</h3>
              <p className="text-emerald-200 text-sm">
                Examen completo de 60 preguntas con tiempo real. Evalúa tu preparación.
              </p>
              <div className="mt-4 flex items-center gap-2 text-emerald-300 text-sm">
                <span>180 min</span>
                <span>•</span>
                <span>60 preguntas</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Áreas */}
      <section className="py-12 bg-slate-800/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Elige tu área de estudio
          </h2>
          
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {AREAS.map((area) => {
              const info = AREA_INFO[area];
              const icons = { 'Ingenierías': Cpu, 'Sociales': Users, 'Biomédicas': Heart };
              const colors = {
                'Ingenierías': 'bg-indigo-500/20 text-indigo-400',
                'Sociales': 'bg-emerald-500/20 text-emerald-400',
                'Biomédicas': 'bg-rose-500/20 text-rose-400'
              };
              const Icon = icons[area];
              const colorClass = colors[area];
              
              return (
                <button
                  key={area}
                  onClick={() => handleAction(`/dashboard?area=${encodeURIComponent(area)}`)}
                  className="p-6 bg-slate-700/50 border border-slate-600 rounded-xl text-left hover:border-cyan-500 hover:bg-slate-700 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                    {area}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {info.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: '3', label: 'Áreas' },
              { value: '18+', label: 'Cursos' },
              { value: '60', label: 'Preguntas' },
              { value: '180', label: 'Minutos' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-cyan-400">{stat.value}</p>
                <p className="text-sm text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-700">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 ATOMIC QUIZ - Plataforma educativa
          </p>
        </div>
      </footer>
    </div>
  );
}
