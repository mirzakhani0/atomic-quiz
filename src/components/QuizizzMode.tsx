import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore, useCurrentQuestion, useProgress, useIsLastQuestion, useIsFirstQuestion, useSavedAnswer } from '../hooks/useAppStore';
import { AREAS, COURSES_BY_AREA, AreaType } from '../types';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, BookOpen, RotateCcw, Home, Lightbulb, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface SheetQuestion {
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
  'Ingenierías': 'https://script.google.com/macros/s/AKfycbyNAnb4uLxcxFiwNZ3Hmi_VIbQlornTFY1SA73zC3uQ1Tu9lwMe2VJZS9HzLLYQojSJyg/exec',
  'Biomédicas': 'https://script.google.com/macros/s/AKfycbzFyqDV6YyDq50OopTA26nZF67rLcLRSk1h9GRp5SOfrDnpLo0RV-oVXV7z6PUAaWQVXg/exec',
  'Sociales': 'https://script.google.com/macros/s/AKfycbwUvvElR49vTGWx0c762zFnJTkqtGXkhAQjBGb9lFTP02dmqCTsebadSJAXc6V9zFXcHQ/exec'
};

const SEMANAS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16'];

export function QuizizzMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const areaParam = searchParams.get('area');
  const courseParam = searchParams.get('course');
  
  const { 
    selectedArea, setSelectedArea,
    selectedCourse, setSelectedCourse,
    setQuestions, currentQuestionIndex, setCurrentQuestionIndex,
    saveAnswer, savedAnswers,
    setQuizizzResult, quizizzResult
  } = useAppStore();

  const currentQuestion = useCurrentQuestion();
  const progress = useProgress();
  const isLast = useIsLastQuestion();
  const isFirst = useIsFirstQuestion();

  const [step, setStep] = useState<'select' | 'loading' | 'quiz'>('select');
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState('S1');

  const selectedAnswer = useSavedAnswer(currentQuestion?.id || '');

  useEffect(() => {
    if (areaParam && AREAS.includes(areaParam as AreaType)) {
      setSelectedArea(areaParam as AreaType);
    }
  }, [areaParam, setSelectedArea]);

  useEffect(() => {
    if (courseParam && selectedArea) {
      setSelectedCourse(courseParam);
    }
  }, [courseParam, selectedArea, setSelectedCourse]);

  const fetchWeekQuestions = async (area: string, semana: string): Promise<SheetQuestion[]> => {
    const appsScriptUrl = APPSCRIPT_URLS[area as AreaType];
    setLoadingStatus(`Cargando ${semana}...`);
    
    try {
      const url = `${appsScriptUrl}?sheet=${semana}`;
      const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
      const text = await response.text();
      
      let json: { data?: SheetQuestion[] };
      try { json = JSON.parse(text); } catch { return []; }
      
      return json.data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const handleStartQuizizz = async () => {
    if (!selectedArea || !selectedCourse) return;
    
    setStep('loading');
    setLoadingStatus('Conectando...');
    setLoadingError(null);

    try {
      const allQuestions = await fetchWeekQuestions(selectedArea, selectedWeek);
      
      if (allQuestions.length === 0) {
        setLoadingError(`No hay preguntas en ${selectedWeek}. Intenta con otra semana.`);
        setStep('select');
        return;
      }

      const filteredQuestions = allQuestions.filter(
        q => (q.curso || '').toLowerCase() === selectedCourse.toLowerCase()
      );

      if (filteredQuestions.length === 0) {
        setLoadingError(`No hay preguntas para "${selectedCourse}" en ${selectedWeek}.`);
        setStep('select');
        return;
      }

      const formattedQuestions = filteredQuestions.map((q, idx) => {
        const respuesta = (q.respuesta || '').toString().toUpperCase().trim();
        const respuestaIndex = respuesta.charCodeAt(0) - 65;
        
        return {
          id: `q-${selectedArea}-${selectedWeek}-${selectedCourse}-${idx}`,
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
          course: q.curso || selectedCourse,
          area: selectedArea,
          justification: q.justificacion || undefined
        };
      });

      const shuffled = [...formattedQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setStep('quiz');
      
    } catch (error) {
      setLoadingError('Error al conectar. Intenta de nuevo.');
      setStep('select');
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (!currentQuestion) return;
    saveAnswer(currentQuestion.id, index);
  };

  const handleNext = () => {
    if (isLast) {
      calculateResults();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = () => {
    const questions = useAppStore.getState().questions;
    let correct = 0;
    const answers: { questionId: string; selectedOption: number | null; isCorrect: boolean; timeSpent: number }[] = [];

    questions.forEach(q => {
      const selected = savedAnswers.get(q.id) ?? null;
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correct++;
      answers.push({ questionId: q.id, selectedOption: selected, isCorrect, timeSpent: 0 });
    });

    setQuizizzResult({
      totalQuestions: questions.length,
      correctAnswers: correct,
      incorrectAnswers: questions.length - correct - (questions.length - savedAnswers.size),
      unanswered: questions.length - savedAnswers.size,
      percentage: (correct / questions.length) * 100,
      answers,
      wrongQuestions: [],
      timeSpent: 0
    });
  };

  const handleFinish = () => {
    calculateResults();
  };

  const handleRestartQuiz = () => {
    useAppStore.getState().resetQuizizz();
    setStep('select');
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Cargando preguntas...</p>
          <p className="text-slate-400 text-sm mb-4">{loadingStatus}</p>
          {loadingError && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
              {loadingError}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>

          <div className="text-center mb-8">
            <BookOpen className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Quizizz</h1>
            <p className="text-slate-400">Las preguntas se cargan automáticamente desde Google Sheets</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Área</label>
              <select
                value={selectedArea || ''}
                onChange={(e) => { setSelectedArea(e.target.value as AreaType); setSelectedCourse(null); }}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                <option value="">Seleccionar área</option>
                {AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {selectedArea && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Semana a repasar</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  {SEMANAS.map(s => (
                    <option key={s} value={s}>Semana {s}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedArea && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Curso</label>
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Seleccionar curso</option>
                  {COURSES_BY_AREA[selectedArea].map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleStartQuizizz}
              disabled={!selectedArea || !selectedCourse}
              className="w-full py-4 bg-violet-600 rounded-xl font-bold hover:bg-violet-500 disabled:opacity-50"
            >
              Comenzar Quizizz - Semana {selectedWeek}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const isLastStep = currentQuestionIndex === useAppStore.getState().questions.length - 1;
  const hasResult = quizizzResult !== null;

  if (hasResult) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className={clsx(
              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
              quizizzResult.percentage >= 70 ? 'bg-emerald-500' : quizizzResult.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
            )}>
              <span className="text-3xl font-bold">{Math.round(quizizzResult.percentage)}%</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Resultados</h2>
            <p className="text-slate-400">
              {quizizzResult.correctAnswers} de {quizizzResult.totalQuestions} correctas
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between p-4 bg-slate-800 rounded-xl">
              <span className="text-emerald-400">Correctas</span>
              <span className="font-bold">{quizizzResult.correctAnswers}</span>
            </div>
            <div className="flex justify-between p-4 bg-slate-800 rounded-xl">
              <span className="text-red-400">Incorrectas</span>
              <span className="font-bold">{quizizzResult.incorrectAnswers}</span>
            </div>
            <div className="flex justify-between p-4 bg-slate-800 rounded-xl">
              <span className="text-slate-400">Sin responder</span>
              <span className="font-bold">{quizizzResult.unanswered}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </button>

          <button
            onClick={handleRestartQuiz}
            className="w-full py-3 mt-3 bg-violet-600 rounded-xl font-medium hover:bg-violet-500 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Repetir Quizizz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Pregunta {progress.current} de {progress.total}</span>
            <span>{Math.round(progress.percentage)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <span className="px-2 py-1 bg-slate-700 rounded">{currentQuestion.course}</span>
            <span className="px-2 py-1 bg-slate-700 rounded">{currentQuestion.area}</span>
          </div>
          
          <h2 className="text-xl font-semibold mb-6">{currentQuestion.questionText}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  className={clsx(
                    'w-full p-4 rounded-xl text-left transition-all border-2 flex items-center gap-3',
                    isSelected 
                      ? 'bg-violet-500/20 border-violet-500' 
                      : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                  )}
                >
                  <span className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isSelected ? 'bg-violet-500 text-white' : 'bg-slate-600 text-slate-300'
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-violet-400 ml-auto" />}
                </button>
              );
            })}
          </div>

          {currentQuestion.justification && (
            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Lightbulb className="w-5 h-5" />
                <span className="font-semibold">Explicación</span>
              </div>
              <p className="text-slate-300">{currentQuestion.justification}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={isFirst}
            className="flex-1 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 py-3 bg-violet-600 rounded-xl font-medium hover:bg-violet-500 flex items-center justify-center gap-2"
          >
            {isLastStep ? 'Ver resultados' : 'Siguiente'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}