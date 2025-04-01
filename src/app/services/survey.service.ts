import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { SurveyDomain } from '../models/survey-domain.model';
import { Survey } from '../models/survey.model';

@Injectable({
    providedIn: 'root'
})
export class SurveyService {
    domains: SurveyDomain[] = [
        { id: 'التطور الجسمي', name: 'التطور الجسمي' },
        { id: 'التطور الاجتماعي', name: 'التطور الاجتماعي' },
        { id: 'التطور الادراكي', name: 'التطور الادراكي' },
        { id: 'التطور لغة الاتصال', name: 'التطور لغة الاتصال' },
        { id: 'التطور المساعدة الذاتية', name: 'التطور المساعدة الذاتية' }
    ];
    constructor(private firestore: Firestore) {}

    getSurveys(): Observable<Survey[]> {
        const surveyCollection = collection(this.firestore, 'surveys');
        const q = query(surveyCollection, orderBy('createdAt', 'desc'));

        return collectionData(q, { idField: 'id' }).pipe(
            map((surveys) => {
                return surveys.map((survey: any) => {
                    const domainObj = this.domains.find((d) => d.id === survey.domain);
                    return {
                        ...survey,
                        domainName: domainObj ? domainObj.name : survey.domain,
                        createdAt: survey.createdAt.toDate()
                    };
                });
            })
        ) as Observable<Survey[]>;
    }
}
