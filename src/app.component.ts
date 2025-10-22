import { registerLocaleData } from '@angular/common';
import { Component, OnInit, ErrorHandler, Injectable } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GoogleTagManagerModule } from 'angular-google-tag-manager';
import { LanguageService } from './app/services/language.service';
import { WhatsappButtonComponent } from './app/shared/components/whatsapp-button/whatsapp-button.component';
import { ChatgptFloatButtonComponent } from './app/shared/components/chatgpt-float-button/chatgpt-float-button.component';
import localeAr from '@angular/common/locales/ar';
import localeEn from '@angular/common/locales/en';
registerLocaleData(localeAr, 'ar');
registerLocaleData(localeEn, 'en');
@Injectable()
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, WhatsappButtonComponent, ChatgptFloatButtonComponent],
    template: `
        <div id="app-root">
            <router-outlet></router-outlet>
            <app-chatgpt-float-button></app-chatgpt-float-button>
            <app-whatsapp-button></app-whatsapp-button>
        </div>
    `
})
export class AppComponent implements OnInit {
    constructor(private languageService: LanguageService) {}

    ngOnInit() {
        // Language is already initialized by LanguageService constructor
        // No additional initialization needed
    }
}
