export type QuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'long_answer'
  | 'true_false'
  | 'fill_in_blank';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type AssessmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QuestionConfig {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface CreateAssessmentPayload {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  duration: number;
  difficulty: DifficultyLevel;
  questionConfigs: QuestionConfig[];
  additionalInstructions?: string;
  fileContent?: string;
  fileName?: string;
}

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  marks: number;
  difficulty: DifficultyLevel;
  explanation?: string;
}

export interface PaperSection {
  title: string;
  questionType: QuestionType;
  questions: GeneratedQuestion[];
  sectionMarks: number;
}

export interface GeneratedPaper {
  title: string;
  subject: string;
  gradeLevel: string;
  duration: number;
  totalMarks: number;
  instructions: string[];
  sections: PaperSection[];
  generatedAt: string;
}

export interface Assessment {
  _id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  duration: number;
  difficulty: DifficultyLevel;
  questionConfigs: QuestionConfig[];
  additionalInstructions?: string;
  fileName?: string;
  status: AssessmentStatus;
  generatedPaper?: GeneratedPaper;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebSocketMessage {
  type: 'progress' | 'completed' | 'failed' | 'connected';
  assessmentId: string;
  progress?: number;
  message?: string;
  data?: GeneratedPaper;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  true_false: 'True / False',
  fill_in_blank: 'Fill in the Blank',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const GRADE_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12', 'Undergraduate', 'Postgraduate',
];
