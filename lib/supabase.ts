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

const keySource = 
  definedKey ? 'Vite Define' :
  import.meta.env.VITE_SUPABASE_ANON_KEY ? 'VITE_SUPABASE_ANON_KEY' :
  import.meta.env.SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' :
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' :
  import.meta.env.VITE_API_KEY ? 'VITE_API_KEY' :
  'Nenhum (usando dummy)';

if (apiKey === 'dummy') {
  console.warn('⚠️ Supabase API Key não encontrada! Origem:', keySource);
} else {
  console.log('✅ Supabase configurado via:', keySource);
  console.log('URL:', apiUrl);
  console.log('Chave (prefixo):', apiKey.substring(0, 10) + '...');
}

export const supabase = createClient(apiUrl, apiKey);
