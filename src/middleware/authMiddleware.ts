import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config/env';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Debugging: Log all headers (sanitized) to check if Authorization is being stripped
  console.log(`[AUTH] Incoming headers keys: ${Object.keys(req.headers).join(', ')}`);

  if (!authHeader) {
    console.warn(`[AUTH FAILED] No authorization header provided. IP: ${req.ip}`);
    // Check if it's in a different casing (rare in Node/Express but possible in proxies)
    const altAuth = req.headers['Authorization'];
    if (altAuth) {
        console.log("[AUTH] Found 'Authorization' header with different casing.");
        // continue logic if needed, but express normally lowercases it
    }
    
    return res.status(401).json({ success: false, message: "No authorization header provided" });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    console.warn(`[AUTH FAILED] Malformed authorization header. IP: ${req.ip}`);
    return res.status(401).json({ success: false, message: "Malformed authorization header" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn(`[AUTH FAILED] Invalid token or user not found. Error: ${error?.message}`);
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    // Attach user to request object for use in controllers
    (req as any).user = user;
    
    console.log(`[AUTH SUCCESS] User: ${user.email} (${user.id})`);
    next();
  } catch (err) {
    console.error(`[AUTH ERROR] Internal server error during auth:`, err);
    return res.status(500).json({ success: false, message: "Internal server error during authentication" });
  }
};
