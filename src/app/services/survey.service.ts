import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query, addDoc, doc, docData, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { catchError, from, map, Observable, of, switchMap, take } from 'rxjs';
import { SurveyDomain } from '../models/survey-domain.model';
import { Survey } from '../models/survey.model';
import { ChildrenService } from './children.service';
import { Child } from '../models/child.model';
import { AssessmentService } from './assessment.service';

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
    currentAgeBlock: string = '';
    constructor(
        private firestore: Firestore,
        private childServ: ChildrenService,
        private assessmentServ: AssessmentService
    ) {}

    // Get single child by ID
    getChild(childId: string): Observable<Child | null> {
        const childDocRef = doc(this.firestore, `children/${childId}`);
        return docData(childDocRef, { idField: 'id' }).pipe(map((data) => (data as Child) || null));
    }

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

    // Get single survey by ID
    getSurvey(surveyId: string): Observable<Survey | null> {
        const surveyDocRef = doc(this.firestore, `surveys/${surveyId}`);
        return docData(surveyDocRef, { idField: 'id' }).pipe(
            map((survey) => {
                if (!survey) return null;

                return survey as Survey;
            }),
            catchError((error) => {
                console.error('Error fetching survey:', error);
                return of(null);
            })
        ) as Observable<Survey | null>;
    }

    createSurvey(childId: string, domain: string): Observable<string> {
        return this.childServ.getChildrenByUid(childId).pipe(
            take(1),
            switchMap((child) => {
                const domainObj = this.domains.find((d) => d.id === domain);

                return this.assessmentServ.getStartBlock(child).pipe(
                    take(1),
                    switchMap((currentAgeBlock) => {
                        const newSurvey: Survey = {
                            childId: childId,
                            childName: child.name,
                            domain: domain,
                            domainName: domainObj?.name || domain,
                            ageRange: currentAgeBlock!,
                            createdAt: new Date(),
                            completed: false,
                            responses: [],
                            currentQuestion: '',
                            currentQuestionIdx: 0,
                            currentAgeBlock: currentAgeBlock!
                        };

                        const surveysCollection = collection(this.firestore, 'surveys');
                        return from(addDoc(surveysCollection, newSurvey)).pipe(map((docRef) => docRef.id));
                    })
                );
            })
        );
    }

    // Update survey progress
    updateSurveyProgress(surveyId: string, responses: any[], currentQuestion: number): Observable<void> {
        const surveyDocRef = doc(this.firestore, `surveys/${surveyId}`);
        return from(
            updateDoc(surveyDocRef, {
                responses: responses,
                currentQuestion: currentQuestion,
                lastUpdated: new Date()
            })
        );
    }

    updateSurvey(survey: Survey): Observable<boolean> {
        if (!survey.id) {
            return of(false);
        }

        // Create a copy of the survey without the id for Firestore
        const { id, ...surveyData } = survey;
        const docRef = doc(this.firestore, `surveys/${id}`);

        return from(updateDoc(docRef, surveyData)).pipe(
            map(() => true),
            catchError((error) => {
                console.error('Error updating survey:', error);
                return of(false);
            })
        );
    }

    // Delete survey
    deleteSurvey(surveyId: string): Observable<void> {
        const surveyDocRef = doc(this.firestore, `surveys/${surveyId}`);
        return from(deleteDoc(surveyDocRef));
    }

    completeSurvey(surveyId: string, responses: any[]): Observable<void> {
        const surveyDocRef = doc(this.firestore, `surveys/${surveyId}`);
        return from(
            updateDoc(surveyDocRef, {
                responses: responses,
                completed: true,
                completedAt: new Date()
            })
        );
    }

    // Calculate age range based on age in months
    getAgeRange(ageInMonths: number): string {
        if (ageInMonths <= 6) return '0-6';
        if (ageInMonths <= 12) return '7-12';
        if (ageInMonths <= 18) return '13-18';
        if (ageInMonths <= 24) return '19-24';
        if (ageInMonths <= 30) return '25-30';
        if (ageInMonths <= 36) return '31-36';
        if (ageInMonths <= 42) return '37-42';
        if (ageInMonths <= 54) return '43-54';
        if (ageInMonths <= 66) return '55-66';
        if (ageInMonths <= 78) return '67-78';
        return '79-90';
    }
}
