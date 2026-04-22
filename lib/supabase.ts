import { createClient } from '@supabase/supabase-js';

// @ts-ignore - Injetado pelo Vite define
const definedUrl = typeof __SUPABASE_URL__ !== 'undefined' ? __SUPABASE_URL__ : null;
// @ts-ignore - Injetado pelo Vite define
const definedKey = typeof __SUPABASE_ANON_KEY__ !== 'undefined' ? __SUPABASE_ANON_KEY__ : null;

const apiUrl = 
  definedUrl ||
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  import.meta.env.VITE_API_URL || 
  'http://localhost:3000';

const apiKey = 
  definedKey ||
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_API_KEY || 
  import.meta.env.SUPABASE_KEY || 
  'dummy';

if (apiKey === 'dummy') {
  console.warn('⚠️ Supabase API Key não encontrada! Verifique as variáveis de ambiente no Vercel.');
  console.log('Diagnóstico de variáveis:', {
    hasDefinedUrl: !!definedUrl,
    hasDefinedKey: !!definedKey,
    hasViteUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
    hasViteKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasSupabaseKey: !!import.meta.env.SUPABASE_ANON_KEY
  });
}

export const supabase = createClient(apiUrl, apiKey);
