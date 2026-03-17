import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREAS, COURSES_BY_AREA, AreaType } from '../types';
import { ArrowLeft, Upload, Database, LogOut, CheckCircle, Loader2, RefreshCw, Link, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useQuestionsStore } from '../hooks/useQuestions';

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

const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw0MpSBuWXFG1-zWBlHIed3uU4RizWVK24DZpREnxQJQ_bewaGPsF0iFlGht72BcwWm/exec';

const APPSCRIPT_URLS: Record<AreaType, string> = {
  'Ingenierías': 'https://script.google.com/macros/s/AKfycbyNAnb4uLxcxFiwNZ3Hmi_VIbQlornTFY1SA73zC3uQ1Tu9lwMe2VJZS9HzLLYQojSJyg/exec',
  'Biomédicas': 'https://script.google.com/macros/s/AKfycbzFyqDV6YyDq50OopTA26nZF67rLcLRSk1h9GRp5SOfrDnpLo0RV-oVXV7z6PUAaWQVXg/exec',
  'Sociales': 'https://script.google.com/macros/s/AKfycbwUvvElR49vTGWx0c762zFnJTkqtGXkhAQjBGb9lFTP02dmqCTsebadSJAXc6V9zFXcHQ/exec'
};

const SEMANAS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16'];

export function Admin() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addQuestions, clearQuestions } = useQuestionsStore();
  
  const [area, setArea] = useState<AreaType>('Ingenierías');
  const [semana, setSemana] = useState('S1');
  const [course, setCourse] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

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
            <p className="text-slate-400">Importa preguntas desde Google Sheets</p>
          </div>
        </div>

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

        <div className="bg-slate-800 rounded-2xl p-6 mt-6">
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

        <div className="bg-slate-800 rounded-2xl p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Gestión de Usuarios</h2>
          <p className="text-slate-400 text-sm mb-4">
            Los usuarios se gestionan directamente en Google Sheets. Para agregar nuevos usuarios:
          </p>
          <ol className="list-decimal list-inside text-slate-400 text-sm space-y-2">
            <li>Abre tu Google Spreadsheet</li>
            <li>Ve a la hoja "Usuarios"</li>
            <li>Agrega las columnas: username, password, role, nombre, createdAt, active</li>
            <li>Para activar un usuario, escribe "true" en la columna "active"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
