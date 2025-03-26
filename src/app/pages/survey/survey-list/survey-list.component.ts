import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Child } from '../../../models/child.model';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChildrenService } from '../../../services/children.service';

@Component({
    selector: 'app-survey-list',
    imports: [],
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
        private childServ: ChildrenService
    ) {
        this.newSurveyForm = this.fb.group({
            childId: ['', Validators.required],
            domain: ['', Validators.required]
        });

        this.children$ = this.childServ.getUserChildren();
    }
}
