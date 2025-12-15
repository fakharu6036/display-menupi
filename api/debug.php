<?php
// Debug routing - DELETE AFTER TESTING
// This file must be accessed directly, not through routing

// Bypass any includes
header('Content-Type: application/json');

$info = [
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'NOT SET',
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'NOT SET',
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'NOT SET',
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'NOT SET',
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'NOT SET',
    'SCRIPT_FILENAME' => $_SERVER['SCRIPT_FILENAME'] ?? 'NOT SET',
    'parsed_path' => null,
    'file_exists' => file_exists(__FILE__)
];

// Parse path same way as index.php
$path = $_SERVER['REQUEST_URI'] ?? '/';
$path = strtok($path, '?');
$basePath = '/api';
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}
if (empty($path) || $path === '/') {
    $path = '/';
} else {
    if (substr($path, 0, 1) !== '/') {
        $path = '/' . $path;
    }
}
$info['parsed_path'] = $path;

// Also test what index.php would see
$info['would_match_health'] = ($path === '/health');
$info['would_match_debug'] = ($path === '/debug.php');

echo json_encode($info, JSON_PRETTY_PRINT);
exit;

