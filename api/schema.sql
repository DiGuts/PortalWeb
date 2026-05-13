-- TAVIL Portal — MariaDB Schema
-- Run: mysql -u <user> -p <dbname> < schema.sql

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id`             INT          NOT NULL AUTO_INCREMENT,
  `name`           TEXT         NOT NULL,
  `email`          VARCHAR(255) NOT NULL,
  `password`       TEXT         NOT NULL,
  `role`           VARCHAR(100) NOT NULL DEFAULT 'Treballador/a',
  `dept`           VARCHAR(100) NOT NULL DEFAULT 'General',
  `phone`          VARCHAR(50)  NOT NULL DEFAULT '',
  `ext`            VARCHAR(20)  NOT NULL DEFAULT '',
  `location`       VARCHAR(100) NOT NULL DEFAULT '',
  `email_verified` TINYINT      NOT NULL DEFAULT 1,
  `onboarded`      TINYINT      NOT NULL DEFAULT 0,
  `email_notifs`   TINYINT      NOT NULL DEFAULT 1,
  `is_head`        TINYINT      NOT NULL DEFAULT 0,
  `must_change_password` TINYINT NOT NULL DEFAULT 0,
  `created_at`     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `email`      VARCHAR(255) NOT NULL,
  `code`       VARCHAR(64)  NOT NULL,
  `purpose`    VARCHAR(20)  NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
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

CREATE TABLE IF NOT EXISTS `suggestion_votes` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `suggestion_id` INT          NOT NULL,
  `user_id`       INT          NOT NULL,
  `vote_type`     VARCHAR(10)  NOT NULL DEFAULT 'up',
  `created_at`    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vote` (`suggestion_id`, `user_id`)
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
  UNIQUE KEY `uq_enquesta_response` (`enquesta_id`, `user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `employees` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `name`     TEXT         NOT NULL,
  `role`     VARCHAR(100) NOT NULL DEFAULT '',
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
  `date`        VARCHAR(20)  NOT NULL DEFAULT '',
  `time`        VARCHAR(20)  NOT NULL DEFAULT '',
  `location`    VARCHAR(255) NOT NULL DEFAULT '',
  `capacity`    INT          NOT NULL DEFAULT 0,
  `enrolled`    INT          NOT NULL DEFAULT 0,
  `past`        TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `agenda_events` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `title`    VARCHAR(255) NOT NULL,
  `day`      INT          NOT NULL,
  `month`    INT          NOT NULL,
  `time`     VARCHAR(20)  NOT NULL DEFAULT '',
  `location` VARCHAR(255) NOT NULL DEFAULT '',
  `type`     VARCHAR(100) NOT NULL DEFAULT 'Sessió interna',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_event` (`title`, `day`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `notices` (
  `id`      INT  NOT NULL AUTO_INCREMENT,
  `title`   TEXT NOT NULL,
  `content` TEXT NOT NULL DEFAULT '',
  `link`    TEXT NOT NULL DEFAULT '',
  `active`  TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `news` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `category`   VARCHAR(100) NOT NULL DEFAULT '',
  `title`      TEXT         NOT NULL,
  `summary`    TEXT         NOT NULL DEFAULT '',
  `content`    LONGTEXT     NOT NULL DEFAULT '',
  `author`     VARCHAR(255) NOT NULL DEFAULT '',
  `date`       VARCHAR(20)  NOT NULL DEFAULT '',
  `image`      TEXT         NOT NULL DEFAULT '',
  `featured`   TINYINT      NOT NULL DEFAULT 0,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `courses` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `title`       TEXT         NOT NULL,
  `category`    VARCHAR(100) NOT NULL DEFAULT '',
  `description` TEXT         NOT NULL DEFAULT '',
  `hours`       VARCHAR(20)  NOT NULL DEFAULT '',
  `mandatory`   TINYINT      NOT NULL DEFAULT 0,
  `cert`        TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `user_course_progress` (
  `id`        INT         NOT NULL AUTO_INCREMENT,
  `user_id`   INT         NOT NULL,
  `course_id` INT         NOT NULL,
  `status`    VARCHAR(50) NOT NULL DEFAULT 'Pendent',
  `progress`  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_course` (`user_id`, `course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `solicituds` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `date`       VARCHAR(20)  NOT NULL,
  `comments`   TEXT         NOT NULL DEFAULT '',
  `status`     VARCHAR(50)  NOT NULL DEFAULT 'Pendent',
  `motive`     TEXT         NOT NULL DEFAULT '',
  `author`     VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `vacances` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `user_id`      INT          NOT NULL,
  `author_name`  VARCHAR(255) NOT NULL DEFAULT '',
  `author_dept`  VARCHAR(100) NOT NULL DEFAULT '',
  `start_date`   VARCHAR(20)  NOT NULL,
  `end_date`     VARCHAR(20)  NOT NULL,
  `comments`     TEXT         NOT NULL DEFAULT '',
  `status`       VARCHAR(50)  NOT NULL DEFAULT 'Pendent',
  `head_status`  VARCHAR(50)  NOT NULL DEFAULT 'Pendent',
  `head_comment` TEXT         NOT NULL DEFAULT '',
  `rrhh_status`  VARCHAR(50)  NOT NULL DEFAULT 'Pendent',
  `rrhh_comment` TEXT         NOT NULL DEFAULT '',
  `created_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `title`      TEXT         NOT NULL,
  `body`       TEXT         NOT NULL DEFAULT '',
  `tab`        VARCHAR(100) NOT NULL DEFAULT '',
  `read`       TINYINT      NOT NULL DEFAULT 0,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `quiz_progress` (
  `user_id`              INT      NOT NULL,
  `quiz_id`              INT      NOT NULL,
  `current_question_idx` INT      NOT NULL DEFAULT 0,
  `answers_json`         LONGTEXT NOT NULL,
  `updated_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `quiz_id`),
  KEY `idx_quiz_progress_user` (`user_id`),
  KEY `idx_quiz_progress_quiz` (`quiz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
