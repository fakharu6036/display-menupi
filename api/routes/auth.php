<?php
// Authentication Routes

require_once __DIR__ . '/../controllers/AuthController.php';

$path = $GLOBALS['path'] ?? $_SERVER['REQUEST_URI'];
$authController = new AuthController();

// POST /api/login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $path === '/login') {
    $authController->login();
}

// POST /api/register
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $path === '/register') {
    $authController->register();
}

// GET /api/users/me
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/users/me') {
    $authController->getMe();
}

// GET /api/users/me/refresh
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/users/me/refresh') {
    $authController->refreshUserData();
}

// POST /api/users/me/avatar
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $path === '/users/me/avatar') {
    $authController->uploadAvatar();
}

