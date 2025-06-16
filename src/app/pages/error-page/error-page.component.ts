import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-error-page',
    imports: [],
    templateUrl: './error-page.component.html',
    styleUrl: './error-page.component.scss'
})
export class ErrorPageComponent implements OnInit {
    errorTitle: string = 'Oops! Something went wrong';
    errorMessage: string = 'We encountered an unexpected error. Please try again or contact support if the problem persists.';

    constructor(private router: Router) {}

    ngOnInit(): void {
        const navigationState = history.state;
        console.log('Navigation state:', navigationState);
        if (navigationState) {
            if (navigationState['errorTitle']) this.errorTitle = navigationState['errorTitle'];
            if (navigationState['errorMessage']) this.errorMessage = navigationState['errorMessage'];
        }
    }

    goToForm(): void {
        this.router.navigate(['/mini-survey']);
    }
}
