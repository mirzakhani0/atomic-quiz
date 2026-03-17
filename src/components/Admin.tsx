import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREAS, COURSES_BY_AREA, AreaType } from '../types';
import { ArrowLeft, Upload, Database, LogOut, CheckCircle, XCircle, Loader2, RefreshCw, Link } from 'lucide-react';
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

const APPSCRIPT_URLS: Record<AreaType, string> = {
  'Ingenierías': 'https://script.google.com/macros/s/AKfycbw-MZvuiU4Z9ySewOSDjyq81pR_NjrcTVq3szEZU1DWDjKyPFG6IvdS5nlzE1ACZz-mMw/exec',
  'Biomédicas': 'https://script.google.com/macros/s/AKfycbxqr1z3gQNHR9TxPCYX_nHAVR1TMvI1veNdt5L1BpaXkULpdddI_K80LSCauzkkjz7--g/exec',
  'Sociales': 'https://script.google.com/macros/s/AKfycbwP-r3D0vvWJ_2Zx_KDyt_sWNBA-Ixs9Yemjhq6XAso454THHVNYqkZpQIty8C2yKZpzg/exec'
};

const SEMANAS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16'];

export function Admin() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { questions, addQuestions, getAllCourses, clearQuestions } = useQuestionsStore();
  
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
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      let json: { data?: ImportedQuestion[] };
      try {
        json = JSON.parse(text);
      } catch {
        const textData = text.replace(/^[\s\S]*\{/, '{').replace(/\}[\s\S]*$/, '}');
        json = JSON.parse(textData);
      }
      
      const data = json.data || [];
      if (!Array.isArray(data)) {
        throw new Error('Formato de datos inválido');
      }
      
      const importedQuestions: ImportedQuestion[] = data;
      
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
        message: `Se importaron ${questionsWithMeta.length} preguntas de ${semana} para ${area}`,
        count: questionsWithMeta.length
      });
      
    } catch (error) {
      console.error('Error fetching:', error);
      setImportResult({
        success: false,
        message: 'Error al conectar. Verifica que el Apps Script esté configurado correctamente.'
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

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Link className="w-5 h-5 text-cyan-400" />
            Conectar con Google Sheets
          </h2>
          
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
            <p className="text-sm text-blue-400">
              Las preguntas se almacenan en tus documentos de Google Sheets. 
              Necesitas configurar el Apps Script en cada documento.
            </p>
          </div>

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
              <label className="block text-sm text-slate-400 mb-2">Semana (S1-S16)</label>
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
              <label className="block text-sm text-slate-400 mb-2">Curso (opcional)</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl"
              >
                <option value="">Todos los cursos</option>
                {COURSES_BY_AREA[area].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={!area || !semana || importing}
            className="w-full py-3 bg-cyan-600 rounded-xl font-medium hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Importar de {area} - {semana}
              </>
            )}
          </button>

          {importResult && (
            <div className={clsx(
              'mt-4 p-3 rounded-xl flex items-center gap-2',
              importResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            )}>
              {importResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span>{importResult.message}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-md font-semibold mb-3 text-amber-400">⚠️ Configurar Apps Script:</h3>
          <ol className="text-sm text-slate-300 space-y-2">
            <li>1. Abre tu Google Sheet de {area}</li>
            <li>2. Ve a <strong>Extensiones → Apps Script</strong></li>
            <li>3. Borra todo y pega este código:</li>
          </ol>
          <pre className="text-xs bg-slate-700 p-3 rounded-lg mt-3 overflow-x-auto text-green-400">
{`function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(e.parameter.sheet || 'S1');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const result = data.slice(1).filter(r => r[0]).map(row => {
    const obj = {}; headers.forEach((h, i) => obj[h] = row[i]); return obj;
  });
  return ContentService.createTextOutput(JSON.stringify({data: result})).setMimeType(ContentService.MimeType.JSON);
}`}
          </pre>
          <ol className="text-sm text-slate-300 space-y-2 mt-3" start={4}>
            <li>4. Click en <strong>Deploy → New deployment</strong></li>
            <li>5. Selecciona <strong>Web app</strong></li>
            <li>6. En "Who has access" selecciona <strong>Anyone</strong> ✓</li>
            <li>7. Click en <strong>Deploy</strong> y copia la URL</li>
          </ol>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Estadísticas</h2>
            <button
              onClick={() => {
                if (confirm('¿Eliminar todas las preguntas?')) clearQuestions();
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-cyan-400">{questions.length}</p>
              <p className="text-slate-400 text-sm">Total</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-emerald-400">{getAllCourses('Ingenierías').length}</p>
              <p className="text-slate-400 text-sm">Cursos ING</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-rose-400">{getAllCourses('Biomédicas').length}</p>
              <p className="text-slate-400 text-sm">Cursos BIO</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-amber-400">{getAllCourses('Sociales').length}</p>
              <p className="text-slate-400 text-sm">Cursos SOC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}