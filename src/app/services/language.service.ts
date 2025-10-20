import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
    code: string;
    name: string;
    flag: string;
    rtl: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private languages: Language[] = [
        { code: 'ar-EG', name: 'العربية', flag: 'eg', rtl: true },
        { code: 'en-US', name: 'English', flag: 'us', rtl: false }
    ];

    private currentLanguageSubject: BehaviorSubject<Language>;
    public currentLanguage$: Observable<Language>;

    constructor(private translateService: TranslateService) {
        // Initialize with saved language or default to Arabic
        const savedLang = localStorage.getItem('language') || 'ar-EG';
        const initialLang = this.languages.find((lang) => lang.code === savedLang) || this.languages[0];

        this.currentLanguageSubject = new BehaviorSubject<Language>(initialLang);
        this.currentLanguage$ = this.currentLanguageSubject.asObservable();

        // Initialize translation service and document settings
        this.applyLanguage(initialLang, false);
    }

    /**
     * Get all available languages
     */
    getLanguages(): Language[] {
        return this.languages;
    }

    /**
     * Get current selected language
     */
    getCurrentLanguage(): Language {
        return this.currentLanguageSubject.value;
    }

    /**
     * Change the application language
     * @param languageCode The language code to switch to
     * @param saveToStorage Whether to save the selection to localStorage
     */
    changeLanguage(languageCode: string, saveToStorage: boolean = true): void {
        const language = this.languages.find((lang) => lang.code === languageCode);

        if (language) {
            // Save to localStorage if requested
            if (saveToStorage) {
                localStorage.setItem('language', language.code);
            }

            // Apply language changes
            this.applyLanguage(language, true);

            // Notify subscribers
            this.currentLanguageSubject.next(language);
        }
    }

    /**
     * Apply language settings to the application
     * @param language The language to apply
     * @param useAnimation Whether to use transition animation
     */
    private applyLanguage(language: Language, useAnimation: boolean = false): void {
        if (useAnimation) {
            // Add fade-out class
            document.body.classList.add('language-fade-out');

            // Wait for fade-out to complete, then change language and fade-in
            setTimeout(() => {
                // Change translation service language
                this.translateService.use(language.code);

                // Set document direction and language
                document.documentElement.dir = language.rtl ? 'rtl' : 'ltr';
                document.documentElement.lang = language.code;
                document.documentElement.setAttribute('data-language', language.code);

                // Apply RTL/LTR class to body for additional styling
                document.body.classList.remove('rtl', 'ltr');
                document.body.classList.add(language.rtl ? 'rtl' : 'ltr');

                // Remove fade-out and add fade-in
                document.body.classList.remove('language-fade-out');
                document.body.classList.add('language-fade-in');

                // Remove fade-in class after animation completes
                setTimeout(() => {
                    document.body.classList.remove('language-fade-in');
                }, 300);
            }, 200); // Fade-out duration
        } else {
            // No animation - apply immediately
            this.translateService.use(language.code);
            document.documentElement.dir = language.rtl ? 'rtl' : 'ltr';
            document.documentElement.lang = language.code;
            document.documentElement.setAttribute('data-language', language.code);
            document.body.classList.remove('rtl', 'ltr');
            document.body.classList.add(language.rtl ? 'rtl' : 'ltr');
        }
    }

    /**
     * Toggle between available languages
     */
    toggleLanguage(): void {
        const currentIndex = this.languages.findIndex((lang) => lang.code === this.currentLanguageSubject.value.code);
        const nextIndex = (currentIndex + 1) % this.languages.length;
        this.changeLanguage(this.languages[nextIndex].code);
    }

    /**
     * Check if current language is RTL
     */
    isRTL(): boolean {
        return this.currentLanguageSubject.value.rtl;
    }

    /**
     * Get language by code
     */
    getLanguageByCode(code: string): Language | undefined {
        return this.languages.find((lang) => lang.code === code);
    }
}
