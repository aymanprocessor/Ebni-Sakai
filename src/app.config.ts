import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from './app/env/env';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DatePipe } from '@angular/common';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './i18n/', '.json');
}

// Function to get default language from localStorage or fallback to 'en-US'
export function getDefaultLanguage(): string {
    return localStorage.getItem('language') || 'en-US';
}

export const appConfig: ApplicationConfig = {
    providers: [
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
                            main: '#8A56AC', // Indigo as primary color
                            surface: '#EEF2FF' // Light indigo surface
                        },
                        secondary: {
                            main: '#8B5CF6' // Purple as secondary color
                        },
                        accent: {
                            main: '#F59E0B' // Amber as accent color
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
                                console.log('Firebase initialized successfully');
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
        DatePipe
    ]
};
