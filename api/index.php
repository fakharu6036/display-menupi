<?php
// MENUPI API - Main Router
// All requests route through this file

// Error reporting (disable in production)
if (getenv('NODE_ENV') !== 'production') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    // Suppress warnings and notices in production, but log errors
    error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE & ~E_DEPRECATED);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Set timezone
date_default_timezone_set('UTC');

// Fix Authorization header (Hostinger Apache issue)
require_once __DIR__ . '/fix-auth.php';

// Load configuration first (defines constants)
require_once __DIR__ . '/config/config.php';

// Handle CORS
require_once __DIR__ . '/utils/response.php';
handleCORS();

// Get request path
$path = $_SERVER['REQUEST_URI'] ?? '/';
// Remove query string
$path = strtok($path, '?');

// Remove base path if needed (for subdirectory installations)
// Frontend calls: https://api.menupi.com/api/users/me/refresh
// REQUEST_URI will be: /api/users/me/refresh (or /users/me/refresh if subdomain points directly)
// We need: /users/me/refresh
$basePath = '/api';
// Remove /api prefix if present (handle both /api/... and /...)
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}
// Also handle if path starts with /api/ (double prefix)
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}

// Handle root path
if (empty($path) || $path === '/') {
    $path = '/';
} else {
    // Ensure path starts with /
    if (substr($path, 0, 1) !== '/') {
        $path = '/' . $path;
    }
}

// Debug: Log the parsed path (always log for troubleshooting)
error_log("MENUPI API - Request: " . ($_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN') . " " . ($_SERVER['REQUEST_URI'] ?? 'UNKNOWN') . " -> Parsed path: " . $path);

// Set global path for routes
$GLOBALS['path'] = $path;

// Include route files
require_once __DIR__ . '/routes/public.php';
require_once __DIR__ . '/routes/auth.php';
require_once __DIR__ . '/routes/screens.php';
require_once __DIR__ . '/routes/media.php';
require_once __DIR__ . '/routes/storage.php';

// 404 - Route not found
http_response_code(404);
jsonResponse([
    'success' => false,
    'error' => 'Route not found'
]);

