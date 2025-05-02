import { registerLocaleData } from '@angular/common';
import { Component, OnInit, ErrorHandler, Injectable } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { GoogleTagManagerModule } from 'angular-google-tag-manager';
import localeAr from '@angular/common/locales/ar';
import localeEn from '@angular/common/locales/en';
registerLocaleData(localeAr, 'ar');
registerLocaleData(localeEn, 'en');
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    handleError(error: any): void {
        console.error('Unhandled Error:', error);

        // Log detailed error information
        if (error instanceof Error) {
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
        }

        // Optional: Send error to monitoring service
        // this.errorService.logError(error);
    }
}

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `
        <div id="app-root">
            <router-outlet></router-outlet>
        </div>
    `
})
export class AppComponent implements OnInit {
    constructor(private translateService: TranslateService) {}

    ngOnInit() {
        this.translateService.use('ar-EG'); // Set default language
    }
}
