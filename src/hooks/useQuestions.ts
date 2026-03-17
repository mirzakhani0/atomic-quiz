import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question, AreaType } from '../types';

interface QuestionsStore {
  questions: Question[];
  addQuestions: (newQuestions: Question[]) => void;
  getQuestionsByAreaAndCourse: (area: AreaType, course?: string) => Question[];
  getQuestionsByArea: (area: AreaType) => Question[];
  getAllCourses: (area: AreaType) => string[];
  clearQuestions: () => void;
}

export const useQuestionsStore = create<QuestionsStore>()(
  persist(
    (set, get) => ({
      questions: [],
      
      addQuestions: (newQuestions: Question[]) => {
        set((state) => {
          const existingIds = new Set(state.questions.map(q => q.id));
          const uniqueNew = newQuestions.filter(q => !existingIds.has(q.id));
          return { questions: [...state.questions, ...uniqueNew] };
        });
      },
      
      getQuestionsByAreaAndCourse: (area: AreaType, course?: string) => {
        const { questions } = get();
        return questions.filter(q => 
          q.area === area && 
          (!course || q.course.toLowerCase() === course.toLowerCase())
        );
      },
      
      getQuestionsByArea: (area: AreaType) => {
        const { questions } = get();
        return questions.filter(q => q.area === area);
      },
      
      getAllCourses: (area: AreaType) => {
        const { questions } = get();
        const courses = new Set(
          questions.filter(q => q.area === area).map(q => q.course)
        );
        return Array.from(courses).sort();
      },
      
      clearQuestions: () => set({ questions: [] })
    }),
    {
      name: 'atomic-quiz-questions'
    }
  )
);