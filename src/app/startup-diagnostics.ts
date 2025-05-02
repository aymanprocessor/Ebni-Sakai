import { enableProdMode } from '@angular/core';
import { Logger } from './services/logger.service';

// Comprehensive startup diagnostics utility
export class StartupDiagnostics {
    private static instance: StartupDiagnostics;
    private diagnosticLog: string[] = [];

    private constructor() {
        this.logSystemInfo();
    }

    public static getInstance(): StartupDiagnostics {
        if (!StartupDiagnostics.instance) {
            StartupDiagnostics.instance = new StartupDiagnostics();
        }
        return StartupDiagnostics.instance;
    }

    private logSystemInfo() {
        this.log('System Diagnostics', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio,
            storageAvailable: {
                localStorage: this.isStorageAvailable('localStorage'),
                sessionStorage: this.isStorageAvailable('sessionStorage')
            },
            browserFeatures: {
                serviceWorker: 'serviceWorker' in navigator,
                webWorker: typeof Worker !== 'undefined',
                indexedDB: 'indexedDB' in window
            }
        });
    }

    private isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
        try {
            const storage = window[type];
            const testKey = '__storage_test__';
            storage.setItem(testKey, '1');
            storage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    public log(category: string, message: any, level: 'info' | 'warn' | 'error' = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${category}: ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}`;

        this.diagnosticLog.push(logEntry);

        // Console logging based on level
        switch (level) {
            case 'info':
                Logger.log(logEntry);
                break;
            case 'warn':
                console.warn(logEntry);
                break;
            case 'error':
                console.error(logEntry);
                break;
        }
    }

    public capturePerformance(callback: () => void) {
        const startTime = performance.now();
        try {
            callback();
            const duration = performance.now() - startTime;
            this.log('Performance', `Operation completed in ${duration.toFixed(2)}ms`, 'info');
        } catch (error) {
            this.log('Performance Error', error, 'error');
        }
    }

    public exportDiagnosticLog(): string {
        return this.diagnosticLog.join('\n');
    }

    public clearDiagnosticLog() {
        this.diagnosticLog = [];
    }

    // Optional: Send diagnostic log to a server or logging service
    public sendDiagnosticLog() {
        const logContent = this.exportDiagnosticLog();
        // Implement your logging service here
        Logger.log('Diagnostic Log:', logContent);
    }
}

// Global error handling
window.addEventListener('error', (event) => {
    const diagnostics = StartupDiagnostics.getInstance();
    diagnostics.log(
        'Global Error',
        {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        },
        'error'
    );
});

window.addEventListener('unhandledrejection', (event) => {
    const diagnostics = StartupDiagnostics.getInstance();
    diagnostics.log('Unhandled Promise Rejection', event.reason, 'error');
});

// Export for use in application
export const diagnostics = StartupDiagnostics.getInstance();
