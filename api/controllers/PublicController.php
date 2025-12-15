<?php
// Public Controller (No Auth Required)

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../config/config.php';

class PublicController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function health() {
        try {
            $dbStatus = 'connected';
            try {
                $this->db->query('SELECT 1');
            } catch (Exception $e) {
                $dbStatus = 'disconnected';
            }
            
            successResponse([
                'status' => 'ok',
                'timestamp' => date('c'),
                'database' => $dbStatus
            ]);
        } catch (Exception $e) {
            errorResponse('Health check failed', 500);
        }
    }
    
    public function getScreen($code) {
        try {
            $code = strtoupper($code);
            
            $screen = $this->db->fetchOne(
                'SELECT s.*, r.plan, r.account_status 
                 FROM screens s 
                 JOIN restaurants r ON s.restaurant_id = r.id 
                 WHERE s.screen_code = ?',
                [$code]
            );
            
            if (!$screen) {
                errorResponse('Screen not found', 404);
            }
            
            // Check if screen is archived or disabled
            $isArchived = isset($screen['status']) && $screen['status'] === 'archived' 
                      || isset($screen['is_archived']) && ($screen['is_archived'] == 1 || $screen['is_archived'] === true);
            $isDisabled = isset($screen['is_disabled']) && ($screen['is_disabled'] == 1 || $screen['is_disabled'] === true);
            
            $plan = $screen['plan'] ?? 'free';
            $requiresBranding = $plan === 'free';
            
            $playerConfig = [
                'branding' => $requiresBranding,
                'controls' => [
                    'fullscreen' => true,
                    'reload' => true,
                    'showCode' => true
                ]
            ];
            
            // If archived or disabled, return special state
            if ($isArchived || $isDisabled) {
                successResponse([
                    'id' => (string)$screen['id'],
                    'screenCode' => $screen['screen_code'],
                    'name' => $screen['name'],
                    'status' => $isArchived ? 'archived' : 'disabled',
                    'accountStatus' => $screen['account_status'],
                    'plan' => $plan,
                    'config' => $playerConfig,
                    'playlist' => [],
                    'message' => $isArchived 
                        ? 'This screen is currently archived. Please reactivate your plan to restore playback.'
                        : 'This screen has been disabled by an administrator.'
                ]);
            }
            
            // Fetch playlist items
            $playlistItems = [];
            try {
                $playlistItems = $this->db->fetchAll(
                    'SELECT sm.*, m.file_path, m.file_type, m.source, m.file_name
                     FROM screen_media sm 
                     JOIN media m ON sm.media_id = m.id 
                     WHERE sm.screen_id = ?
                     ORDER BY sm.display_order ASC, sm.id ASC',
                    [$screen['id']]
                );
            } catch (Exception $e) {
                // Fallback if display_order doesn't exist
                $playlistItems = $this->db->fetchAll(
                    'SELECT sm.*, m.file_path, m.file_type, m.source, m.file_name
                     FROM screen_media sm 
                     JOIN media m ON sm.media_id = m.id 
                     WHERE sm.screen_id = ?
                     ORDER BY sm.id ASC',
                    [$screen['id']]
                );
            }
            
            // Fetch all media for this restaurant
            $mediaRows = $this->db->fetchAll(
                'SELECT * FROM media WHERE restaurant_id = ?',
                [$screen['restaurant_id']]
            );
            
            $baseUrl = BASE_URL;
            
            $playlist = array_map(function($item) {
                return [
                    'id' => (string)$item['id'],
                    'mediaId' => (string)$item['media_id'],
                    'duration' => (int)($item['play_value'] ?? 10),
                    'order' => (int)($item['display_order'] ?? 0),
                    'playbackConfig' => [
                        'mode' => ($item['play_mode'] === 'seconds') ? 'duration' : 'times',
                        'duration' => (int)($item['play_value'] ?? 10),
                        'scheduleType' => 'always'
                    ]
                ];
            }, $playlistItems);
            
            // Normalize media URLs
            $media = array_map(function($row) use ($baseUrl) {
                // Normalize the URL to fix any old localhost URLs in the database
                if ($row['source'] === 'upload') {
                    // Check if file_path is already a full URL or just a path
                    if (strpos($row['file_path'], 'http://') === 0 || strpos($row['file_path'], 'https://') === 0) {
                        // It's a full URL - normalize it
                        if (strpos($row['file_path'], 'localhost:3000') !== false || 
                            strpos($row['file_path'], 'localhost:3001') !== false || 
                            strpos($row['file_path'], '127.0.0.1') !== false) {
                            // Extract path and rebuild with correct base URL
                            $parsed = parse_url($row['file_path']);
                            $path = $parsed['path'] ?? '';
                            $url = $baseUrl . (substr($path, 0, 1) === '/' ? $path : '/' . $path);
                        } else {
                            // Already a proper production URL
                            $url = $row['file_path'];
                        }
                    } else {
                        // It's just a path - construct full URL
                        $cleanPath = (substr($row['file_path'], 0, 1) === '/') ? $row['file_path'] : '/' . $row['file_path'];
                        $url = $baseUrl . $cleanPath;
                    }
                } else {
                    // External URLs (YouTube, etc.) - return as-is
                    $url = $row['file_path'];
                }
                
                return [
                    'id' => (string)$row['id'],
                    'url' => $url,
                    'name' => $row['file_name'],
                    'type' => $row['file_type'],
                    'size' => $row['file_size_mb'] . ' MB',
                    'duration' => 10,
                    'createdAt' => strtotime($row['created_at']) * 1000,
                    'sourceProvider' => ($row['source'] === 'upload') ? null : $row['source']
                ];
            }, $mediaRows);
            
            $updatedAt = isset($screen['updated_at']) && $screen['updated_at'] 
                ? strtotime($screen['updated_at']) * 1000 
                : strtotime($screen['created_at']) * 1000;
            
            successResponse([
                'id' => (string)$screen['id'],
                'screenCode' => $screen['screen_code'],
                'name' => $screen['name'],
                'orientation' => ($screen['orientation'] === 'horizontal') ? 'landscape' : 'portrait',
                'aspectRatio' => $screen['aspect_ratio'] ?? '16:9',
                'displayMode' => ($screen['display_mode'] === 'fit') ? 'contain' : ($screen['display_mode'] ?? 'contain'),
                'playlist' => $playlist,
                'media' => $media,
                'createdAt' => strtotime($screen['created_at']) * 1000,
                'updatedAt' => $updatedAt,
                'lastPing' => isset($screen['last_seen_at']) && $screen['last_seen_at'] 
                    ? strtotime($screen['last_seen_at']) * 1000 
                    : null,
                'plan' => $plan,
                'config' => $playerConfig
            ]);
        } catch (Exception $e) {
            error_log('Get screen error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
    
    public function pingScreen($screenId) {
        try {
            $this->db->execute(
                'UPDATE screens SET last_seen_at = NOW() WHERE id = ?',
                [$screenId]
            );
            
            successResponse(['message' => 'Ping received']);
        } catch (Exception $e) {
            error_log('Ping screen error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
}

