import { Component, OnInit } from '@angular/core';
import { LandingHeaderComponent } from '../../shared/components/landing-header/landing-header.component';
import { LandingFooterComponent } from '../../shared/components/landing-footer/landing-footer.component';

@Component({
    selector: 'app-terms-of-use',
    standalone: true,
    imports: [LandingHeaderComponent, LandingFooterComponent],
    templateUrl: './terms-of-use.component.html',
    styleUrls: ['./terms-of-use.component.css']
})
export class TermsOfUseComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
