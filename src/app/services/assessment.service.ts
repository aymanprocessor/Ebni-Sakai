import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay, catchError, switchMap } from 'rxjs/operators';
import { DevelopmentAssessment, AssessmentSession } from '../models/assessment.model';
import { QuestionItem } from '../models/survey-question.model';
import { Child } from '../models/child.model';
import { ChildrenService } from './children.service';
import { DateUtilsService } from './date-utils.service';

/**
 * Interface to define a question sequence step
 */
export interface SequenceStep {
    ageRange: string;
    questionId: string;
}

@Injectable({
    providedIn: 'root'
})
export class AssessmentService {
    private ageBlocks = ['0-6', '7-12', '13-18', '19-24', '25-30', '31-36', '37-42', '43-54', '55-66', '67-78', '79-90'];
    private assessmentData$: Observable<DevelopmentAssessment>;
    private currentSession = new BehaviorSubject<AssessmentSession | null>(null);

    constructor(
        private http: HttpClient,
        private dataUtilsService: DateUtilsService
    ) {
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

    getStartBlock(child: Child): Observable<string | null> {
        const ageInMonths = this.dataUtilsService.ageInMonthsFromDate(child.birthday);
        const ageBlockIdx = this.ageBlocks.findIndex((block) => {
            const [start, end] = block.split('-').map(Number);
            return ageInMonths >= start && ageInMonths <= end;
        });

        if (child.hasDisability === null || child.hasDisability === false || child.hasDisability === undefined) {
            const previousBlock = ageBlockIdx > 0 ? this.ageBlocks[ageBlockIdx - 1] : null;
            return of(previousBlock);
        } else {
            const previousBlock = ageBlockIdx > 0 ? this.ageBlocks[ageBlockIdx - 2] : null;
            return of(previousBlock);
        }
    }

    getCurrentQuestion(): Observable<QuestionItem | null> {
        return this.currentSession.pipe(
            switchMap((session) => {
                if (!session) return of(null);
                return this.getQuestionByDetails(session.domainName, session.currentAgeBlock, session.currentQuestionIdx);
            })
        );
    }
    getNextAgeRange(domainName: string, currentAgeRange: string): Observable<string | null> {
        return this.assessmentData$.pipe(
            map((data) => {
                const ranges = Object.keys(data[domainName]);
                const currentIndex = ranges.indexOf(currentAgeRange);

                if (currentIndex !== -1 && currentIndex < ranges.length - 1) {
                    return ranges[currentIndex + 1];
                }
                return null;
            })
        );
    }
    getPrevAgeRange(domainName: string, currentAgeRange: string): Observable<string | null> {
        return this.assessmentData$.pipe(
            map((data) => {
                const ranges = Object.keys(data[domainName]);
                const currentIndex = ranges.indexOf(currentAgeRange);

                if (currentIndex > 0) {
                    return ranges[currentIndex - 1];
                }
                return null;
            })
        );
    }
    getQuestionByDetails(domainName: string, ageRange: string, questionIdx: number): Observable<QuestionItem | null> {
        return this.assessmentData$.pipe(
            map((data) => {
                if (!data || !data[domainName] || !data[domainName][ageRange]) return null;

                const questionMap = data[domainName][ageRange];
                const keys = Object.keys(questionMap);

                if (questionIdx < 0 || questionIdx >= keys.length) return null;

                const key = keys[questionIdx];
                return questionMap[key] || null;
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

    getCurrentQuestionNumber(domainName: string, ageRange: string, index: number): Observable<number> {
        return this.assessmentData$.pipe(
            map((data) => {
                const keys = Object.keys(data[domainName][ageRange]);
                if (index >= 0 && index < keys.length) {
                    return parseInt(keys[index], 10);
                }
                return 0;
            })
        );
    }

    getCurrentQuestionIndex(domainName: string, ageRange: string, questionNumber: number): Observable<number> {
        return this.assessmentData$.pipe(
            map((data) => {
                const keys = Object.keys(data[domainName][ageRange]);
                return keys.indexOf(String(questionNumber));
            })
        );
    }
    /**
     * Method to set assessment to a specific age range and question
     * @param domainName The domain name to set
     * @param ageRange The age range to navigate to
     * @param questionId The specific question ID to set
     */
    setSpecificQuestion(domainName: string, ageRange: string, questionIdx: number): void {
        const session = this.currentSession.value;
        if (!session) return;

        // Update the session with new values
        session.currentAgeBlock = ageRange;
        session.currentQuestionIdx = questionIdx;

        // Update the session
        this.currentSession.next(session);

        // For logging/debugging purposes
        console.log(`Set session to domain: ${domainName}, age range: ${ageRange}, question index: ${questionIdx}`);
    }

    /**
     * Gets the first question from an age range relative to the current one
     * @param offset Numerical offset from current age range (-1 for previous, 1 for next, etc.)
     * @param ageRange Optional starting age range (uses current session if not provided)
     * @param domainName Optional domain name (uses current session if not provided)
     * @returns Observable with object containing the age range, question ID and QuestionItem, or null if not found
     */
    getAgeRangeFirstQuestionByOffset(offset: number, ageRange?: string, domainName?: string): Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null> {
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
                return {
                    ageRange: targetAgeRange,
                    questionId: questionId,
                    question: questionItem
                };
            })
        );
    }

    answerQuestion(answer: boolean): void {
        const session = this.currentSession.value;
        if (!session) return;

        // Parse the current question ID to determine the age range and question index
        const [ageRange, questionIndexStr] = session.currentQuestion.split('-');
        const questionIndex = parseInt(questionIndexStr) - 1; // Convert to 0-based index

        // Initialize responses object if it doesn't exist
        if (!session.responses) {
            session.responses = {};
        }

        // Initialize the array for this age range if it doesn't exist
        if (!session.responses[ageRange]) {
            session.responses[ageRange] = [];
        }

        // Ensure the array has enough elements
        while (session.responses[ageRange].length <= questionIndex) {
            session.responses[ageRange].push('');
        }

        // Update the response
        session.responses[ageRange][questionIndex] = answer ? 'y' : 'n';

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
