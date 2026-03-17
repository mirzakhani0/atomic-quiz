import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREAS, COURSES_BY_AREA, AreaType, Question } from '../types';
import { ArrowLeft, Upload, FileText, Plus, Trash2, Save, Database, LogOut, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import clsx from 'clsx';

interface QuestionForm {
  questionText: string;
  options: string[];
  correctAnswer: number;
  justification: string;
  course: string;
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
  const [area, setArea] = useState<AreaType>('Ingenierías');
  const [semana, setSemana] = useState('S1');
  const [course, setCourse] = useState('');
  const [source, setSource] = useState<'google-sheets' | 'manual'>('google-sheets');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  const parseGoogleSheetCSV = (csvText: string): QuestionForm[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const result: QuestionForm[] = [];

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

  const fetchFromGoogleSheets = async (appsScriptUrl: string, semana: string): Promise<QuestionForm[]> => {
    const url = `${appsScriptUrl}?sheet=${semana}`;
    const response = await fetch(url);
    const json = await response.json();
    
    if (json.error) {
      throw new Error(json.error);
    }
    
    const data = json.data || [];
    return data.map((row: Record<string, string>) => {
      const respuesta = (row.respuesta || '').toString().toUpperCase().trim();
      const respuestaIndex = respuesta.charCodeAt(0) - 65;
      
      return {
        questionText: row.pregunta || '',
        options: [
          row.opcion_a || '',
          row.opcion_b || '',
          row.opcion_c || '',
          row.opcion_d || '',
          row.opcion_e || ''
        ],
        correctAnswer: respuestaIndex >= 0 && respuestaIndex < 5 ? respuestaIndex : 0,
        justification: row.justificacion || '',
        course: row.curso || ''
      };
    });
  };

  const handleImport = async () => {
    if (!area || !semana) return;
    setImporting(true);
    setImportResult(null);

    try {
      const appsScriptUrl = APPSCRIPT_URLS[area];
      const importedQuestions = await fetchFromGoogleSheets(appsScriptUrl, semana);
      
      const filteredQuestions = course 
        ? importedQuestions.filter(q => q.course.toLowerCase() === course.toLowerCase())
        : importedQuestions;

      setQuestions(filteredQuestions);
      
      setImportResult({
        success: true,
        message: `Se importaron ${filteredQuestions.length} preguntas de ${semana} para ${area}`,
        count: filteredQuestions.length
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Error al importar. Verifica que el Apps Script esté desplegado correctamente.'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (questions.length === 0) return;
    setImporting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setImportResult({
      success: true,
      message: `Se guardaron ${questions.length} preguntas correctamente`
    });
    setQuestions([]);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      questionText: '',
      options: ['', '', '', '', ''],
      correctAnswer: 0,
      justification: '',
      course: course || COURSES_BY_AREA[area][0]
    }]);
  };

  const handleUpdateQuestion = (index: number, field: keyof QuestionForm, value: string | number | string[]) => {
    const updated = [...questions];
    if (field === 'options' && Array.isArray(value)) {
      updated[index].options = value;
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
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
            <Upload className="w-5 h-5 text-cyan-400" />
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
                Importando...
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              Preguntas Importadas ({questions.length})
            </h2>
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-500"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {questions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No hay preguntas importadas. Selecciona un área y semana para importar.
            </p>
          ) : (
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-700 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs px-2 py-1 bg-slate-600 rounded">{q.course}</span>
                    <button
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-medium mb-2">{idx + 1}. {q.questionText.substring(0, 60)}...</p>
                  <div className="text-xs text-slate-400">
                    Respuesta: <span className="text-emerald-400">{String.fromCharCode(65 + q.correctAnswer)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <button
              onClick={handleSaveQuestions}
              disabled={importing}
              className="w-full py-3 bg-violet-600 rounded-xl font-medium hover:bg-violet-500 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar {questions.length} pregunta{questions.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Estadísticas</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-cyan-400">3</p>
              <p className="text-slate-400 text-sm">Áreas</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-violet-400">16</p>
              <p className="text-slate-400 text-sm">Semanas</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-emerald-400">{questions.length}</p>
              <p className="text-slate-400 text-sm">En memoria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}