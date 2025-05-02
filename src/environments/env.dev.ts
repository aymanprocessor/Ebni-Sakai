import { Environment } from '../app/models/environment.model';

// src/environments/environment.ts
export const environment = {
    production: false,

    // Zoom Configuration
    zoom: {
        apiKey: 'YOUR_PROD_ZOOM_API_KEY',

        sdkKey: 'A8LPvrl8RuiacV4ChXmaA',
        sdkSecret: 'mG4vF2yeSkVg54dJv0DzO4Qbrv4zqL4D',
        authCode: 'YOUR_DEV_ZOOM_AUTH_CODE',
        redirectUri: 'http://localhost:4200/oauth/zoom/callback'
    },

    // Security Configuration
    encryptionKey: 'dev_encryption_key_for_testing_only',

    // API URLs
    apiUrl: 'http://localhost:3000/api',
    zoomProxyUrl: 'https://petal-tidal-kicker.glitch.me/zoom',

    // Logging
    enableDebugLogs: true,

    // Other application settings
    appName: 'Your App Name - Dev',
    defaultLanguage: 'en'
};
