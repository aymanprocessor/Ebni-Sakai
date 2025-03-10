// language-selector.component.ts
import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { OverlayModule } from 'primeng/overlay';

interface Language {
    code: string;
    name: string;
    flag: string;
    rtl: boolean;
}

@Component({
    selector: 'app-language-selector',
    imports: [ButtonModule, OverlayModule, NgFor, NgIf],
    templateUrl: './language-selector.component.html',
    styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent implements OnInit {
    languages: Language[] = [
        { code: 'ar-EG', name: 'العربية', flag: 'eg', rtl: true },
        { code: 'en-US', name: 'English', flag: 'us', rtl: false }
    ];

    selectedLanguage: Language;
    visible: boolean = false;

    constructor(private translateServ: TranslateService) {
        // Default to English
        this.selectedLanguage = this.languages[0];
    }

    ngOnInit(): void {
        // Check for saved language preference
        const savedLang = localStorage.getItem('language');
        if (savedLang) {
            const found = this.languages.find((lang) => lang.code === savedLang);
            if (found) {
                this.selectedLanguage = found;
                this.applyLanguage(found);
            }
        }
    }

    toggleOverlay(): void {
        this.visible = !this.visible;
    }

    selectLanguage(lang: Language): void {
        this.selectedLanguage = lang;
        this.visible = false;
        localStorage.setItem('language', lang.code);
        this.applyLanguage(lang);
        this.translateServ.use(lang.code);
    }

    private applyLanguage(lang: Language): void {
        // Set direction based on RTL flag
        document.documentElement.dir = lang.rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang.code;

        // Additional language change logic would go here
        // For example, using a translation service
    }
}
