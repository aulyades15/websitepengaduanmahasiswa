-- ============================================
-- DATABASE SCHEMA: Sistem Pengaduan Mahasiswa
-- UIN K.H. Abdurrahman Wahid Pekalongan
-- PostgreSQL version
-- ============================================

-- Drop tables if exist (for fresh install)
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS performance_metrics CASCADE;
DROP TABLE IF EXISTS feedback_analysis CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS chat_attachments CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS status_history CASCADE;
DROP TABLE IF EXISTS lampiran CASCADE;
DROP TABLE IF EXISTS pengaduan CASCADE;
DROP TABLE IF EXISTS kategori_unit_mapping CASCADE;
DROP TABLE IF EXISTS faq CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS unit_penanganan CASCADE;
DROP TABLE IF EXISTS kategori_pengaduan CASCADE;
DROP TABLE IF EXISTS prodi CASCADE;
DROP TABLE IF EXISTS fakultas CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    nim VARCHAR(12) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    prodi_id INT,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'mahasiswa' CHECK (role IN ('mahasiswa', 'admin', 'pimpinan', 'unit')),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_nim ON users(nim);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. SESSIONS
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- 3. PASSWORD RESETS
CREATE TABLE password_resets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. FAKULTAS
CREATE TABLE fakultas (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(10) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODI
CREATE TABLE prodi (
    id SERIAL PRIMARY KEY,
    fakultas_id INT NOT NULL REFERENCES fakultas(id),
    kode VARCHAR(10) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    jenjang VARCHAR(10) CHECK (jenjang IN ('D3', 'S1', 'S2', 'S3')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. KATEGORI PENGADUAN
CREATE TABLE kategori_pengaduan (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) UNIQUE NOT NULL,
    deskripsi TEXT,
    icon VARCHAR(50),
    is_urgent_default BOOLEAN DEFAULT FALSE,
    sla_hours INT DEFAULT 48,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. UNIT PENANGANAN
CREATE TABLE unit_penanganan (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) UNIQUE NOT NULL,
    deskripsi TEXT,
    email VARCHAR(100),
    phone VARCHAR(20),
    pic_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. KATEGORI UNIT MAPPING
CREATE TABLE kategori_unit_mapping (
    id SERIAL PRIMARY KEY,
    kategori_id INT NOT NULL REFERENCES kategori_pengaduan(id),
    unit_id INT NOT NULL REFERENCES unit_penanganan(id),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kategori_id, unit_id)
);

-- 9. PENGADUAN
CREATE TABLE pengaduan (
    id BIGSERIAL PRIMARY KEY,
    kode_pengaduan VARCHAR(20) UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    is_anonim BOOLEAN DEFAULT FALSE,
    judul VARCHAR(200) NOT NULL,
    deskripsi TEXT NOT NULL,
    kategori_id INT NOT NULL REFERENCES kategori_pengaduan(id),
    lokasi VARCHAR(200),
    status VARCHAR(20) DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'diproses', 'selesai', 'ditolak', 'tertunda')),
    is_urgent BOOLEAN DEFAULT FALSE,
    urgency_level VARCHAR(20) DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
    unit_id INT REFERENCES unit_penanganan(id),
    assigned_to BIGINT REFERENCES users(id),
    assigned_at TIMESTAMP,
    sla_target_hours INT DEFAULT 48,
    sla_deadline TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by BIGINT REFERENCES users(id),
    resolution_note TEXT,
    rejected_at TIMESTAMP,
    rejected_by BIGINT REFERENCES users(id),
    rejection_reason TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    rated_at TIMESTAMP,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_pengaduan_kode ON pengaduan(kode_pengaduan);
CREATE INDEX idx_pengaduan_user ON pengaduan(user_id);
CREATE INDEX idx_pengaduan_status ON pengaduan(status);
CREATE INDEX idx_pengaduan_urgent ON pengaduan(is_urgent);
CREATE INDEX idx_pengaduan_kategori ON pengaduan(kategori_id);
CREATE INDEX idx_pengaduan_unit ON pengaduan(unit_id);
CREATE INDEX idx_pengaduan_created ON pengaduan(created_at DESC);
CREATE INDEX idx_pengaduan_sla ON pengaduan(sla_deadline);

-- 10. LAMPIRAN
CREATE TABLE lampiran (
    id BIGSERIAL PRIMARY KEY,
    pengaduan_id BIGINT NOT NULL REFERENCES pengaduan(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    file_type VARCHAR(20) CHECK (file_type IN ('image', 'document', 'video', 'audio', 'other')),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_lampiran_pengaduan ON lampiran(pengaduan_id);

-- 11. CHAT MESSAGES
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    pengaduan_id BIGINT NOT NULL REFERENCES pengaduan(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('mahasiswa', 'admin', 'unit', 'system')),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_pengaduan ON chat_messages(pengaduan_id);
CREATE INDEX idx_chat_created ON chat_messages(created_at);

-- 12. CHAT ATTACHMENTS
CREATE TABLE chat_attachments (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. STATUS HISTORY
CREATE TABLE status_history (
    id BIGSERIAL PRIMARY KEY,
    pengaduan_id BIGINT NOT NULL REFERENCES pengaduan(id) ON DELETE CASCADE,
    status_from VARCHAR(20),
    status_to VARCHAR(20) NOT NULL,
    changed_by BIGINT NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_status_history_pengaduan ON status_history(pengaduan_id);

-- 14. AUDIT LOG
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- 15. NOTIFICATIONS
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pengaduan_id BIGINT REFERENCES pengaduan(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'pengaduan_baru', 'status_berubah', 'chat_baru', 
        'assigned', 'deadline_mendekat', 'overdue',
        'rating_request', 'resolved', 'rejected'
    )),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- 16. NOTIFICATION PREFERENCES
CREATE TABLE notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) CHECK (channel IN ('email', 'whatsapp', 'push', 'sms')),
    notification_type VARCHAR(50),
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, channel, notification_type)
);

-- 17. MESSAGE TEMPLATES
CREATE TABLE message_templates (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    kategori_id INT REFERENCES kategori_pengaduan(id),
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. PERFORMANCE METRICS
CREATE TABLE performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    unit_id INT REFERENCES unit_penanganan(id),
    kategori_id INT REFERENCES kategori_pengaduan(id),
    total_pengaduan INT DEFAULT 0,
    pengaduan_menunggu INT DEFAULT 0,
    pengaduan_diproses INT DEFAULT 0,
    pengaduan_selesai INT DEFAULT 0,
    pengaduan_ditolak INT DEFAULT 0,
    avg_response_hours DECIMAL(10,2),
    avg_resolution_hours DECIMAL(10,2),
    overdue_count INT DEFAULT 0,
    urgent_count INT DEFAULT 0,
    avg_rating DECIMAL(3,2),
    rating_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (metric_date, unit_id, kategori_id)
);

-- 19. FEEDBACK ANALYSIS
CREATE TABLE feedback_analysis (
    id BIGSERIAL PRIMARY KEY,
    pengaduan_id BIGINT NOT NULL REFERENCES pengaduan(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    feedback TEXT,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    keywords JSONB,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. SYSTEM SETTINGS
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    value_type VARCHAR(20) CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. FAQ
CREATE TABLE faq (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    kategori_id INT REFERENCES kategori_pengaduan(id),
    view_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. WEBHOOKS
CREATE TABLE webhooks (
    id BIGSERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    events JSONB NOT NULL,
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-generate kode_pengaduan
CREATE OR REPLACE FUNCTION generate_kode_pengaduan()
RETURNS TRIGGER AS $$
DECLARE
    prefix VARCHAR(10);
    seq_num INT;
    new_kode VARCHAR(20);
BEGIN
    prefix := 'PM-' || TO_CHAR(CURRENT_DATE, 'DDMM');
    SELECT COUNT(*) + 1 INTO seq_num
    FROM pengaduan
    WHERE kode_pengaduan LIKE prefix || '-%';
    new_kode := prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
    NEW.kode_pengaduan := new_kode;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_kode
BEFORE INSERT ON pengaduan
FOR EACH ROW
WHEN (NEW.kode_pengaduan IS NULL)
EXECUTE FUNCTION generate_kode_pengaduan();

-- Auto-set SLA deadline and urgent flag
CREATE OR REPLACE FUNCTION set_sla_deadline()
RETURNS TRIGGER AS $$
DECLARE
    cat_urgent BOOLEAN;
    cat_sla INT;
BEGIN
    -- Get category defaults
    SELECT is_urgent_default, sla_hours INTO cat_urgent, cat_sla
    FROM kategori_pengaduan WHERE id = NEW.kategori_id;
    
    -- Set urgent flag based on category if not explicitly set
    IF cat_urgent = TRUE AND NEW.is_urgent = FALSE THEN
        NEW.is_urgent := TRUE;
    END IF;
    
    -- Set SLA target hours
    IF cat_urgent = TRUE THEN
        NEW.sla_target_hours := COALESCE(cat_sla, 24);
    ELSE
        NEW.sla_target_hours := COALESCE(NEW.sla_target_hours, cat_sla, 48);
    END IF;
    
    NEW.sla_deadline := NEW.created_at + (NEW.sla_target_hours || ' hours')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_sla
BEFORE INSERT ON pengaduan
FOR EACH ROW
EXECUTE FUNCTION set_sla_deadline();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pengaduan_updated_at
BEFORE UPDATE ON pengaduan
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW v_pengaduan_dashboard AS
SELECT 
    p.id,
    p.kode_pengaduan,
    p.judul,
    p.status,
    p.is_urgent,
    p.is_anonim,
    p.rating,
    p.created_at,
    p.sla_deadline,
    CASE 
        WHEN p.status IN ('selesai', 'ditolak') THEN FALSE
        WHEN p.sla_deadline < NOW() THEN TRUE
        ELSE FALSE
    END AS is_overdue,
    u.nim,
    u.nama AS pelapor_nama,
    k.nama AS kategori_nama,
    k.icon AS kategori_icon,
    un.nama AS unit_nama,
    ROUND(EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600, 1) AS hours_since_created,
    ROUND(EXTRACT(EPOCH FROM (p.sla_deadline - NOW()))/3600, 1) AS hours_until_deadline
FROM pengaduan p
JOIN users u ON p.user_id = u.id
JOIN kategori_pengaduan k ON p.kategori_id = k.id
LEFT JOIN unit_penanganan un ON p.unit_id = un.id;

-- ============================================
-- INITIAL DATA (SEED)
-- ============================================

-- Fakultas
INSERT INTO fakultas (kode, nama) VALUES
('FTI', 'Fakultas Teknologi Informasi'),
('FAI', 'Fakultas Agama Islam'),
('FEBI', 'Fakultas Ekonomi dan Bisnis Islam'),
('FUAD', 'Fakultas Ushuluddin dan Dakwah');

-- Prodi
INSERT INTO prodi (fakultas_id, kode, nama, jenjang) VALUES
(1, 'TI', 'Teknik Informatika', 'S1'),
(1, 'SI', 'Sistem Informasi', 'S1'),
(2, 'PAI', 'Pendidikan Agama Islam', 'S1'),
(2, 'HKI', 'Hukum Keluarga Islam', 'S1'),
(3, 'ES', 'Ekonomi Syariah', 'S1'),
(3, 'MZW', 'Manajemen Zakat dan Wakaf', 'S1'),
(4, 'KPI', 'Komunikasi dan Penyiaran Islam', 'S1');

-- Kategori
INSERT INTO kategori_pengaduan (nama, deskripsi, icon, is_urgent_default, sla_hours) VALUES
('Akademik', 'Masalah terkait perkuliahan, nilai, dosen', '📚', FALSE, 48),
('Fasilitas', 'Infrastruktur kampus, ruang kelas, toilet', '🏫', FALSE, 48),
('Keuangan', 'UKT, beasiswa, pembayaran', '💰', FALSE, 48),
('Dosen', 'Keluhan atau saran terkait dosen', '👨‍🏫', FALSE, 48),
('Bullying', 'Perundungan, kekerasan, diskriminasi', '🚨', TRUE, 24);

-- Unit Penanganan
INSERT INTO unit_penanganan (nama, deskripsi, email) VALUES
('Bagian Akademik', 'Menangani masalah akademik mahasiswa', 'akademik@uingusdur.ac.id'),
('Sarana & Prasarana', 'Menangani fasilitas kampus', 'sarpras@uingusdur.ac.id'),
('Bagian Keuangan', 'Menangani masalah keuangan', 'keuangan@uingusdur.ac.id'),
('Wakil Dekan I', 'Menangani masalah dosen', 'wadek1@uingusdur.ac.id'),
('Satgas Kekerasan Kampus', 'Menangani kasus bullying & kekerasan', 'satgas@uingusdur.ac.id');

-- Kategori Unit Mapping
INSERT INTO kategori_unit_mapping (kategori_id, unit_id, is_default) VALUES
(1, 1, TRUE),
(2, 2, TRUE),
(3, 3, TRUE),
(4, 4, TRUE),
(5, 5, TRUE);

-- System Settings
INSERT INTO system_settings (key, value, value_type, description, is_public) VALUES
('site_name', 'Pengaduan Mahasiswa UIN Gus Dur', 'string', 'Nama aplikasi', TRUE),
('sla_default_hours', '48', 'number', 'Target SLA default (jam)', FALSE),
('sla_urgent_hours', '24', 'number', 'Target SLA untuk kasus urgent', FALSE),
('max_file_size_mb', '10', 'number', 'Maksimal ukuran file upload (MB)', TRUE),
('allowed_file_types', '["jpg","jpeg","png","pdf","doc","docx"]', 'json', 'Tipe file yang diizinkan', TRUE);

-- FAQ
INSERT INTO faq (question, answer, sort_order) VALUES
('Berapa lama pengaduan saya diproses?', 'Maksimal 2x24 jam kerja (48 jam) untuk pengaduan normal, dan 24 jam untuk kasus mendesak seperti bullying.', 1),
('Apakah saya bisa mengirim pengaduan tanpa nama?', 'Ya, Anda bisa memilih opsi anonim saat mengirim pengaduan. Nama dan NIM tidak akan ditampilkan ke admin, namun tetap tersimpan di sistem untuk keperluan notifikasi.', 2),
('Bagaimana cara melacak status pengaduan saya?', 'Login ke akun Anda, lalu buka menu "Riwayat Pengaduan". Anda akan melihat semua pengaduan beserta statusnya. Anda juga akan menerima notifikasi setiap ada update.', 3);

-- ============================================
-- END OF SCHEMA
-- ============================================