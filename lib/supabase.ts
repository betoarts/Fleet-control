import { createClient } from '@supabase/supabase-js';

const apiUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  import.meta.env.VITE_API_URL || 
  'http://localhost:3000';

const apiKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_API_KEY || 
  import.meta.env.SUPABASE_KEY || 
  'dummy';

if (apiKey === 'dummy') {
  console.warn('⚠️ Supabase API Key não encontrada! Verifique as variáveis de ambiente no Vercel.');
  console.log('Variáveis detectadas:', {
    hasViteUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
    hasNextUrl: !!import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    hasViteKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasSupabaseKey: !!import.meta.env.SUPABASE_ANON_KEY,
    hasNextKey: !!import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
}

export const supabase = createClient(apiUrl, apiKey);
