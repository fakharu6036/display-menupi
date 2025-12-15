<?php
// Authentication Middleware

// Include fix-auth to ensure getAuthorizationHeader() is available
if (file_exists(__DIR__ . '/../fix-auth.php')) {
    require_once __DIR__ . '/../fix-auth.php';
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/response.php';

function authenticateToken() {
    // Use fix-auth.php function if available
    if (function_exists('getAuthorizationHeader')) {
        $authHeader = getAuthorizationHeader();
    } else {
        // Fallback: Check multiple possible header locations
        $authHeader = '';
        
        // Method 1: Standard HTTP_AUTHORIZATION
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }
        // Method 2: REDIRECT_HTTP_AUTHORIZATION (Apache mod_rewrite)
        elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        // Method 3: getallheaders() function
        elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
            }
        }
        // Method 4: Read from apache_request_headers()
        elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            } elseif (isset($headers['authorization'])) {
                $authHeader = $headers['authorization'];
            }
        }
        // Method 5: Check all HTTP_* variables
        if (empty($authHeader)) {
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $headerName = str_replace('_', '-', substr($key, 5));
                    if (strtolower($headerName) === 'authorization') {
                        $authHeader = $value;
                        break;
                    }
                }
            }
        }
    }
    
    if (empty($authHeader)) {
        error_log('No Authorization header found in any location.');
        error_log('Available $_SERVER keys with HTTP: ' . implode(', ', array_filter(array_keys($_SERVER), function($k) { return strpos($k, 'HTTP_') === 0; })));
        if (function_exists('getallheaders')) {
            error_log('getallheaders(): ' . json_encode(getallheaders()));
        }
        errorResponse('Unauthorized: No token provided', 401);
    }
    
    $parts = explode(' ', $authHeader);
    if (count($parts) !== 2 || $parts[0] !== 'Bearer') {
        errorResponse('Unauthorized: Invalid token format', 401);
    }
    
    $token = $parts[1];
    error_log('Token received: ' . substr($token, 0, 20) . '...');
    $payload = JWT::verify($token);
    
    if (!$payload) {
        error_log('JWT verification failed for token: ' . substr($token, 0, 20) . '...');
        errorResponse('Unauthorized: Invalid or expired token', 403);
    }
    
    error_log('JWT verified for user ID: ' . ($payload['id'] ?? 'NOT SET'));
    
    // Verify user and restaurant still exist and are active
    $db = Database::getInstance();
    
    try {
        $user = $db->fetchOne(
            'SELECT u.id, u.role, u.restaurant_id, r.account_status, r.id as restaurant_exists 
             FROM users u 
             LEFT JOIN restaurants r ON u.restaurant_id = r.id 
             WHERE u.id = ?',
            [$payload['id']]
        );
        
        if (!$user) {
            errorResponse('User account no longer exists', 401);
        }
        
        if (!$user['restaurant_exists']) {
            errorResponse('Account has been deleted', 401);
        }
        
        if ($user['account_status'] === 'deleted' || $user['account_status'] === 'suspended') {
            $message = $user['account_status'] === 'deleted' 
                ? 'Account has been deleted' 
                : 'Account has been suspended';
            errorResponse($message, 403);
        }
        
        // Set user data in global scope for controllers
        $GLOBALS['user'] = [
            'id' => (int)$user['id'],
            'role' => $user['role'],
            'restaurantId' => (int)$user['restaurant_id'],
            'restaurant_id' => (int)$user['restaurant_id'] // Backward compatibility
        ];
        
        return $GLOBALS['user'];
    } catch (Exception $e) {
        error_log('Database error in authenticateToken: ' . $e->getMessage());
        // Fail open for availability, but use token payload
        $GLOBALS['user'] = [
            'id' => (int)$payload['id'],
            'role' => $payload['role'] ?? 'owner',
            'restaurantId' => (int)($payload['restaurantId'] ?? $payload['restaurant_id'] ?? 0),
            'restaurant_id' => (int)($payload['restaurantId'] ?? $payload['restaurant_id'] ?? 0)
        ];
        return $GLOBALS['user'];
    }
}

function authenticateAdmin() {
    $user = authenticateToken();
    
    if ($user['role'] !== 'super_admin') {
        errorResponse('Forbidden: Admin access required', 403);
    }
    
    return $user;
}

function getCurrentUser() {
    return $GLOBALS['user'] ?? null;
}

