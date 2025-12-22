-- Device Table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    screen_id INTEGER,
    device_name VARCHAR(128),
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Public Player Code Table
CREATE TABLE IF NOT EXISTS public_player_codes (
    id SERIAL PRIMARY KEY,
    screen_id INTEGER NOT NULL,
    code VARCHAR(16) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device Pairing History Table (optional)
CREATE TABLE IF NOT EXISTS device_pairing_history (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL,
    screen_id INTEGER NOT NULL,
    paired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(16) -- 'qr', 'manual', 'public_code'
);
