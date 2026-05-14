-- 2026-05-11: Seed external courses
INSERT INTO `courses` (title, description, url, category, hours, mandatory, is_external, departments) VALUES
('Prevenció de riscos laborals',
 'Formació obligatòria en PRL per a tot el personal. Cobreix riscos generals, ergonomia i protocols d\'emergència.',
 'https://campus.tavil.cat/prl',
 'Seguretat', '4h', 1, 1, '[]'),

('Introducció a la sostenibilitat tèxtil',
 'Conceptes clau de sostenibilitat en la indústria tèxtil: materials, traçabilitat i certificacions (GOTS, OEKO-TEX).',
 'https://campus.tavil.cat/sostenibilitat',
 'Qualitat', '3h', 0, 1, '[]'),

('Excel avançat per a l\'anàlisi de vendes',
 'Taules dinàmiques, fórmules avançades i dashboards per al seguiment de KPIs comercials.',
 'https://campus.tavil.cat/excel-avançat',
 'Comercial', '6h', 0, 1, '["Comercial","Administració"]'),

('Protecció de dades (RGPD)',
 'Regulació general de protecció de dades aplicada a l\'empresa. Obligatori per a tots els usuaris amb accés a dades de clients.',
 'https://campus.tavil.cat/rgpd',
 'Compliance', '2h', 1, 1, '[]'),

('Comunicació efectiva en entorns professionals',
 'Tècniques de comunicació assertiva, presentacions i gestió de conflictes en equip.',
 'https://campus.tavil.cat/comunicacio',
 'Habilitats', '5h', 0, 1, '[]'),

('Anglès per a negocis (B2)',
 'Vocabulari i expressions per a reunions, correus i negociació amb clients internacionals.',
 'https://campus.tavil.cat/angles-b2',
 'Idiomes', '20h', 0, 1, '["Comercial","Direcció"]'),

('Control de qualitat en producció',
 'Mètodes d\'inspecció, estàndards ISO i eines de millora contínua aplicades a planta.',
 'https://campus.tavil.cat/qualitat-produccio',
 'Qualitat', '8h', 0, 1, '["Producció","Qualitat"]'),

('Acollida i cultura TAVIL',
 'Coneix l\'empresa, els seus valors, l\'organigrama i els processos interns. Imprescindible per als nous incorporats.',
 'https://campus.tavil.cat/acollida',
 'Acollida', '2h', 1, 1, '[]');
