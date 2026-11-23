import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../src/utils/encryption.js';

describe('Encryption Utility', () => {
  it('should encrypt and decrypt a string correctly', () => {
    const plaintext = 'my-secret-access-token-12345';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for the same input (random IV)', () => {
    const plaintext = 'same-plaintext';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to the same value
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it('should handle empty string', () => {
    const plaintext = '';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('should handle long strings', () => {
    const plaintext = 'a'.repeat(10000);
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('should handle special characters and unicode', () => {
    const plaintext = 'Special chars: !@#$%^&*()_+{}|:<>?™©®';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('should produce output in format iv:authTag:ciphertext', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');

    expect(parts).toHaveLength(3);
    // IV is 16 bytes = 32 hex chars
    expect(parts[0]).toHaveLength(32);
    // Auth tag is 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Ciphertext should not be empty
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('should throw on invalid encrypted text format', () => {
    expect(() => decrypt('invalid')).toThrow('Invalid encrypted text format');
    expect(() => decrypt('a:b')).toThrow('Invalid encrypted text format');
  });

  it('should throw on tampered ciphertext', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    // Tamper with the ciphertext
    parts[2] = parts[2].replace(/./g, '0');
    const tampered = parts.join(':');

    expect(() => decrypt(tampered)).toThrow();
  });
});
