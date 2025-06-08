import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { N8nFirestoreService } from '../../../services/n8n-firestore.service';

@Component({
    selector: 'app-mini-survey-qurstions',
    imports: [],
    templateUrl: './mini-survey-qurstions.component.html',
    styleUrl: './mini-survey-qurstions.component.scss'
})
export class MiniSurveyQurstionsComponent implements OnInit {
    surveyId: string | null = null;
    constructor(
        private route: ActivatedRoute,
        private n8nFirestoreSerivice: N8nFirestoreService
    ) {}
    ngOnInit(): void {
        this.surveyId = this.route.snapshot.paramMap.get('id')!;
    }
    sendRequest() {
        const payload = {
            id: 'kv8lnrs1I9MJrdUdlyCH',
            currentAgeRange: '13-18',
            domain: 'physical development'
        };

        this.n8nFirestoreSerivice.getAgeRangeBlockQuestions(payload).subscribe({
            next: (response) => {
                console.log('Response:', response);
            },
            error: (error) => {
                console.error('Error:', error);
            }
        });
    }
}
