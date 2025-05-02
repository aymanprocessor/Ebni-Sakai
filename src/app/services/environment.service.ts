// src/app/services/environment.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environments/env.dev';
import { Environment } from '../models/environment.model';

/**
 * Service to provide access to environment variables
 * and handle environment-specific behavior
 */
@Injectable({
    providedIn: 'root'
})
export class EnvironmentService {
    private readonly environment = environment;

    constructor() {
        // Log environment mode on service initialization
        if (this.isDevelopment()) {
            console.log('Application running in DEVELOPMENT mode');
        } else {
            console.log('Application running in PRODUCTION mode');
        }
    }

    /**
     * Check if the application is running in development mode
     */
    isDevelopment(): boolean {
        return !this.environment.production;
    }

    /**
     * Check if the application is running in production mode
     */
    isProduction(): boolean {
        return this.environment.production;
    }

    /**
     * Get all environment variables
     */
    getAll(): any {
        return this.environment;
    }

    /**
     * Get a specific environment variable
     * @param key The environment variable key
     * @param defaultValue Default value if key doesn't exist
     */
    get<K extends keyof Environment>(key: K, defaultValue: Environment[K] | null = null): Environment[K] | null {
        return this.environment[key] !== undefined ? this.environment[key] : defaultValue;
    }

    /**
     * Get Zoom configuration
     */
    getZoomConfig(): any {
        return this.environment.zoom;
    }

    /**
     * Get API URL
     */
    getApiUrl(): string {
        return this.environment.apiUrl;
    }

    /**
     * Get Zoom proxy URL
     */
    getZoomProxyUrl(): string {
        return this.environment.zoomProxyUrl;
    }

    /**
     * Log message only in development mode
     * @param message Message to log
     * @param optionalParams Additional parameters
     */
    logDev(message?: any, ...optionalParams: any[]): void {
        if (this.isDevelopment() && this.environment.enableDebugLogs) {
            console.log(message, ...optionalParams);
        }
    }

    /**
     * Log error in both development and production
     * @param message Error message
     * @param optionalParams Additional parameters
     */
    logError(message?: any, ...optionalParams: any[]): void {
        console.error(message, ...optionalParams);
    }
}
