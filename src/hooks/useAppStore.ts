import { create } from 'zustand';
import type { AppStore, Student, Question, ExamMode, QuizizzResult, SimulacroResult, ExamStatus } from '../types';

export const useAppStore = create<AppStore>((set, get) => ({
  student: null,
  setStudent: (student: Student) => set({ student }),
  
  selectedArea: null,
  setSelectedArea: (area) => set({ selectedArea: area }),
  
  selectedCourse: null,
  setSelectedCourse: (course) => set({ selectedCourse: course }),
  
  questions: [],
  currentQuestionIndex: 0,
  setQuestions: (questions: Question[]) => set({ questions, currentQuestionIndex: 0 }),
  setCurrentQuestionIndex: (index: number) => set({ currentQuestionIndex: index }),
  
  savedAnswers: new Map(),
  saveAnswer: (questionId: string, option: number | null) => {
    const { savedAnswers } = get();
    const newAnswers = new Map(savedAnswers);
    newAnswers.set(questionId, option);
    set({ savedAnswers: newAnswers });
  },
  clearAnswers: () => set({ savedAnswers: new Map() }),
  
  examMode: null,
  setExamMode: (mode: ExamMode | null) => set({ examMode: mode }),
  
  status: 'idle',
  setStatus: (status: ExamStatus) => set({ status }),
  
  quizizzResult: null,
  simulacroResult: null,
  setQuizizzResult: (result: QuizizzResult | null) => set({ quizizzResult: result }),
  setSimulacroResult: (result: SimulacroResult | null) => set({ simulacroResult: result }),
  
  startTime: null,
  setStartTime: (time: Date | null) => set({ startTime: time }),
  
  reset: () => set({
    student: null,
    selectedArea: null,
    selectedCourse: null,
    questions: [],
    currentQuestionIndex: 0,
    savedAnswers: new Map(),
    examMode: null,
    status: 'idle',
    quizizzResult: null,
    simulacroResult: null,
    startTime: null
  }),

  resetQuizizz: () => set({
    questions: [],
    currentQuestionIndex: 0,
    savedAnswers: new Map(),
    quizizzResult: null
  }),

  resetSimulacro: () => set({
    questions: [],
    currentQuestionIndex: 0,
    savedAnswers: new Map(),
    simulacroResult: null
  })
}));

export const useCurrentQuestion = () => {
  const questions = useAppStore(state => state.questions);
  const index = useAppStore(state => state.currentQuestionIndex);
  return questions[index] || null;
};

export const useProgress = () => {
  const index = useAppStore(state => state.currentQuestionIndex);
  const total = useAppStore(state => state.questions.length);
  const savedAnswers = useAppStore(state => state.savedAnswers);
  return {
    current: index + 1,
    total,
    answered: savedAnswers.size,
    percentage: total > 0 ? ((index + 1) / total) * 100 : 0
  };
};

export const useIsLastQuestion = () => {
  const index = useAppStore(state => state.currentQuestionIndex);
  const total = useAppStore(state => state.questions.length);
  return index === total - 1;
};

export const useIsFirstQuestion = () => {
  const index = useAppStore(state => state.currentQuestionIndex);
  return index === 0;
};

export const useSavedAnswer = (questionId: string) => {
  const savedAnswers = useAppStore(state => state.savedAnswers);
  return savedAnswers.get(questionId) ?? null;
};