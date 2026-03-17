import { useNavigate } from 'react-router-dom';
import { Brain, Target, BookOpen, LogOut, User, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function UserDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg">
              <User className="w-4 h-4 text-cyan-400" />
              <span className="text-white text-sm">{currentUser?.nombre || currentUser?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-300 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Bienvenido</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Hola, <span className="text-cyan-400">{currentUser?.nombre || currentUser?.username}</span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-8">
            Elige cómo quieres practicar
          </p>

          {/* Mode Cards */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/quizizz')}
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
              onClick={() => navigate('/simulacro')}
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

      {/* Footer */}
      <footer className="py-8 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 ATOMIC QUIZ - Plataforma educativa
          </p>
        </div>
      </footer>
    </div>
  );
}
