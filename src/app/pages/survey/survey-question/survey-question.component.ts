import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subscription, BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap, tap, map, finalize, catchError, take } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { AssessmentService, SequenceStep } from '../../../services/assessment.service';
import { SurveyService } from '../../../services/survey.service';
import { ChildrenService } from '../../../services/children.service';
import { Child } from '../../../models/child.model';
import { Survey } from '../../../models/survey.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { CommonModule } from '@angular/common';
import { QuestionItem } from '../../../models/survey-question.model';
import { AssessmentSession } from '../../../models/assessment.model';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-survey-question',
    standalone: true,
    imports: [CommonModule, ButtonModule, ToolbarModule, CardModule, ProgressBarModule, BadgeModule, ProgressSpinnerModule, ToastModule],
    providers: [MessageService],
    templateUrl: './survey-question.component.html',
    styleUrls: ['./survey-question.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('questionAnimation', [
            transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
            transition(':leave', [animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))])
        ])
    ]
})
export class SurveyQuestionComponent implements OnInit, OnDestroy {
    survey$: Observable<Survey | null | undefined>;
    currentQuestion$: Observable<QuestionItem | null>;
    child$: Observable<Child | undefined>;
    loading = true;
    error = false;
    currentQuestionIndex = 0;
    currentAgeRange = '';
    assessmentSession: AssessmentSession | null = null;
    isNavigating = false;
    re = 2 + 5;

    // response$ = new BehaviorSubject<{ [key: string]: string[] }>({});
    private subscriptions: Subscription[] = [];

    // Add event listener for when user leaves the page
    @HostListener('window:beforeunload', ['$event'])
    beforeUnloadHandler(event: BeforeUnloadEvent) {
        this.storeCurrentResponses();
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private surveyService: SurveyService,
        private childService: ChildrenService,
        private assessmentService: AssessmentService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef
    ) {
        this.survey$ = of(undefined);
        this.currentQuestion$ = of(null);
        this.child$ = of(undefined);
    }

    ngOnInit(): void {
        console.log('SurveyQuestionComponent initialized');
        this.initSurvey();
    }

    private initSurvey(): void {
        this.survey$ = this.route.params.pipe(
            switchMap((params) => {
                const surveyId = params['id'];
                if (!surveyId) {
                    this.error = true;
                    return of(undefined);
                }

                this.loading = true;
                return this.surveyService.getSurvey(surveyId).pipe(
                    tap((survey) => {
                        this.loading = false;
                        if (!survey) {
                            this.error = true;
                        } else {
                            this.initAssessmentSession(survey);
                        }
                    }),
                    catchError((error) => {
                        console.error('Error loading survey:', error);
                        this.loading = false;
                        this.error = true;
                        this.messageService.add({
                            severity: 'error',
                            summary: 'خطأ',
                            detail: 'فشل في تحميل بيانات الاستبيان'
                        });
                        return of(undefined);
                    }),
                    finalize(() => {
                        this.loading = false;
                    })
                );
            })
        );

        this.initRelatedData();
    }

    private initAssessmentSession(survey: Survey): void {
        // Create assessment session from survey data
        const session: AssessmentSession = {
            ageRange: survey.ageRange || '0-6',
            childId: survey.childId,
            domainName: survey.domain,
            currentQuestion: survey.currentQuestion,
            currentQuestionIdx: survey.currentQuestionIdx,
            currentAgeBlock: survey.currentAgeBlock || survey.ageRange || '0-6',
            responses: survey.responses || {}
        };

        this.currentAgeRange = session.currentAgeBlock;
        this.currentQuestionIndex = session.currentQuestionIdx;
        this.assessmentSession = session;
        this.assessmentService.startSession(session);
    }

    private initRelatedData(): void {
        // Get child data when survey is loaded
        this.child$ = this.survey$.pipe(
            switchMap((survey) => {
                if (!survey || !survey.childId) return of(undefined);
                return this.childService.getChildrenByUid(survey.childId);
            })
        );

        // Get the current question from the assessment data
        this.currentQuestion$ = this.assessmentService.getCurrentQuestion();
    }

    /**
     * Store current survey responses to database
     * Called when leaving page or finishing survey
     */
    private storeCurrentResponses(): void {
        if (this.isNavigating) return;

        this.survey$.pipe(take(1)).subscribe((survey) => {
            if (survey && survey.id) {
                // Only update if survey exists and has an ID
                this.surveyService.updateSurvey(survey).subscribe({
                    next: () => console.log('Survey responses saved'),
                    error: (err) => console.error('Error saving survey responses:', err)
                });
            }
        });
    }

    answerQuestion(survey: Survey, answer: boolean): void {
        if (!survey || this.isNavigating) return;

        // Set flag to prevent multiple navigations
        this.isNavigating = true;

        // Make a copy of the survey to avoid modifying the observable directly
        this.updateSurveyResponses(survey, answer);
        // Save the updated survey state
        const updatedSurvey = { ...survey };

        const subscription = this.processAnswer(updatedSurvey, answer).subscribe(
            (result) => {
                if (result.success) {
                    // If we need to move to next age block
                    // if (result.moveToNextAgeBlock) {
                    //this.navigateToNextAgeBlock();
                    // }
                    this.isNavigating = false;
                    this.cdr.markForCheck();
                } else {
                    this.handleAnswerError(new Error('Failed to process answer'));
                }
            },
            (error) => {
                this.handleAnswerError(error);
                this.isNavigating = false;
            }
        );

        this.subscriptions.push(subscription);
    }

    private processAnswer(survey: Survey, answer: boolean) {
        return this.currentQuestion$.pipe(
            take(1),
            switchMap((question) => {
                if (!question) return of({ success: false });

                const ageRange = survey.ageRange || '0-6';
                return this.assessmentService.getTotalQuestionsCount(survey.domain, ageRange).pipe(
                    take(1),
                    switchMap((totalQuestions) => {
                        const isLastQuestion = this.currentQuestionIndex >= totalQuestions - 1;

                        if (isLastQuestion) {
                            return this.navigateToNextAgeBlock(survey).pipe(map(() => ({ success: true, moveToNextAgeBlock: true })));
                        }

                        // Move to next question in current age block
                        this.currentQuestionIndex++;
                        survey.currentQuestionIdx = this.currentQuestionIndex;

                        this.assessmentService.setSpecificQuestion(survey.domain, ageRange, this.currentQuestionIndex);
                        this.currentQuestion$ = this.assessmentService.getCurrentQuestion();

                        return of({ success: true, moveToNextAgeBlock: false });
                    })
                );
            }),
            switchMap((result) =>
                this.surveyService.updateSurvey(survey).pipe(
                    map(() => result),
                    catchError((error) => {
                        console.error('Error updating survey:', error);
                        return of({ success: false });
                    })
                )
            )
        );
    }

    private updateSurveyResponses(survey: Survey, answer: boolean): void {
        // Make sure we're working with a defined survey object
        if (!survey) {
            console.error('Survey object is undefined');
            return;
        }

        // Initialize responses object if it doesn't exist
        if (!survey.responses) {
            survey.responses = {};
        }

        // Make sure currentAgeRange is defined
        if (!this.currentAgeRange) {
            console.error('currentAgeRange is undefined');
            return;
        }

        // Create a new reference for the responses object to trigger change detection
        const updatedResponses = { ...survey.responses };

        // Initialize the array for this age range if it doesn't exist
        if (!updatedResponses[this.currentAgeRange]) {
            updatedResponses[this.currentAgeRange] = [];
        }

        // Create a new array reference for the age range
        const updatedAgeRangeResponses = [...updatedResponses[this.currentAgeRange]];

        // Ensure the array has enough elements
        while (updatedAgeRangeResponses.length <= this.currentQuestionIndex) {
            updatedAgeRangeResponses.push('n'); // Default to 'n'
        }

        // Update the response
        updatedAgeRangeResponses[this.currentQuestionIndex] = answer ? 'y' : 'n';

        // Update the references
        updatedResponses[this.currentAgeRange] = updatedAgeRangeResponses;
        survey.responses = updatedResponses;
        console.log('updatedResponses:', updatedResponses);
    }

    private navigateToNextAgeBlock(survey: Survey): Observable<boolean> {
        if (!this.assessmentSession) return of(false);

        this.currentQuestionIndex = 0;

        return this.assessmentService.getAgeRangeFirstQuestionByOffset(1, this.currentAgeRange, this.assessmentSession.domainName).pipe(
            map((result) => {
                if (result) {
                    survey.ageRange = result.ageRange;
                    survey.currentAgeBlock = result.ageRange;
                    survey.currentQuestionIdx = 0;
                    survey.currentQuestion = '1';
                    this.currentAgeRange = result.ageRange;

                    this.messageService.add({
                        severity: 'info',
                        summary: 'انتقال',
                        detail: `تم الانتقال إلى الفئة العمرية ${result.ageRange}`
                    });

                    return true;
                }

                this.completeSurvey();
                return true;
            }),
            catchError((error) => {
                console.error('Error navigating to next age block:', error);
                return of(false);
            })
        );
    }

    completeSurvey(): void {
        this.survey$.pipe(take(1)).subscribe((survey) => {
            if (survey) {
                survey.completed = true;
                survey.completedAt = new Date();

                this.surveyService.updateSurvey(survey).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'اكتمل',
                            detail: 'تم إكمال الاستبيان بنجاح'
                        });
                        this.cdr.markForCheck();
                    }
                });
            }
        });
    }

    private handleAnswerError(error: any): void {
        console.error('Error updating survey:', error);
        this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'حدث خطأ أثناء معالجة إجابتك'
        });
    }

    navigateHome(): void {
        // Store current responses before navigating away
        this.storeCurrentResponses();
        this.router.navigate(['/app/survey/list']);
    }

    ngOnDestroy(): void {
        // Store responses when component is destroyed
        this.storeCurrentResponses();

        // Clean up subscriptions
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
