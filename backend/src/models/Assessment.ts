import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  QuestionType,
  DifficultyLevel,
  AssessmentStatus,
  QuestionConfig,
  GeneratedPaper,
} from '../types/assessment.types';

export interface IAssessment extends Document {
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
  fileContent?: string;
  status: AssessmentStatus;
  generatedPaper?: GeneratedPaper;
  errorMessage?: string;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionConfigSchema = new Schema<QuestionConfig>(
  {
    type: {
      type: String,
      enum: ['multiple_choice', 'short_answer', 'long_answer', 'true_false', 'fill_in_blank'],
      required: true,
    },
    count: { type: Number, required: true, min: 1, max: 50 },
    marks: { type: Number, required: true, min: 1, max: 100 },
  },
  { _id: false }
);

const GeneratedQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['multiple_choice', 'short_answer', 'long_answer', 'true_false', 'fill_in_blank'],
      required: true,
    },
    question: { type: String, required: true },
    options: [String],
    correctAnswer: { type: String, required: true },
    marks: { type: Number, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    explanation: String,
  },
  { _id: false }
);

const PaperSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    questionType: { type: String, required: true },
    questions: [GeneratedQuestionSchema],
    sectionMarks: { type: Number, required: true },
  },
  { _id: false }
);

const GeneratedPaperSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    gradeLevel: { type: String, required: true },
    duration: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    instructions: [String],
    sections: [PaperSectionSchema],
    generatedAt: { type: String, required: true },
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subject: { type: String, required: true, trim: true, maxlength: 100 },
    gradeLevel: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true, min: 1 },
    duration: { type: Number, required: true, min: 5 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    questionConfigs: {
      type: [QuestionConfigSchema],
      required: true,
      validate: {
        validator: (configs: QuestionConfig[]) => configs.length > 0,
        message: 'At least one question configuration is required',
      },
    },
    additionalInstructions: { type: String, maxlength: 1000 },
    fileName: String,
    fileContent: String,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    generatedPaper: GeneratedPaperSchema,
    errorMessage: String,
    jobId: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
AssessmentSchema.index({ status: 1, createdAt: -1 });
AssessmentSchema.index({ createdAt: -1 });

// Virtual for formatted status
AssessmentSchema.virtual('isCompleted').get(function (this: IAssessment) {
  return this.status === 'completed';
});

const Assessment: Model<IAssessment> = mongoose.model<IAssessment>(
  'Assessment',
  AssessmentSchema
);

export default Assessment;
