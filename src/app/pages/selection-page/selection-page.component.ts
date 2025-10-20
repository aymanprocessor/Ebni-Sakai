import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-selection-page',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TranslateModule],
    templateUrl: './selection-page.component.html',
    styleUrls: ['./selection-page.component.scss']
})
export class SelectionPageComponent {
    constructor(private router: Router) {}

    navigateToSurveys() {
        this.router.navigate(['/app/survey/list']);
    }

    navigateToGames() {
        this.router.navigate(['/app/game']);
    }
}
