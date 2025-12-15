<?php
// Screen Routes (Auth Required)

require_once __DIR__ . '/../controllers/ScreenController.php';

$path = $GLOBALS['path'] ?? $_SERVER['REQUEST_URI'];
$screenController = new ScreenController();

// GET /api/screens
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/screens') {
    $screenController->listScreens();
}

// POST /api/screens
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $path === '/screens') {
    $screenController->createScreen();
}

// PUT /api/screens/:id
if ($_SERVER['REQUEST_METHOD'] === 'PUT' && preg_match('#^/screens/(\d+)$#', $path, $matches)) {
    $screenController->updateScreen($matches[1]);
}

// DELETE /api/screens/:id
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && preg_match('#^/screens/(\d+)$#', $path, $matches)) {
    $screenController->deleteScreen($matches[1]);
}

