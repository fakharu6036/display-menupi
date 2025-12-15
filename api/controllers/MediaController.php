<?php
// Media Controller (Auth Required)

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/upload.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

// Alias for backward compatibility
function authenticate() {
    return authenticateToken();
}

class MediaController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Normalize media URL - fixes old localhost URLs
     */
    private function normalizeMediaUrl($url, $baseUrl) {
        if (empty($url)) {
            return $url;
        }
        
        // If it's already a full URL, check if it needs to be rewritten
        if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {
            // Rewrite localhost URLs to use the correct base URL
            if (strpos($url, 'localhost:3000') !== false || 
                strpos($url, 'localhost:3001') !== false || 
                strpos($url, '127.0.0.1') !== false) {
                
                // Extract the path from the old URL
                $parsed = parse_url($url);
                $path = $parsed['path'] ?? '';
                
                // Construct new URL
                $cleanPath = (substr($path, 0, 1) === '/') ? $path : '/' . $path;
                return $baseUrl . $cleanPath;
            }
            // If it's already a proper production URL, return as-is
            return $url;
        }
        
        // If it's just a path, construct the full URL
        $cleanPath = (substr($url, 0, 1) === '/') ? $url : '/' . $url;
        return $baseUrl . $cleanPath;
    }
    
    /**
     * Get media base URL
     */
    private function getMediaBaseUrl() {
        // Use API_URL environment variable if set
        $apiUrl = getenv('API_URL');
        if ($apiUrl) {
            $apiUrl = rtrim($apiUrl, '/api');
            $apiUrl = rtrim($apiUrl, '/');
            if (strpos($apiUrl, 'http://') !== 0 && strpos($apiUrl, 'https://') !== 0) {
                $apiUrl = 'https://' . $apiUrl;
            }
            return $apiUrl;
        }
        
        // In production, default to https://api.menupi.com
        if (getenv('NODE_ENV') === 'production' || NODE_ENV === 'production') {
            return 'https://api.menupi.com';
        }
        
        // Development fallback
        return 'http://localhost:3001';
    }
    
    /**
     * GET /api/media - List all media for restaurant
     */
    public function listMedia() {
        try {
            $user = authenticate();
            
            $rows = $this->db->fetchAll(
                'SELECT * FROM media WHERE restaurant_id = ? ORDER BY created_at DESC',
                [$user['restaurant_id']]
            );
            
            $baseUrl = $this->getMediaBaseUrl();
            
            $media = array_map(function($row) use ($baseUrl) {
                // Normalize the URL to fix any old localhost URLs in the database
                $mediaUrl = $this->normalizeMediaUrl($row['file_path'], $baseUrl);
                
                // Convert created_at to timestamp
                $createdAt = strtotime($row['created_at']) * 1000;
                
                return [
                    'id' => (string)$row['id'],
                    'url' => $mediaUrl,
                    'name' => $row['file_name'],
                    'type' => $row['file_type'],
                    'size' => $row['file_size_mb'] . ' MB',
                    'duration' => 10,
                    'createdAt' => $createdAt,
                    'sourceProvider' => ($row['source'] === 'upload') ? null : $row['source']
                ];
            }, $rows);
            
            successResponse($media);
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/media - Upload media file
     */
    public function uploadMedia() {
        try {
            $user = authenticateToken();
            
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                errorResponse('No file uploaded or file upload error', 400);
            }
            
            $file = $_FILES['file'];
            
            // Validate and save file
            $fileInfo = saveUploadedFile($file);
            
            // Determine file type
            $fileType = getFileType($fileInfo['mime_type']);
            $sizeMb = formatFileSize($fileInfo['size']);
            
            // Store only relative path in database
            $relativePath = 'uploads/' . $fileInfo['filename'];
            
            // Insert into database
            $this->db->execute(
                'INSERT INTO media (user_id, restaurant_id, file_name, file_path, file_type, file_size_mb, source) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    $user['id'],
                    $user['restaurant_id'],
                    $file['name'],
                    $relativePath,
                    $fileType,
                    $sizeMb,
                    'upload'
                ]
            );
            
            $mediaId = $this->db->lastInsertId();
            
            // Log activity
            try {
                $this->db->execute(
                    'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                    [
                        $user['restaurant_id'],
                        $user['id'],
                        'Media Uploaded',
                        'File "' . $file['name'] . '" uploaded (' . $fileType . ', ' . $sizeMb . ' MB)'
                    ]
                );
            } catch (Exception $e) {
                // Activity table might not exist, ignore
            }
            
            // Return the correct production URL
            $baseUrl = $this->getMediaBaseUrl();
            $fileUrl = $this->normalizeMediaUrl($relativePath, $baseUrl);
            
            successResponse([
                'success' => true,
                'id' => $mediaId,
                'url' => $fileUrl,
                'duration' => ($fileType === 'video') ? 30 : null
            ]);
        } catch (Exception $e) {
            // Clean up file if database insert fails
            if (isset($fileInfo['filepath'])) {
                $fullPath = UPLOAD_DIR . basename($fileInfo['filepath']);
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
            }
            errorResponse($e->getMessage(), 500);
        }
    }
    
    /**
     * DELETE /api/media/:id - Delete media
     */
    public function deleteMedia($id) {
        try {
            $user = authenticateToken();
            
            // Get file path first
            $media = $this->db->fetchOne(
                'SELECT file_path FROM media WHERE id = ? AND restaurant_id = ?',
                [$id, $user['restaurant_id']]
            );
            
            if (!$media) {
                errorResponse('Media not found', 404);
            }
            
            // Delete file from disk
            $filePath = $media['file_path'];
            // Handle both relative and absolute paths
            if (strpos($filePath, 'uploads/') === 0) {
                $fullPath = UPLOAD_DIR . basename($filePath);
            } else {
                $fullPath = $filePath;
            }
            
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
            
            // Delete from database
            $this->db->execute(
                'DELETE FROM media WHERE id = ? AND restaurant_id = ?',
                [$id, $user['restaurant_id']]
            );
            
            successResponse(['success' => true]);
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 500);
        }
    }
}

