import { Environment } from '../app/models/environment.model';

export const environment = {
    production: true,

    // Zoom Configuration
    zoom: {
        apiKey: 'YOUR_PROD_ZOOM_API_KEY',
        clientId: 'YOUR_PROD_ZOOM_CLIENT_ID',
        clientSecret: 'YOUR_PROD_ZOOM_CLIENT_SECRET',
        authCode: 'YOUR_PROD_ZOOM_AUTH_CODE',
        redirectUri: 'https://your-production-domain.com/oauth/zoom/callback'
    },

    // Security Configuration
    // In production, this should be set via environment variables
    encryptionKey: '${ENCRYPTION_KEY}',

    // API URLs
    apiUrl: 'https://api.your-production-domain.com',
    zoomProxyUrl: 'https://api.your-production-domain.com/zoom',

    // Logging
    enableDebugLogs: false,

    // Other application settings
    appName: 'Your App Name',
    defaultLanguage: 'en'
};
