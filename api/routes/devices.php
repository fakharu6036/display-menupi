<?php
// Device & Pairing Routes (Auth Required)

require_once __DIR__ . '/../controllers/DeviceController.php';

$path = $GLOBALS['path'] ?? $_SERVER['REQUEST_URI'];
$deviceController = new DeviceController();

// POST /api/pair
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $path === '/pair') {
    $deviceController->pair();
}

// GET /api/devices
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/devices') {
    $deviceController->listDevices();
}

// POST /api/devices/:device_id/reassign
if ($_SERVER['REQUEST_METHOD'] === 'POST' && preg_match('#^/devices/([A-Za-z0-9_-]+)/reassign$#', $path, $matches)) {
    $deviceController->reassign($matches[1]);
}

// POST /api/devices/:device_id/disconnect
if ($_SERVER['REQUEST_METHOD'] === 'POST' && preg_match('#^/devices/([A-Za-z0-9_-]+)/disconnect$#', $path, $matches)) {
    $deviceController->disconnect($matches[1]);
}

// POST /api/public-player/:screen_id/regenerate
if ($_SERVER['REQUEST_METHOD'] === 'POST' && preg_match('#^/public-player/(\d+)/regenerate$#', $path, $matches)) {
    $deviceController->regeneratePublicCode($matches[1]);
}

// GET /api/public-player/:screen_id/devices
if ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('#^/public-player/(\d+)/devices$#', $path, $matches)) {
    $deviceController->listPublicPlayerDevices($matches[1]);
}
