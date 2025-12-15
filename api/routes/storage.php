<?php
// Storage Routes (Auth Required)

require_once __DIR__ . '/../controllers/StorageController.php';
require_once __DIR__ . '/../middleware/auth.php';

$path = $GLOBALS['path'] ?? $_SERVER['REQUEST_URI'];
$storageController = new StorageController();

// GET /api/storage/usage
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/storage/usage') {
    $storageController->getStorageUsage();
}

// GET /api/storage/breakdown
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === '/storage/breakdown') {
    $storageController->getStorageBreakdown();
}

