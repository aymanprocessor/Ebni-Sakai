import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class N8nFirestoreService {
    constructor(private http: HttpClient) {}
    getAgeRangeBlockQuestions(payload: any) {
        const url = 'https://n8n.kidskills.app/webhook/get-age-range-block-questions';
        return this.http.post(url, payload);
    }
    getAgeRangeBlockQuestionsFromStatus(id: string) {
        const url = 'https://n8n.kidskills.app/webhook/get-age-range-block-questions-from-status';
        const payload = { id: id };
        return this.http.post(url, payload);
    }
    saveAnswers(payload: any) {
        const url = 'https://n8n.kidskills.app/webhook/answer-questions';
        return this.http.post(url, payload);
    }

    postAction(payload: any) {
        const url = 'https://n8n.kidskills.app/webhook/post-age-range-action';

        return this.http.post(url, payload);
    }

    prevAgeRange(id: string) {
        const url = 'https://n8n.kidskills.app/webhook/post-age-range-action';
        const payload = {
            action: 'prev age range',
            id: id
        };
        return this.http.post(url, payload);
    }
}
