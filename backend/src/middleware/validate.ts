import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiResponse } from '../types/assessment.types';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        data: errors as any,
      };
      res.status(400).json(response);
      return;
    }
    req.body = result.data;
    next();
  };
}

// Validation schemas
export const createAssessmentSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title too long'),
  subject: z
    .string()
    .min(2, 'Subject must be at least 2 characters')
    .max(100, 'Subject too long'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  dueDate: z.string().refine((d) => {
    const date = new Date(d);
    return !isNaN(date.getTime()) && date > new Date();
  }, 'Due date must be a valid future date'),
  totalMarks: z
    .number({ invalid_type_error: 'Total marks must be a number' })
    .int()
    .min(1, 'Total marks must be at least 1')
    .max(1000, 'Total marks cannot exceed 1000'),
  duration: z
    .number({ invalid_type_error: 'Duration must be a number' })
    .int()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration cannot exceed 480 minutes'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' }),
  }),
  questionConfigs: z
    .array(
      z.object({
        type: z.enum([
          'multiple_choice',
          'short_answer',
          'long_answer',
          'true_false',
          'fill_in_blank',
        ]),
        count: z
          .number()
          .int()
          .min(1, 'Question count must be at least 1')
          .max(50, 'Cannot have more than 50 questions per type'),
        marks: z
          .number()
          .int()
          .min(1, 'Marks must be at least 1')
          .max(100, 'Marks cannot exceed 100 per question'),
      })
    )
    .min(1, 'At least one question type must be configured'),
  additionalInstructions: z.string().max(1000).optional(),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
