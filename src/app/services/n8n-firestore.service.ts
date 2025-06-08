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
}
