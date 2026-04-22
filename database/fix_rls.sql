-- ============================================
-- NBAPARK Fleet Control - Supabase Cloud RLS Fix (IDEMPOTENTE)
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Habilitar RLS em todas as tabelas (caso não estejam)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos_posicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_parada ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas existentes para evitar erros de duplicidade
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon update users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert logs" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select logs" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select vehicles" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon update vehicles" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select vehicle_status" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon update vehicle_status" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select reservations" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert reservations" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon update reservations" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select schedules" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert schedules" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon delete schedules" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select tasks" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert tasks" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon update tasks" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select settings" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select positions" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert positions" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon select notifications" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert notifications" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon update notifications" ON public.%I', t);
    END LOOP;
END $$;

-- 3. Criar Políticas Permissivas para o papel 'anon' 

-- Tabela: users
DROP POLICY IF EXISTS "Allow anon select users" ON public.users;
CREATE POLICY "Allow anon select users" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert users" ON public.users;
CREATE POLICY "Allow anon insert users" ON public.users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update users" ON public.users;
CREATE POLICY "Allow anon update users" ON public.users FOR UPDATE USING (true);

-- Tabela: user_logs
DROP POLICY IF EXISTS "Allow anon insert logs" ON public.user_logs;
CREATE POLICY "Allow anon insert logs" ON public.user_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon select logs" ON public.user_logs;
CREATE POLICY "Allow anon select logs" ON public.user_logs FOR SELECT USING (true);

-- Tabela: vehicles e vehicle_status
DROP POLICY IF EXISTS "Allow anon select vehicles" ON public.vehicles;
CREATE POLICY "Allow anon select vehicles" ON public.vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon update vehicles" ON public.vehicles;
CREATE POLICY "Allow anon update vehicles" ON public.vehicles FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anon select vehicle_status" ON public.vehicle_status;
CREATE POLICY "Allow anon select vehicle_status" ON public.vehicle_status FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon update vehicle_status" ON public.vehicle_status;
CREATE POLICY "Allow anon update vehicle_status" ON public.vehicle_status FOR UPDATE USING (true);

-- Tabela: reservations
DROP POLICY IF EXISTS "Allow anon select reservations" ON public.reservations;
CREATE POLICY "Allow anon select reservations" ON public.reservations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert reservations" ON public.reservations;
CREATE POLICY "Allow anon insert reservations" ON public.reservations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update reservations" ON public.reservations;
CREATE POLICY "Allow anon update reservations" ON public.reservations FOR UPDATE USING (true);

-- Tabela: schedules
DROP POLICY IF EXISTS "Allow anon select schedules" ON public.schedules;
CREATE POLICY "Allow anon select schedules" ON public.schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert schedules" ON public.schedules;
CREATE POLICY "Allow anon insert schedules" ON public.schedules FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon delete schedules" ON public.schedules;
CREATE POLICY "Allow anon delete schedules" ON public.schedules FOR DELETE USING (true);

-- Tabela: tasks
DROP POLICY IF EXISTS "Allow anon select tasks" ON public.tasks;
CREATE POLICY "Allow anon select tasks" ON public.tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert tasks" ON public.tasks;
CREATE POLICY "Allow anon insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update tasks" ON public.tasks;
CREATE POLICY "Allow anon update tasks" ON public.tasks FOR UPDATE USING (true);

-- Tabela: app_settings
DROP POLICY IF EXISTS "Allow anon select settings" ON public.app_settings;
CREATE POLICY "Allow anon select settings" ON public.app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon all settings" ON public.app_settings;
CREATE POLICY "Allow anon all settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Tabelas de Tracking (veiculos_posicoes e notificacoes_parada)
DROP POLICY IF EXISTS "Allow anon select positions" ON public.veiculos_posicoes;
CREATE POLICY "Allow anon select positions" ON public.veiculos_posicoes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert positions" ON public.veiculos_posicoes;
CREATE POLICY "Allow anon insert positions" ON public.veiculos_posicoes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon select notifications" ON public.notificacoes_parada;
CREATE POLICY "Allow anon select notifications" ON public.notificacoes_parada FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anon insert notifications" ON public.notificacoes_parada;
CREATE POLICY "Allow anon insert notifications" ON public.notificacoes_parada FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update notifications" ON public.notificacoes_parada;
CREATE POLICY "Allow anon update notifications" ON public.notificacoes_parada FOR UPDATE USING (true);

-- 4. Garantir permissões de schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon;

-- 5. Habilitar Realtime (com verificação de existência)
DO $$
BEGIN
    -- Tenta adicionar as tabelas à publicação se elas ainda não estiverem lá
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'veiculos_posicoes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.veiculos_posicoes;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notificacoes_parada') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes_parada;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reservations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'app_settings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
    END IF;
END $$;
