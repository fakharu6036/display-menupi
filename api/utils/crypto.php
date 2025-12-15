<?php
// Cryptographic Utility Functions

function generateCode($length = 6) {
    $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    $max = strlen($characters) - 1;
    
    for ($i = 0; $i < $length; $i++) {
        $code .= $characters[random_int(0, $max)];
    }
    
    return $code;
}

function generateVerificationToken() {
    return bin2hex(random_bytes(32));
}

function hashVerificationToken($token) {
    return hash('sha256', $token);
}

