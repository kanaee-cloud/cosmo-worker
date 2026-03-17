import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config/env';

export const getSupabaseClient = (authToken?: string) => {
  const options = authToken
    ? { global: { headers: { Authorization: authToken } } }
    : {};

  return createClient(SUPABASE_URL, SUPABASE_KEY, options);
};