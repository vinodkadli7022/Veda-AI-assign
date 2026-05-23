import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger';
import {
  CreateAssessmentDTO,
  GeneratedPaper,
  GeneratedQuestion,
  PaperSection,
  QuestionType,
  DifficultyLevel,
} from '../types/assessment.types';
import { v4 as uuidv4 } from 'uuid';

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice Questions',
  short_answer: 'Short Answer Questions',
  true_false: 'True or False',
  fill_in_blank: 'Fill in the Blanks',
  long_answer: 'Long Answer / Essay Questions',
};

function buildPrompt(dto: CreateAssessmentDTO): string {
  const questionDetails = dto.questionConfigs
    .map(
      (q) =>
        `- ${QUESTION_TYPE_LABELS[q.type]}: ${q.count} question(s), ${q.marks} mark(s) each`
    )
    .join('\n');

  const contextSection = dto.fileContent
    ? `\n\nUse the following source material as the primary content for questions:\n---\n${dto.fileContent.slice(0, 3000)}\n---`
    : '';

  return `You are an expert educational assessment creator. Generate a complete, high-quality assessment paper in valid JSON format.

Assessment Details:
- Title: ${dto.title}
- Subject: ${dto.subject}
- Grade Level: ${dto.gradeLevel}
- Difficulty: ${dto.difficulty}
- Duration: ${dto.duration} minutes
- Total Marks: ${dto.totalMarks}
${dto.additionalInstructions ? `- Special Instructions: ${dto.additionalInstructions}` : ''}

Question Requirements:
${questionDetails}
${contextSection}

CRITICAL: Return ONLY a valid JSON object with NO markdown, NO code blocks, NO extra text. The JSON must match this exact structure:

{
  "title": "string",
  "subject": "string",
  "gradeLevel": "string",
  "duration": number,
  "totalMarks": number,
  "instructions": ["string", "string", "string"],
  "sections": [
    {
      "title": "string",
      "questionType": "multiple_choice|short_answer|long_answer|true_false|fill_in_blank",
      "sectionMarks": number,
      "questions": [
        {
          "id": "unique_id",
          "type": "multiple_choice|short_answer|long_answer|true_false|fill_in_blank",
          "question": "Full question text",
          "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
          "correctAnswer": "string",
          "marks": number,
          "difficulty": "easy|medium|hard",
          "explanation": "Brief explanation of the answer"
        }
      ]
    }
  ]
}

Rules:
1. For multiple_choice, always include exactly 4 options
2. For true_false, options should be ["True", "False"]
3. For fill_in_blank, use underscores (___) in the question text
4. Questions must match the requested difficulty level: ${dto.difficulty}
5. Ensure questions are pedagogically appropriate for ${dto.gradeLevel}
6. Each section must correspond exactly to the question types requested
7. Total marks across all sections must equal ${dto.totalMarks}
8. Make questions diverse and challenging`;
}

export class AIService {
  private genai: GoogleGenAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genai = new GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async generateAssessment(
    dto: CreateAssessmentDTO,
    onProgress?: (progress: number, message: string) => void
  ): Promise<GeneratedPaper> {
    logger.info('Starting AI assessment generation', { title: dto.title });

    onProgress?.(10, 'Preparing AI prompt...');

    const prompt = buildPrompt(dto);

    onProgress?.(20, 'Connecting to AI service...');

    let rawText = '';
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        onProgress?.(30 + attempt * 10, `Generating questions (attempt ${attempt + 1})...`);

        const response = await this.genai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 8192,
          },
        });

        rawText = response.text ?? '';
        if (rawText) break;
      } catch (error: any) {
        logger.warn(`AI generation attempt ${attempt + 1} failed:`, error.message);
        if (attempt === maxAttempts - 1) throw error;
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      }
      attempt++;
    }

    onProgress?.(70, 'Processing AI response...');

    const paper = this.parseResponse(rawText, dto);

    onProgress?.(90, 'Validating and finalizing paper...');

    logger.info('Assessment generation completed', {
      title: paper.title,
      sections: paper.sections.length,
      totalQuestions: paper.sections.reduce((s, sec) => s + sec.questions.length, 0),
    });

    return paper;
  }

  private parseResponse(rawText: string, dto: CreateAssessmentDTO): GeneratedPaper {
    // Strip markdown code blocks if present
    let cleaned = rawText.trim();
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim();
    }
    // Remove any leading/trailing non-JSON characters
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      logger.error('Failed to parse AI response as JSON:', { rawText: cleaned.slice(0, 500) });
      // Return a fallback paper
      return this.generateFallbackPaper(dto);
    }

    // Normalize and assign IDs
    const sections: PaperSection[] = (parsed.sections || []).map((sec: any) => ({
      title: sec.title || 'Section',
      questionType: sec.questionType as QuestionType,
      sectionMarks: Number(sec.sectionMarks) || 0,
      questions: (sec.questions || []).map((q: any): GeneratedQuestion => ({
        id: q.id || uuidv4(),
        type: q.type as QuestionType,
        question: q.question || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer || '',
        marks: Number(q.marks) || 1,
        difficulty: (q.difficulty as DifficultyLevel) || dto.difficulty,
        explanation: q.explanation,
      })),
    }));

    return {
      title: parsed.title || dto.title,
      subject: parsed.subject || dto.subject,
      gradeLevel: parsed.gradeLevel || dto.gradeLevel,
      duration: Number(parsed.duration) || dto.duration,
      totalMarks: Number(parsed.totalMarks) || dto.totalMarks,
      instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [
        'Read all questions carefully before answering.',
        `This paper consists of ${sections.length} section(s).`,
        'Write legibly and show all working where applicable.',
      ],
      sections,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateFallbackPaper(dto: CreateAssessmentDTO): GeneratedPaper {
    logger.warn('Using fallback paper generation');
    const sections: PaperSection[] = dto.questionConfigs.map((config) => ({
      title: QUESTION_TYPE_LABELS[config.type],
      questionType: config.type,
      sectionMarks: config.count * config.marks,
      questions: Array.from({ length: config.count }, (_, i): GeneratedQuestion => ({
        id: uuidv4(),
        type: config.type,
        question: `${dto.subject} Question ${i + 1} — Please regenerate for actual content.`,
        options: config.type === 'multiple_choice'
          ? ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4']
          : config.type === 'true_false' ? ['True', 'False'] : [],
        correctAnswer: 'See answer key',
        marks: config.marks,
        difficulty: dto.difficulty,
      })),
    }));

    return {
      title: dto.title,
      subject: dto.subject,
      gradeLevel: dto.gradeLevel,
      duration: dto.duration,
      totalMarks: dto.totalMarks,
      instructions: [
        'Read all questions carefully before answering.',
        `This paper consists of ${sections.length} section(s).`,
        'Write legibly and show all working where applicable.',
      ],
      sections,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const aiService = new AIService();
