<?php
// Diagnostic endpoint - shows exactly what's happening with auth
// DELETE AFTER FIXING

header('Content-Type: application/json');

// Include fix-auth
require_once __DIR__ . '/fix-auth.php';

$diagnosis = [
    'timestamp' => date('c'),
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'NOT SET',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'NOT SET',
    'authorization_header' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'NOT SET',
        'from_fix_auth' => getAuthorizationHeader() ?? 'NOT FOUND',
    ],
    'all_http_headers' => [],
    'getallheaders_result' => null,
    'apache_request_headers_result' => null,
];

// Get all HTTP_* variables
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0) {
        $diagnosis['all_http_headers'][$key] = substr($value, 0, 100);
    }
}

// Try getallheaders
if (function_exists('getallheaders')) {
    $diagnosis['getallheaders_result'] = getallheaders();
}

// Try apache_request_headers
if (function_exists('apache_request_headers')) {
    $diagnosis['apache_request_headers_result'] = apache_request_headers();
}

// Test if we can read Authorization from request
$authFromRequest = getAuthorizationHeader();
$diagnosis['authorization_found'] = !empty($authFromRequest);
$diagnosis['authorization_value'] = $authFromRequest ? substr($authFromRequest, 0, 50) . '...' : 'NOT FOUND';

echo json_encode($diagnosis, JSON_PRETTY_PRINT);
exit;

