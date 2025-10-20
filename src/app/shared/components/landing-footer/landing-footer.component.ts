import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-landing-footer',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule],
    templateUrl: './landing-footer.component.html',
    styleUrls: ['./landing-footer.component.scss']
})
export class LandingFooterComponent {}
