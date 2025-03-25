import { Component, OnInit, ErrorHandler, Injectable } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GoogleTagManagerModule } from 'angular-google-tag-manager';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    handleError(error: any): void {
        console.error('Unhandled Error:', error);

        // Log detailed error information
        if (error instanceof Error) {
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
        }

        // Optional: Send error to monitoring service
        // this.errorService.logError(error);
    }
}

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `
        <div id="app-root">
            <router-outlet></router-outlet>
        </div>
    `
})
export class AppComponent implements OnInit {
    constructor() {
        console.log('AppComponent constructor called');

        // Add global error event listeners
        window.addEventListener('error', (event) => {
            console.error('Global Error Event:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
        });
    }

    ngOnInit() {
        console.log('AppComponent initialized');

        // Performance tracking
        const startTime = performance.now();

        // Log when initial rendering is complete
        requestAnimationFrame(() => {
            const renderTime = performance.now() - startTime;
            console.log(`Initial render completed in ${renderTime.toFixed(2)}ms`);
        });
    }
}
