<?php
// File Upload Utility

require_once __DIR__ . '/../config/config.php';

function validateFileUpload($file) {
    if (!isset($file['error']) || is_array($file['error'])) {
        throw new Exception('Invalid file upload');
    }
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload error: ' . $file['error']);
    }
    
    if ($file['size'] > MAX_FILE_SIZE) {
        throw new Exception('File size exceeds maximum allowed size');
    }
    
    $allowedTypes = explode(',', ALLOWED_MIME_TYPES);
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Invalid file type. Allowed types: ' . ALLOWED_MIME_TYPES);
    }
    
    return true;
}

function saveUploadedFile($file, $prefix = '') {
    validateFileUpload($file);
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $sanitizedName = preg_replace('/[^a-zA-Z0-9.-]/', '_', $file['name']);
    $filename = ($prefix ? $prefix . '-' : '') . time() . '-' . $sanitizedName;
    $filepath = UPLOAD_DIR . $filename;
    
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to save uploaded file');
    }
    
    return [
        'filename' => $filename,
        'filepath' => 'uploads/' . $filename,
        'size' => $file['size'],
        'mime_type' => mime_content_type($filepath)
    ];
}

function getFileType($mimeType) {
    if (strpos($mimeType, 'image/') === 0) {
        return 'image';
    } elseif (strpos($mimeType, 'video/') === 0) {
        return 'video';
    } elseif ($mimeType === 'application/pdf') {
        return 'pdf';
    } elseif ($mimeType === 'image/gif') {
        return 'gif';
    }
    return 'unknown';
}

function formatFileSize($bytes) {
    return round($bytes / 1024 / 1024, 2);
}

