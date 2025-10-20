import { Component, OnInit } from '@angular/core';
import { LandingHeaderComponent } from '../../shared/components/landing-header/landing-header.component';
import { LandingFooterComponent } from '../../shared/components/landing-footer/landing-footer.component';

@Component({
    selector: 'app-privacy-policy',
    standalone: true,
    imports: [LandingHeaderComponent, LandingFooterComponent],
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
