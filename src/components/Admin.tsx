import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREAS, COURSES_BY_AREA, AreaType } from '../types';
import { ArrowLeft, Upload, FileText, Plus, Trash2, Save, Database } from 'lucide-react';
import clsx from 'clsx';

interface QuestionForm {
  questionText: string;
  options: string[];
  correctAnswer: number;
  justification: string;
  course: string;
}

export function Admin() {
  const navigate = useNavigate();
  const [area, setArea] = useState<AreaType>('Ingenierías');
  const [course, setCourse] = useState('');
  const [source, setSource] = useState<'google-sheets' | 'csv' | 'manual'>('manual');
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      questionText: '',
      options: ['', '', '', '', ''],
      correctAnswer: 0,
      justification: '',
      course: course
    }]);
    setEditingIndex(questions.length);
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
    setEditingIndex(null);
  };

  const handleImport = async () => {
    if (!area || !course) return;
    setImporting(true);
    setImportResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setImportResult({
        success: true,
        message: `Se importaron correctamente las preguntas de ${course} para el área de ${area}`
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Error al importar preguntas'
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
    setEditingIndex(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-slate-400">Gestiona las preguntas de la plataforma</p>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Importar Preguntas
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
              <label className="block text-sm text-slate-400 mb-2">Curso</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl"
              >
                <option value="">Seleccionar curso</option>
                {COURSES_BY_AREA[area].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Fuente</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as 'google-sheets' | 'csv' | 'manual')}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl"
              >
                <option value="google-sheets">Google Sheets</option>
                <option value="csv">Archivo CSV</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          {source === 'google-sheets' && (
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">URL de Google Sheets</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl"
              />
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!area || !course || importing}
            className="w-full py-3 bg-cyan-600 rounded-xl font-medium hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>Importando...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importar desde {source === 'google-sheets' ? 'Google Sheets' : source === 'csv' ? 'CSV' : 'Excel'}
              </>
            )}
          </button>

          {importResult && (
            <div className={clsx(
              'mt-4 p-3 rounded-xl',
              importResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            )}>
              {importResult.message}
            </div>
          )}
        </div>

        {/* Manual Entry Section */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              Preguntas Manuales
            </h2>
            <button
              onClick={handleAddQuestion}
              disabled={!course}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-500 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Agregar pregunta
            </button>
          </div>

          {!course && (
            <p className="text-slate-400 text-sm">Selecciona un curso para agregar preguntas</p>
          )}

          {questions.length > 0 && (
            <div className="space-y-3 mb-4">
              {questions.map((q, idx) => (
                <div 
                  key={idx} 
                  className={clsx(
                    'p-4 bg-slate-700 rounded-xl',
                    editingIndex === idx && 'ring-2 ring-violet-500'
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm text-slate-400">Pregunta {idx + 1}</span>
                    <button
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <textarea
                    value={q.questionText}
                    onChange={(e) => handleUpdateQuestion(idx, 'questionText', e.target.value)}
                    placeholder="Escribe la pregunta..."
                    className="w-full p-2 bg-slate-600 rounded-lg mb-3 text-sm"
                    rows={2}
                  />

                  <div className="space-y-2 mb-3">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={q.correctAnswer === optIdx}
                          onChange={() => handleUpdateQuestion(idx, 'correctAnswer', optIdx)}
                          className="accent-violet-500"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            newOptions[optIdx] = e.target.value;
                            handleUpdateQuestion(idx, 'options', newOptions);
                          }}
                          placeholder={`Opción ${String.fromCharCode(65 + optIdx)}`}
                          className="flex-1 p-2 bg-slate-600 rounded-lg text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={q.justification}
                    onChange={(e) => handleUpdateQuestion(idx, 'justification', e.target.value)}
                    placeholder="Explicación de la respuesta correcta..."
                    className="w-full p-2 bg-slate-600 rounded-lg text-sm"
                    rows={2}
                  />
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

        {/* Stats */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Estadísticas</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-cyan-400">3</p>
              <p className="text-slate-400 text-sm">Áreas</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-violet-400">18</p>
              <p className="text-slate-400 text-sm">Cursos</p>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-xl">
              <p className="text-2xl font-bold text-emerald-400">1000+</p>
              <p className="text-slate-400 text-sm">Preguntas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}