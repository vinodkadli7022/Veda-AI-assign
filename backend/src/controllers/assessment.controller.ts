import { Request, Response } from 'express';
import Assessment from '../models/Assessment';
import { addAssessmentJob } from '../services/queue.service';
import { aiService } from '../services/ai.service';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { broadcastToAssessment } from '../websocket/ws.handler';
import logger from '../utils/logger';
import { ApiResponse, CreateAssessmentDTO, WebSocketMessage } from '../types/assessment.types';

// POST /api/assessments
export const createAssessment = asyncHandler(async (req: Request, res: Response) => {
  const dto: CreateAssessmentDTO = req.body;

  logger.info('Creating assessment', { title: dto.title });

  const assessment = new Assessment({
    title: dto.title,
    subject: dto.subject,
    gradeLevel: dto.gradeLevel,
    dueDate: new Date(dto.dueDate),
    totalMarks: dto.totalMarks,
    duration: dto.duration,
    difficulty: dto.difficulty,
    questionConfigs: dto.questionConfigs,
    additionalInstructions: dto.additionalInstructions,
    fileName: dto.fileName,
    fileContent: dto.fileContent,
    status: 'pending',
  });

  await assessment.save();

  // Check if Redis/queue is available, otherwise process inline
  let jobId: string | undefined;
  try {
    jobId = await addAssessmentJob(assessment._id.toString(), dto);
    await Assessment.findByIdAndUpdate(assessment._id, { jobId });
    logger.info('Assessment queued for processing', { id: assessment._id, jobId });
  } catch (queueError: any) {
    logger.warn('Queue unavailable, processing inline:', queueError.message);
    // Process directly without queue (fallback for environments without Redis)
    processInline(assessment._id.toString(), dto);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      id: assessment._id,
      status: assessment.status,
      message: 'Assessment created and queued for generation',
    },
  };

  res.status(201).json(response);
});

// Inline processing fallback (when Redis not available)
async function processInline(assessmentId: string, dto: CreateAssessmentDTO): Promise<void> {
  try {
    await Assessment.findByIdAndUpdate(assessmentId, { status: 'processing' });

    const sendProgress = (progress: number, message: string) => {
      const wsMsg: WebSocketMessage = { type: 'progress', assessmentId, progress, message };
      broadcastToAssessment(assessmentId, wsMsg);
    };

    const generatedPaper = await aiService.generateAssessment(dto, sendProgress);

    await Assessment.findByIdAndUpdate(assessmentId, {
      status: 'completed',
      generatedPaper,
    });

    broadcastToAssessment(assessmentId, {
      type: 'completed',
      assessmentId,
      progress: 100,
      message: 'Assessment generated successfully!',
      data: generatedPaper,
    });
  } catch (error: any) {
    logger.error('Inline processing failed:', error.message);
    await Assessment.findByIdAndUpdate(assessmentId, {
      status: 'failed',
      errorMessage: error.message,
    });
    broadcastToAssessment(assessmentId, {
      type: 'failed',
      assessmentId,
      message: error.message,
    });
  }
}

// GET /api/assessments
export const listAssessments = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  const [assessments, total] = await Promise.all([
    Assessment.find({}, '-fileContent')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assessment.countDocuments(),
  ]);

  res.json({
    success: true,
    data: assessments,
    total,
    page,
    limit,
  });
});

// GET /api/assessments/:id
export const getAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assessment = await Assessment.findById(id, '-fileContent').lean();

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const response: ApiResponse = { success: true, data: assessment };
  res.json(response);
});

// GET /api/assessments/:id/status
export const getAssessmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assessment = await Assessment.findById(id, 'status errorMessage jobId').lean();

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      status: assessment.status,
      errorMessage: assessment.errorMessage,
    },
  };
  res.json(response);
});

// DELETE /api/assessments/:id
export const deleteAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assessment = await Assessment.findByIdAndDelete(id);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const response: ApiResponse = { success: true, message: 'Assessment deleted successfully' };
  res.json(response);
});

// POST /api/assessments/:id/regenerate
export const regenerateAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assessment = await Assessment.findById(id);

  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  if (assessment.status === 'processing') {
    throw new AppError('Assessment is already being processed', 400);
  }

  await Assessment.findByIdAndUpdate(id, {
    status: 'pending',
    generatedPaper: undefined,
    errorMessage: undefined,
  });

  const dto: CreateAssessmentDTO = {
    title: assessment.title,
    subject: assessment.subject,
    gradeLevel: assessment.gradeLevel,
    dueDate: assessment.dueDate.toISOString(),
    totalMarks: assessment.totalMarks,
    duration: assessment.duration,
    difficulty: assessment.difficulty,
    questionConfigs: assessment.questionConfigs,
    additionalInstructions: assessment.additionalInstructions,
    fileContent: assessment.fileContent,
    fileName: assessment.fileName,
  };

  try {
    await addAssessmentJob(id, dto);
  } catch {
    processInline(id, dto);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Regeneration started',
    data: { id },
  };
  res.json(response);
});
