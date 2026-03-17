import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore, useCurrentQuestion, useProgress, useIsLastQuestion, useIsFirstQuestion, useSavedAnswer } from '../hooks/useAppStore';
import { AREAS, COURSES_BY_AREA, QUIZIZZ_CONFIG, AreaType } from '../types';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, BookOpen, RotateCcw, Home, Lightbulb } from 'lucide-react';
import clsx from 'clsx';

const MOCK_QUESTIONS = [
  {
    id: '1',
    number: 1,
    questionText: '¿Cuánto es 15 + 27?',
    options: ['40', '42', '44', '46', '48'],
    correctAnswer: 1,
    course: 'Aritmética',
    area: 'Ingenierías' as AreaType,
    justification: '15 + 27 = 42. Se suman las unidades: 5+7=12, se lleva 1. Luego 1+2+1=4.'
  },
  {
    id: '2',
    number: 2,
    questionText: '¿Cuál es el resultado de 8 × 7?',
    options: ['54', '56', '58', '60', '62'],
    correctAnswer: 1,
    course: 'Aritmética',
    area: 'Ingenierías' as AreaType,
    justification: '8 × 7 = 56. La tabla de multiplicar del 8: 8×7=56.'
  },
  {
    id: '3',
    number: 3,
    questionText: '¿Cuál es la capital del Perú?',
    options: ['Arequipa', 'Cusco', 'Lima', 'Trujillo', 'Iquitos'],
    correctAnswer: 2,
    course: 'Geografía',
    area: 'Ingenierías' as AreaType,
    justification: 'Lima es la capital del Perú desde 1535, fundada por Francisco Pizarro.'
  },
  {
    id: '4',
    number: 4,
    questionText: '¿Qué gas constituye aproximadamente el 21% de la atmósfera terrestre?',
    options: ['Nitrógeno', 'Oxígeno', 'Argón', 'Dióxido de carbono', 'Hidrógeno'],
    correctAnswer: 1,
    course: 'Química',
    area: 'Ingenierías' as AreaType,
    justification: 'El oxígeno constituye aproximadamente el 21% del aire que respiramos.'
  },
  {
    id: '5',
    number: 5,
    questionText: '¿En qué año terminó la Segunda Guerra Mundial?',
    options: ['1943', '1944', '1945', '1946', '1947'],
    correctAnswer: 2,
    course: 'Historia',
    area: 'Ingenierías' as AreaType,
    justification: 'La Segunda Guerra Mundial terminó en 1945 con la rendición de Japón.'
  },
  {
    id: '6',
    number: 6,
    questionText: '¿Cuál es el órgano más grande del cuerpo humano?',
    options: ['Corazón', 'Hígado', 'Piel', 'Pulmón', 'Cerebro'],
    correctAnswer: 2,
    course: 'Biología',
    area: 'Ingenierías' as AreaType,
    justification: 'La piel es el órgano más grande, cubre aproximadamente 2 metros cuadrados.'
  },
  {
    id: '7',
    number: 7,
    questionText: '¿Qué representa la fórmula química H2O?',
    options: ['Agua', 'Oxígeno', 'Hidrógeno', 'Dióxido de carbono', 'Alcohol'],
    correctAnswer: 0,
    course: 'Química',
    area: 'Ingenierías' as AreaType,
    justification: 'H2O es la fórmula del agua, compuesta por 2 átomos de hidrógeno y 1 de oxígeno.'
  },
  {
    id: '8',
    number: 8,
    questionText: '¿Cuál es el río más largo del mundo?',
    options: ['Amazonas', 'Nilo', 'Misisipi', 'Yangtsé', 'Mekong'],
    correctAnswer: 1,
    course: 'Geografía',
    area: 'Ingenierías' as AreaType,
    justification: 'El río Nilo tiene aproximadamente 6,650 km, siendo el más largo del mundo.'
  },
  {
    id: '9',
    number: 9,
    questionText: '¿Quién escribió "La Odisea"?',
    options: ['Platón', 'Homero', 'Aristóteles', 'Sófocles', 'Eurípides'],
    correctAnswer: 1,
    course: 'Literatura',
    area: 'Ingenierías' as AreaType,
    justification: 'Homero fue el autor de "La Odisea", poema épico griego del siglo VIII a.C.'
  },
  {
    id: '10',
    number: 10,
    questionText: '¿Cuál es la velocidad de la luz en el vacío?',
    options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '200,000 km/s', '400,000 km/s'],
    correctAnswer: 0,
    course: 'Física',
    area: 'Ingenierías' as AreaType,
    justification: 'La velocidad de la luz en el vacío es aproximadamente 300,000 km/s.'
  }
];

export function QuizizzMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const areaParam = searchParams.get('area');
  
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

  const [showFeedback, setShowFeedback] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [step, setStep] = useState<'select' | 'quiz'>('select');

  const selectedAnswer = useSavedAnswer(currentQuestion?.id || '');

  useEffect(() => {
    if (areaParam && AREAS.includes(areaParam as AreaType)) {
      setSelectedArea(areaParam as AreaType);
    }
  }, [areaParam, setSelectedArea]);

  const handleStartQuizizz = () => {
    if (!selectedArea || !selectedCourse) return;
    const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setStep('quiz');
  };

  const handleSelectAnswer = (index: number) => {
    if (!currentQuestion) return;
    saveAnswer(currentQuestion.id, index);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (isLast) {
      calculateResults();
      setShowResult(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    setShowFeedback(false);
    if (!isFirst) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = () => {
    const questions = MOCK_QUESTIONS;
    let correct = 0;
    const wrongQuestions: typeof questions = [];
    const answers: { questionId: string; selectedOption: number | null; isCorrect: boolean; timeSpent: number }[] = [];

    questions.forEach(q => {
      const selected = savedAnswers.get(q.id) ?? null;
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correct++;
      else if (selected !== null) wrongQuestions.push(q);
      answers.push({ questionId: q.id, selectedOption: selected, isCorrect, timeSpent: 0 });
    });

    setQuizizzResult({
      totalQuestions: questions.length,
      correctAnswers: correct,
      incorrectAnswers: questions.length - correct - (questions.length - savedAnswers.size),
      unanswered: questions.length - savedAnswers.size,
      percentage: (correct / questions.length) * 100,
      answers,
      wrongQuestions,
      timeSpent: 0
    });
  };

  const handleRetryWrong = () => {
    if (!quizizzResult?.wrongQuestions.length) return;
    setQuestions([...quizizzResult.wrongQuestions]);
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setStep('quiz');
  };

  if (showResult && quizizzResult) {
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
            <h2 className="text-2xl font-bold mb-2">Resultados del Quizizz</h2>
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

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-slate-700 rounded-xl font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Inicio
            </button>
            {quizizzResult.wrongQuestions.length > 0 && (
              <button
                onClick={handleRetryWrong}
                className="flex-1 py-3 bg-violet-600 rounded-xl font-medium hover:bg-violet-500 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Repasar errores
              </button>
            )}
          </div>
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
            <h1 className="text-2xl font-bold mb-2">Quizizz - Modo Estudio</h1>
            <p className="text-slate-400">Selecciona área y curso para comenzar</p>
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
              className="w-full py-4 bg-violet-600 rounded-xl font-bold hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Comenzar Quizizz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
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

        {/* Question Card */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <span className="px-2 py-1 bg-slate-700 rounded">{currentQuestion.course}</span>
          </div>
          
          <h2 className="text-xl font-semibold mb-6">{currentQuestion.questionText}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === currentQuestion.correctAnswer;
              
              let bgClass = 'bg-slate-700 hover:bg-slate-600';
              let borderClass = 'border-slate-600';
              
              if (showFeedback) {
                if (isCorrectOption) {
                  bgClass = 'bg-emerald-500/20 border-emerald-500';
                } else if (isSelected && !isCorrect) {
                  bgClass = 'bg-red-500/20 border-red-500';
                }
              } else if (isSelected) {
                bgClass = 'bg-violet-500/20 border-violet-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !showFeedback && handleSelectAnswer(idx)}
                  disabled={showFeedback}
                  className={clsx(
                    'w-full p-4 rounded-xl text-left transition-all border-2 flex items-center gap-3',
                    bgClass, borderClass
                  )}
                >
                  <span className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isSelected ? 'bg-violet-500 text-white' : 'bg-slate-600 text-slate-300'
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                  {showFeedback && isCorrectOption && (
                    <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
                  )}
                  {showFeedback && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {showFeedback && currentQuestion.justification && (
            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Lightbulb className="w-5 h-5" />
                <span className="font-semibold">Explicación</span>
              </div>
              <p className="text-slate-300">{currentQuestion.justification}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
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
            onClick={handleNext}
            className="flex-1 py-3 bg-violet-600 rounded-xl font-medium hover:bg-violet-500 flex items-center justify-center gap-2"
          >
            {isLast ? 'Finalizar' : 'Siguiente'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}