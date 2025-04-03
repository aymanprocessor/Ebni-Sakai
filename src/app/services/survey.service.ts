import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query, addDoc } from '@angular/fire/firestore';
import { from, map, Observable, switchMap, take } from 'rxjs';
import { SurveyDomain } from '../models/survey-domain.model';
import { Survey } from '../models/survey.model';
import { ChildrenService } from './children.service';

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
    constructor(
        private firestore: Firestore,
        private childServ: ChildrenService
    ) {}

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

    createSurvey(childId: string, domain: string): Observable<string> {
        return this.childServ.getChildrenByUid(childId).pipe(
            take(1),
            switchMap((child) => {
                const domainObj = this.domains.find((d) => d.id === domain);
                const ageRange = this.childServ.getAgeRangeFromBirthDate(child.birthday);

                const newSurvey: Survey = {
                    childId: childId,
                    childName: child.name,
                    domain: domain,
                    domainName: domainObj?.name || domain,
                    ageRange: ageRange,
                    createdAt: new Date(),
                    completed: false,
                    responses: [],
                    currentQuestion: 0
                };

                const surveysCollection = collection(this.firestore, 'surveys');
                return from(addDoc(surveysCollection, newSurvey)).pipe(map((docRef) => docRef.id));
            })
        );
    }
}
