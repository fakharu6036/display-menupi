<?php
// Screen Controller

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/crypto.php';
require_once __DIR__ . '/../middleware/auth.php';

class ScreenController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function listScreens() {
        $user = authenticateToken();
        
        try {
            $screens = $this->db->fetchAll(
                'SELECT * FROM screens WHERE restaurant_id = ?',
                [$user['restaurantId']]
            );
            
            $result = [];
            foreach ($screens as $screen) {
                // Fetch playlist items
                try {
                    $playlistItems = $this->db->fetchAll(
                        'SELECT sm.*, m.file_path, m.file_type, m.source 
                         FROM screen_media sm 
                         JOIN media m ON sm.media_id = m.id 
                         WHERE sm.screen_id = ?
                         ORDER BY sm.display_order ASC, sm.id ASC',
                        [$screen['id']]
                    );
                } catch (Exception $e) {
                    // Fallback if display_order doesn't exist
                    $playlistItems = $this->db->fetchAll(
                        'SELECT sm.*, m.file_path, m.file_type, m.source 
                         FROM screen_media sm 
                         JOIN media m ON sm.media_id = m.id 
                         WHERE sm.screen_id = ?
                         ORDER BY sm.id ASC',
                        [$screen['id']]
                    );
                }
                
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
                
                $result[] = [
                    'id' => (string)$screen['id'],
                    'screenCode' => $screen['screen_code'],
                    'name' => $screen['name'],
                    'orientation' => ($screen['orientation'] === 'horizontal') ? 'landscape' : 'portrait',
                    'aspectRatio' => $screen['aspect_ratio'] ?? '16:9',
                    'displayMode' => ($screen['display_mode'] === 'fit') ? 'contain' : ($screen['display_mode'] ?? 'contain'),
                    'playlist' => $playlist,
                    'createdAt' => strtotime($screen['created_at']) * 1000,
                    'lastPing' => isset($screen['last_seen_at']) && $screen['last_seen_at'] 
                        ? strtotime($screen['last_seen_at']) * 1000 
                        : null
                ];
            }
            
            successResponse($result);
        } catch (Exception $e) {
            error_log('List screens error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
    
    public function createScreen() {
        $user = authenticateToken();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = $data['name'] ?? '';
        $orientation = $data['orientation'] ?? 'landscape';
        $aspectRatio = $data['aspectRatio'] ?? '16:9';
        $screenCode = $data['screenCode'] ?? generateCode();
        
        try {
            // Get restaurant plan
            $restaurant = $this->db->fetchOne(
                'SELECT plan FROM restaurants WHERE id = ?',
                [$user['restaurantId']]
            );
            
            if (!$restaurant) {
                errorResponse('Restaurant not found', 404);
            }
            
            $plan = $restaurant['plan'];
            $planLimits = [
                'free' => 1,
                'basic' => 3,
                'pro' => -1
            ];
            
            $maxScreens = $planLimits[$plan] ?? 1;
            
            // Check screen limit
            if ($maxScreens !== -1) {
                $count = $this->db->fetchOne(
                    'SELECT COUNT(*) as count FROM screens WHERE restaurant_id = ?',
                    [$user['restaurantId']]
                );
                
                if ($count['count'] >= $maxScreens) {
                    errorResponse("Screen limit reached. Your {$plan} plan allows {$maxScreens} screen" . ($maxScreens > 1 ? 's' : '') . ". Please upgrade to create more screens.", 403);
                }
            }
            
            // Create screen
            $this->db->execute(
                'INSERT INTO screens (user_id, restaurant_id, name, orientation, aspect_ratio, screen_code, template) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    $user['id'],
                    $user['restaurantId'],
                    $name,
                    ($orientation === 'landscape') ? 'horizontal' : 'vertical',
                    $aspectRatio,
                    $screenCode,
                    'default'
                ]
            );
            
            $screenId = $this->db->lastInsertId();
            
            // Log activity
            try {
                $this->db->execute(
                    'INSERT INTO activity_logs (restaurant_id, user_id, action, details) 
                     VALUES (?, ?, ?, ?)',
                    [$user['restaurantId'], $user['id'], 'Screen Created', "Screen \"{$name}\" created with code {$screenCode}"]
                );
            } catch (Exception $e) {
                // Activity table might not exist
            }
            
            successResponse(['id' => (string)$screenId]);
        } catch (Exception $e) {
            error_log('Create screen error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
    
    public function updateScreen($id) {
        $user = authenticateToken();
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $this->db->getConnection()->beginTransaction();
            
            // Update screen details
            if (isset($data['name'])) {
                $orientation = isset($data['orientation']) 
                    ? (($data['orientation'] === 'landscape') ? 'horizontal' : 'vertical')
                    : null;
                $aspectRatio = $data['aspectRatio'] ?? null;
                
                $updateFields = ['name = ?'];
                $params = [$data['name']];
                
                if ($orientation !== null) {
                    $updateFields[] = 'orientation = ?';
                    $params[] = $orientation;
                }
                
                if ($aspectRatio !== null) {
                    $updateFields[] = 'aspect_ratio = ?';
                    $params[] = $aspectRatio;
                }
                
                // Try to update with updated_at
                try {
                    $updateFields[] = 'updated_at = NOW()';
                } catch (Exception $e) {
                    // Column doesn't exist
                }
                
                $params[] = $id;
                $params[] = $user['restaurantId'];
                
                $this->db->execute(
                    'UPDATE screens SET ' . implode(', ', $updateFields) . ' WHERE id = ? AND restaurant_id = ?',
                    $params
                );
            }
            
            // Update playlist
            if (isset($data['playlist'])) {
                // Update updated_at timestamp
                try {
                    $this->db->execute('UPDATE screens SET updated_at = NOW() WHERE id = ?', [$id]);
                } catch (Exception $e) {
                    // Ignore if column doesn't exist
                }
                
                // Delete old playlist
                $this->db->execute('DELETE FROM screen_media WHERE screen_id = ?', [$id]);
                
                // Check if display_order exists
                $hasDisplayOrder = false;
                try {
                    $this->db->query('SELECT display_order FROM screen_media LIMIT 1');
                    $hasDisplayOrder = true;
                } catch (Exception $e) {
                    // Try to add column
                    try {
                        $this->db->execute('ALTER TABLE screen_media ADD COLUMN display_order INT DEFAULT 0 AFTER play_value');
                        $hasDisplayOrder = true;
                    } catch (Exception $e2) {
                        // Can't add column
                    }
                }
                
                // Insert new playlist items
                foreach ($data['playlist'] as $i => $item) {
                    $mode = (isset($item['playbackConfig']['mode']) && $item['playbackConfig']['mode'] === 'times') ? 'times' : 'seconds';
                    $val = $item['duration'] ?? 10;
                    $order = $item['order'] ?? $i;
                    
                    if ($hasDisplayOrder) {
                        $this->db->execute(
                            'INSERT INTO screen_media (screen_id, media_id, play_mode, play_value, display_order) 
                             VALUES (?, ?, ?, ?, ?)',
                            [$id, $item['mediaId'], $mode, $val, $order]
                        );
                    } else {
                        $this->db->execute(
                            'INSERT INTO screen_media (screen_id, media_id, play_mode, play_value) 
                             VALUES (?, ?, ?, ?)',
                            [$id, $item['mediaId'], $mode, $val]
                        );
                    }
                }
            }
            
            $this->db->getConnection()->commit();
            successResponse(['success' => true]);
        } catch (Exception $e) {
            $this->db->getConnection()->rollBack();
            error_log('Update screen error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
    
    public function deleteScreen($id) {
        $user = authenticateToken();
        
        try {
            $this->db->execute(
                'DELETE FROM screens WHERE id = ? AND restaurant_id = ?',
                [$id, $user['restaurantId']]
            );
            
            successResponse(['success' => true]);
        } catch (Exception $e) {
            error_log('Delete screen error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
}

