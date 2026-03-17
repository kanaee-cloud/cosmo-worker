import { genAI } from '../config/env';
import { Part } from '@google/generative-ai';

// Helper to fetch image and convert to base64
async function urlToGenerativePart(url: string, mimeType: string): Promise<Part> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString("base64"),
      mimeType
    },
  };
}

export const generateQuiz = async (missionLog: string, difficulty: string = 'medium') => {
  // UPGRADE KE GENERASI 1.5 FLASH (Cepat & Akurat)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an AI instructor in a space-themed productivity system.
    The user has just completed a mission (task) with the following summary: "${missionLog}".
    
    Generate 3 multiple-choice quiz questions to test the user's understanding of this task/topic.
    Format the output as a valid JSON array of objects.
    Each object should have:
    - "question": string
    - "options": array of 4 strings
    - "correct_index": integer (0-3) indicating the correct option
    - "explanation": string (brief explanation of the answer)
    
    Do not include markdown code blocks (like \`\`\`json). Just the raw JSON array.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean up potential markdown code blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz");
  }
};

export const validateMissionAndCalculateXP = async (title: string, description: string, imageUrl: string) => {
  // UPGRADE KE GENERASI 1.5 FLASH (Model ini bisa teks DAN gambar sekaligus)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    console.log(`[GEMINI SERVICE] Starting validation for "${title}"`);
    
    const mimeType = imageUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const imagePart = await urlToGenerativePart(imageUrl, mimeType);

    const prompt = `
      You are a Mission Control AI Officer.
      A Captain has submitted proof for a physical/general mission.
      
      Mission Title: "${title}"
      Mission Description: "${description}"
      
      Your task:
      1. Analyze the attached image.
      2. Determine if the image is relevant to the mission title and description. Is it valid proof?
      3. If valid, estimate the difficulty/effort of the task based on the visual evidence and description (Scale 1-10).
      4. Calculate Experience Points (Fuel Cells) to award. Base XP is 100.
         - If heavy/difficult work: Award 150-300 XP.
         - If medium work: Award 100-150 XP.
         - If light/trivial work: Award 50-100 XP.
         
      Return a JSON object with:
      - "isValid": boolean
      - "confidence": number (0-1)
      - "difficulty_rating": number (1-10)
      - "xp_awarded": number (integer)
      - "reasoning": string (brief verification comment to the captain)
      
      If the image is irrelevant or fake, set isValid to false and xp_awarded to 0.
      Do not include markdown code blocks. Just the raw JSON.
    `;

    // Format pengiriman payload untuk SDK terbaru
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    // Pembersihan teks sebelum di-parse menjadi JSON
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error validating mission:", error);
    throw new Error("Failed to validate mission");
  }
};