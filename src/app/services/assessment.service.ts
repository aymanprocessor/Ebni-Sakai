import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, shareReplay, catchError, switchMap } from 'rxjs/operators';
import { DevelopmentAssessment, AssessmentSession } from '../models/assessment.model';
import { QuestionItem } from '../models/survey-question.model';

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
    getNextAgeRange(domainName: string, currentAgeRange: string): Observable<string | null> {
        return this.assessmentData$.pipe(map((data) => {
            const ranges = Object.keys(data[domainName]);
            const currentIndex = ranges.indexOf(currentAgeRange);

            if (currentIndex !== -1 && currentIndex < ranges.length - 1) {
                return ranges[currentIndex + 1];
            }
            return null;
        }));
    }
    getPrevAgeRange(domainName: string, currentAgeRange: string): Observable<string | null> {
        return this.assessmentData$.pipe(map((data) => {
            const ranges = Object.keys(data[domainName]);
            const currentIndex = ranges.indexOf(currentAgeRange);

            if ( currentIndex > 0) {
                return ranges[currentIndex -1];
            }
            return null;
        }));
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

    getCurrentQuestionNumber(domainName: string, ageRange: string, index: number): Observable<number> {
        return this.assessmentData$.pipe(map((data) => {
            const keys = Object.keys(data[domainName][ageRange]);
            if (index >= 0 && index < keys.length) {
                return parseInt(keys[index], 10);
            }
            return 0;
        }));

    }

    getCurrentQuestionIndex(domainName: string, ageRange: string, questionNumber: number): Observable<number> {
        return this.assessmentData$.pipe(map((data) => {
            const keys = Object.keys(data[domainName][ageRange]);
            return keys.indexOf(String(questionNumber));
        }));

    }
    /**
     * Method to set assessment to a specific age range and question
     * @param domainName The domain name to set
     * @param ageRange The age range to navigate to
     * @param questionId The specific question ID to set
     */
    setSpecificQuestion(domainName: string, ageRange: string, questionId: string): void {
        const session = this.currentSession.value;
        if (!session) return;

        // Update the session with new values
        session.ageRange = ageRange;
        session.currentQuestion = questionId;

        // Update the session
        this.currentSession.next({ ...session });

        // For logging/debugging purposes
        console.log(`Set session to domain: ${domainName}, age range: ${ageRange}, question: ${questionId}`);
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

    /**
     * Creates a navigation sequence for a specific domain
     * @param domainName The domain to navigate within
     * @param sequence Array of SequenceStep objects defining the navigation order
     */
    createNavigationSequence(
        domainName: string,
        sequence: SequenceStep[]
    ): {
        start: () => Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null>;
        next: () => Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null>;
        previous: () => Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null>;
        jumpTo: (index: number) => Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null>;
        getCurrentIndex: () => Observable<number>;
        getSequenceLength: () => number;
    } {
        // Store sequence information
        const navigationSequence = [...sequence];

        // Create navigation handlers
        const navigator = {
            // Start the sequence
            start: (): Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null> => {
                if (navigationSequence.length === 0) return of(null);
                return this.navigateToSequenceIndex(domainName, navigationSequence, 0);
            },

            // Move to next question in sequence
            next: (): Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null> => {
                return this.getCurrentSequenceIndex(domainName, navigationSequence).pipe(
                    switchMap((index) => {
                        if (index === -1 || index >= navigationSequence.length - 1) return of(null);
                        return this.navigateToSequenceIndex(domainName, navigationSequence, index + 1);
                    })
                );
            },

            // Move to previous question in sequence
            previous: (): Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null> => {
                return this.getCurrentSequenceIndex(domainName, navigationSequence).pipe(
                    switchMap((index) => {
                        if (index <= 0) return of(null);
                        return this.navigateToSequenceIndex(domainName, navigationSequence, index - 1);
                    })
                );
            },

            // Jump to specific index in sequence
            jumpTo: (index: number): Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null> => {
                if (index < 0 || index >= navigationSequence.length) return of(null);
                return this.navigateToSequenceIndex(domainName, navigationSequence, index);
            },

            // Get current position in sequence
            getCurrentIndex: (): Observable<number> => {
                return this.getCurrentSequenceIndex(domainName, navigationSequence);
            },

            // Get total sequence length
            getSequenceLength: (): number => {
                return navigationSequence.length;
            }
        };

        return navigator;
    }

    /**
     * Helper method to navigate to a specific index in a sequence
     * @private
     */
    private navigateToSequenceIndex(domainName: string, sequence: SequenceStep[], index: number): Observable<{ ageRange: string; questionId: string; question: QuestionItem } | null> {
        if (index < 0 || index >= sequence.length) return of(null);

        const targetStep = sequence[index];

        return this.assessmentData$.pipe(
            map((data) => {
                if (!data || !data[domainName] || !data[domainName][targetStep.ageRange] || !data[domainName][targetStep.ageRange][targetStep.questionId]) {
                    return null;
                }

                const questionItem = data[domainName][targetStep.ageRange][targetStep.questionId];

                // Update session to this question
                this.setSpecificQuestion(domainName, targetStep.ageRange, targetStep.questionId);

                return {
                    ageRange: targetStep.ageRange,
                    questionId: targetStep.questionId,
                    question: questionItem
                };
            })
        );
    }

    /**
     * Helper method to get the current index in a sequence
     * @private
     */
    private getCurrentSequenceIndex(domainName: string, sequence: SequenceStep[]): Observable<number> {
        const session = this.currentSession.value;
        if (!session) return of(-1);

        // If domain doesn't match, we're not in this sequence
        if (session.domainName !== domainName) return of(-1);

        const currentAgeRange = session.ageRange;
        const currentQuestionId = session.currentQuestion;

        // Find current position in sequence
        const index = sequence.findIndex((step) => step.ageRange === currentAgeRange && step.questionId === currentQuestionId);

        return of(index);
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
