<?php
// Media Routes (Auth Required)

require_once __DIR__ . '/../controllers/MediaController.php';

$path = $GLOBALS['path'] ?? $_SERVER['REQUEST_URI'];
$mediaController = new MediaController();

// GET /api/media
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/media') {
    $mediaController->listMedia();
}

// POST /api/media
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $path === '/media') {
    $mediaController->uploadMedia();
}

// DELETE /api/media/:id
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && preg_match('#^/media/(\d+)$#', $path, $matches)) {
    $mediaController->deleteMedia($matches[1]);
}

