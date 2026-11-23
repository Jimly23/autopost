<?php

namespace Tests\Unit;

use App\Services\EncryptionService;
use Tests\TestCase;

class EncryptionTest extends TestCase
{
    public function test_can_encrypt_and_decrypt_text(): void
    {
        $service = new EncryptionService();
        $plainText = 'EAABsbCS1iHgBA...test_token_123456';

        $encrypted = $service->encrypt($plainText);
        $this->assertNotEmpty($encrypted);
        $this->assertStringContainsString(':', $encrypted);

        $parts = explode(':', $encrypted);
        $this->assertCount(3, $parts, 'Encrypted format must be iv:authTag:ciphertext');

        $decrypted = $service->decrypt($encrypted);
        $this->assertEquals($plainText, $decrypted);
    }
}
