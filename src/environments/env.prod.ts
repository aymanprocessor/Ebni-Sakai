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
    firebase: {
        apiKey: 'AIzaSyADNdy8cCZmAx3MkZNtFukpETTXXd18UU0',
        authDomain: 'ebni-81db7.firebaseapp.com',
        projectId: 'ebni-81db7',
        storageBucket: 'ebni-81db7.firebasestorage.app',
        messagingSenderId: '91661046504',
        appId: '1:91661046504:web:3670ac44bab7a7574c2f5d',
        measurementId: 'G-3LDCZF3LM7'
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
