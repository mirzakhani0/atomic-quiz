import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREAS, COURSES_BY_AREA, AreaType } from '../types';
import { ArrowLeft, Upload, FileText, Database, LogOut, CheckCircle, XCircle, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useQuestionsStore } from '../hooks/useQuestions';
import clsx from 'clsx';

interface ImportedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: number;
  justification: string | undefined;
  course: string;
}

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
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseJSON = (text: string): ImportedQuestion[] => {
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : data.data || [];
      
      return arr.map((row: Record<string, unknown>) => {
        const respuesta = String(row.respuesta || row.respuesta_correcta || '').toUpperCase().trim();
        const respuestaIndex = respuesta.charCodeAt(0) - 65;
        
        return {
          questionText: String(row.pregunta || row.questionText || ''),
          options: [
            String(row.opcion_a || row.option_a || ''),
            String(row.opcion_b || row.option_b || ''),
            String(row.opcion_c || row.option_c || ''),
            String(row.opcion_d || row.option_d || ''),
            String(row.opcion_e || row.option_e || '')
          ],
          correctAnswer: respuestaIndex >= 0 && respuestaIndex < 5 ? respuestaIndex : 0,
          justification: String(row.justificacion || row.explicacion || ''),
          course: String(row.curso || row.course || '')
        };
      }).filter((q: ImportedQuestion) => q.questionText);
    } catch (e) {
      throw new Error('JSON inválido');
    }
  };

  const parseCSV = (text: string): ImportedQuestion[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const result: ImportedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 9) continue;

      const respuesta = cols[6]?.toUpperCase().trim() || '';
      const respuestaIndex = respuesta.charCodeAt(0) - 65;

      result.push({
        questionText: cols[0] || '',
        options: [cols[1] || '', cols[2] || '', cols[3] || '', cols[4] || '', cols[5] || ''],
        correctAnswer: respuestaIndex >= 0 && respuestaIndex < 5 ? respuestaIndex : 0,
        justification: cols[7] || '',
        course: cols[8] || ''
      });
    }

    return result;
  };

  const handleImportJSON = async () => {
    if (!jsonInput.trim()) return;
    setImporting(true);
    setImportResult(null);

    try {
      const importedQuestions = parseJSON(jsonInput);
      
      const filteredQuestions = course 
        ? importedQuestions.filter(q => q.course.toLowerCase() === course.toLowerCase())
        : importedQuestions;

      const questionsWithMeta = filteredQuestions.map((q, idx) => ({
        id: `${area}-${semana}-${q.course}-${idx}-${Date.now()}`,
        number: idx + 1,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        course: q.course,
        area: area,
        justification: q.justification || undefined
      }));

      addQuestions(questionsWithMeta);
      
      setImportResult({
        success: true,
        message: `Se importaron ${questionsWithMeta.length} preguntas desde JSON`,
        count: questionsWithMeta.length
      });
      setJsonInput('');
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Error al parsear JSON. Verifica el formato.'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const importedQuestions = file.name.endsWith('.json') 
          ? parseJSON(text) 
          : parseCSV(text);

        const filteredQuestions = course 
          ? importedQuestions.filter(q => q.course.toLowerCase() === course.toLowerCase())
          : importedQuestions;

        const questionsWithMeta = filteredQuestions.map((q, idx) => ({
          id: `${area}-${semana}-${q.course}-${idx}-${Date.now()}`,
          number: idx + 1,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          course: q.course,
          area: area,
          justification: q.justification || undefined
        }));

        addQuestions(questionsWithMeta);
        
        setImportResult({
          success: true,
          message: `Se importaron ${questionsWithMeta.length} preguntas desde ${file.name}`,
          count: questionsWithMeta.length
        });
      } catch (error) {
        setImportResult({
          success: false,
          message: 'Error al leer el archivo. Formato no válido.'
        });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
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
            <p className="text-slate-400">Importa preguntas desde archivo o JSON</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            Importar Preguntas
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Área destino</label>
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
          </div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Subir archivo (CSV o JSON)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white file:cursor-pointer"
            />
          </div>

          <div className="text-center text-slate-400 py-2">o</div>

          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-2">Pegar JSON directamente</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"pregunta": "...", "opcion_a": "...", "opcion_b": "...", "opcion_c": "...", "opcion_d": "...", "opcion_e": "...", "respuesta": "A", "justificacion": "...", "curso": "Aritmética"}]'
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-sm font-mono h-32"
            />
          </div>

          <button
            onClick={handleImportJSON}
            disabled={!jsonInput.trim() || importing}
            className="w-full py-3 bg-cyan-600 rounded-xl font-medium hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Importar desde JSON
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
          <h3 className="text-md font-semibold mb-3">Formato esperado (JSON):</h3>
          <pre className="text-xs bg-slate-700 p-3 rounded-lg overflow-x-auto text-slate-300">
{`[
  {
    "pregunta": "¿Cuánto es 15 + 27?",
    "opcion_a": "40",
    "opcion_b": "42",
    "opcion_c": "44",
    "opcion_d": "46",
    "opcion_e": "48",
    "respuesta": "B",
    "justificacion": "15 + 27 = 42",
    "curso": "Aritmética"
  }
]`}
          </pre>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Estadísticas de Preguntas</h2>
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de eliminar todas las preguntas guardadas?')) {
                  clearQuestions();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar todo
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-cyan-400">{questions.length}</p>
              <p className="text-slate-400 text-sm">Total guardadas</p>
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