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
        provideFirebaseApp(() => {
            console.log('Initializing Firebase app with config:', environment.firebase);
            return initializeApp(environment.firebase);
        }),
        // Provide Firebase services
        provideAuth(() => {
            console.log('Initializing Firebase Auth');
            return getAuth();
        }),
        provideFirestore(() => {
            console.log('Initializing Firebase Firestore');
            return getFirestore();
        }),
        DatePipe
    ]
};
