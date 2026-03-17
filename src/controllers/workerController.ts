import { Request, Response } from 'express';
import { generateQuiz, validateMissionAndCalculateXP } from '../services/geminiService';
import { getSupabaseClient } from '../services/supabase';
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
  directive_id: z.string().optional(),
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
    const { title, description, imageUrl, directive_id } = ValidationSchema.parse(req.body);
    const userId = (req as any).user?.id || 'unknown';
    const authHeader = req.headers.authorization;

    console.log(`[MISSION VALIDATION] User: ${userId} | Title: "${title}" | Image: ${imageUrl.substring(0, 30)}...`);

    // --- ASYNC MODE (BACKGROUND JOB) ---
    // Dipicu jika Frontend mengirimkan ID Direktif dan Token Auth
    if (directive_id && authHeader) {
      console.log(`[ASYNC MODE] Directive ID: ${directive_id}. Queuing background job.`);
      
      // Kirim respons 202 Accepted ke Frontend SECARA CEPAT (Fire and Forget)
      res.status(202).json({ 
        success: true, 
        message: "Validation request queued. Result will be updated automatically." 
      });

      // Eksekusi Background Job
      (async () => {
        try {
          console.log(`[BACKGROUND JOB] Starting validation for ${directive_id}...`);
          
          // 1. Panggil Gemini AI
          const validationResult = await validateMissionAndCalculateXP(title, description || "", imageUrl);
          console.log(`[BACKGROUND JOB] Validation Complete. Valid=${validationResult.isValid} | XP=${validationResult.xp_awarded}`);

          const supabase = getSupabaseClient(authHeader);
          
          if (validationResult.isValid) {
            
            // LANGKAH 1: Update status Misi di tabel 'directives'
            const { error: dirError } = await supabase
              .from('directives')
              .update({
                status: 'DONE', 
                evidence_link: imageUrl
              })
              .eq('id', directive_id)
              .eq('user_id', userId); 

            if (dirError) console.error(`[BACKGROUND JOB] Directives Update Failed:`, dirError);
            else console.log(`[BACKGROUND JOB] Directives Updated Successfully.`);

            // LANGKAH 2: Masukkan log AI ke tabel 'mission_journals'
            const { error: journalError } = await supabase
              .from('mission_journals')
              .insert([{
                directive_id: directive_id,
                user_id: userId,
                journal_type: 'IMAGE_VALIDATION',
                ai_feedback: validationResult.reasoning || "Verified by Cosmo AI.",
                validation_score: Math.round((validationResult.confidence || 0.8) * 100),
                bonus_exp: validationResult.xp_awarded || 50,
                evidence_url: imageUrl
              }]);

            if (journalError) console.error(`[BACKGROUND JOB] Mission Journals Insert Failed:`, journalError);
            else console.log(`[BACKGROUND JOB] Journal Log Saved Successfully.`);

            // LANGKAH 3: Tambahkan EXP (Fuel Cells) ke tabel 'users'
            const { data: userData, error: fetchUserError } = await supabase
              .from('users')
              .select('fuel_cells')
              .eq('id', userId)
              .single();
            
            if (fetchUserError) {
              console.error(`[BACKGROUND JOB] Failed to fetch current Fuel Cells:`, fetchUserError);
            } else {
              const currentFuel = userData?.fuel_cells || 0;
              const newFuel = currentFuel + (validationResult.xp_awarded || 50);

              const { error: userError } = await supabase
                .from('users')
                .update({ fuel_cells: newFuel })
                .eq('id', userId);
              
              if (userError) {
                console.error(`[BACKGROUND JOB] Failed to update Fuel Cells:`, userError);
              } else {
                console.log(`[BACKGROUND JOB] Success! Captain awarded ${validationResult.xp_awarded} FC. Total FC: ${newFuel}`);
              }
            }

          } else {
            // JIKA AI MENOLAK GAMBAR BUKTI (INVALID)
             const { error: rejectError } = await supabase
              .from('mission_journals')
              .insert([{
                directive_id: directive_id,
                user_id: userId,
                journal_type: 'IMAGE_VALIDATION',
                ai_feedback: `[VALIDATION REJECTED] ${validationResult.reasoning || "Evidence does not match parameters."}`,
                validation_score: 0,
                bonus_exp: 0,
                evidence_url: imageUrl
              }]);
              
             if(rejectError) console.error("[BACKGROUND JOB] Failed to log rejection:", rejectError);
             console.log(`[BACKGROUND JOB] Mission marked as invalid and logged.`);
          }
        } catch (bgError) {
          console.error(`[BACKGROUND JOB] Error:`, bgError);
        }
      })();
      
      return; 
    }

    // --- SYNC MODE (Legacy) ---
    // Dipicu jika Frontend hanya ingin ngetes tanpa menyimpan ke Database
    const validationResult = await validateMissionAndCalculateXP(title, description || "", imageUrl);
    console.log(`[MISSION VALIDATION] Result: Valid=${validationResult.isValid} | XP=${validationResult.xp_awarded}`);
    res.json({ success: true, result: validationResult });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn(`[MISSION VALIDATION] Validation Error: ${JSON.stringify(error.errors)}`);
      if (!res.headersSent) res.status(400).json({ success: false, errors: error.errors });
    } else {
      console.error(`[MISSION VALIDATION] Failed:`, error);
      if (!res.headersSent) res.status(500).json({ success: false, message: "Failed to validate mission" });
    }
  }
};