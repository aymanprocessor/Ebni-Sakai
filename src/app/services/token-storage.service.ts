// src/app/services/token-storage.service.ts
import { Injectable } from '@angular/core';
import { EncryptionService } from './encryption.service';

@Injectable({
    providedIn: 'root'
})
export class TokenStorageService {
    private readonly STORAGE_PREFIX = 'app_secure_';

    constructor(private encryptionService: EncryptionService) {}

    /**
     * Store token data securely
     * @param key The storage key
     * @param data The data to store
     */
    storeSecurely(key: string, data: any): void {
        try {
            // Convert data to string if it's an object
            const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);

            // Encrypt the data
            const encryptedData = this.encryptionService.encrypt(dataString);

            // Store with prefix to avoid collisions
            sessionStorage.setItem(`${this.STORAGE_PREFIX}${key}`, encryptedData);
        } catch (error) {
            console.error('Error storing data securely:', error);
        }
    }

    /**
     * Retrieve securely stored data
     * @param key The storage key
     * @param isObject Whether the stored data is an object
     * @returns The decrypted data
     */
    retrieveSecurely(key: string, isObject = false): any {
        try {
            // Get encrypted data
            const encryptedData = sessionStorage.getItem(`${this.STORAGE_PREFIX}${key}`);

            if (!encryptedData) {
                return null;
            }

            // Decrypt the data
            const decryptedData = this.encryptionService.decrypt(encryptedData);

            // Parse if it's an object
            return isObject ? JSON.parse(decryptedData) : decryptedData;
        } catch (error) {
            console.error('Error retrieving secure data:', error);
            return null;
        }
    }

    /**
     * Remove securely stored data
     * @param key The storage key
     */
    removeSecurely(key: string): void {
        sessionStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
    }

    /**
     * Clear all securely stored data for this application
     */
    clearAllSecureData(): void {
        Object.keys(sessionStorage)
            .filter((key) => key.startsWith(this.STORAGE_PREFIX))
            .forEach((key) => sessionStorage.removeItem(key));
    }
}
