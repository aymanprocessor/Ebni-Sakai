import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { LandingHeaderComponent } from '../../shared/components/landing-header/landing-header.component';
import { LandingFooterComponent } from '../../shared/components/landing-footer/landing-footer.component';

@Component({
    selector: 'app-about-us',
    standalone: true,
    imports: [CommonModule, TranslateModule, CardModule, ButtonModule, TagModule, LandingHeaderComponent, LandingFooterComponent],
    templateUrl: './about-us.component.html',
    styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent implements OnInit, OnDestroy {
    currentDir: 'rtl' | 'ltr' = 'ltr';
    private langSub: Subscription | null = null;

    constructor(private translate: TranslateService) {}

    ngOnInit(): void {
        const lang = this.translate.currentLang || this.translate.getDefaultLang() || 'en-US';
        this.setDirection(lang);
        this.langSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
            this.setDirection(event.lang);
        });
    }

    private setDirection(lang: string) {
        const isRtl = lang.toLowerCase().startsWith('ar');
        this.currentDir = isRtl ? 'rtl' : 'ltr';
        document.documentElement.dir = this.currentDir;
    }

    ngOnDestroy(): void {
        if (this.langSub) {
            this.langSub.unsubscribe();
            this.langSub = null;
        }
    }

    getValueIcon(index: number): string {
        const icons = [
            'pi-shield', // Integrity
            'pi-star', // Excellence
            'pi-check-circle', // Accountability
            'pi-users', // Teamwork
            'pi-lightbulb', // Innovation
            'pi-heart', // Respect
            'pi-globe', // Sustainability
            'pi-user-plus' // Customer Commitment
        ];
        return icons[index % icons.length];
    }

    getValueParts(value: string): [string, string] {
        // Split on the first dash or en dash
        const match = value.match(/^(.*?)[–-]\s*(.*)$/);
        if (match) {
            return [match[1].trim(), match[2].trim()];
        }
        return [value, ''];
    }
}
