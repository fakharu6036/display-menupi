<?php
// Test headers - DELETE AFTER TESTING
header('Content-Type: application/json');

$info = [
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'NOT SET',
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'NOT SET',
    'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'NOT SET',
    'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'NOT SET',
];

if (function_exists('getallheaders')) {
    $allHeaders = getallheaders();
    $info['all_headers'] = $allHeaders;
    $info['authorization_from_getallheaders'] = $allHeaders['Authorization'] ?? $allHeaders['authorization'] ?? 'NOT FOUND';
}

// Show all $_SERVER keys with 'AUTH' or 'HTTP'
$info['auth_related_server_vars'] = [];
foreach ($_SERVER as $key => $value) {
    if (stripos($key, 'AUTH') !== false || stripos($key, 'HTTP') !== false) {
        $info['auth_related_server_vars'][$key] = substr($value, 0, 100);
    }
}

echo json_encode($info, JSON_PRETTY_PRINT);
exit;

