// src/app/services/logger.service.ts

import { environment } from '../../environments/env.dev';

export class Logger {
    private static isDev = !environment.production;

    /**
     * Log message only in development mode
     */
    static log(message: any, ...optionalParams: any[]): void {
        if (this.isDev && environment.enableDebugLogs) {
            console.log(message, ...optionalParams);
        }
    }

    /**
     * Log warning only in development mode
     */
    static warn(message: any, ...optionalParams: any[]): void {
        if (this.isDev && environment.enableDebugLogs) {
            console.warn(message, ...optionalParams);
        }
    }

    /**
     * Log error in both development and production
     */
    static error(message: any, ...optionalParams: any[]): void {
        console.error(message, ...optionalParams);
    }

    /**
     * Track performance in development mode
     */
    static time(label: string): void {
        if (this.isDev && environment.enableDebugLogs) {
            console.time(label);
        }
    }

    /**
     * End performance tracking in development mode
     */
    static timeEnd(label: string): void {
        if (this.isDev && environment.enableDebugLogs) {
            console.timeEnd(label);
        }
    }
}
