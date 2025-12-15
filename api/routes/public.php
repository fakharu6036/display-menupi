<?php
// Public Routes (No Auth Required)

require_once __DIR__ . '/../controllers/PublicController.php';

$path = $GLOBALS['path'] ?? $_SERVER['REQUEST_URI'];
$publicController = new PublicController();

// GET /api/health
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/health') {
    $publicController->health();
}

// GET /api/public/screen/:code
if ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('#^/public/screen/([A-Z0-9]+)$#', $path, $matches)) {
    $publicController->getScreen($matches[1]);
}

// POST /api/screens/:id/ping
if ($_SERVER['REQUEST_METHOD'] === 'POST' && preg_match('#^/screens/(\d+)/ping$#', $path, $matches)) {
    $publicController->pingScreen($matches[1]);
}

