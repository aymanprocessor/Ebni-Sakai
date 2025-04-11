import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, shareReplay, catchError, switchMap } from 'rxjs/operators';
import { DevelopmentAssessment, AssessmentSession } from '../models/assessment.model';
import { QuestionItem } from '../models/survey-question.model';

@Injectable({
    providedIn: 'root'
})
export class AssessmentService {
    private assessmentData$: Observable<DevelopmentAssessment>;
    private currentSession = new BehaviorSubject<AssessmentSession | null>(null);

    constructor(private http: HttpClient) {
        // Load assessment data from the JSON file
        this.assessmentData$ = this.loadAssessmentData().pipe(
            shareReplay(1) // Cache the result
        );
    }

    private loadAssessmentData(): Observable<DevelopmentAssessment> {
        // In a real application, this would come from a file or API
        return this.http.get<DevelopmentAssessment>('assets/assessment.json').pipe(
            catchError((error) => {
                console.error('Error loading assessment data:', error);
                return of({} as DevelopmentAssessment);
            })
        );
    }

    getAssessmentData(): Observable<DevelopmentAssessment> {
        return this.assessmentData$;
    }

    startSession(session: AssessmentSession): void {
        this.currentSession.next(session);
    }

    getCurrentSession(): Observable<AssessmentSession | null> {
        return this.currentSession.asObservable();
    }

    getCurrentQuestion(): Observable<QuestionItem | null> {
        return this.currentSession.pipe(
            switchMap((session) => {
                if (!session) return of(null);
                return this.getQuestionByDetails(session.domainName, session.ageRange, session.currentQuestion);
            })
        );
    }

    getQuestionByDetails(domainName: string, ageRange: string, questionId: string): Observable<QuestionItem | null> {
        return this.assessmentData$.pipe(
            map((data) => {
                if (!data || !data[domainName] || !data[domainName][ageRange]) return null;
                return data[domainName][ageRange][questionId] || null;
            })
        );
    }

    getTotalQuestionsCount(domainName: string, ageRange: string): Observable<number> {
        return this.assessmentData$.pipe(
            map((data) => {
                if (!data || !data[domainName] || !data[domainName][ageRange]) return 0;
                return Object.keys(data[domainName][ageRange]).length;
            })
        );
    }

    answerQuestion(answer: boolean): void {
        const session = this.currentSession.value;
        if (!session) return;

        // Add response
        const responseExists = session.responses.some((r) => r.questionId === session.currentQuestion);

        if (responseExists) {
            session.responses = session.responses.map((r) => (r.questionId === session.currentQuestion ? { ...r, response: answer } : r));
        } else {
            session.responses.push({
                questionId: session.currentQuestion,
                response: answer
            });
        }

        // Move to next question
        this.assessmentData$.subscribe((data) => {
            if (!data || !session.domainName || !session.ageRange) return;

            const questions = Object.keys(data[session.domainName][session.ageRange] || {});
            const currentIndex = questions.indexOf(session.currentQuestion);

            if (currentIndex < questions.length - 1) {
                session.currentQuestion = questions[currentIndex + 1];
            }

            this.currentSession.next({ ...session });
        });
    }
}
