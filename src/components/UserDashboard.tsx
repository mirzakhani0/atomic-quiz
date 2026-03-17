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
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'progreso' | 'ranking'>('progreso');

  const [hasErrors, setHasErrors] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser?.username) return;
      
      try {
        // Cargar Historial
        const historyUrl = `${APPSCRIPT_URL}?action=getHistory&dni=${encodeURIComponent(currentUser.username)}`;
        const historyRes = await fetch(historyUrl);
        const historyData = await historyRes.json();
        if (historyData.success) setHistory(historyData.history);

        // Cargar Ranking
        const rankingUrl = `${APPSCRIPT_URL}?action=getLeaderboard`;
        const rankingRes = await fetch(rankingUrl);
        const rankingData = await rankingRes.json();
        if (rankingData.success) setLeaderboard(rankingData.leaderboard);

        // Verificar Errores
        const errorUrl = `${APPSCRIPT_URL}?action=getWrongQuestions&dni=${encodeURIComponent(currentUser.username)}`;
        const errorRes = await fetch(errorUrl);
        const errorData = await errorRes.json();
        if (errorData.success && errorData.wrongIds?.length > 0) setHasErrors(true);

      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchData();
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
          <div className="grid md:grid-cols-3 gap-6 mb-12">
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

            <button
              onClick={() => hasErrors ? navigate('/quizizz?mode=repaso') : null}
              disabled={!hasErrors}
              className={`group p-8 border rounded-3xl text-left transition-all relative overflow-hidden ${
                hasErrors 
                ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/20 hover:-translate-y-1' 
                : 'bg-slate-800/20 border-slate-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${hasErrors ? 'bg-rose-500/20' : 'bg-slate-700/20'}`}>
                <Zap className={`w-7 h-7 ${hasErrors ? 'text-rose-400' : 'text-slate-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${hasErrors ? 'text-white' : 'text-slate-500'}`}>Borra tus errores</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {hasErrors 
                  ? 'Practica únicamente las preguntas que has fallado en simulacros anteriores.' 
                  : 'No tienes errores pendientes por repasar. ¡Excelente trabajo!'}
              </p>
              {hasErrors && (
                <div className="absolute top-4 right-4 animate-pulse">
                  <div className="px-2 py-1 bg-rose-500 rounded text-[10px] font-bold text-white uppercase">Prioritario</div>
                </div>
              )}
            </button>
          </div>

          {/* History & Ranking Section */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden">
            <div className="p-2 border-b border-slate-700 flex">
              <button
                onClick={() => setActiveTab('progreso')}
                className={`flex-1 py-4 px-6 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'progreso' ? 'text-cyan-400 bg-slate-700/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <History className="w-4 h-4" />
                MIS RESULTADOS
              </button>
              <button
                onClick={() => setActiveTab('ranking')}
                className={`flex-1 py-4 px-6 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'ranking' ? 'text-amber-400 bg-slate-700/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Award className="w-4 h-4" />
                RANKING GLOBAL
              </button>
            </div>

            <div className="overflow-x-auto">
              {loadingHistory ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-500" />
                  Cargando datos...
                </div>
              ) : activeTab === 'progreso' ? (
                // TABLA DE PROGRESO (Ya existente mejorada)
                history.length > 0 ? (
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
                            <div className="flex items-center gap-2 text-white text-sm">
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
                          <td className="px-6 py-4 text-slate-300 text-sm">
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
                  </div>
                )
              ) : (
                // TABLA DE RANKING (NUEVA)
                <table className="w-full text-left">
                  <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">Puesto</th>
                      <th className="px-6 py-4 font-medium">Estudiante</th>
                      <th className="px-6 py-4 font-medium">Área</th>
                      <th className="px-6 py-4 font-medium text-right">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {leaderboard.length > 0 ? leaderboard.map((player, index) => (
                      <tr key={index} className={`hover:bg-slate-700/30 transition-colors ${index === 0 ? 'bg-amber-500/5' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-slate-700 text-slate-300">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium text-sm">{player.nombre}</div>
                          <div className="text-slate-500 text-[10px]">{new Date(player.fecha).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-400">{player.area}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-amber-400">{player.puntaje}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-500">
                          Aún no hay datos en el ranking esta semana.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
