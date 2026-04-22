-- =============================================================
-- VEHICLE STATUS TABLE - NBAPARK Fleet Control
-- Execute este SQL no seu projeto Supabase (yochbbecyadbiixercyq)
-- via SQL Editor: https://supabase.com/dashboard/project/yochbbecyadbiixercyq/sql
-- =============================================================

-- 1. Criar a tabela vehicle_status
CREATE TABLE IF NOT EXISTS public.vehicle_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_name TEXT NOT NULL UNIQUE,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    blocked_at TIMESTAMPTZ,
    blocked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserir o veículo padrão (Polo Volkswagen)
INSERT INTO public.vehicle_status (vehicle_name, is_blocked, block_reason)
VALUES ('Polo Volkswagen', false, null)
ON CONFLICT (vehicle_name) DO NOTHING;

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.vehicle_status ENABLE ROW LEVEL SECURITY;

-- 4. Política para permitir leitura por todos (usuários autenticados ou anônimos)
CREATE POLICY "Allow read access to vehicle_status" ON public.vehicle_status
    FOR SELECT
    USING (true);

-- 5. Política para permitir atualização por todos (para o bloqueio funcionar)
CREATE POLICY "Allow update access to vehicle_status" ON public.vehicle_status
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 6. Política para permitir inserção (caso precise adicionar novos veículos)
CREATE POLICY "Allow insert access to vehicle_status" ON public.vehicle_status
    FOR INSERT
    WITH CHECK (true);

-- =============================================================
-- PRONTO! Após executar, o bloqueio funcionará em todos os dispositivos.
-- =============================================================
