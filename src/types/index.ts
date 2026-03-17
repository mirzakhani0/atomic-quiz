// ============================================
// TIPOS PRINCIPALES - ATOMIC QUIZ
// ============================================

export type AreaType = 'Ingenierías' | 'Sociales' | 'Biomédicas';

export type ExamMode = 'quizizz' | 'simulacro';

export type ExamStatus = 'idle' | 'loading' | 'ready' | 'in_progress' | 'completed' | 'error';

// ============================================
// CURSOS POR ÁREA
// ============================================

export const COURSES_BY_AREA: Record<AreaType, string[]> = {
  'Ingenierías': [
    'Aritmética', 'Álgebra', 'Geometría', 'Trigonometría',
    'Física', 'Química', 'Biología',
    'Psicología', 'Historia', 'Geografía',
    'Educación Cívica', 'Economía', 'Comunicación', 'Literatura',
    'Razonamiento Matemático', 'Razonamiento Verbal',
    'Inglés', 'Quechua'
  ],
  'Sociales': [
    'Matemática', 'Física', 'Química', 'Biología',
    'Psicología', 'Historia', 'Geografía',
    'Educación Cívica', 'Economía', 'Comunicación', 'Literatura',
    'Razonamiento Matemático', 'Razonamiento Verbal',
    'Inglés', 'Quechua'
  ],
  'Biomédicas': [
    'Matemática', 'Física', 'Química', 'Biología', 'Anatomía',
    'Psicología', 'Historia', 'Geografía',
    'Educación Cívica', 'Economía', 'Comunicación',
    'Razonamiento Matemático', 'Razonamiento Verbal',
    'Inglés', 'Quechua'
  ]
};

// ============================================
// DATOS DEL ESTUDIANTE
// ============================================

export interface Student {
  id: string;
  name: string;
  area: AreaType;
}

// ============================================
// PREGUNTAS
// ============================================

export interface Question {
  id: string;
  number: number;
  questionText: string;
  options: string[];
  correctAnswer: number;
  course: string;
  area: AreaType;
  justification?: string;
  imageUrl?: string;
}

// ============================================
// RESPUESTAS
// ============================================

export interface Answer {
  questionId: string;
  selectedOption: number | null;
  isCorrect: boolean;
  timeSpent: number;
}

// ============================================
// RESULTADOS
// ============================================

export interface QuizizzResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  percentage: number;
  answers: Answer[];
  wrongQuestions: Question[];
  timeSpent: number;
}

export interface SimulacroResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  percentage: number;
  score: number;
  maxScore: number;
  answers: Answer[];
  answersByCourse: Record<string, { correct: number; total: number }>;
  timeSpent: number;
}

// ============================================
// ESTADO DEL STORE
// ============================================

export interface AppStore {
  student: Student | null;
  setStudent: (student: Student) => void;
  
  selectedArea: AreaType | null;
  setSelectedArea: (area: AreaType | null) => void;
  
  selectedCourse: string | null;
  setSelectedCourse: (course: string | null) => void;
  
  questions: Question[];
  currentQuestionIndex: number;
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  
  savedAnswers: Map<string, number | null>;
  saveAnswer: (questionId: string, option: number | null) => void;
  clearAnswers: () => void;
  
  examMode: ExamMode | null;
  setExamMode: (mode: ExamMode | null) => void;
  
  status: ExamStatus;
  setStatus: (status: ExamStatus) => void;
  
  quizizzResult: QuizizzResult | null;
  simulacroResult: SimulacroResult | null;
  setQuizizzResult: (result: QuizizzResult | null) => void;
  setSimulacroResult: (result: SimulacroResult | null) => void;
  
  startTime: Date | null;
  setStartTime: (time: Date | null) => void;
  
  reset: () => void;
}

// ============================================
// ADMIN - IMPORTACIÓN
// ============================================

export interface ImportConfig {
  area: AreaType;
  course: string;
  source: 'google-sheets' | 'csv' | 'manual';
  url?: string;
  data?: Question[];
}

export interface QuestionImport {
  questionText: string;
  options: string[];
  correctAnswer: number;
  justification?: string;
  course: string;
  area: AreaType;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  course: string;
  area: AreaType;
}

// ============================================
// CONSTANTES
// ============================================

export const AREA_INFO: Record<AreaType, { description: string; color: string; icon: string }> = {
  'Ingenierías': {
    description: 'Para carreras de Ingeniería y Tecnología',
    color: 'indigo',
    icon: 'Cpu'
  },
  'Sociales': {
    description: 'Para carreras de Ciencias Sociales y Humanidades',
    color: 'emerald',
    icon: 'Users'
  },
  'Biomédicas': {
    description: 'Para carreras de Salud y Medicina',
    color: 'rose',
    icon: 'Heart'
  }
};

export const SIMULACRO_CONFIG = {
  totalQuestions: 60,
  timeMinutes: 180,
  passingPercentage: 50
};

export const QUIZIZZ_CONFIG = {
  defaultQuestions: 10,
  showFeedback: true,
  showJustification: true,
  shuffleQuestions: true,
  shuffleOptions: true
};

export const AREAS: AreaType[] = ['Ingenierías', 'Sociales', 'Biomédicas'];