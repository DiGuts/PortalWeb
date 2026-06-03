CREATE TABLE IF NOT EXISTS `course_certificates` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `user_id`     INT           NOT NULL,
  `course_id`   INT           NOT NULL,
  `filename`    VARCHAR(255)  NOT NULL COMMENT 'Server-generated safe filename',
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `is_active`   TINYINT       NOT NULL DEFAULT 1 COMMENT '0 = superseded by re-upload',
  `uploaded_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME      NULL DEFAULT NULL,
  `reviewed_by` INT           NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cert_user_course` (`user_id`, `course_id`),
  KEY `idx_cert_status_active` (`status`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
