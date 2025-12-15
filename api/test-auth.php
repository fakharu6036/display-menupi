<?php
// Test auth header - DELETE AFTER TESTING
header('Content-Type: application/json');

$info = [
    'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET',
    'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'NOT SET',
    'all_headers' => []
];

if (function_exists('getallheaders')) {
    $info['all_headers'] = getallheaders();
}

// Show all $_SERVER keys containing 'AUTH' or 'HEADER'
$info['auth_related'] = [];
foreach ($_SERVER as $key => $value) {
    if (stripos($key, 'AUTH') !== false || stripos($key, 'HEADER') !== false) {
        $info['auth_related'][$key] = substr($value, 0, 50) . (strlen($value) > 50 ? '...' : '');
    }
}

echo json_encode($info, JSON_PRETTY_PRINT);

