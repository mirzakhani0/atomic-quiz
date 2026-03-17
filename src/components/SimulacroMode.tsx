import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useCurrentQuestion, useProgress, useIsLastQuestion, useIsFirstQuestion, useSavedAnswer } from '../hooks/useAppStore';
import { AREAS, AreaType } from '../types';
import { ArrowLeft, ArrowRight, Clock, Grid3X3, X, RotateCcw } from 'lucide-react';
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

export function SimulacroMode() {
  const navigate = useNavigate();
  const {
    selectedArea, setSelectedArea,
    setQuestions, currentQuestionIndex, setCurrentQuestionIndex,
    saveAnswer, savedAnswers,
    setSimulacroResult, simulacroResult,
    status, setStatus
  } = useAppStore();

  const currentQuestion = useCurrentQuestion();
  const progress = useProgress();
  const isLast = useIsLastQuestion();
  const isFirst = useIsFirstQuestion();
  const selectedAnswer = useSavedAnswer(currentQuestion?.id || '');

  const [step, setStep] = useState<'select' | 'loading' | 'exam'>('select');
  const [loadingStatus, setLoadingStatus] = useState('');
  const [showNavigator, setShowNavigator] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState('S1');
  const timerRef = useRef<number | null>(null);

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

  const startExam = async () => {
    if (!selectedArea) return;
    
    setStep('loading');
    setLoadingStatus('Cargando preguntas...');

    try {
      const allQuestions = await fetchWeekQuestions(selectedArea, selectedWeek);
      
      const formattedQuestions = allQuestions.map((q, idx) => {
        const respuesta = (q.respuesta || '').toString().toUpperCase().trim();
        const respuestaIndex = respuesta.charCodeAt(0) - 65;
        
        return {
          id: `sim-${selectedArea}-${selectedWeek}-${idx}`,
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
          course: q.curso || 'General',
          area: selectedArea,
          justification: q.justificacion || undefined
        };
      });

      setQuestions(formattedQuestions);
      setStatus('in_progress');
      setStep('exam');
      
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      setLoadingStatus('Error al cargar. Intenta de nuevo.');
      setStep('select');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (index: number) => {
    if (!currentQuestion) return;
    saveAnswer(currentQuestion.id, index);
  };

  const handleNext = () => {
    if (isLast) {
      setShowFinishModal(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleGoToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setShowNavigator(false);
  };

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const questions = useAppStore.getState().questions;
    let correct = 0;
    const answers: { questionId: string; selectedOption: number | null; isCorrect: boolean; timeSpent: number }[] = [];
    const answersByCourse: Record<string, { correct: number; total: number }> = {};

    questions.forEach(q => {
      const selected = savedAnswers.get(q.id) ?? null;
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correct++;
      answers.push({ questionId: q.id, selectedOption: selected, isCorrect, timeSpent: 0 });
      
      if (!answersByCourse[q.course]) answersByCourse[q.course] = { correct: 0, total: 0 };
      answersByCourse[q.course].total++;
      if (isCorrect) answersByCourse[q.course].correct++;
    });

    setSimulacroResult({
      totalQuestions: questions.length,
      correctAnswers: correct,
      incorrectAnswers: questions.length - correct - (questions.length - savedAnswers.size),
      unanswered: questions.length - savedAnswers.size,
      percentage: (correct / questions.length) * 100,
      score: correct * 50,
      maxScore: questions.length * 50,
      answers,
      answersByCourse,
      timeSpent: elapsedTime
    });
    
    setStatus('completed');
    setShowFinishModal(false);
    setShowResult(true);
  };

  const handleRestartSimulacro = () => {
    useAppStore.getState().resetSimulacro();
    setStep('select');
  };

  const { answeredCount, unansweredCount } = {
    answeredCount: savedAnswers.size,
    unansweredCount: (useAppStore.getState().questions.length || 60) - savedAnswers.size
  };

  if (showResult && simulacroResult) {
    if (timerRef.current) clearInterval(timerRef.current);
    
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className={clsx(
              'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4',
              simulacroResult.percentage >= 50 ? 'bg-emerald-500' : 'bg-amber-500'
            )}>
              <span className="text-3xl font-bold">{Math.round(simulacroResult.percentage)}%</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Resultados del Simulacro</h2>
            <p className="text-slate-400">
              {simulacroResult.correctAnswers} de {simulacroResult.totalQuestions} correctas
            </p>
            <p className="text-cyan-400 font-semibold mt-2">
              {simulacroResult.score} / {simulacroResult.maxScore} puntos
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 bg-slate-800 rounded-xl text-center">
              <p className="text-emerald-400 text-2xl font-bold">{simulacroResult.correctAnswers}</p>
              <p className="text-slate-400 text-sm">Correctas</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl text-center">
              <p className="text-red-400 text-2xl font-bold">{simulacroResult.incorrectAnswers}</p>
              <p className="text-slate-400 text-sm">Incorrectas</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl text-center">
              <p className="text-slate-400 text-2xl font-bold">{simulacroResult.unanswered}</p>
              <p className="text-slate-400 text-sm">Sin responder</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl text-center">
              <p className="text-cyan-400 text-2xl font-bold">{formatTime(simulacroResult.timeSpent)}</p>
              <p className="text-slate-400 text-sm">Tiempo</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-500"
          >
            Volver al inicio
          </button>

          <button
            onClick={handleRestartSimulacro}
            className="w-full py-4 mt-3 bg-slate-700 rounded-xl font-bold hover:bg-slate-600 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Repetir Simulacro
          </button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Cargando Simulacro...</p>
          <p className="text-slate-400 text-sm">{loadingStatus}</p>
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
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Simulacro</h1>
            <p className="text-slate-400">Selecciona el área y semana</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Área</label>
              <select
                value={selectedArea || ''}
                onChange={(e) => setSelectedArea(e.target.value as AreaType)}
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
                <label className="block text-sm text-slate-400 mb-2">Semana</label>
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

            <button
              onClick={startExam}
              disabled={!selectedArea}
              className="w-full py-4 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-500 disabled:opacity-50"
            >
              Iniciar Simulacro - Semana {selectedWeek}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 bg-slate-800 border-b border-slate-700 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                <span className="text-white font-bold">{progress.current}</span>
                /{progress.total}
              </span>
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-slate-700 rounded-xl">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>

            <button
              onClick={() => setShowNavigator(true)}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <span className="px-2 py-1 bg-slate-700 rounded">{currentQuestion.course}</span>
              <span className="px-2 py-1 bg-slate-700 rounded">{selectedWeek}</span>
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
                        ? 'bg-emerald-500/20 border-emerald-500' 
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    )}
                  >
                    <span className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
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
              onClick={() => isLast ? setShowFinishModal(true) : handleNext()}
              className="flex-1 py-3 bg-emerald-600 rounded-xl font-medium hover:bg-emerald-500 flex items-center justify-center gap-2"
            >
              {isLast ? 'Finalizar' : 'Siguiente'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-slate-500">
            {answeredCount} respondidas / {unansweredCount} sin responder
          </div>
        </div>
      </main>

      {showNavigator && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowNavigator(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-slate-800 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Navegador</h3>
              <button onClick={() => setShowNavigator(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {useAppStore.getState().questions.map((q, idx) => {
                const isAnswered = savedAnswers.has(q.id);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleGoToQuestion(idx)}
                    className={clsx(
                      'w-8 h-8 rounded text-xs font-medium',
                      isCurrent 
                        ? 'ring-2 ring-emerald-500 bg-emerald-500/20' 
                        : isAnswered 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-700 text-slate-400'
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showFinishModal && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Finalizar Simulacro</h3>
            {unansweredCount > 0 ? (
              <p className="text-amber-400 mb-4">
                Tienes {unansweredCount} preguntas sin responder.
              </p>
            ) : (
              <p className="text-emerald-400 mb-4">
                Has respondido todas las preguntas.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600"
              >
                Continuar
              </button>
              <button
                onClick={finishExam}
                className="flex-1 py-3 bg-emerald-600 rounded-xl font-medium hover:bg-emerald-500"
              >
                Calificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}