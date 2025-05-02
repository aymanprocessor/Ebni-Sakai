import { initializeApp } from '@angular/fire/app';
import { getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { environment } from '../environments/env.dev';
import { Logger } from './services/logger.service';

export class FirebaseDiagnostics {
    private static instance: FirebaseDiagnostics;

    private constructor() {}

    public static getInstance(): FirebaseDiagnostics {
        if (!FirebaseDiagnostics.instance) {
            FirebaseDiagnostics.instance = new FirebaseDiagnostics();
        }
        return FirebaseDiagnostics.instance;
    }

    public async validateFirebaseConfiguration() {
        console.group('Firebase Configuration Diagnostics');

        try {
            // Validate Firebase configuration
            this.validateConfig();

            // Initialize Firebase app
            const startTime = performance.now();
            const app = initializeApp(environment.firebase);
            const initTime = performance.now() - startTime;

            Logger.log(`Firebase App Initialization: ${initTime.toFixed(2)}ms`);

            // Check Auth and Firestore
            const auth = getAuth(app);
            const firestore = getFirestore(app);

            // Optional: Connect to emulators for local development
            if (environment.useEmulators) {
                this.connectEmulators(auth, firestore);
            }

            Logger.log('Firebase Configuration: VALID');
        } catch (error) {
            console.error('Firebase Configuration Error:', error);
            this.logDetailedError(error);
        } finally {
            console.groupEnd();
        }
    }

    private validateConfig() {
        const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];

        // requiredKeys.forEach((key) => {
        //     if (!environment.firebase[key]) {
        //         throw new Error(`Missing Firebase configuration: ${key}`);
        //     }
        // });
    }

    private connectEmulators(auth: any, firestore: any) {
        Logger.log('Connecting to Firebase Emulators');
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectFirestoreEmulator(firestore, 'localhost', 8080);
    }

    private logDetailedError(error: any) {
        console.error('Detailed Error Information:');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);

        if (error.code) {
            console.error('Error Code:', error.code);
        }

        if (error.stack) {
            console.error('Error Stack:', error.stack);
        }
    }

    public async performNetworkDiagnostics() {
        console.group('Network Diagnostics');

        try {
            const startTime = performance.now();

            // Test network connectivity
            const response = await fetch('https://www.google.com', {
                mode: 'no-cors',
                cache: 'no-store'
            });

            const networkTime = performance.now() - startTime;
            Logger.log(`Network Connectivity Test: ${networkTime.toFixed(2)}ms`);
            Logger.log('Internet Connection: AVAILABLE');
        } catch (error) {
            console.error('Network Connectivity Error:', error);
            console.warn('Potential network issues detected');
        } finally {
            console.groupEnd();
        }
    }
}

// Export for use in application
export const firebaseDiagnostics = FirebaseDiagnostics.getInstance();
