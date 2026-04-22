import { createClient } from '@supabase/supabase-js';

const apiUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_API_KEY || 'dummy';

export const supabase = createClient(apiUrl, apiKey);
