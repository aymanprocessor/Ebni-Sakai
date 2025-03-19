import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-survey',
    imports: [ButtonModule],
    templateUrl: './survey.component.html',
    styleUrl: './survey.component.scss'
})
export class SurveyComponent {}
