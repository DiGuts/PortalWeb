ALTER TABLE users
    ADD COLUMN IF NOT EXISTS requires_prl TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS epi_grup VARCHAR(5) NULL;

CREATE TABLE IF NOT EXISTS prevention_signatures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_key VARCHAR(50) NOT NULL,
    signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature_data MEDIUMTEXT NOT NULL,
    UNIQUE KEY uq_user_doc (user_id, document_key),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
