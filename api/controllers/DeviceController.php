<?php
// DeviceController for TV pairing, management, and public player code
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

class DeviceController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }
    public function pair() {
        $user = authenticateToken();
        $input = json_decode(file_get_contents('php://input'), true);
        $device_id = $input['device_id'] ?? null;
        $screen_id = $input['screen_id'] ?? null;
        $public_code = $input['public_code'] ?? null;

        if (!$device_id || (!$screen_id && !$public_code)) {
            errorResponse('Missing device_id and screen_id or public_code', 400);
        }

        // If public_code provided, resolve to screen_id
        if ($public_code) {
            $codeRow = $this->db->fetchOne('SELECT * FROM public_player_codes WHERE code = ? AND active = 1 AND (expires_at IS NULL OR expires_at > NOW())', [$public_code]);
            if (!$codeRow) errorResponse('Invalid or expired public code', 400);
            $screen_id = $codeRow['screen_id'];
        }

        // Check user owns the screen
        $screen = $this->db->fetchOne('SELECT * FROM screens WHERE id = ? AND user_id = ?', [$screen_id, $user['id']]);
        if (!$screen) errorResponse('Screen not found or not owned by user', 403);

        // Remove any existing mapping for this device_id
        $this->db->execute('DELETE FROM devices WHERE device_id = ?', [$device_id]);

        // Save new mapping
        $this->db->execute('INSERT INTO devices (device_id, user_id, screen_id, last_active, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW(), NOW())', [$device_id, $user['id'], $screen_id]);

        successResponse(['message' => 'This TV is now connected to ' . $screen['name'], 'screen' => $screen['name']]);
    }

    public function listDevices() {
        $user = authenticateToken();
        $devices = $this->db->fetchAll('SELECT d.device_id, d.device_name, d.last_active, s.name as screen_name, s.id as screen_id FROM devices d LEFT JOIN screens s ON d.screen_id = s.id WHERE d.user_id = ?', [$user['id']]);
        successResponse(['devices' => $devices]);
    }


    public function reassign($device_id) {
        $user = authenticateToken();
        $input = json_decode(file_get_contents('php://input'), true);
        $screen_id = $input['screen_id'] ?? null;
        if (!$screen_id) errorResponse('Missing screen_id', 400);

        // Check user owns the screen
        $screen = $this->db->fetchOne('SELECT * FROM screens WHERE id = ? AND user_id = ?', [$screen_id, $user['id']]);
        if (!$screen) errorResponse('Screen not found or not owned by user', 403);

        // Update device mapping
        $updated = $this->db->execute('UPDATE devices SET screen_id = ?, updated_at = NOW() WHERE device_id = ? AND user_id = ?', [$screen_id, $device_id, $user['id']]);
        if (!$updated) errorResponse('Device not found or not owned by user', 404);

        successResponse(['message' => 'Device reassigned to ' . $screen['name']]);
    }


    public function disconnect($device_id) {
        $user = authenticateToken();
        $updated = $this->db->execute('UPDATE devices SET screen_id = NULL, updated_at = NOW() WHERE device_id = ? AND user_id = ?', [$device_id, $user['id']]);
        if (!$updated) errorResponse('Device not found or not owned by user', 404);
        successResponse(['message' => 'Device disconnected']);
    }


    public function regeneratePublicCode($screen_id) {
        $user = authenticateToken();
        // Check user owns the screen
        $screen = $this->db->fetchOne('SELECT * FROM screens WHERE id = ? AND user_id = ?', [$screen_id, $user['id']]);
        if (!$screen) errorResponse('Screen not found or not owned by user', 403);

        // Expire old codes after 7 days (grace period)
        $this->db->execute('UPDATE public_player_codes SET expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY), active = 0 WHERE screen_id = ? AND active = 1', [$screen_id]);

        // Generate new code
        $new_code = strtoupper(bin2hex(random_bytes(3)));
        $this->db->execute('INSERT INTO public_player_codes (screen_id, code, active, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())', [$screen_id, $new_code]);

        successResponse(['message' => 'New public player code generated', 'code' => $new_code]);
    }


    public function listPublicPlayerDevices($screen_id) {
        $user = authenticateToken();
        // Check user owns the screen
        $screen = $this->db->fetchOne('SELECT * FROM screens WHERE id = ? AND user_id = ?', [$screen_id, $user['id']]);
        if (!$screen) errorResponse('Screen not found or not owned by user', 403);

        $devices = $this->db->fetchAll('SELECT device_id, device_name, last_active FROM devices WHERE screen_id = ?', [$screen_id]);
        successResponse(['devices' => $devices]);
    }
}
