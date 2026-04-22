-- ============================================
-- NBAPARK Fleet Control - Complete Local Database Schema
-- PostgreSQL 17 - Local Development
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  phone BIGINT UNIQUE NOT NULL,
  role TEXT DEFAULT 'driver' CHECK (role IN ('driver', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================
-- 2. USER_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON public.user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON public.user_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_logs_action ON public.user_logs(action);

-- ============================================
-- 3. VEHICLES TABLE (Primary vehicle table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  plate TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Passeio' CHECK (type IN ('Passeio', 'Utilitario')),
  is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  block_reason TEXT,
  blocked_at TIMESTAMPTZ,
  blocked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicles_name ON public.vehicles(name);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_blocked ON public.vehicles(is_blocked);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);

-- ============================================
-- 4. VEHICLE_STATUS TABLE (Legacy / Compatibility)
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicle_status (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  vehicle_name TEXT UNIQUE NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  block_reason TEXT,
  blocked_at TIMESTAMPTZ,
  blocked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_status_vehicle_name ON public.vehicle_status(vehicle_name);
CREATE INDEX IF NOT EXISTS idx_vehicle_status_is_blocked ON public.vehicle_status(is_blocked);

-- ============================================
-- 5. RESERVATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  start_odometer BIGINT NOT NULL CHECK (start_odometer >= 0),
  end_odometer BIGINT CHECK (end_odometer IS NULL OR end_odometer >= start_odometer),
  itinerary TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ CHECK (end_time IS NULL OR end_time >= start_time),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON public.reservations(vehicle);
CREATE INDEX IF NOT EXISTS idx_reservations_start_time ON public.reservations(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);

-- ============================================
-- 6. SCHEDULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  reserver_name TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_at ON public.schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_schedules_vehicle ON public.schedules(vehicle);

-- ============================================
-- 7. TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluida')),
  assigned_to TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  destination_name TEXT,
  destination_address TEXT,
  destination_latitude DOUBLE PRECISION,
  destination_longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- ============================================
-- 8. APP_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 9. TRACKING TABLES - Vehicle Positions
-- ============================================
CREATE TABLE IF NOT EXISTS public.veiculos_posicoes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reservation_id TEXT NOT NULL,
  veiculo_id TEXT NOT NULL,
  motorista_nome TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  velocidade DOUBLE PRECISION DEFAULT 0,
  precisao DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parado BOOLEAN DEFAULT FALSE,
  parado_desde TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_veiculos_posicoes_reservation ON public.veiculos_posicoes(reservation_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_posicoes_veiculo ON public.veiculos_posicoes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_posicoes_timestamp ON public.veiculos_posicoes(timestamp DESC);

-- ============================================
-- 10. STOP NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.notificacoes_parada (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reservation_id TEXT NOT NULL,
  veiculo_id TEXT NOT NULL,
  motorista_nome TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  parado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visualizada BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_parada_reservation ON public.notificacoes_parada(reservation_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_parada_visualizada ON public.notificacoes_parada(visualizada);
CREATE INDEX IF NOT EXISTS idx_notificacoes_parada_created ON public.notificacoes_parada(created_at DESC);

-- ============================================
-- 11. VIEWS
-- ============================================

-- View: Latest position per vehicle (for real-time map)
CREATE OR REPLACE VIEW public.veiculos_posicoes_atual AS
SELECT DISTINCT ON (veiculo_id)
  id,
  reservation_id,
  veiculo_id,
  motorista_nome,
  lat,
  lng,
  velocidade,
  precisao,
  heading,
  timestamp,
  parado,
  parado_desde
FROM public.veiculos_posicoes
ORDER BY veiculo_id, timestamp DESC;

-- View: Active trips
CREATE OR REPLACE VIEW public.active_trips AS
SELECT
  r.id,
  r.user_id,
  r.employee_name,
  r.vehicle,
  r.start_odometer,
  r.itinerary,
  r.start_time,
  EXTRACT(EPOCH FROM (NOW() - r.start_time))/60 AS duration_minutes
FROM public.reservations r
WHERE r.status = 'active'
ORDER BY r.start_time DESC;

-- View: Trip statistics
CREATE OR REPLACE VIEW public.trip_statistics AS
SELECT
  employee_name,
  COUNT(*) AS total_trips,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_trips,
  SUM(CASE WHEN status = 'completed' THEN (end_odometer - start_odometer) ELSE 0 END) AS total_km,
  AVG(CASE WHEN status = 'completed' THEN (end_odometer - start_odometer) ELSE NULL END) AS avg_km_per_trip,
  MAX(start_time) AS last_trip_date
FROM public.reservations
GROUP BY employee_name
ORDER BY total_km DESC;

-- ============================================
-- 12. TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vehicles
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for vehicle_status
DROP TRIGGER IF EXISTS update_vehicle_status_updated_at ON public.vehicle_status;
CREATE TRIGGER update_vehicle_status_updated_at
  BEFORE UPDATE ON public.vehicle_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. SEED DATA - Default Vehicles
-- ============================================
INSERT INTO public.vehicles (id, name, plate, type, is_blocked)
VALUES
  ('polo-vw', 'Polo Volkswagen', 'ABC-1234', 'Passeio', FALSE),
  ('fiorino-fiat', 'Fiorino Fiat', 'DEF-5678', 'Utilitario', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vehicle_status (id, vehicle_name, is_blocked, block_reason)
VALUES ('polo-vw', 'Polo Volkswagen', FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- Default app settings
INSERT INTO public.app_settings (key, value) VALUES
  ('company_name', 'NBAPARK Fleet Control'),
  ('logo_url', '/logo.png'),
  ('about_text', 'Sistema de controle de frota empresarial.')
ON CONFLICT (key) DO NOTHING;

-- Default admin user
INSERT INTO public.users (id, name, phone, role) VALUES
  ('admin-default', 'Administrador', 999999999, 'admin')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 14. POSTGREST ROLES (for Local Connectivity)
-- ============================================

-- Create a web_anon role for unauthenticated requests
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon; -- Allow full access for local dev
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create an authenticator role that uses the anon role
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator WITH NOINHERIT LOGIN PASSWORD 'fleet_pgrst_pass_2026';
  END IF;
END
$$;

GRANT anon TO authenticator;
