export type QuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'long_answer'
  | 'true_false'
  | 'fill_in_blank';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type AssessmentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface QuestionConfig {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface CreateAssessmentDTO {
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  totalMarks: number;
  duration: number; // minutes
  difficulty: DifficultyLevel;
  questionConfigs: QuestionConfig[];
  additionalInstructions?: string;
  fileContent?: string; // extracted text from PDF
  fileName?: string;
}

export interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for MCQ
  correctAnswer: string;
  marks: number;
  difficulty: DifficultyLevel;
  explanation?: string;
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

export interface PaperSection {
  title: string;
  questionType: QuestionType;
  questions: GeneratedQuestion[];
  sectionMarks: number;
}

export interface AssessmentDocument {
  _id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  dueDate: Date;
  totalMarks: number;
  duration: number;
  difficulty: DifficultyLevel;
  questionConfigs: QuestionConfig[];
  additionalInstructions?: string;
  fileName?: string;
  status: AssessmentStatus;
  generatedPaper?: GeneratedPaper;
  errorMessage?: string;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}
