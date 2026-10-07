-- ==============================================================================
-- BELLADOOR - DADOS DE TESTE INICIAIS (SEED DATA)
-- Simulação de um profissional real para validação e testes
-- ==============================================================================

-- 1. Inserir Perfil do Profissional
INSERT INTO profiles (id, role, full_name, email, phone, avatar_url)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'PROFESSIONAL',
    'Camila Martins',
    'camila@belladoor.app',
    '11999887766',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
) ON CONFLICT (id) DO NOTHING;

-- 2. Inserir Dados Profissionais da Camila
INSERT INTO professionals (
    id, slug, bio, category, instagram_handle, whatsapp_number,
    base_city, base_state, base_neighborhood,
    max_travel_distance_km, buffer_time_minutes, accepts_at_home, accepts_at_studio
)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'camila-makeup',
    'Especialista em Maquiagem Social, Noivas e Penteados modernos. Levo todo o camarim completo com iluminação profissional até a sua casa.',
    'Maquiagem & Cabelo',
    'camilamartins.beauty',
    '5511999887766',
    'São Paulo', 'SP', 'Moema',
    25.00, 35, true, false
) ON CONFLICT (id) DO NOTHING;

-- 3. Bairros Atendidos e Taxas de Deslocamento
INSERT INTO service_areas (professional_id, neighborhood_name, city, travel_fee)
VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Moema', 'São Paulo', 0.00), -- Bairro base: sem taxa extra
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Itaim Bibi', 'São Paulo', 15.00),
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Jardins', 'São Paulo', 15.00),
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Pinheiros', 'São Paulo', 20.00),
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Vila Mariana', 'São Paulo', 20.00),
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Brooklin', 'São Paulo', 10.00);

-- 4. Serviços Oferecidos
INSERT INTO services (professional_id, name, description, duration_minutes, price)
VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Maquiagem Social Glam', 'Produção completa de alta durabilidade com cílios postiços inclusos e preparação de pele blindada.', 60, 180.00),
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Penteado / Babyliss Modelado', 'Ondas glamurosas, meio-preso ou coque despojado com fixação profissional.', 50, 140.00),
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Combo Beleza Total (Make + Penteado)', 'Produção completa para madrinhas, formandas e convidadas VIP no conforto do seu lar.', 110, 290.00),
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Design de Sobrancelha com Henna', 'Alinhamento visagista com aplicação de henna para realçar o olhar.', 30, 70.00);

-- 5. Grade de Horários (Segunda a Sábado das 08h às 19h)
INSERT INTO availability_rules (professional_id, day_of_week, start_time, end_time)
VALUES
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 1, '08:00', '19:00'), -- Seg
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 2, '08:00', '19:00'), -- Ter
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 3, '08:00', '19:00'), -- Qua
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 4, '08:00', '19:00'), -- Qui
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 5, '08:00', '20:00'), -- Sex
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 6, '07:00', '20:00'); -- Sáb

-- 6. Assinatura SaaS Inicial (Período de Testes Ativo)
INSERT INTO subscriptions (professional_id, plan_name, status, price_monthly, trial_ends_at)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'BellaDoor Pro',
    'TRIAL',
    39.90,
    now() + interval '14 days'
);
