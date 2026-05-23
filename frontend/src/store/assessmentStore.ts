import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Assessment, CreateAssessmentPayload, GeneratedPaper } from '@/types';
import { assessmentApi } from '@/lib/api';

interface AssessmentStore {
  // State
  currentAssessment: Assessment | null;
  assessments: Assessment[];
  isCreating: boolean;
  isGenerating: boolean;
  generationProgress: number;
  generationMessage: string;
  error: string | null;

  // Form draft (persisted)
  formDraft: Partial<CreateAssessmentPayload> | null;

  // Actions
  createAssessment: (payload: CreateAssessmentPayload) => Promise<string>;
  fetchAssessment: (id: string) => Promise<Assessment>;
  fetchAssessments: () => Promise<void>;
  setGenerationProgress: (progress: number, message: string) => void;
  setGenerationComplete: (paper: GeneratedPaper) => void;
  setGenerationFailed: (error: string) => void;
  setIsGenerating: (v: boolean) => void;
  clearError: () => void;
  saveFormDraft: (draft: Partial<CreateAssessmentPayload>) => void;
  clearFormDraft: () => void;
  regenerateAssessment: (id: string) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
}

export const useAssessmentStore = create<AssessmentStore>()(
  devtools(
    persist(
      (set, get) => ({
        currentAssessment: null,
        assessments: [],
        isCreating: false,
        isGenerating: false,
        generationProgress: 0,
        generationMessage: '',
        error: null,
        formDraft: null,

        createAssessment: async (payload) => {
          set({ isCreating: true, error: null });
          try {
            const result = await assessmentApi.create(payload);
            set({ isCreating: false, isGenerating: true, generationProgress: 0 });
            return result.id;
          } catch (error: any) {
            set({ isCreating: false, error: error.message });
            throw error;
          }
        },

        fetchAssessment: async (id) => {
          const assessment = await assessmentApi.getById(id);
          set({ currentAssessment: assessment });
          return assessment;
        },

        fetchAssessments: async () => {
          const { data } = await assessmentApi.list();
          set({ assessments: data });
        },

        setGenerationProgress: (progress, message) => {
          set({ generationProgress: progress, generationMessage: message });
        },

        setGenerationComplete: (paper) => {
          set((state) => ({
            isGenerating: false,
            generationProgress: 100,
            generationMessage: 'Done!',
            currentAssessment: state.currentAssessment
              ? { ...state.currentAssessment, status: 'completed', generatedPaper: paper }
              : null,
          }));
        },

        setGenerationFailed: (error) => {
          set({
            isGenerating: false,
            error,
            generationMessage: '',
          });
        },

        setIsGenerating: (v) => set({ isGenerating: v }),

        clearError: () => set({ error: null }),

        saveFormDraft: (draft) => set({ formDraft: draft }),

        clearFormDraft: () => set({ formDraft: null }),

        regenerateAssessment: async (id) => {
          set({ isGenerating: true, error: null, generationProgress: 0 });
          await assessmentApi.regenerate(id);
        },

        deleteAssessment: async (id) => {
          await assessmentApi.delete(id);
          set((state) => ({
            assessments: state.assessments.filter((a) => a._id !== id),
          }));
        },
      }),
      {
        name: 'vedaai-assessment-store',
        partialize: (state) => ({ formDraft: state.formDraft }),
      }
    ),
    { name: 'AssessmentStore' }
  )
);
