import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-complete-page',
    templateUrl: './complete-page.component.html',
    styleUrls: ['./complete-page.component.scss']
})
export class CompletePageComponent {
    constructor(private router: Router) {}

    goToForm(): void {
        this.router.navigate(['/mini-survey']);
    }
}
