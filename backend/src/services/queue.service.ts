import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { getRedisClient } from '../config/redis';
import Assessment from '../models/Assessment';
import { aiService } from './ai.service';
import { broadcastToAssessment } from '../websocket/ws.handler';
import logger from '../utils/logger';
import { CreateAssessmentDTO, WebSocketMessage } from '../types/assessment.types';

export const QUEUE_NAME = 'assessment-generation';

let assessmentQueue: Queue | null = null;
let assessmentWorker: Worker | null = null;
let queueEvents: QueueEvents | null = null;

export interface AssessmentJobData {
  assessmentId: string;
  dto: CreateAssessmentDTO;
}

export function getQueue(): Queue {
  if (!assessmentQueue) {
    const connection = getRedisClient();
    assessmentQueue = new Queue<AssessmentJobData>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
    logger.info('Assessment queue initialized');
  }
  return assessmentQueue;
}

export async function addAssessmentJob(
  assessmentId: string,
  dto: CreateAssessmentDTO
): Promise<string> {
  const queue = getQueue();
  const job = await queue.add(
    'generate',
    { assessmentId, dto },
    { jobId: `assessment-${assessmentId}` }
  );
  logger.info('Assessment job added to queue', { jobId: job.id, assessmentId });
  return job.id!;
}

export function startWorker(): void {
  if (assessmentWorker) return;

  const connection = getRedisClient();

  assessmentWorker = new Worker<AssessmentJobData>(
    QUEUE_NAME,
    async (job: Job<AssessmentJobData>) => {
      const { assessmentId, dto } = job.data;
      logger.info('Processing assessment job', { jobId: job.id, assessmentId });

      try {
        // Mark as processing
        await Assessment.findByIdAndUpdate(assessmentId, { status: 'processing' });

        const sendProgress = (progress: number, message: string) => {
          job.updateProgress(progress);
          const wsMsg: WebSocketMessage = {
            type: 'progress',
            assessmentId,
            progress,
            message,
          };
          broadcastToAssessment(assessmentId, wsMsg);
        };

        const generatedPaper = await aiService.generateAssessment(dto, sendProgress);

        await Assessment.findByIdAndUpdate(assessmentId, {
          status: 'completed',
          generatedPaper,
        });

        const completedMsg: WebSocketMessage = {
          type: 'completed',
          assessmentId,
          progress: 100,
          message: 'Assessment generated successfully!',
          data: generatedPaper,
        };
        broadcastToAssessment(assessmentId, completedMsg);

        logger.info('Assessment job completed', { assessmentId });
      } catch (error: any) {
        logger.error('Assessment job failed', { assessmentId, error: error.message });

        await Assessment.findByIdAndUpdate(assessmentId, {
          status: 'failed',
          errorMessage: error.message,
        });

        const failedMsg: WebSocketMessage = {
          type: 'failed',
          assessmentId,
          message: error.message || 'Generation failed. Please try again.',
        };
        broadcastToAssessment(assessmentId, failedMsg);

        throw error;
      }
    },
    {
      connection,
      concurrency: 3,
      limiter: { max: 10, duration: 60000 }, // 10 jobs per minute
    }
  );

  assessmentWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  assessmentWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err.message);
  });

  assessmentWorker.on('error', (err) => {
    logger.error('Worker error:', err.message);
  });

  logger.info('Assessment worker started');
}

export async function shutdownQueue(): Promise<void> {
  if (assessmentWorker) {
    await assessmentWorker.close();
    assessmentWorker = null;
  }
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
  if (assessmentQueue) {
    await assessmentQueue.close();
    assessmentQueue = null;
  }
  logger.info('Queue shutdown complete');
}
