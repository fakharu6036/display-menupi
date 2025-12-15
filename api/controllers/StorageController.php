<?php
// Storage Controller

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/response.php';

class StorageController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * GET /api/storage/usage
     * Get total storage usage for the authenticated user's restaurant
     */
    public function getStorageUsage() {
        try {
            // Authenticate user
            $user = authenticateToken();
            if (!$user) {
                http_response_code(401);
                jsonResponse(['success' => false, 'error' => 'Unauthorized']);
                return;
            }

            $restaurantId = $user['restaurant_id'] ?? $user['restaurantId'] ?? null;
            if (!$restaurantId) {
                http_response_code(401);
                jsonResponse(['success' => false, 'error' => 'Restaurant ID missing']);
                return;
            }

            // Get total storage usage
            $result = $this->db->fetchOne(
                'SELECT SUM(file_size_mb) as total_mb FROM media WHERE restaurant_id = ?',
                [$restaurantId]
            );

            $totalMB = $result ? (float)($result['total_mb'] ?? 0) : 0;

            jsonResponse(['usedMB' => $totalMB]);
        } catch (Exception $e) {
            http_response_code(500);
            jsonResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    /**
     * GET /api/storage/breakdown
     * Get storage breakdown by file type
     */
    public function getStorageBreakdown() {
        try {
            // Authenticate user
            $user = authenticateToken();
            if (!$user) {
                http_response_code(401);
                jsonResponse(['success' => false, 'error' => 'Unauthorized']);
                return;
            }

            $restaurantId = $user['restaurant_id'] ?? $user['restaurantId'] ?? null;
            if (!$restaurantId) {
                http_response_code(401);
                jsonResponse(['success' => false, 'error' => 'Restaurant ID missing']);
                return;
            }

            // Get storage breakdown by file type
            $rows = $this->db->fetchAll(
                'SELECT file_type, SUM(file_size_mb) as total_mb 
                 FROM media 
                 WHERE restaurant_id = ? 
                 GROUP BY file_type',
                [$restaurantId]
            );

            $breakdown = [
                'image' => 0,
                'video' => 0,
                'pdf' => 0,
                'gif' => 0,
                'other' => 0
            ];

            foreach ($rows as $row) {
                $type = strtolower($row['file_type'] ?? 'other');
                if (isset($breakdown[$type])) {
                    $breakdown[$type] = (float)($row['total_mb'] ?? 0);
                } else {
                    $breakdown['other'] += (float)($row['total_mb'] ?? 0);
                }
            }

            jsonResponse($breakdown);
        } catch (Exception $e) {
            http_response_code(500);
            jsonResponse(['success' => false, 'error' => $e->getMessage()]);
        }
    }
}

