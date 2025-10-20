import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DatePipe } from '@angular/common';
import { AuthService } from './app/services/auth.service';
import { EnvironmentService } from './app/services/environment.service';
import { environment } from './environments/env.dev';
import { Logger } from './app/services/logger.service';
import { MessageService } from 'primeng/api';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './i18n/', '.json');
}

// Function to get default language from localStorage or fallback to 'ar-EG'
export function getDefaultLanguage(): string {
    return localStorage.getItem('language') || 'ar-EG';
}

export function initializeAuth(authService: AuthService) {
    return () => authService.waitForInitialization();
}

export const appConfig: ApplicationConfig = {
    providers: [
        {
            provide: LOCALE_ID,
            useFactory: () => localStorage.getItem('language')?.split('-')[0] || 'ar' // or a language service
        },
        importProvidersFrom(
            TranslateModule.forRoot({
                defaultLanguage: getDefaultLanguage(),
                loader: {
                    provide: TranslateLoader,
                    useFactory: createTranslateLoader,
                    deps: [HttpClient]
                }
            })
        ),

        provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideAnimationsAsync(),
        { provide: 'googleTagManagerId', useValue: 'GTM-KR39448R' },
        providePrimeNG({
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: '.app-dark',
                    colors: {
                        primary: {
                            main: '#8A4FFF', // Vibrant purple as primary color
                            surface: '#F3E8FF' // Light lavender surface
                        },
                        secondary: {
                            main: '#6D28D9' // Deep purple as secondary color
                        },
                        accent: {
                            main: '#C084FC' // Lighter purple as accent color
                        }
                    }
                }
            }
        }),
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        {
            provide: 'FIREBASE_INITIALIZATION_TIMEOUT',
            useValue: 10000 // 10 seconds timeout
        },
        {
            provide: 'APP_INITIALIZER',
            useFactory: initializeAuth,
            deps: [AuthService],
            multi: true
        },
        {
            provide: 'APP_INITIALIZER',
            useFactory: (timeout: number) => {
                return () =>
                    new Promise((resolve, reject) => {
                        const timer = setTimeout(() => {
                            console.error('Firebase initialization timed out');
                            reject(new Error('Firebase initialization timeout'));
                        }, timeout);

                        Promise.all([initializeApp(environment.firebase), getAuth(), getFirestore()])
                            .then((results) => {
                                clearTimeout(timer);
                                Logger.log('Firebase initialized successfully');
                                resolve(results);
                            })
                            .catch((error) => {
                                clearTimeout(timer);
                                console.error('Firebase initialization error:', error);
                                reject(error);
                            });
                    });
            },
            deps: ['FIREBASE_INITIALIZATION_TIMEOUT'],
            multi: true
        },
        DatePipe,
        MessageService
    ]
};
