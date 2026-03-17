import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREAS, COURSES_BY_AREA, AreaType } from '../types';
import { ArrowLeft, Upload, Database, LogOut, CheckCircle, XCircle, Loader2, RefreshCw, Link, Users, BookOpen, Bell, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useQuestionsStore } from '../hooks/useQuestions';
import clsx from 'clsx';

interface ImportedQuestion {
  pregunta?: string;
  opcion_a?: string;
  opcion_b?: string;
  opcion_c?: string;
  opcion_d?: string;
  opcion_e?: string;
  respuesta?: string;
  justificacion?: string;
  curso?: string;
}

interface UserRecord {
  username: string;
  password: string;
  role: string;
  nombre: string;
  createdAt: string;
  active: boolean | string;
}

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1iiOUxM48ZFPbuSRtAPedgxCwrS1VpNznhfvh1G4B2pirPbf0sBN3E0WqY_LfTmM5/exec';

const APPSCRIPT_URLS: Record<AreaType, string> = {
  'Ingenierías': 'https://script.google.com/macros/s/AKfycbyNAnb4uLxcxFiwNZ3Hmi_VIbQlornTFY1SA73zC3uQ1Tu9lwMe2VJZS9HzLLYQojSJyg/exec',
  'Biomédicas': 'https://script.google.com/macros/s/AKfycbzFyqDV6YyDq50OopTA26nZF67rLcLRSk1h9GRp5SOfrDnpLo0RV-oVXV7z6PUAaWQVXg/exec',
  'Sociales': 'https://script.google.com/macros/s/AKfycbwUvvElR49vTGWx0c762zFnJTkqtGXkhAQjBGb9lFTP02dmqCTsebadSJAXc6V9zFXcHQ/exec'
};

const SEMANAS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16'];

export function Admin() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addQuestions, getAllCourses, clearQuestions } = useQuestionsStore();
  
  const [activeTab, setActiveTab] = useState<'questions' | 'users'>('questions');
  const [area, setArea] = useState<AreaType>('Ingenierías');
  const [semana, setSemana] = useState('S1');
  const [course, setCourse] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [approvingAll, setApprovingAll] = useState(false);

  const fetchFromGoogleSheets = async (): Promise<void> => {
    const appsScriptUrl = APPSCRIPT_URLS[area];
    const url = `${appsScriptUrl}?sheet=${semana}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      const text = await response.text();
      let json: { data?: ImportedQuestion[] };
      
      try {
        json = JSON.parse(text);
      } catch {
        const textData = text.replace(/^[\s\S]*\{/, '{').replace(/\}[\s\S]*$/, '}');
        json = JSON.parse(textData);
      }
      
      const importedQuestions = json.data || [];
      
      const filteredQuestions = course
        ? importedQuestions.filter(q => (q.curso || '').toLowerCase() === course.toLowerCase())
        : importedQuestions;

      const questionsWithMeta = filteredQuestions.map((q, idx) => {
        const respuesta = (q.respuesta || '').toString().toUpperCase().trim();
        const respuestaIndex = respuesta.charCodeAt(0) - 65;
        
        return {
          id: `${area}-${semana}-${q.curso}-${idx}-${Date.now()}`,
          number: idx + 1,
          questionText: q.pregunta || '',
          options: [
            q.opcion_a || '',
            q.opcion_b || '',
            q.opcion_c || '',
            q.opcion_d || '',
            q.opcion_e || ''
          ],
          correctAnswer: respuestaIndex >= 0 && respuestaIndex < 5 ? respuestaIndex : 0,
          course: q.curso || '',
          area: area,
          justification: q.justificacion || undefined
        };
      });

      addQuestions(questionsWithMeta);
      
      setImportResult({
        success: true,
        message: `Se importaron ${questionsWithMeta.length} preguntas de ${semana}`,
        count: questionsWithMeta.length
      });
      
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Error al conectar con Google Sheets'
      });
    }
  };

  const handleImport = async () => {
    if (!area || !semana) return;
    setImporting(true);
    setImportResult(null);
    await fetchFromGoogleSheets();
    setImporting(false);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const url = `${APPSCRIPT_URL}?action=getUsuarios`;
      const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
      const text = await response.text();
      let result: { success: boolean; data?: UserRecord[] };
      try {
        result = JSON.parse(text);
      } catch {
        result = { success: false, data: [] };
      }
      
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoadingUsers(false);
  };

  const toggleUserActive = async (username: string, currentActive: boolean) => {
    try {
      const url = `${APPSCRIPT_URL}?action=toggleUser&username=${encodeURIComponent(username)}&active=${!currentActive}`;
      const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
      await response.text();
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
    }
  };

  const approveAllPending = async () => {
    const pendingUsers = users.filter(u => {
      const isActive = u.active === true || u.active === 'true' || u.active === '1';
      return !isActive;
    });
    
    if (pendingUsers.length === 0) return;
    
    setApprovingAll(true);
    for (const user of pendingUsers) {
      await toggleUserActive(user.username, false);
    }
    setApprovingAll(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const isActive = u.active === true || u.active === 'true' || u.active === '1';
      if (filterStatus === 'pending') return !isActive;
      if (filterStatus === 'active') return isActive;
      if (filterStatus === 'inactive') return !isActive;
      return true;
    });
  }, [users, filterStatus]);

  const pendingCount = useMemo(() => {
    return users.filter(u => {
      const isActive = u.active === true || u.active === 'true' || u.active === '1';
      return !isActive;
    }).length;
  }, [users]);

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  const renderQuestionsTab = () => (
    <>
      <div className="bg-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link className="w-5 h-5 text-cyan-400" />
          Importar desde Google Sheets
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Área</label>
            <select
              value={area}
              onChange={(e) => { setArea(e.target.value as AreaType); setCourse(''); }}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl"
            >
              {AREAS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Semana</label>
            <select
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl"
            >
              {SEMANAS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Curso</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl"
            >
              <option value="">Todos</option>
              {COURSES_BY_AREA[area].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleImport}
          disabled={!area || !semana || importing}
          className="w-full py-3 bg-cyan-600 rounded-xl font-medium hover:bg-cyan-500 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {importing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Importar de {area} - {semana}
            </>
          )}
        </button>

        {importResult && importResult.success && (
          <div className="mt-4 p-3 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{importResult.message}</span>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Nota</h2>
          <button
            onClick={() => { if (confirm('¿Eliminar todo?')) clearQuestions(); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar
          </button>
        </div>
        <p className="text-slate-400 text-sm">
          Las preguntas importadas se guardan localmente. Los usuarios pueden acceder a Quizizz que carga directamente desde Google Sheets.
        </p>
      </div>
    </>
  );

  const renderUsersTab = () => (
    <div className="bg-slate-800 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Usuarios Registrados
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button
              onClick={approveAllPending}
              disabled={approvingAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 rounded-lg text-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              {approvingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              Aprobar todos ({pendingCount})
            </button>
          )}
          <button
            onClick={fetchUsers}
            disabled={loadingUsers}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 rounded-lg text-sm hover:bg-cyan-500 disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", loadingUsers && "animate-spin")} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'active', 'inactive'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm transition-colors',
              filterStatus === status
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            )}
          >
            {status === 'all' && 'Todos'}
            {status === 'pending' && `Pendientes (${pendingCount})`}
            {status === 'active' && 'Activos'}
            {status === 'inactive' && 'Inactivos'}
          </button>
        ))}
      </div>

      {loadingUsers ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-slate-400 mt-2">Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400">
            {filterStatus === 'pending' ? 'No hay usuarios pendientes' : 
             filterStatus === 'active' ? 'No hay usuarios activos' :
             filterStatus === 'inactive' ? 'No hay usuarios inactivos' :
             'No hay usuarios registrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isActive = user.active === true || user.active === 'true' || user.active === '1';
            const isPending = !isActive;
            return (
              <div key={user.username} className={clsx(
                "flex items-center justify-between p-4 rounded-xl",
                isPending ? "bg-amber-500/10 border border-amber-500/20" : "bg-slate-700"
              )}>
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isActive ? "bg-emerald-500/20 text-emerald-400" : 
                    isPending ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {isActive ? <CheckCircle className="w-5 h-5" /> :
                     isPending ? <Bell className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {user.nombre || user.username}
                      {isPending && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                          Pendiente
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-slate-400">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleUserActive(user.username, isActive)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  )}
                >
                  {isActive ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Pendiente
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-slate-400">Gestiona preguntas y usuarios</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('questions')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              activeTab === 'questions' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            <BookOpen className="w-4 h-4" />
            Preguntas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              activeTab === 'users' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            <Users className="w-4 h-4" />
            Usuarios
          </button>
        </div>

        {activeTab === 'questions' ? renderQuestionsTab() : renderUsersTab()}
      </div>
    </div>
  );
}
