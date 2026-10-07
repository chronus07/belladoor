-- ==============================================================================
-- BELLADOOR - PLATAFORMA SAAS DE BELEZA A DOMICÍLIO
-- Esquema de Banco de Dados Relacional (PostgreSQL / Supabase)
-- ==============================================================================

-- Habilita extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA DE PERFIS GERAIS (Usuários do sistema)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('PROFESSIONAL', 'CLIENT', 'ADMIN')),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(25),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA DE PROFISSIONAIS DA BELEZA (Extensão do perfil para assinantes)
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    slug VARCHAR(80) UNIQUE NOT NULL, -- Ex: 'maria-makeup' (Acesso: belladoor.app/maria-makeup)
    bio TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'Multi', -- Maquiagem, Cabelo, Unhas, Estética, Sobrancelha
    instagram_handle VARCHAR(80),
    whatsapp_number VARCHAR(25) NOT NULL,
    
    -- Localização Base (Ponto de partida do profissional para calcular deslocamento)
    base_city VARCHAR(100) NOT NULL,
    base_state VARCHAR(2) NOT NULL,
    base_neighborhood VARCHAR(100),
    base_latitude NUMERIC(10, 7),
    base_longitude NUMERIC(10, 7),
    
    -- Regras do Atendimento a Domicílio
    max_travel_distance_km NUMERIC(5, 2) DEFAULT 25.00, -- Raio máximo que atende
    buffer_time_minutes INT DEFAULT 30, -- Tempo de trânsito necessário entre clientes (30-45 min)
    accepts_at_home BOOLEAN DEFAULT true, -- Atendimento a domicílio
    accepts_at_studio BOOLEAN DEFAULT false, -- Caso também tenha espaço próprio
    
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BAIRROS E REGIÕES ATENDIDAS (Com taxa de deslocamento personalizada)
CREATE TABLE IF NOT EXISTS service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    neighborhood_name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    travel_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Taxa de deslocamento para essa região
    is_covered BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CATÁLOGO DE SERVIÇOS DO PROFISSIONAL
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL, -- Ex: "Maquiagem Social", "Escova Lisa", "Alongamento Fibra de Vidro"
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60, -- Duração média do atendimento
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PORTFÓLIO DE FOTOS (Vitrine de trabalhos)
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. GRADE DE HORÁRIOS DE TRABALHO (Disponibilidade semanal do profissional)
CREATE TABLE IF NOT EXISTS availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 1=Segunda, ..., 6=Sábado
    start_time TIME NOT NULL, -- Ex: '09:00'
    end_time TIME NOT NULL,   -- Ex: '19:00'
    is_active BOOLEAN DEFAULT true
);

-- 7. TABELA DE AGENDAMENTOS (O coração do sistema)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id),
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Dados do Cliente no momento do agendamento
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(25) NOT NULL,
    client_email VARCHAR(255),
    
    -- Serviço & Horários
    service_id UUID NOT NULL REFERENCES services(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Valores
    service_price NUMERIC(10, 2) NOT NULL,
    travel_fee NUMERIC(10, 2) DEFAULT 0.00,
    total_price NUMERIC(10, 2) NOT NULL,
    
    -- Endereço de Atendimento (Domicílio da cliente)
    service_location_type VARCHAR(20) DEFAULT 'CLIENT_HOME' CHECK (service_location_type IN ('CLIENT_HOME', 'STUDIO')),
    address_street VARCHAR(200) NOT NULL,
    address_number VARCHAR(30) NOT NULL,
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_state VARCHAR(2) NOT NULL,
    address_cep VARCHAR(10) NOT NULL,
    address_latitude NUMERIC(10, 7),
    address_longitude NUMERIC(10, 7),
    
    -- Status do Agendamento
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',     -- Aguardando aprovação ou confirmação
        'CONFIRMED',   -- Confirmado na agenda
        'IN_TRANSIT',   -- Profissional a caminho
        'COMPLETED',   -- Atendimento finalizado
        'CANCELLED'    -- Cancelado por cliente ou profissional
    )),
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ASSINATURAS SAAS DOS PROFISSIONAIS (Monetização)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    plan_name VARCHAR(50) DEFAULT 'BellaDoor Pro',
    status VARCHAR(20) DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED')),
    price_monthly NUMERIC(10, 2) DEFAULT 39.90, -- R$ 39,90/mês ou R$ 299/ano
    trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    payment_gateway VARCHAR(30), -- 'MERCADOPAGO', 'ASAAS', 'STRIPE'
    gateway_subscription_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. PERÍODOS DE BLOQUEIO DE AGENDA / FOLGAS (Férias, Cursos, Bloqueio por Intervalo)
CREATE TABLE IF NOT EXISTS blocked_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) DEFAULT 'Folga / Indisponível',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ÍNDICES PARA ALTA PERFORMANCE DE CONSULTA
CREATE INDEX IF NOT EXISTS idx_professionals_slug ON professionals(slug);
CREATE INDEX IF NOT EXISTS idx_services_professional ON services(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lookup ON appointments(professional_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_service_areas ON service_areas(professional_id, neighborhood_name);
CREATE INDEX IF NOT EXISTS idx_blocked_periods ON blocked_periods(professional_id, start_date, end_date);
