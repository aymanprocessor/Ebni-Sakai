// src/app/services/encryption.service.ts
import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../environments/env.dev';

@Injectable({
    providedIn: 'root'
})
export class EncryptionService {
    private readonly encryptionKey: string;

    constructor() {
        // Get encryption key from environment or generate one
        this.encryptionKey = environment.encryptionKey || this.generateEncryptionKey();
    }

    /**
     * Encrypt data using AES encryption
     * @param data The data to encrypt
     * @returns Encrypted data string
     */
    encrypt(data: string): string {
        try {
            return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
        } catch (error) {
            console.error('Encryption error:', error);
            return '';
        }
    }

    /**
     * Decrypt data using AES encryption
     * @param encryptedData The encrypted data
     * @returns Decrypted data string
     */
    decrypt(encryptedData: string): string {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Decryption error:', error);
            return '';
        }
    }

    /**
     * Generate a random encryption key and store it for the session
     * @returns A random encryption key
     */
    private generateEncryptionKey(): string {
        // Check if we already have one in sessionStorage
        const storedKey = sessionStorage.getItem('app_encryption_key');

        if (storedKey) {
            return storedKey;
        }

        // Generate a random key
        const randomKey = CryptoJS.lib.WordArray.random(16).toString();

        // Store it for this session
        sessionStorage.setItem('app_encryption_key', randomKey);

        return randomKey;
    }
}
