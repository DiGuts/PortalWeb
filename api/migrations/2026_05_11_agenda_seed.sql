-- 2026-05-11: Seed agenda events for May 2026
INSERT IGNORE INTO `agenda_events` (title, day, month, time, location, type) VALUES
('Reunió comercial setmanal',          6,  5, '09:30',        'Sala Aurora · Seu central',       'Sessió interna'),
('Formació: noves eines CRM',          8,  5, '15:00 – 17:00','Campus TAVIL · Online',            'Sessió interna'),
('Comitè de direcció Q2',              12, 5, '10:00 – 12:00','Sala de juntes · Seu central',    'Sessió interna'),
('Jornada portes obertes planta Terrassa', 15, 5, 'Tot el dia', 'Planta Terrassa',               'Activitat empresa'),
('Visita client Mango',                19, 5, '11:00 – 13:00','Seu central',                     'Visita comercial'),
('Presentació resultats Q1',           20, 5, '16:00 – 17:00','Auditori · Seu central',          'Sessió interna'),
('Fira Motex Barcelona',               22, 5, 'Tot el dia',   'Fira de Barcelona · Montjuïc',    'Fira'),
('Fira Motex Barcelona',               23, 5, 'Tot el dia',   'Fira de Barcelona · Montjuïc',    'Fira'),
('Torneig ping-pong interdepartaments',27, 5, '18:00',        'Planta baixa',                    'Activitat empresa'),
('Dinar equip comercial',              28, 5, '14:00 – 16:00','Restaurant El Racó',              'Activitat empresa'),
('Dia festiu (Dilluns de Pasqua Granada)', 1, 6, 'Tot el dia','—',                              'Festiu');
