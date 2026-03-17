import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, BookOpen, LogOut, User, Sparkles, TrendingUp, History, Calendar, Award, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNDLhK6_BaxCtOO_sXrvfare0f4If3JLruSswte2f4ujoeKSQUmxnoXjIJUBQoWA6c/exec';

interface HistoryItem {
  fecha: string;
  area: string;
  puntaje: number;
  puntajeMax: number;
  correctas: number;
  total: number;
}

export function UserDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!currentUser?.username) return;
      
      try {
        // En nuestro sistema, el username suele ser el DNI o identificador único
        const url = `${APPSCRIPT_URL}?action=getHistory&dni=${encodeURIComponent(currentUser.username)}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.history) {
          setHistory(result.history);
        }
      } catch (error) {
        console.error('Error cargando historial:', error);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getBestScore = () => {
    if (history.length === 0) return 0;
    return Math.max(...history.map(h => h.puntaje));
  };

  const getAveragePercentage = () => {
    if (history.length === 0) return 0;
    const total = history.reduce((acc, h) => acc + (h.puntaje / h.puntajeMax), 0);
    return Math.round((total / history.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-12">
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

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Welcome & Stats Summary */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="md:col-span-2 bg-slate-800/40 border border-slate-700 p-8 rounded-3xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-300 text-sm mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span>Tu panel de control</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  ¡Hola, <span className="text-cyan-400">{currentUser?.nombre?.split(' ')[0]}</span>!
                </h1>
                <p className="text-slate-400">
                  Has realizado <span className="text-white font-bold">{history.length}</span> simulacros hasta ahora. ¡Sigue así!
                </p>
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-gradient-to-br from-violet-600/20 to-violet-900/20 border border-violet-500/20 p-6 rounded-3xl flex flex-col justify-center text-center">
              <TrendingUp className="w-8 h-8 text-violet-400 mx-auto mb-2" />
              <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Rendimiento Promedio</p>
              <p className="text-4xl font-bold text-white">{getAveragePercentage()}%</p>
            </div>
          </div>

          {/* Practice Modes */}
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            ¿Qué quieres practicar hoy?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <button
              onClick={() => navigate('/quizizz')}
              className="group p-8 bg-slate-800/40 border border-slate-700 rounded-3xl text-left hover:border-violet-500/50 hover:bg-slate-800/60 transition-all hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Modo Quizizz</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ideal para memorizar datos clave y repasar temas específicos con feedback al instante.
              </p>
            </button>

            <button
              onClick={() => navigate('/simulacro')}
              className="group p-8 bg-slate-800/40 border border-slate-700 rounded-3xl text-left hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all hover:-translate-y-1"
            >
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Modo Simulacro</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Examen de 60 preguntas con tiempo real (180 min). La mejor forma de medir tu nivel.
              </p>
            </button>
          </div>

          {/* History Section */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                Historial de Intentos
              </h3>
              <div className="px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300">
                Mejor Puntaje: {getBestScore()} pts
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingHistory ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-500" />
                  Cargando tus resultados...
                </div>
              ) : history.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">Fecha</th>
                      <th className="px-6 py-4 font-medium">Área</th>
                      <th className="px-6 py-4 font-medium">Correctas</th>
                      <th className="px-6 py-4 font-medium">Puntaje</th>
                      <th className="px-6 py-4 font-medium text-right">Rendimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {history.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-white">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            item.area === 'Ingenierías' ? 'bg-indigo-500/10 text-indigo-400' :
                            item.area === 'Sociales' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-rose-500/10 text-rose-400'
                          }`}>
                            {item.area}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {item.correctas} <span className="text-slate-600 text-xs">/ {item.total}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {Math.round(item.puntaje * 100) / 100}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  (item.puntaje / item.puntajeMax) >= 0.5 ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${(item.puntaje / item.puntajeMax) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-slate-400">
                              {Math.round((item.puntaje / item.puntajeMax) * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Aún no has realizado ningún simulacro.</p>
                  <p className="text-sm">¡Comienza hoy mismo!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm mb-1">
            Desarrollado por <span className="text-cyan-400 font-medium">Carlos Llano</span>
          </p>
          <p className="text-slate-500 text-xs mb-4">
            llanovilca97@gmail.com
          </p>
          <p className="text-slate-600 text-xs uppercase tracking-widest">
            © 2026 ATOMIC QUIZ - Plataforma educativa
          </p>
        </div>
      </footer>
    </div>
  );
}
