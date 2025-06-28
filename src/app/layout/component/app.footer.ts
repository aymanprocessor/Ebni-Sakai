import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    imports: [TranslateModule],
    template: `
        <div class="layout-footer">
            {{ 'footer.madeby' | translate }} | <a href="app/privacy-policy">{{ 'footer.privacyPolicy' | translate }}</a> | <a href="app/terms-of-use">{{ 'footer.termsOfService' | translate }}</a>
        </div>
    `
})
export class AppFooter {}
