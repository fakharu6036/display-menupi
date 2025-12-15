<?php
// Response Utility Functions

// Ensure config is loaded (defines ALLOWED_ORIGINS, NODE_ENV)
if (!defined('ALLOWED_ORIGINS')) {
    require_once __DIR__ . '/../config/config.php';
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function successResponse($data = null, $message = null) {
    $response = ['success' => true];
    if ($data !== null) {
        $response['data'] = $data;
    }
    if ($message !== null) {
        $response['message'] = $message;
    }
    jsonResponse($response);
}

function errorResponse($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => $message
    ];
    if ($details !== null) {
        $response['details'] = $details;
    }
    jsonResponse($response, $statusCode);
}

function handleCORS() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = explode(',', ALLOWED_ORIGINS);
    
    if (NODE_ENV === 'production') {
        $allowedOrigins = array_map('trim', $allowedOrigins);
        if (!empty($origin) && in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }
    } else {
        // Development - allow localhost
        if (!empty($origin) && (strpos($origin, 'http://localhost') === 0 || strpos($origin, 'http://127.0.0.1') === 0)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization');
    header('Access-Control-Allow-Credentials: true');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

