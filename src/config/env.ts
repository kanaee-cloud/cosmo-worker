import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in .env file. AI features will not work.");
}

export const genAI = new GoogleGenerativeAI(API_KEY || "");
export const PORT = process.env.PORT || 3000;
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
export const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Parse allowed origins from env or use defaults
export const ALLOWED_ORIGINS = [
  FRONTEND_URL, 
  "http://localhost:5173", 
  "http://localhost:4173", // Vite preview
  "https://cosmo-frontend.vercel.app"
].filter(Boolean);
