import { Router } from 'express';
import {
  createAssessment,
  listAssessments,
  getAssessment,
  getAssessmentStatus,
  deleteAssessment,
  regenerateAssessment,
} from '../controllers/assessment.controller';
import { validate, createAssessmentSchema } from '../middleware/validate';

const router = Router();

// POST /api/assessments - Create a new assessment and queue generation
router.post('/', validate(createAssessmentSchema), createAssessment);

// GET /api/assessments - List all assessments (paginated)
router.get('/', listAssessments);

// GET /api/assessments/:id - Get a single assessment with generated paper
router.get('/:id', getAssessment);

// GET /api/assessments/:id/status - Poll generation status
router.get('/:id/status', getAssessmentStatus);

// POST /api/assessments/:id/regenerate - Regenerate a paper
router.post('/:id/regenerate', regenerateAssessment);

// DELETE /api/assessments/:id - Delete an assessment
router.delete('/:id', deleteAssessment);

export default router;
