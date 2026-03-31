-- ============================================================
--  TAVIL Portal — MariaDB initialisation script
--  Generated from SQLite dev database
--  Run: mysql -u <user> -p <dbname> < tavil_mariadb_init.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ─── Schema ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT            NOT NULL AUTO_INCREMENT,
  `name`       TEXT           NOT NULL,
  `email`      VARCHAR(255)   NOT NULL,
  `password`   TEXT           NOT NULL,
  `role`       VARCHAR(100)   NOT NULL DEFAULT 'Treballador/a',
  `dept`       VARCHAR(100)   NOT NULL DEFAULT 'General',
  `phone`      VARCHAR(50)    NOT NULL DEFAULT '',
  `ext`        VARCHAR(20)    NOT NULL DEFAULT '',
  `location`   VARCHAR(100)   NOT NULL DEFAULT '',
  `created_at` DATETIME       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `suggestions` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `title`       TEXT         NOT NULL,
  `description` TEXT         NOT NULL DEFAULT '',
  `category`    VARCHAR(100) NOT NULL DEFAULT 'General',
  `anonymous`   TINYINT      NOT NULL DEFAULT 1,
  `author`      VARCHAR(255) NOT NULL DEFAULT 'Anònim',
  `votes`       INT          NOT NULL DEFAULT 0,
  `status`      VARCHAR(50)  NOT NULL DEFAULT 'Pendent',
  `response`    TEXT         NOT NULL DEFAULT '',
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `incidencies` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `title`       TEXT         NOT NULL,
  `description` TEXT         NOT NULL DEFAULT '',
  `area`        VARCHAR(100) NOT NULL DEFAULT 'General',
  `priority`    VARCHAR(50)  NOT NULL DEFAULT 'Baixa',
  `author`      VARCHAR(255) NOT NULL DEFAULT '',
  `status`      VARCHAR(50)  NOT NULL DEFAULT 'Oberta',
  `assigned_to` VARCHAR(255) NOT NULL DEFAULT '',
  `resolution`  TEXT         NOT NULL DEFAULT '',
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `enquestes` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `title`      TEXT         NOT NULL,
  `questions`  INT          NOT NULL DEFAULT 0,
  `deadline`   VARCHAR(50)  NOT NULL DEFAULT '',
  `creator`    VARCHAR(255) NOT NULL DEFAULT '',
  `total`      INT          NOT NULL DEFAULT 140,
  `responses`  INT          NOT NULL DEFAULT 0,
  `status`     VARCHAR(50)  NOT NULL DEFAULT 'Disponible',
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `enquesta_responses` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `enquesta_id` INT          NOT NULL,
  `user_email`  VARCHAR(255) NOT NULL,
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_enquesta_user` (`enquesta_id`, `user_email`),
  CONSTRAINT `fk_er_enquesta` FOREIGN KEY (`enquesta_id`) REFERENCES `enquestes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `employees` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `name`     TEXT         NOT NULL,
  `role`     VARCHAR(255) NOT NULL DEFAULT '',
  `dept`     VARCHAR(100) NOT NULL DEFAULT '',
  `email`    VARCHAR(255) NOT NULL DEFAULT '',
  `phone`    VARCHAR(50)  NOT NULL DEFAULT '',
  `ext`      VARCHAR(20)  NOT NULL DEFAULT '',
  `initials` VARCHAR(10)  NOT NULL DEFAULT '',
  `color`    VARCHAR(50)  NOT NULL DEFAULT 'bg-gray-400',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `activities` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `title`       TEXT         NOT NULL,
  `category`    VARCHAR(100) NOT NULL DEFAULT '',
  `description` TEXT         NOT NULL DEFAULT '',
  `date`        VARCHAR(50)  NOT NULL DEFAULT '',
  `time`        VARCHAR(20)  NOT NULL DEFAULT '',
  `location`    VARCHAR(255) NOT NULL DEFAULT '',
  `capacity`    INT          NOT NULL DEFAULT 0,
  `enrolled`    INT          NOT NULL DEFAULT 0,
  `past`        TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `agenda_events` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `title`    TEXT         NOT NULL,
  `day`      INT          NOT NULL,
  `month`    INT          NOT NULL,
  `time`     VARCHAR(20)  NOT NULL DEFAULT '',
  `location` VARCHAR(255) NOT NULL DEFAULT '',
  `type`     VARCHAR(100) NOT NULL DEFAULT 'Sessió interna',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `notices` (
  `id`      INT     NOT NULL AUTO_INCREMENT,
  `title`   TEXT    NOT NULL,
  `content` TEXT    NOT NULL DEFAULT '',
  `link`    TEXT    NOT NULL DEFAULT '',
  `active`  TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `news` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `category`   VARCHAR(100) NOT NULL DEFAULT '',
  `title`      TEXT         NOT NULL,
  `summary`    TEXT         NOT NULL DEFAULT '',
  `content`    TEXT         NOT NULL DEFAULT '',
  `author`     VARCHAR(255) NOT NULL DEFAULT '',
  `date`       VARCHAR(50)  NOT NULL DEFAULT '',
  `image`      VARCHAR(255) NOT NULL DEFAULT '',
  `featured`   TINYINT      NOT NULL DEFAULT 0,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `courses` (
  `id`          INT         NOT NULL AUTO_INCREMENT,
  `title`       TEXT        NOT NULL,
  `category`    VARCHAR(100) NOT NULL DEFAULT '',
  `description` TEXT        NOT NULL DEFAULT '',
  `hours`       VARCHAR(20) NOT NULL DEFAULT '',
  `mandatory`   TINYINT     NOT NULL DEFAULT 0,
  `cert`        TINYINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_course_progress` (
  `id`        INT         NOT NULL AUTO_INCREMENT,
  `user_id`   INT         NOT NULL,
  `course_id` INT         NOT NULL,
  `status`    VARCHAR(50) NOT NULL DEFAULT 'Pendent',
  `progress`  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ucp` (`user_id`, `course_id`),
  CONSTRAINT `fk_ucp_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`   (`id`),
  CONSTRAINT `fk_ucp_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solicituds` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `date`       VARCHAR(50)  NOT NULL,
  `comments`   TEXT         NOT NULL DEFAULT '',
  `status`     VARCHAR(50)  NOT NULL DEFAULT 'Pendent',
  `motive`     TEXT         NOT NULL DEFAULT '',
  `author`     VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `title`      VARCHAR(255) NOT NULL,
  `body`       TEXT         NOT NULL DEFAULT '',
  `tab`        VARCHAR(100) NOT NULL DEFAULT '',
  `read`       TINYINT      NOT NULL DEFAULT 0,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Data ─────────────────────────────────────────────────────────────────────

-- users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `dept`, `phone`, `ext`, `location`, `created_at`) VALUES (11, 'Carles Homs', 'carleshoms@tavil.net', '$2b$12$OoDpEVeBD6oThDGQWX5LyePjwxO96MWWHb4j1GOg7.kz/AfwDfL1y', 'Treballador/a', 'General', '', '', '', '2026-03-30 10:19:58');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `dept`, `phone`, `ext`, `location`, `created_at`) VALUES (12, 'Marta García', 'm.garcia@tavil.com', '$2b$12$.AtuQsI1JG88Ipg33IlvROBYmt0gpr8kxBBGEVVXJ7XEMJY/Tju7u', 'Treballador/a', 'Operacions', '', '', '', '2026-03-30 10:19:58');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `dept`, `phone`, `ext`, `location`, `created_at`) VALUES (13, 'Jordi Bellmunt', 'j.bellmunt@tavil.com', '$2b$12$krTqSuZweEPFaCSe5B9KaOTsONs9gebWeeaHTLKnTmw7ub/2cXoMO', 'Administrador/a', 'Direcció', '', '', '', '2026-03-30 10:19:58');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `dept`, `phone`, `ext`, `location`, `created_at`) VALUES (14, 'Unai', 'unai@tavil.net', '$2b$12$j3dWccB7vshc3yKCmPIPM.DG13UjWZY7XtteguOAiFOXKgWeIfm1m', 'Recursos humans', 'Sistemes', '', '', '', '2026-03-30 10:19:58');
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `dept`, `phone`, `ext`, `location`, `created_at`) VALUES (15, 'Root', 'root', '$2b$12$QfL2ZyAI3fhCza1.t9TS9u9siwqZ1R9GYrBLyyZUwewj0ZtfncOX2', 'Administrador/a', 'Sistemes', '', '', '', '2026-03-31 08:24:20');
ALTER TABLE `users` AUTO_INCREMENT = 16;

-- suggestions
INSERT INTO `suggestions` (`id`, `title`, `description`, `category`, `anonymous`, `author`, `votes`, `status`, `response`, `created_at`) VALUES (13, 'Ampliar l''horari del menjador fins a les 15:30', '', 'Instal·lacions', 1, 'Anònim', 14, 'En revisió', 'Estem valorant la proposta amb el servei de càtering. Resposta prevista abans del 31 de març.', '2026-03-30 10:19:58');
INSERT INTO `suggestions` (`id`, `title`, `description`, `category`, `anonymous`, `author`, `votes`, `status`, `response`, `created_at`) VALUES (14, 'Programa de bicicleta compartida per venir a la planta', '', 'Sostenibilitat', 1, 'Anònim', 23, 'Acceptada', 'Acceptat! Es posarà en marxa al maig amb 10 bicicletes disponibles al pàrquing.', '2026-03-30 10:19:58');
INSERT INTO `suggestions` (`id`, `title`, `description`, `category`, `anonymous`, `author`, `votes`, `status`, `response`, `created_at`) VALUES (15, 'Habilitar un espai de descans a la planta 2', '', 'Benestar', 1, 'Anònim', 18, 'En revisió', '', '2026-03-30 10:19:58');
INSERT INTO `suggestions` (`id`, `title`, `description`, `category`, `anonymous`, `author`, `votes`, `status`, `response`, `created_at`) VALUES (16, 'Sessions de ioga durant la pausa del migdia', '', 'Benestar', 1, 'Anònim', 9, 'Pendent', '', '2026-03-30 10:19:58');
INSERT INTO `suggestions` (`id`, `title`, `description`, `category`, `anonymous`, `author`, `votes`, `status`, `response`, `created_at`) VALUES (17, 'Iep iep', 'Programa nice nice', 'Sostenibilitat', 1, 'Anònim', 0, 'Pendent', '', '2026-03-31 08:55:13');
ALTER TABLE `suggestions` AUTO_INCREMENT = 18;

-- incidencies
INSERT INTO `incidencies` (`id`, `title`, `description`, `area`, `priority`, `author`, `status`, `assigned_to`, `resolution`, `created_at`) VALUES (16, 'Avaria climatització sala de reunions 3', '', 'Instal·lacions', 'Mitjana', 'Carles Homs', 'En gestió', 'David López', '', '2026-03-30 10:19:58');
INSERT INTO `incidencies` (`id`, `title`, `description`, `area`, `priority`, `author`, `status`, `assigned_to`, `resolution`, `created_at`) VALUES (17, 'Porta d''emergència bloquejada al magatzem B', '', 'Seguretat', 'Alta', 'Marta García', 'Resolta', 'Pere Soler', 'Resolt el 19/03. Es va substituir el mecanisme de tancament. Verificat per Xavier Casals.', '2026-03-30 10:19:58');
INSERT INTO `incidencies` (`id`, `title`, `description`, `area`, `priority`, `author`, `status`, `assigned_to`, `resolution`, `created_at`) VALUES (18, 'Impressora 2n pis fora de servei', '', 'Equipament', 'Baixa', 'Carles Homs', 'Oberta', 'Raül Ibáñez', '', '2026-03-30 10:19:58');
INSERT INTO `incidencies` (`id`, `title`, `description`, `area`, `priority`, `author`, `status`, `assigned_to`, `resolution`, `created_at`) VALUES (19, 'Fuita d''aire comprimit a la secció de muntatge', '', 'Instal·lacions', 'Alta', 'Marta García', 'Resolta', 'David López', 'Resolt el 14/03. Reparació d''urgència del connector pneumàtic.', '2026-03-30 10:19:58');
INSERT INTO `incidencies` (`id`, `title`, `description`, `area`, `priority`, `author`, `status`, `assigned_to`, `resolution`, `created_at`) VALUES (20, 'Senyal Wi-Fi feble al menjador', '', 'Sistemes', 'Baixa', 'Carles Homs', 'En gestió', 'Oriol Prats', '', '2026-03-30 10:19:58');
ALTER TABLE `incidencies` AUTO_INCREMENT = 21;

-- enquestes
INSERT INTO `enquestes` (`id`, `title`, `questions`, `deadline`, `creator`, `total`, `responses`, `status`, `created_at`) VALUES (13, 'Enquesta de clima laboral Q1 2026', 20, '2026-03-31', 'Laura Martí', 140, 85, 'Disponible', '2026-03-30 10:19:58');
INSERT INTO `enquestes` (`id`, `title`, `questions`, `deadline`, `creator`, `total`, `responses`, `status`, `created_at`) VALUES (14, 'Satisfacció amb el servei de menjador', 10, '2026-03-15', 'Elena Pujol', 140, 112, 'Completada', '2026-03-30 10:19:58');
INSERT INTO `enquestes` (`id`, `title`, `questions`, `deadline`, `creator`, `total`, `responses`, `status`, `created_at`) VALUES (15, 'Valoració de la formació 2025', 15, '2026-01-31', 'Laura Martí', 140, 98, 'Tancada', '2026-03-30 10:19:58');
INSERT INTO `enquestes` (`id`, `title`, `questions`, `deadline`, `creator`, `total`, `responses`, `status`, `created_at`) VALUES (16, 'Enquesta de necessitats formatives 2026', 12, '2026-04-15', 'Elena Pujol', 140, 46, 'Disponible', '2026-03-30 10:19:58');
ALTER TABLE `enquestes` AUTO_INCREMENT = 17;

-- enquesta_responses
INSERT INTO `enquesta_responses` (`id`, `enquesta_id`, `user_email`, `created_at`) VALUES (1, 13, 'unai@tavil.net', '2026-03-31 08:16:14');
INSERT INTO `enquesta_responses` (`id`, `enquesta_id`, `user_email`, `created_at`) VALUES (2, 16, 'unai@tavil.net', '2026-03-31 08:16:16');
ALTER TABLE `enquesta_responses` AUTO_INCREMENT = 3;

-- employees
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (64, 'Àlex Font', 'Director comercial', 'Comercial', 'a.font@tavil.com', '934 12 00 10', '801', 'AF', 'bg-red-400');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (65, 'Marina Torres', 'Executiva de comptes', 'Comercial', 'm.torres@tavil.com', '934 12 00 11', '802', 'MT', 'bg-pink-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (66, 'Núria Camps', 'Responsable de compres', 'Compres', 'n.camps@tavil.com', '934 12 00 20', '701', 'NC', 'bg-orange-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (67, 'Jordi Bellmunt', 'Director general', 'Direcció', 'j.bellmunt@tavil.com', '934 12 00 01', '101', 'JB', 'bg-blue-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (68, 'Carme Martínez', 'Directora financera', 'Direcció', 'c.martinez@tavil.com', '934 12 00 02', '102', 'CM', 'bg-emerald-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (69, 'Carla Vidal', 'Comptable sènior', 'Direcció', 'c.vidal@tavil.com', '934 12 00 03', '103', 'CV', 'bg-teal-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (70, 'Marc Ferrer', 'Enginyer de processos', 'Enginyeria', 'm.ferrer@tavil.com', '934 12 34 80', '601', 'MF', 'bg-violet-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (71, 'Sílvia Roca', 'Dissenyadora de producte', 'Enginyeria', 's.roca@tavil.com', '934 12 34 81', '602', 'SR', 'bg-indigo-400');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (72, 'Gerard Costa', 'Enginyer mecànic', 'Enginyeria', 'g.costa@tavil.com', '934 12 34 82', '603', 'GC', 'bg-blue-400');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (73, 'Jordi Fàbrega', 'Responsable de màrqueting', 'Màrqueting', 'j.fabrega@tavil.com', '934 12 34 90', '901', 'JF', 'bg-rose-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (74, 'Marta García', 'Responsable d''operacions', 'Operacions', 'm.garcia@tavil.com', '934 12 34 56', '301', 'MG', 'bg-red-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (75, 'Pere Soler', 'Cap de logística', 'Operacions', 'p.soler@tavil.com', '934 12 34 58', '302', 'PS', 'bg-amber-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (76, 'David López', 'Tècnic de manteniment', 'Operacions', 'd.lopez@tavil.com', '934 12 34 59', '303', 'DL', 'bg-orange-400');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (77, 'Joan Puig', 'Director de producció', 'Producció', 'j.puig@tavil.com', '934 12 34 57', '401', 'JP', 'bg-amber-600');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (78, 'Roger Bosch', 'Cap de torn – matí', 'Producció', 'r.bosch@tavil.com', '934 12 34 70', '402', 'RB', 'bg-cyan-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (79, 'Sandra Vila', 'Cap de torn – tarda', 'Producció', 's.vila@tavil.com', '934 12 34 71', '403', 'SV', 'bg-indigo-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (80, 'Laura Martí', 'Responsable de RRHH', 'Recursos humans', 'l.marti@tavil.com', '934 12 34 60', '201', 'LM', 'bg-violet-400');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (81, 'Elena Pujol', 'Tècnica de selecció', 'Recursos humans', 'e.pujol@tavil.com', '934 12 34 61', '202', 'EP', 'bg-pink-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (82, 'Pau Torrent', 'Cap de sistemes', 'Sistemes', 'p.torrent@tavil.com', '934 12 34 50', '501', 'PT', 'bg-sky-500');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (83, 'Irene Molina', 'Tècnica de sistemes', 'Sistemes', 'i.molina@tavil.com', '934 12 34 51', '502', 'IM', 'bg-cyan-600');
INSERT INTO `employees` (`id`, `name`, `role`, `dept`, `email`, `phone`, `ext`, `initials`, `color`) VALUES (84, 'Bernat Camps', 'Responsable de qualitat', 'Qualitat', 'b.camps@tavil.com', '934 12 34 40', '1001', 'BC', 'bg-green-500');
ALTER TABLE `employees` AUTO_INCREMENT = 85;

-- activities
INSERT INTO `activities` (`id`, `title`, `category`, `description`, `date`, `time`, `location`, `capacity`, `enrolled`, `past`) VALUES (25, 'Torneig de pàdel TAVIL', 'Esport', 'Competició amistosa per parelles, oberta a tots els nivells. Inclou berenar i premi als finalistes.', '5 abr 2026', '10:00 – 14:00', 'Club esportiu Mollet', 32, 24, 0);
INSERT INTO `activities` (`id`, `title`, `category`, `description`, `date`, `time`, `location`, `capacity`, `enrolled`, `past`) VALUES (26, 'Partit de futbol interempresa', 'Esport', 'Partit amistós contra l''equip de Fixaciones Ibéricas. Veniu a animar o a jugar!', '12 abr 2026', '18:00 – 20:00', 'Camp municipal de Mollet', 22, 18, 0);
INSERT INTO `activities` (`id`, `title`, `category`, `description`, `date`, `time`, `location`, `capacity`, `enrolled`, `past`) VALUES (27, 'Sortida cultural al MNAC', 'Cultura', 'Visita guiada a l''exposició temporal «Art i indústria» amb transport des de la planta.', '19 abr 2026', '09:30 – 14:00', 'Museu Nacional d''Art de Catalunya', 25, 20, 0);
INSERT INTO `activities` (`id`, `title`, `category`, `description`, `date`, `time`, `location`, `capacity`, `enrolled`, `past`) VALUES (28, 'Cursa solidària 5K', 'RSC', 'Corre per una bona causa. Recaptació destinada al Banc dels Aliments.', '26 abr 2026', '09:00 – 12:00', 'Passeig marítim de Barcelona', 50, 38, 0);
INSERT INTO `activities` (`id`, `title`, `category`, `description`, `date`, `time`, `location`, `capacity`, `enrolled`, `past`) VALUES (29, 'Sessió de ioga al parc', 'Benestar', 'Sessió de ioga per a tots els nivells al parc annex a la planta. Porta roba còmoda.', '3 mai 2026', '08:00 – 09:00', 'Parc exterior planta', 20, 12, 0);
INSERT INTO `activities` (`id`, `title`, `category`, `description`, `date`, `time`, `location`, `capacity`, `enrolled`, `past`) VALUES (30, 'Sopar d''equip primavera 2026', 'Social', 'Sopar de convivència per a tots els treballadors de TAVIL. Inclou menú i activitat de team building.', '15 mai 2026', '20:00 – 23:30', 'Restaurant Can Mollet', 120, 87, 0);
INSERT INTO `activities` (`id`, `title`, `category`, `description`, `date`, `time`, `location`, `capacity`, `enrolled`, `past`) VALUES (31, 'Jornada de voluntariat ambiental', 'RSC', 'Plantada d''arbres i neteja forestal als voltants de la planta. Activitat per a totes les edats.', '22 mar 2026', '09:00 – 13:00', 'Bosc periurbà de Mollet', 40, 40, 1);
INSERT INTO `activities` (`id`, `title`, `category`, `description`, `date`, `time`, `location`, `capacity`, `enrolled`, `past`) VALUES (32, 'Taller de cuina saludable', 'Benestar', 'Sessió pràctica amb un nutricionista per aprendre a preparar àpats equilibrats al dia a dia.', '15 mar 2026', '13:00 – 15:00', 'Menjador de planta', 20, 20, 1);
ALTER TABLE `activities` AUTO_INCREMENT = 33;

-- agenda_events
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (31, 'Comitè de direcció', 24, 3, '09:00 – 11:00', 'Sala de reunions', 'Sessió interna');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (32, 'Reunió general trimestral', 25, 3, '10:00 – 12:00', 'Auditori de planta', 'Sessió interna');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (33, 'Revisió de projectes R+D', 26, 3, '15:00 – 16:30', 'Sala d''enginyeria', 'Sessió interna');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (34, 'Taller de seguretat laboral', 27, 3, '09:00 – 13:00', 'Sala de formació', 'Sessió interna');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (35, 'Divendres Sant', 3, 4, '', '', 'Festiu');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (36, 'Formació Excel avançat', 3, 4, '10:00 – 12:00', 'Sala de formació', 'Sessió interna');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (37, 'Torneig de pàdel TAVIL', 5, 4, '10:00 – 14:00', 'Club esportiu Mollet', 'Activitat empresa');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (38, 'Dilluns de Pasqua', 6, 4, '', '', 'Festiu');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (39, 'Visita client Grupo Aldesa', 8, 4, '10:00 – 13:00', 'Planta Mollet', 'Visita comercial');
INSERT INTO `agenda_events` (`id`, `title`, `day`, `month`, `time`, `location`, `type`) VALUES (40, 'Fira Hispack Barcelona', 15, 4, '09:00 – 18:00', 'Fira de Barcelona', 'Fira');
ALTER TABLE `agenda_events` AUTO_INCREMENT = 41;

-- notices
INSERT INTO `notices` (`id`, `title`, `content`, `link`, `active`) VALUES (10, 'Tall de subministrament elèctric previst', 'Diumenge 23 de març, de 06:00 a 14:00. Afecta les plantes 1 i 2. Reviseu el protocol d''aturada.', 'Veure protocol', 1);
INSERT INTO `notices` (`id`, `title`, `content`, `link`, `active`) VALUES (11, 'Nova normativa de teletreball 2026', 'S''han actualitzat les condicions per als dies de treball remot. Consulteu els canvis a la secció de RRHH.', 'Llegir més', 1);
INSERT INTO `notices` (`id`, `title`, `content`, `link`, `active`) VALUES (12, 'Campus TAVIL: Obertes inscripcions', 'Ja pots apuntar-te als cursos d''automatització industrial per al segon trimestre.', 'Inscriure''m', 1);
ALTER TABLE `notices` AUTO_INCREMENT = 13;

-- news
INSERT INTO `news` (`id`, `category`, `title`, `summary`, `content`, `author`, `date`, `image`, `featured`, `created_at`) VALUES (13, 'Notícies corporatives', 'Nova línia de producció inaugurada a la planta de Mollet', 'La inversió de 2,3 milions d''euros permetrà augmentar la capacitat productiva un 15% durant el segon semestre de 2026.', 'La nova línia de producció, inaugurada ahir a la planta de Mollet, representa la inversió més gran de TAVIL dels últims cinc anys. Amb una capacitat addicional del 15%, l''empresa podrà respondre a la creixent demanda del mercat europeu.', 'Jordi Fàbrega', '20 mar 2026', '/assets/images/img_4.png', 1, '2026-03-30 10:19:58');
INSERT INTO `news` (`id`, `category`, `title`, `summary`, `content`, `author`, `date`, `image`, `featured`, `created_at`) VALUES (14, 'Notícies corporatives', 'Resultats del primer trimestre: creixement del 8%', 'Les vendes internacionals han impulsat els resultats per sobre de les previsions.', 'TAVIL tanca el primer trimestre de 2026 amb un creixement del 8% respecte al mateix període de l''any anterior. Les vendes internacionals han estat el principal motor de creixement, especialment al mercat alemany i francès.', 'Carme Martínez', '18 mar 2026', '/assets/images/img_7.png', 0, '2026-03-30 10:19:58');
INSERT INTO `news` (`id`, `category`, `title`, `summary`, `content`, `author`, `date`, `image`, `featured`, `created_at`) VALUES (15, 'Recursos humans', 'Convocatòria oberta per al programa de mentoria interna', 'Els treballadors interessats poden inscriure''s fins al 31 de març.', 'El Departament de Recursos Humans obre la convocatòria del programa de mentoria interna per al segon trimestre de 2026. Els treballadors amb més de dos anys d''experiència a l''empresa poden sol·licitar ser mentors.', 'Laura Martí', '15 mar 2026', '/assets/images/img_3.png', 0, '2026-03-30 10:19:58');
INSERT INTO `news` (`id`, `category`, `title`, `summary`, `content`, `author`, `date`, `image`, `featured`, `created_at`) VALUES (16, 'Seguretat', 'Actualització del protocol de seguretat en zones de càrrega', 'A partir de l''1 d''abril s''aplicaran noves mesures de seguretat.', 'El Departament de Prevenció de Riscos Laborals ha actualitzat el protocol de seguretat per a les zones de càrrega i descàrrega. Les noves mesures inclouen senyalització ampliada i l''ús obligatori d''armilles reflectants.', 'Xavier Casals', '12 mar 2026', '/assets/images/img_8.png', 0, '2026-03-30 10:19:58');
ALTER TABLE `news` AUTO_INCREMENT = 17;

-- courses
INSERT INTO `courses` (`id`, `title`, `category`, `description`, `hours`, `mandatory`, `cert`) VALUES (22, 'Prevenció i seguretat a planta', 'Seguretat', 'Formació obligatòria anual sobre prevenció de riscos laborals per a personal de planta.', '8h', 1, 0);
INSERT INTO `courses` (`id`, `title`, `category`, `description`, `hours`, `mandatory`, `cert`) VALUES (23, 'Procediments de qualitat ISO 9001', 'Qualitat', 'Formació sobre el sistema de gestió de qualitat de TAVIL segons la norma ISO 9001.', '6h', 1, 0);
INSERT INTO `courses` (`id`, `title`, `category`, `description`, `hours`, `mandatory`, `cert`) VALUES (24, 'Introducció a l''ERP (SAP Business One)', 'Sistemes', 'Curs bàsic per aprendre a navegar i utilitzar les funcions principals de l''ERP corporatiu.', '10h', 0, 0);
INSERT INTO `courses` (`id`, `title`, `category`, `description`, `hours`, `mandatory`, `cert`) VALUES (25, 'Bones pràctiques comercials', 'Comercial', 'Tècniques de venda consultiva i gestió de clients adaptades al sector industrial.', '12h', 0, 0);
INSERT INTO `courses` (`id`, `title`, `category`, `description`, `hours`, `mandatory`, `cert`) VALUES (26, 'Formació en protecció de dades (RGPD)', 'Compliance', 'Formació obligatòria sobre la normativa de protecció de dades personals.', '4h', 1, 1);
INSERT INTO `courses` (`id`, `title`, `category`, `description`, `hours`, `mandatory`, `cert`) VALUES (27, 'Manual d''acollida per a noves incorporacions', 'Acollida', 'Curs introductori per als nous treballadors amb tota la informació corporativa.', '5h', 1, 1);
INSERT INTO `courses` (`id`, `title`, `category`, `description`, `hours`, `mandatory`, `cert`) VALUES (28, 'Anglès B2 per a entorn professional', 'Idiomes', 'Millorar el nivell d''anglès per a comunicació professional escrita i oral.', '40h', 0, 0);
ALTER TABLE `courses` AUTO_INCREMENT = 29;

-- user_course_progress
INSERT INTO `user_course_progress` (`id`, `user_id`, `course_id`, `status`, `progress`) VALUES (22, 11, 22, 'En curs', 62);
INSERT INTO `user_course_progress` (`id`, `user_id`, `course_id`, `status`, `progress`) VALUES (23, 11, 23, 'Pendent', 0);
INSERT INTO `user_course_progress` (`id`, `user_id`, `course_id`, `status`, `progress`) VALUES (24, 11, 24, 'En curs', 40);
INSERT INTO `user_course_progress` (`id`, `user_id`, `course_id`, `status`, `progress`) VALUES (25, 11, 25, 'Pendent', 0);
INSERT INTO `user_course_progress` (`id`, `user_id`, `course_id`, `status`, `progress`) VALUES (26, 11, 26, 'Completat', 100);
INSERT INTO `user_course_progress` (`id`, `user_id`, `course_id`, `status`, `progress`) VALUES (27, 11, 27, 'Completat', 100);
INSERT INTO `user_course_progress` (`id`, `user_id`, `course_id`, `status`, `progress`) VALUES (28, 11, 28, 'En curs', 25);
ALTER TABLE `user_course_progress` AUTO_INCREMENT = 29;

-- solicituds
INSERT INTO `solicituds` (`id`, `date`, `comments`, `status`, `motive`, `author`, `created_at`) VALUES (2, '2026-04-01', '€€€€', 'Aprovada', '', 'unai@tavil.net', '2026-03-30 10:20:46');
INSERT INTO `solicituds` (`id`, `date`, `comments`, `status`, `motive`, `author`, `created_at`) VALUES (3, '2026-04-04', 'Moneeey moneey moneeeyyy, i just want some moneeeey', 'Denegada', 'Mmm nah', 'carleshoms@tavil.net', '2026-03-31 07:26:49');
INSERT INTO `solicituds` (`id`, `date`, `comments`, `status`, `motive`, `author`, `created_at`) VALUES (4, '2026-04-05', '€€€🙏🙏🙏', 'Aprovada', '', 'carleshoms@tavil.net', '2026-03-31 07:46:51');
INSERT INTO `solicituds` (`id`, `date`, `comments`, `status`, `motive`, `author`, `created_at`) VALUES (5, '2026-04-05', '€€€€€€€€€€€€€€€€€€€€', 'Denegada', 'per burru', 'carleshoms@tavil.net', '2026-03-31 09:06:26');
ALTER TABLE `solicituds` AUTO_INCREMENT = 6;

-- notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `body`, `tab`, `read`, `created_at`) VALUES (1, 14, 'Nova petició rebuda', 'Carles Homs ha enviat una nova petició per al 2026-04-05.', 'Solicituds', 1, '2026-03-31 07:46:51');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `body`, `tab`, `read`, `created_at`) VALUES (2, 11, 'Petició Aprovada', 'La teva petició ha estat aprovada.', 'Solicituds', 1, '2026-03-31 07:48:09');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `body`, `tab`, `read`, `created_at`) VALUES (3, 14, 'Nova petició rebuda', 'Carles Homs ha enviat una nova petició per al 2026-04-05.', 'Solicituds', 1, '2026-03-31 09:06:26');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `body`, `tab`, `read`, `created_at`) VALUES (4, 11, 'Petició Denegada', 'La teva petició ha estat denegada. Motiu: per burru', 'Solicituds', 0, '2026-03-31 09:07:04');
ALTER TABLE `notifications` AUTO_INCREMENT = 5;

SET FOREIGN_KEY_CHECKS = 1;
