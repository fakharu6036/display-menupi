<?php
// Test X-Authorization header - DELETE AFTER TESTING
header('Content-Type: application/json');

require_once __DIR__ . '/fix-auth.php';

$result = [
    'timestamp' => date('c'),
    'authorization_header' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET',
        'HTTP_X_AUTHORIZATION' => $_SERVER['HTTP_X_AUTHORIZATION'] ?? 'NOT SET',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'NOT SET',
    ],
    'getallheaders_result' => null,
    'fix_auth_result' => null,
];

if (function_exists('getallheaders')) {
    $headers = getallheaders();
    $result['getallheaders_result'] = [
        'Authorization' => $headers['Authorization'] ?? 'NOT FOUND',
        'X-Authorization' => $headers['X-Authorization'] ?? 'NOT FOUND',
        'authorization' => $headers['authorization'] ?? 'NOT FOUND',
        'x-authorization' => $headers['x-authorization'] ?? 'NOT FOUND',
    ];
}

if (function_exists('getAuthorizationHeader')) {
    $authHeader = getAuthorizationHeader();
    $result['fix_auth_result'] = $authHeader ? substr($authHeader, 0, 50) . '...' : 'NOT FOUND';
    $result['fix_auth_found'] = !empty($authHeader);
} else {
    $result['fix_auth_result'] = 'FUNCTION NOT AVAILABLE';
    $result['fix_auth_found'] = false;
}

echo json_encode($result, JSON_PRETTY_PRINT);
exit;

