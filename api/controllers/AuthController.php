<?php
// Authentication Controller

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/crypto.php';

class AuthController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            errorResponse('Email and password are required', 400);
        }
        
        try {
            // Check if is_verified column exists
            $hasVerificationColumn = false;
            try {
                $this->db->query('SELECT is_verified FROM users LIMIT 1');
                $hasVerificationColumn = true;
            } catch (Exception $e) {
                $hasVerificationColumn = false;
            }
            
            $user = $this->db->fetchOne(
                'SELECT u.*, r.plan, r.account_status, r.name as rest_name 
                 FROM users u 
                 JOIN restaurants r ON u.restaurant_id = r.id 
                 WHERE u.email = ? AND u.auth_method = "local"',
                [$email]
            );
            
            if (!$user) {
                errorResponse('User not found or uses Google Login', 401);
            }
            
            if ($user['account_status'] === 'deleted') {
                errorResponse('Account has been deleted', 403);
            }
            
            if ($user['account_status'] === 'suspended') {
                errorResponse('Account has been suspended. Please contact support.', 403);
            }
            
            if (!password_verify($password, $user['password'])) {
                errorResponse('Invalid credentials', 401);
            }
            
            if ($hasVerificationColumn && isset($user['is_verified']) && $user['is_verified'] == 0) {
                errorResponse('Please verify your email first. Check your inbox for the verification link.', 403);
            }
            
            $token = JWT::generate([
                'id' => (int)$user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'restaurantId' => (int)$user['restaurant_id']
            ]);
            
            // Get avatar URL if column exists
            $avatarUrl = null;
            try {
                $userWithAvatar = $this->db->fetchOne('SELECT avatar_url FROM users WHERE id = ?', [$user['id']]);
                if ($userWithAvatar && isset($userWithAvatar['avatar_url'])) {
                    $avatarUrl = $userWithAvatar['avatar_url'];
                }
            } catch (Exception $e) {
                // Column doesn't exist yet
            }
            
            successResponse([
                'token' => $token,
                'user' => [
                    'id' => (string)$user['id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'restaurantId' => (string)$user['restaurant_id'],
                    'plan' => $user['plan'],
                    'accountStatus' => $user['account_status'],
                    'avatarUrl' => $avatarUrl
                ]
            ]);
        } catch (Exception $e) {
            error_log('Login error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
    
    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        
        if (empty($name) || empty($email) || empty($password)) {
            errorResponse('Name, email, and password are required', 400);
        }
        
        try {
            // Check if email exists
            $existing = $this->db->fetchOne('SELECT id FROM users WHERE email = ?', [$email]);
            if ($existing) {
                errorResponse('Email already registered', 400);
            }
            
            // Create restaurant
            $this->db->execute(
                'INSERT INTO restaurants (name, email, owner_name, plan, max_screens, account_status) 
                 VALUES (?, ?, ?, "free", 1, "active")',
                [$name, $email, $name]
            );
            
            $restaurantId = $this->db->lastInsertId();
            
            // Create user
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $this->db->execute(
                'INSERT INTO users (restaurant_id, name, email, password, role, auth_method) 
                 VALUES (?, ?, ?, ?, "owner", "local")',
                [$restaurantId, $name, $email, $hashedPassword]
            );
            
            $userId = $this->db->lastInsertId();
            
            $token = JWT::generate([
                'id' => (int)$userId,
                'email' => $email,
                'role' => 'owner',
                'restaurantId' => (int)$restaurantId
            ]);
            
            successResponse([
                'token' => $token,
                'user' => [
                    'id' => (string)$userId,
                    'email' => $email,
                    'name' => $name,
                    'role' => 'owner',
                    'restaurantId' => (string)$restaurantId,
                    'plan' => 'free',
                    'accountStatus' => 'active'
                ]
            ], 201);
        } catch (Exception $e) {
            error_log('Register error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
    
    public function getMe() {
        require_once __DIR__ . '/../middleware/auth.php';
        $user = authenticateToken();
        
        try {
            $userData = $this->db->fetchOne(
                'SELECT u.*, r.plan, r.account_status, r.name as rest_name 
                 FROM users u 
                 JOIN restaurants r ON u.restaurant_id = r.id 
                 WHERE u.id = ?',
                [$user['id']]
            );
            
            if (!$userData) {
                errorResponse('User not found', 404);
            }
            
            // Get avatar URL if exists
            $avatarUrl = null;
            if (isset($userData['avatar_url'])) {
                $avatarUrl = $userData['avatar_url'];
            }
            
            successResponse([
                'id' => (string)$userData['id'],
                'email' => $userData['email'],
                'name' => $userData['name'],
                'role' => $userData['role'],
                'restaurantId' => (string)$userData['restaurant_id'],
                'plan' => $userData['plan'],
                'accountStatus' => $userData['account_status'],
                'avatarUrl' => $avatarUrl
            ]);
        } catch (Exception $e) {
            error_log('Get me error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
    
    public function refreshUserData() {
        require_once __DIR__ . '/../middleware/auth.php';
        $user = authenticateToken();
        
        try {
            $userData = $this->db->fetchOne(
                'SELECT u.*, r.plan, r.account_status, r.name as rest_name, r.max_screens 
                 FROM users u 
                 JOIN restaurants r ON u.restaurant_id = r.id 
                 WHERE u.id = ?',
                [$user['id']]
            );
            
            if (!$userData) {
                errorResponse('User not found', 404);
            }
            
            // Get avatar URL
            $avatarUrl = null;
            if (isset($userData['avatar_url'])) {
                $avatarUrl = $userData['avatar_url'];
            }
            
            successResponse([
                'id' => (string)$userData['id'],
                'email' => $userData['email'],
                'name' => $userData['name'],
                'role' => $userData['role'],
                'restaurantId' => (string)$userData['restaurant_id'],
                'plan' => $userData['plan'],
                'accountStatus' => $userData['account_status'],
                'maxScreens' => (int)($userData['max_screens'] ?? 1),
                'avatarUrl' => $avatarUrl
            ]);
        } catch (Exception $e) {
            error_log('Refresh user data error: ' . $e->getMessage());
            errorResponse('Server error', 500);
        }
    }
    
    public function uploadAvatar() {
        require_once __DIR__ . '/../middleware/auth.php';
        require_once __DIR__ . '/../utils/upload.php';
        require_once __DIR__ . '/../config/config.php';
        
        $user = authenticateToken();
        
        try {
            if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
                errorResponse('No file uploaded', 400);
            }
            
            $file = $_FILES['avatar'];
            
            // Validate it's an image
            if (!strpos($file['type'], 'image/') === 0) {
                unlink($file['tmp_name']);
                errorResponse('File must be an image', 400);
            }
            
            // Check if avatar_url column exists
            try {
                $this->db->query('SELECT avatar_url FROM users LIMIT 1');
            } catch (Exception $e) {
                try {
                    $this->db->execute('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER google_id');
                } catch (Exception $alterErr) {
                    error_log('Could not add avatar_url column: ' . $alterErr->getMessage());
                }
            }
            
            // Get current avatar to delete old one
            $currentUser = $this->db->fetchOne('SELECT avatar_url FROM users WHERE id = ?', [$user['id']]);
            if ($currentUser && !empty($currentUser['avatar_url'])) {
                $oldPath = str_replace('https://api.menupi.com/', '', $currentUser['avatar_url']);
                $oldPath = str_replace('http://localhost:3001/', '', $oldPath);
                $oldPath = str_replace('http://localhost:3000/', '', $oldPath);
                $oldPath = ltrim($oldPath, '/');
                if (strpos($oldPath, 'uploads/') === 0) {
                    $fullPath = UPLOAD_DIR . basename($oldPath);
                    if (file_exists($fullPath)) {
                        unlink($fullPath);
                    }
                }
            }
            
            // Save uploaded file
            $fileInfo = saveUploadedFile($file, 'avatar');
            
            // Store only relative path
            $relativePath = 'uploads/' . $fileInfo['filename'];
            
            // Get correct production URL
            $baseUrl = getenv('API_URL') ?: (getenv('BASE_URL') ?: 'https://api.menupi.com');
            $baseUrl = rtrim($baseUrl, '/api');
            $baseUrl = rtrim($baseUrl, '/');
            if (strpos($baseUrl, 'http://') !== 0 && strpos($baseUrl, 'https://') !== 0) {
                $baseUrl = 'https://' . $baseUrl;
            }
            
            $avatarUrl = $baseUrl . '/' . $relativePath;
            
            // Update user with new avatar URL
            $this->db->execute(
                'UPDATE users SET avatar_url = ? WHERE id = ?',
                [$avatarUrl, $user['id']]
            );
            
            successResponse(['avatarUrl' => $avatarUrl]);
        } catch (Exception $e) {
            // Clean up file if database update fails
            if (isset($fileInfo['filepath'])) {
                $fullPath = UPLOAD_DIR . basename($fileInfo['filepath']);
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
            }
            errorResponse($e->getMessage(), 500);
        }
    }
}

