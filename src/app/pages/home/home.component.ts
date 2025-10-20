import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LandingHeaderComponent } from '../../shared/components/landing-header/landing-header.component';
import { LandingFooterComponent } from '../../shared/components/landing-footer/landing-footer.component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';

interface Feature {
    icon: string;
    titleKey: string;
    descriptionKey: string;
    color: string;
}

interface Benefit {
    icon: string;
    titleKey: string;
    descriptionKey: string;
}

interface Stat {
    value: string;
    labelKey: string;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule, CardModule, ButtonModule, TagModule, TimelineModule, LandingHeaderComponent, LandingFooterComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    features: Feature[] = [
        {
            icon: 'pi-brain',
            titleKey: 'pages.home.features.aiAssessment.title',
            descriptionKey: 'pages.home.features.aiAssessment.description',
            color: '#667eea'
        },
        {
            icon: 'pi-star',
            titleKey: 'pages.home.features.interactiveGames.title',
            descriptionKey: 'pages.home.features.interactiveGames.description',
            color: '#f093fb'
        },
        {
            icon: 'pi-chart-line',
            titleKey: 'pages.home.features.progressTracking.title',
            descriptionKey: 'pages.home.features.progressTracking.description',
            color: '#4fd1c5'
        },
        {
            icon: 'pi-users',
            titleKey: 'pages.home.features.expertSupport.title',
            descriptionKey: 'pages.home.features.expertSupport.description',
            color: '#fbbf24'
        }
    ];

    benefits: Benefit[] = [
        {
            icon: 'pi-check-circle',
            titleKey: 'pages.home.benefits.evidenceBased.title',
            descriptionKey: 'pages.home.benefits.evidenceBased.description'
        },
        {
            icon: 'pi-mobile',
            titleKey: 'pages.home.benefits.accessible.title',
            descriptionKey: 'pages.home.benefits.accessible.description'
        },
        {
            icon: 'pi-heart',
            titleKey: 'pages.home.benefits.childCentered.title',
            descriptionKey: 'pages.home.benefits.childCentered.description'
        },
        {
            icon: 'pi-shield',
            titleKey: 'pages.home.benefits.safeSecure.title',
            descriptionKey: 'pages.home.benefits.safeSecure.description'
        }
    ];

    stats: Stat[] = [
        { value: '1000+', labelKey: 'pages.home.stats.happyChildren' },
        { value: '500+', labelKey: 'pages.home.stats.familiesServed' },
        { value: '50+', labelKey: 'pages.home.stats.expertSpecialists' },
        { value: '100+', labelKey: 'pages.home.stats.interactiveGames' }
    ];
}
