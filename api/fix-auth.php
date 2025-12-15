<?php
// Temporary fix: Read Authorization from request and set in $_SERVER
// Include this at the top of index.php if headers aren't working

// Function to get Authorization header
// LiteSpeed Cache may strip Authorization header, so we check multiple sources
function getAuthorizationHeader() {
    // Method 1: Standard HTTP_AUTHORIZATION
    if (isset($_SERVER['HTTP_AUTHORIZATION']) && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return $_SERVER['HTTP_AUTHORIZATION'];
    }
    
    // Method 2: REDIRECT_HTTP_AUTHORIZATION (Apache mod_rewrite)
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    
    // Method 3: Try custom header (LiteSpeed might allow this)
    if (isset($_SERVER['HTTP_X_AUTHORIZATION']) && !empty($_SERVER['HTTP_X_AUTHORIZATION'])) {
        return $_SERVER['HTTP_X_AUTHORIZATION'];
    }
    
    // Method 4: getallheaders() function
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['Authorization']) && !empty($headers['Authorization'])) {
            return $headers['Authorization'];
        }
        if (isset($headers['authorization']) && !empty($headers['authorization'])) {
            return $headers['authorization'];
        }
        if (isset($headers['X-Authorization']) && !empty($headers['X-Authorization'])) {
            return $headers['X-Authorization'];
        }
    }
    
    // Method 5: apache_request_headers()
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization']) && !empty($headers['Authorization'])) {
            return $headers['Authorization'];
        }
        if (isset($headers['authorization']) && !empty($headers['authorization'])) {
            return $headers['authorization'];
        }
        if (isset($headers['X-Authorization']) && !empty($headers['X-Authorization'])) {
            return $headers['X-Authorization'];
        }
    }
    
    // Method 6: Check all HTTP_* variables
    foreach ($_SERVER as $key => $value) {
        if (strpos($key, 'HTTP_') === 0 && !empty($value)) {
            $headerName = str_replace('_', '-', substr($key, 5));
            if (strtolower($headerName) === 'authorization' || strtolower($headerName) === 'x-authorization') {
                return $value;
            }
        }
    }
    
    // Method 7: Read from request body (for POST requests with JSON)
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if (isset($data['token']) && !empty($data['token'])) {
            return 'Bearer ' . $data['token'];
        }
    }
    
    // Method 8: Read from query parameter (temporary fallback for LiteSpeed Cache)
    // This is less secure but works when headers are stripped
    if (isset($_GET['token']) && !empty($_GET['token'])) {
        return 'Bearer ' . $_GET['token'];
    }
    
    return null;
}

// Set Authorization header in $_SERVER if found
$authHeader = getAuthorizationHeader();
if ($authHeader && !isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $_SERVER['HTTP_AUTHORIZATION'] = $authHeader;
}

