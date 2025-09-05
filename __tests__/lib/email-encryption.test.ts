import { encryptPassword, decryptPassword, generateEncryptionKey } from '../../lib/email-encryption';

// Mock crypto module
const mockCrypto = {
  randomBytes: jest.fn(),
  createCipher: jest.fn(),
  createDecipher: jest.fn(),
  scrypt: jest.fn(),
  createCipheriv: jest.fn(),
  createDecipheriv: jest.fn()
};

jest.mock('crypto', () => mockCrypto);

describe('Email Encryption Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto functions
    mockCrypto.randomBytes.mockReturnValue(Buffer.from('1234567890123456'));
    mockCrypto.scrypt.mockImplementation((password, salt, keylen, callback) => {
      callback(null, Buffer.from('encryption-key-32-bytes-long!!'));
    });
    
    const mockCipher = {
      update: jest.fn().mockReturnValue(Buffer.from('encrypted')),
      final: jest.fn().mockReturnValue(Buffer.from('data'))
    };
    
    const mockDecipher = {
      update: jest.fn().mockReturnValue(Buffer.from('decrypted')),
      final: jest.fn().mockReturnValue(Buffer.from('password'))
    };
    
    mockCrypto.createCipheriv.mockReturnValue(mockCipher);
    mockCrypto.createDecipheriv.mockReturnValue(mockDecipher);
  });

  describe('encryptPassword', () => {
    it('should encrypt password successfully', async () => {
      const password = 'mySecretPassword123';
      
      const encrypted = await encryptPassword(password);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(password);
    });

    it('should generate random salt for each encryption', async () => {
      const password = 'samePassword';
      
      await encryptPassword(password);
      await encryptPassword(password);
      
      expect(mockCrypto.randomBytes).toHaveBeenCalledTimes(2);
    });

    it('should use AES-256-GCM encryption', async () => {
      const password = 'testPassword';
      
      await encryptPassword(password);
      
      expect(mockCrypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.any(Buffer),
        expect.any(Buffer)
      );
    });

    it('should handle empty password', async () => {
      const password = '';
      
      const encrypted = await encryptPassword(password);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(1000);
      
      const encrypted = await encryptPassword(password);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const encrypted = await encryptPassword(password);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should throw error for null password', async () => {
      await expect(encryptPassword(null as any)).rejects.toThrow();
    });

    it('should throw error for undefined password', async () => {
      await expect(encryptPassword(undefined as any)).rejects.toThrow();
    });
  });

  describe('decryptPassword', () => {
    it('should decrypt password successfully', async () => {
      // Mock a valid encrypted string format
      const encryptedPassword = 'salt:iv:authTag:encryptedData';
      
      const decrypted = await decryptPassword(encryptedPassword);
      
      expect(decrypted).toBeDefined();
      expect(typeof decrypted).toBe('string');
    });

    it('should use correct decryption algorithm', async () => {
      const encryptedPassword = 'salt:iv:authTag:encryptedData';
      
      await decryptPassword(encryptedPassword);
      
      expect(mockCrypto.createDecipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        expect.any(Buffer),
        expect.any(Buffer)
      );
    });

    it('should validate encrypted string format', async () => {
      const invalidFormat = 'invalid-encrypted-string';
      
      await expect(decryptPassword(invalidFormat)).rejects.toThrow('Invalid encrypted password format');
    });

    it('should handle malformed encrypted data', async () => {
      const malformedData = 'salt:iv:authTag'; // Missing encrypted data
      
      await expect(decryptPassword(malformedData)).rejects.toThrow();
    });

    it('should throw error for empty encrypted string', async () => {
      await expect(decryptPassword('')).rejects.toThrow();
    });

    it('should throw error for null encrypted string', async () => {
      await expect(decryptPassword(null as any)).rejects.toThrow();
    });

    it('should handle authentication tag verification', async () => {
      const encryptedPassword = 'salt:iv:authTag:encryptedData';
      
      const mockDecipher = {
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue(Buffer.from('decrypted')),
        final: jest.fn().mockReturnValue(Buffer.from('password'))
      };
      
      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher);
      
      await decryptPassword(encryptedPassword);
      
      expect(mockDecipher.setAuthTag).toHaveBeenCalled();
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate key from password and salt', async () => {
      const password = 'masterPassword';
      const salt = Buffer.from('randomSalt');
      
      const key = await generateEncryptionKey(password, salt);
      
      expect(mockCrypto.scrypt).toHaveBeenCalledWith(
        password,
        salt,
        32,
        expect.any(Function)
      );
      expect(key).toBeInstanceOf(Buffer);
    });

    it('should generate 32-byte key for AES-256', async () => {
      const password = 'testPassword';
      const salt = Buffer.from('testSalt');
      
      await generateEncryptionKey(password, salt);
      
      expect(mockCrypto.scrypt).toHaveBeenCalledWith(
        password,
        salt,
        32, // 32 bytes for AES-256
        expect.any(Function)
      );
    });

    it('should handle scrypt errors', async () => {
      const password = 'testPassword';
      const salt = Buffer.from('testSalt');
      
      mockCrypto.scrypt.mockImplementation((password, salt, keylen, callback) => {
        callback(new Error('Scrypt error'), null);
      });
      
      await expect(generateEncryptionKey(password, salt)).rejects.toThrow('Scrypt error');
    });
  });

  describe('Integration Tests', () => {
    it('should encrypt and decrypt password correctly', async () => {
      // Use real crypto for integration test
      jest.unmock('crypto');
      const realCrypto = require('crypto');
      
      // Re-import with real crypto
      jest.resetModules();
      const { encryptPassword: realEncrypt, decryptPassword: realDecrypt } = require('../../lib/email-encryption');
      
      const originalPassword = 'myTestPassword123!@#';
      
      const encrypted = await realEncrypt(originalPassword);
      const decrypted = await realDecrypt(encrypted);
      
      expect(decrypted).toBe(originalPassword);
    });

    it('should produce different encrypted values for same password', async () => {
      jest.unmock('crypto');
      jest.resetModules();
      const { encryptPassword: realEncrypt } = require('../../lib/email-encryption');
      
      const password = 'samePassword';
      
      const encrypted1 = await realEncrypt(password);
      const encrypted2 = await realEncrypt(password);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle unicode characters correctly', async () => {
      jest.unmock('crypto');
      jest.resetModules();
      const { encryptPassword: realEncrypt, decryptPassword: realDecrypt } = require('../../lib/email-encryption');
      
      const unicodePassword = '测试密码🔐🌟';
      
      const encrypted = await realEncrypt(unicodePassword);
      const decrypted = await realDecrypt(encrypted);
      
      expect(decrypted).toBe(unicodePassword);
    });
  });

  describe('Security Tests', () => {
    it('should use cryptographically secure random values', async () => {
      const password = 'testPassword';
      
      await encryptPassword(password);
      
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(16); // IV
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32); // Salt
    });

    it('should not expose plaintext password in encrypted string', async () => {
      const password = 'secretPassword123';
      
      const encrypted = await encryptPassword(password);
      
      expect(encrypted).not.toContain(password);
      expect(encrypted.toLowerCase()).not.toContain(password.toLowerCase());
    });

    it('should use authenticated encryption', async () => {
      const password = 'testPassword';
      
      await encryptPassword(password);
      
      expect(mockCrypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-gcm', // GCM provides authentication
        expect.any(Buffer),
        expect.any(Buffer)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle cipher creation errors', async () => {
      mockCrypto.createCipheriv.mockImplementation(() => {
        throw new Error('Cipher creation failed');
      });
      
      await expect(encryptPassword('test')).rejects.toThrow('Cipher creation failed');
    });

    it('should handle decipher creation errors', async () => {
      mockCrypto.createDecipheriv.mockImplementation(() => {
        throw new Error('Decipher creation failed');
      });
      
      await expect(decryptPassword('salt:iv:tag:data')).rejects.toThrow('Decipher creation failed');
    });

    it('should handle cipher update errors', async () => {
      const mockCipher = {
        update: jest.fn().mockImplementation(() => {
          throw new Error('Cipher update failed');
        }),
        final: jest.fn()
      };
      
      mockCrypto.createCipheriv.mockReturnValue(mockCipher);
      
      await expect(encryptPassword('test')).rejects.toThrow('Cipher update failed');
    });

    it('should handle decipher final errors', async () => {
      const mockDecipher = {
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue(Buffer.from('test')),
        final: jest.fn().mockImplementation(() => {
          throw new Error('Authentication failed');
        })
      };
      
      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher);
      
      await expect(decryptPassword('salt:iv:tag:data')).rejects.toThrow('Authentication failed');
    });
  });
});