import { Request, Response } from 'express';
import { generateQuiz, validateMissionAndCalculateXP } from '../services/geminiService';
import { z } from 'zod';

// Zod schemas for validation
const QuizSchema = z.object({
  mission_log: z.string().min(10, "Mission log must be at least 10 characters long"),
  difficulty: z.string().optional().default('medium'),
});

const ValidationSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL"),
});

export const handleGenerateQuiz = async (req: Request, res: Response) => {
  try {
    const { mission_log, difficulty } = QuizSchema.parse(req.body);
    const userId = (req as any).user?.id || 'unknown';
    
    console.log(`[QUIZ GENERATION] User: ${userId} | Mission Log Length: ${mission_log.length} | Difficulty: ${difficulty}`);
    
    const quiz = await generateQuiz(mission_log, difficulty);
    
    console.log(`[QUIZ GENERATION] Success. Generated ${Array.isArray(quiz) ? quiz.length : 0} questions.`);
    res.json({ success: true, quiz });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn(`[QUIZ GENERATION] Validation Error: ${JSON.stringify(error.errors)}`);
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      console.error(`[QUIZ GENERATION] Failed:`, error);
      res.status(500).json({ success: false, message: "Failed to generate quiz" });
    }
  }
};

export const handleValidateMission = async (req: Request, res: Response) => {
  try {
    const { title, description, imageUrl } = ValidationSchema.parse(req.body);
    const userId = (req as any).user?.id || 'unknown';

    console.log(`[MISSION VALIDATION] User: ${userId} | Title: "${title}" | Image: ${imageUrl.substring(0, 30)}...`);

    // Check if image URL is valid/accessible is handled by Zod primarily, but we rely on fetch inside service
    const validationResult = await validateMissionAndCalculateXP(title, description || "", imageUrl);
    
    console.log(`[MISSION VALIDATION] Result: Valid=${validationResult.isValid} | XP=${validationResult.xp_awarded} | Confidence=${validationResult.confidence}`);
    
    res.json({ success: true, result: validationResult });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn(`[MISSION VALIDATION] Validation Error: ${JSON.stringify(error.errors)}`);
      res.status(400).json({ success: false, errors: error.errors });
    } else {
      console.error(`[MISSION VALIDATION] Failed:`, error);
      res.status(500).json({ success: false, message: "Failed to validate mission" });
    }
  }
};
