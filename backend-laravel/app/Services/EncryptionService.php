<?php

namespace App\Services;

class EncryptionService
{
    protected string $keyHex;

    public function __construct()
    {
        $this->keyHex = config('services.encryption.key') ?? env('ENCRYPTION_KEY', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    }

    /**
     * Encrypt plaintext using AES-256-GCM.
     * Output matches Node.js format: iv:authTag:ciphertext (hex-encoded).
     */
    public function encrypt(string $plaintext): string
    {
        $key = hex2bin($this->keyHex);
        $iv = random_bytes(16);
        $tag = '';

        $ciphertext = openssl_encrypt(
            $plaintext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16
        );

        return bin2hex($iv) . ':' . bin2hex($tag) . ':' . bin2hex($ciphertext);
    }

    /**
     * Decrypt AES-256-GCM string (iv:authTag:ciphertext).
     */
    public function decrypt(string $encryptedText): string
    {
        $parts = explode(':', $encryptedText);
        if (count($parts) !== 3) {
            throw new \InvalidArgumentException('Invalid encrypted text format');
        }

        [$ivHex, $tagHex, $ciphertextHex] = $parts;
        $key = hex2bin($this->keyHex);
        $iv = hex2bin($ivHex);
        $tag = hex2bin($tagHex);
        $ciphertext = hex2bin($ciphertextHex);

        $decrypted = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        if ($decrypted === false) {
            throw new \RuntimeException('Decryption failed: corrupted or tampered data');
        }

        return $decrypted;
    }
}
