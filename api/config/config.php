<?php
// MENUPI API Configuration

// Load environment variables from .env file
function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        return;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments and empty lines
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        // Check if line contains = sign
        if (strpos($line, '=') === false) {
            continue;
        }
        
        // Split by = sign (max 2 parts: key=value)
        $parts = explode('=', $line, 2);
        if (count($parts) < 2) {
            continue;
        }
        
        $name = trim($parts[0]);
        $value = trim($parts[1] ?? '');
        
        // Skip if name is empty
        if (empty($name)) {
            continue;
        }
        
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

// Load .env file from root
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    loadEnv($envPath);
} else {
    error_log("Warning: .env file not found at: {$envPath}");
}

// Configuration constants
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'your_super_secret_jwt_key_minimum_32_characters_long_please_change_this');
define('JWT_EXPIRY', 5 * 60 * 60); // 5 hours in seconds

// CORS Configuration
define('ALLOWED_ORIGINS', getenv('ALLOWED_ORIGINS') ?: 'https://app.menupi.com,https://tv.menupi.com');
define('NODE_ENV', getenv('NODE_ENV') ?: 'production');

// File Upload Configuration
define('MAX_FILE_SIZE', intval(getenv('MAX_FILE_SIZE') ?: 52428800)); // 50MB
define('ALLOWED_MIME_TYPES', getenv('ALLOWED_MIME_TYPES') ?: 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,application/pdf');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');

// Base URL for file serving
define('BASE_URL', getenv('BASE_URL') ?: 'https://api.menupi.com');

// Ensure uploads directory exists
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

