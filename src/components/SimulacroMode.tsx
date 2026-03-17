import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useCurrentQuestion, useProgress, useIsLastQuestion, useIsFirstQuestion, useSavedAnswer } from '../hooks/useAppStore';
import { AREAS, COURSES_BY_AREA, SIMULACRO_CONFIG, AreaType } from '../types';
import { ArrowLeft, ArrowRight, Clock, Grid3X3, FileCheck, AlertTriangle, X, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const SIMULACRO_QUESTIONS = Array.from({ length: 60 }, (_, i) => ({
  id: `q${i + 1}`,
  number: i + 1,
  questionText: `Pregunta de simulacro ${i + 1}. ¿Cuál es la respuesta correcta?`,
  options: ['Opción A', 'Opción B', 'Opción C', 'Opción D', 'Opción E'],
  correctAnswer: Math.floor(Math.random() * 5),
  course: ['Aritmética', 'Álgebra', 'Física', 'Química', 'Biología', 'Historia', 'Geografía'][i % 7],
  area: 'Ingenierías' as AreaType
}));

export function SimulacroMode() {
  const navigate = useNavigate();
  const {
    selectedArea, setSelectedArea,
    setQuestions, currentQuestionIndex, setCurrentQuestionIndex,
    saveAnswer, savedAnswers,
    setSimulacroResult, simulacroResult,
    startTime, setStartTime,
    status, setStatus
  } = useAppStore();

  const currentQuestion = useCurrentQuestion();
  const progress = useProgress();
  const isLast = useIsLastQuestion();
  const isFirst = useIsFirstQuestion();
  const selectedAnswer = useSavedAnswer(currentQuestion?.id || '');

  const [showNavigator, setShowNavigator] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [step, setStep] = useState<'select' | 'exam'>('select');
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const startExam = () => {
    if (!selectedArea) return;
    const shuffled = [...SIMULACRO_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setStartTime(new Date());
    setStatus('in_progress');
    setStep('exam');
  };

  useEffect(() => {
    if (status === 'in_progress') {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

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
    const questions = SIMULACRO_QUESTIONS;
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

  const { answeredCount, unansweredCount, unansweredIndexes } = useMemo(() => {
    const answered = savedAnswers.size;
    const unanswered = SIMULACRO_QUESTIONS.length - answered;
    const indexes: number[] = [];
    SIMULACRO_QUESTIONS.forEach((q, idx) => {
      if (!savedAnswers.has(q.id)) indexes.push(idx);
    });
    return { answeredCount: answered, unansweredCount: unanswered, unansweredIndexes: indexes };
  }, [savedAnswers]);

  if (showResult && simulacroResult) {
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

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Resultados por curso</h3>
            <div className="space-y-2">
              {Object.entries(simulacroResult.answersByCourse).map(([course, data]) => (
                <div key={course} className="flex justify-between p-3 bg-slate-800 rounded-lg">
                  <span>{course}</span>
                  <span className={clsx(data.correct / data.total >= 0.5 ? 'text-emerald-400' : 'text-amber-400')}>
                    {data.correct}/{data.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-500 transition-colors"
          >
            Volver al inicio
          </button>
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
            <h1 className="text-2xl font-bold mb-2">Simulacro - Examen Completo</h1>
            <p className="text-slate-400">60 preguntas en 180 minutos</p>
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

            <button
              onClick={startExam}
              disabled={!selectedArea}
              className="w-full py-4 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar Simulacro
            </button>

            <div className="p-4 bg-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Importante</span>
              </div>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• 60 preguntas de opción múltiple</li>
                <li>• 180 minutos de tiempo</li>
                <li>• 50 puntos por pregunta correcta</li>
                <li>• No puedes volver atrás</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
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

      {/* Question */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <span className="px-2 py-1 bg-slate-700 rounded">{currentQuestion.course}</span>
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
                    {isSelected && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={isFirst}
              className="flex-1 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {/* Navigator Modal */}
      {showNavigator && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowNavigator(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-slate-800 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Navegador de preguntas</h3>
              <button onClick={() => setShowNavigator(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {SIMULACRO_QUESTIONS.map((q, idx) => {
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

      {/* Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Finalizar Simulacro</h3>
            {unansweredCount > 0 ? (
              <p className="text-amber-400 mb-4">
                Tienes {unansweredCount} preguntas sin responder. Se marcarán como incorrectas.
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