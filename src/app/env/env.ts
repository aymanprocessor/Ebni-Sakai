interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}

interface ZoomConfig {
    clientId: string;
    clientSecret: string;
}
interface Environment {
    zoomApiUrl: any;
    apiUrl: any;
    production: boolean;
    useEmulators: boolean;
    zoom: ZoomConfig;
    firebase: FirebaseConfig;
}

export const environment: Environment = {
    production: false,
    useEmulators: false, // Set to true for local development
    zoomApiUrl: 'https://api.zoom.us/v2',
    apiUrl: '',
    zoom: {
        clientId: 'A8LPvrl8RuiacV4ChXmaA',
        clientSecret: 'mG4vF2yeSkVg54dJv0DzO4Qbrv4zqL4D'
    },
    firebase: {
        apiKey: 'AIzaSyADNdy8cCZmAx3MkZNtFukpETTXXd18UU0',
        authDomain: 'ebni-81db7.firebaseapp.com',
        projectId: 'ebni-81db7',
        storageBucket: 'ebni-81db7.firebasestorage.app',
        messagingSenderId: '91661046504',
        appId: '1:91661046504:web:3670ac44bab7a7574c2f5d',
        measurementId: 'G-3LDCZF3LM7'
    }
};
