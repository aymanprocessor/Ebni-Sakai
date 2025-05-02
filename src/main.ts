import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import { GlobalErrorHandler } from './app.component';
import { ErrorHandler, enableProdMode } from '@angular/core';
import { diagnostics } from './app/startup-diagnostics';
import { Logger } from './app/services/logger.service';

// Enable detailed error tracking
diagnostics.log('Application Startup', 'Initializing application');

// Performance and error tracking
const startTime = performance.now();

// Optional: Enable production mode if needed
// enableProdMode();

bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
        ...(appConfig.providers || []),
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandler
        }
    ]
})
    .then(() => {
        const bootstrapTime = performance.now() - startTime;
        diagnostics.log('Bootstrap', `Application bootstrapped successfully in ${bootstrapTime.toFixed(2)}ms`, 'info');

        // Additional startup diagnostics
        diagnostics.capturePerformance(() => {
            // Any additional startup checks or initializations
            Logger.log('Startup diagnostics completed');
        });
    })
    .catch((err) => {
        diagnostics.log('Bootstrap Error', err, 'error');

        // Detailed error logging
        if (err instanceof Error) {
            diagnostics.log(
                'Error Details',
                {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                },
                'error'
            );
        }

        // Optional: Display user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background-color: #4c1d95;
        color: white;
        padding: 20px;
        text-align: center;
        z-index: 9999;
    `;
        errorContainer.innerHTML = `
        <h1>Application Failed to Load</h1>
        <p>We're experiencing technical difficulties. Please try refreshing the page.</p>
        <button onclick="window.location.reload()">Reload</button>
    `;
        document.body.appendChild(errorContainer);

        // Optional: Send diagnostic log
        diagnostics.sendDiagnosticLog();
    });
