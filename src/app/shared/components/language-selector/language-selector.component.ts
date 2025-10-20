// language-selector.component.ts
import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { OverlayModule } from 'primeng/overlay';
import { LanguageService, Language } from '../../../services/language.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-language-selector',
    imports: [ButtonModule, OverlayModule, NgFor, NgIf],
    templateUrl: './language-selector.component.html',
    styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
    languages: Language[] = [];
    selectedLanguage: Language;
    visible: boolean = false;
    private languageSubscription?: Subscription;

    constructor(private languageService: LanguageService) {
        // Initialize with current language from service
        this.selectedLanguage = this.languageService.getCurrentLanguage();
    }

    ngOnInit(): void {
        // Get available languages
        this.languages = this.languageService.getLanguages();

        // Subscribe to language changes
        this.languageSubscription = this.languageService.currentLanguage$.subscribe((language) => {
            this.selectedLanguage = language;
        });
    }

    ngOnDestroy(): void {
        // Clean up subscription
        this.languageSubscription?.unsubscribe();
    }

    toggleOverlay(): void {
        this.visible = !this.visible;
    }

    selectLanguage(lang: Language): void {
        this.visible = false;

        // Change language smoothly without reload
        this.languageService.changeLanguage(lang.code);
    }
}
