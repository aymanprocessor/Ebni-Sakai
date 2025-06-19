import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Child } from '../../../models/child.model';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChildrenService } from '../../../services/children.service';
import { SurveyService } from '../../../services/survey.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { SurveyDomain } from '../../../models/survey-domain.model';
import { Survey } from '../../../models/survey.model';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';

@Component({
    selector: 'app-survey-list',
    imports: [ButtonModule, CommonModule, TableModule, TagModule, DropdownModule, DialogModule, ReactiveFormsModule],
    templateUrl: './survey-list.component.html',
    styleUrl: './survey-list.component.scss'
})
export class SurveyListComponent {
    surveys$: Observable<Survey[]>;
    children$: Observable<Child[]>;
    domains: SurveyDomain[] = [
        { id: 'التطور الجسمي', name: 'التطور الجسمي' },
        { id: 'التطور الاجتماعي', name: 'التطور الاجتماعي' },
        { id: 'التطور الادراكي', name: 'التطور الادراكي' },
        { id: 'التطور لغة الاتصال', name: 'التطور لغة الاتصال' },
        { id: 'التطور المساعدة الذاتية', name: 'التطور المساعدة الذاتية' }
    ];

    displayNewSurveyDialog = false;
    newSurveyForm: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private childServ: ChildrenService,
        private surveyServ: SurveyService
    ) {
        this.newSurveyForm = this.fb.group({
            childId: ['', Validators.required],
            domain: ['', Validators.required]
        });

        this.children$ = this.childServ.getUserChildren();

        this.surveys$ = this.surveyServ.getSurveys();
    }

    openNewSurveyDialog(): void {
        this.displayNewSurveyDialog = true;
        this.newSurveyForm.reset();
    }

    continueSurvey(id: string): void {}

    viewResults(id: string): void {}
    deleteSurvey(id: string): void {}
    startSurvey(): void {
        this.displayNewSurveyDialog = false;
    }
}
