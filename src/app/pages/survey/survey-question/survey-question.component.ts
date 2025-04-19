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
    response$ = new BehaviorSubject<{ [key: string]: string[] }>({});
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

                this.updateSurveyResponses(survey, answer);

                return this.assessmentService.getTotalQuestionsCount(survey.domain, survey.ageRange || '0-6').pipe(
                    take(1),
                    map((totalQuestions) => {
                        const isLastQuestion = this.currentQuestionIndex >= totalQuestions - 1;
                        const moveToNextAgeBlock = isLastQuestion;

                        if (!isLastQuestion) {
                            // Move to next question in current age block
                            this.currentQuestionIndex++;
                            survey.currentQuestionIdx = this.currentQuestionIndex;

                            this.assessmentService.setSpecificQuestion(survey.domain, survey.ageRange || '0-6', this.currentQuestionIndex);
                            this.currentQuestion$ = this.assessmentService.getCurrentQuestion();
                        } else if (moveToNextAgeBlock) {
                            this.navigateToNextAgeBlock();
                            // Mark for moving to next age block after saving
                            // We'll handle the actual navigation after saving the current response
                        }

                        return { success: true, moveToNextAgeBlock };
                    })
                );
            }),
            switchMap((result) => {
                // Always save the current state
                return this.surveyService.updateSurvey(survey).pipe(
                    map(() => result),
                    catchError((error) => {
                        console.error('Error updating survey:', error);
                        return of({ success: false });
                    })
                );
            })
        );
    }

    private updateSurveyResponses(survey: Survey, answer: boolean): void {
        debugger;
        if (!survey.responses[this.currentAgeRange!]) {
            survey.responses[this.currentAgeRange!] = []; // Or something like ["n", "n", "n"] as default
        }
        survey.responses[this.currentAgeRange!][this.currentQuestionIndex] = answer ? 'y' : 'n';
        localStorage.setItem('surveyResponses', JSON.stringify(survey.responses));
    }

    navigateToNextAgeBlock(): void {
        if (!this.assessmentSession) return;

        this.currentQuestionIndex = 0;

        const subscription = this.assessmentService.getAgeRangeFirstQuestionByOffset(1, this.currentAgeRange, this.assessmentSession.domainName).subscribe((result) => {
            if (result) {
                // Navigate to the next age range
                this.assessmentService.setSpecificQuestion(this.assessmentSession!.domainName, result.ageRange, 0);

                // Update current survey
                this.survey$.pipe(take(1)).subscribe((survey) => {
                    if (survey) {
                        survey.ageRange = result.ageRange;
                        survey.currentAgeBlock = result.ageRange;
                        survey.currentQuestionIdx = 0;
                        survey.currentQuestion = '1';

                        this.surveyService.updateSurvey(survey).subscribe();
                    }
                });

                // Update current age range for UI
                this.currentAgeRange = result.ageRange;

                this.messageService.add({
                    severity: 'info',
                    summary: 'انتقال',
                    detail: `تم الانتقال إلى الفئة العمرية ${result.ageRange}`
                });

                this.cdr.markForCheck();
            } else {
                // No more age blocks, mark survey as completed
                this.completeSurvey();
            }
        });

        this.subscriptions.push(subscription);
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
