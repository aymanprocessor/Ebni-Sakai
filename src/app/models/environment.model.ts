export interface Environment {
    production: boolean;

    zoom: {
        apiKey: string;
        sdkKey: string;
        sdkSecret: string;
        authCode: string;
        redirectUri: string;
    };

    encryptionKey: string;

    apiUrl: string;
    zoomProxyUrl: string;

    enableDebugLogs: boolean;

    appName: string;
    defaultLanguage: string;

    // Add any additional environment properties here
}
