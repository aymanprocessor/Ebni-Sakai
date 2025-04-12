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
    private ageRanges = ['0-6', '7-12', '13-18', '19-24', '25-30', '31-36', '37-42', '43-54', '55-66', '67-78', '79-90'];

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

    getCurrentAgeRangeIndex(ageRange: string): number {
        return this.ageRanges.indexOf(ageRange);
    }

    getAgeRangeAtIndex(index: number): string | null {
        if (index < 0 || index >= this.ageRanges.length) {
            return null;
        }
        return this.ageRanges[index];
    }
    getAgeRangeWithOffset(ageRange: string, offset: number): string | null {
        const currentIndex = this.getCurrentAgeRangeIndex(ageRange);
        if (currentIndex === -1) {
            return null; // Current age range not found
        }
        const targetIndex = currentIndex + offset;
        const getAgeRangeAtIndex = this.getAgeRangeAtIndex(targetIndex);
        return getAgeRangeAtIndex;
    }

    getAgeRangeFirstQuestionByOffset(offset: number, ageRange?: string, domainName?: string): Observable<QuestionItem | null> {
        const session = this.currentSession.value;
        if (!session && (!ageRange || !domainName)) return of(null);

        // Use provided values or fall back to current session
        const startAgeRange = ageRange || session?.ageRange;
        const startDomainName = domainName || session?.domainName;

        if (!startAgeRange || !startDomainName) return of(null);

        return this.assessmentData$.pipe(
            map((data) => {
                if (!data || !data[startDomainName]) return null;

                // Get all available age ranges for the specified domain
                const ageRanges = Object.keys(data[startDomainName] || {}).sort((a, b) => {
                    // Sort age ranges by their lower bound
                    const aStart = parseInt(a.split('-')[0]);
                    const bStart = parseInt(b.split('-')[0]);
                    return aStart - bStart;
                });

                if (ageRanges.length === 0) return null;

                // Find starting age range index
                const currentIndex = ageRanges.indexOf(startAgeRange);
                if (currentIndex === -1) return null;

                // Calculate target index based on offset
                const targetIndex = currentIndex + offset;

                // Check if target index is valid
                if (targetIndex < 0 || targetIndex >= ageRanges.length) return null;

                const targetAgeRange = ageRanges[targetIndex];

                // Get questions for target age range
                const questions = Object.keys(data[startDomainName][targetAgeRange] || {}).sort((a, b) => parseInt(a) - parseInt(b));

                if (questions.length === 0) return null;

                // Get first question ID
                const questionId = questions[0];

                // Get the actual question item
                const questionItem = data[startDomainName][targetAgeRange][questionId];

                // Return first question of target age range with complete details
                return questionItem;
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
