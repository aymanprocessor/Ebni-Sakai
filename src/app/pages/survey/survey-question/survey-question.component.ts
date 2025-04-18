import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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

    private subscriptions: Subscription[] = [];

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
        // if (survey.currentAgeBlock == null || survey.currentAgeBlock == '') {

        // };

        const session: AssessmentSession = {
            ageRange: survey.ageRange || '0-6',
            childId: survey.childId,
            domainName: survey.domain,
            currentQuestion: survey.currentQuestion,
            currentQuestionIdx: survey.currentQuestionIdx,
            currentAgeBlock: survey.currentAgeBlock,
            responses: survey.responses.map((r) => ({
                questionId: r.questionId,
                response: r.value
            }))
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

    answerQuestion(survey: Survey, answer: boolean): void {
        if (!survey) return;

        // Make a copy of the survey to avoid modifying the observable directly
        const updatedSurvey = { ...survey };

        const subscription = this.processAnswer(updatedSurvey, answer).subscribe(
            (success) => this.handleAnswerResult(success, updatedSurvey),
            (error) => this.handleAnswerError(error)
        );

        this.subscriptions.push(subscription);
    }

    private processAnswer(survey: Survey, answer: boolean) {
        return this.currentQuestion$.pipe(
            take(1),
            switchMap((question) => {
                if (!question) return of(false);

                this.updateSurveyResponses(survey, question, answer);

                return this.assessmentService.getTotalQuestionsCount(survey.domainName, survey.ageRange || '0-6').pipe(
                    take(1),
                    map((totalQuestions) => {
                        this.updateSurveyProgress(survey, totalQuestions);
                        return true;
                    })
                );
            }),
            switchMap((success) => {
                if (!success) return of(false);
                return this.surveyService.updateSurvey(survey);
            })
        );
    }

    private updateSurveyResponses(survey: Survey, question: QuestionItem, answer: boolean): void {
        const questionId = survey.currentQuestion.toString();
        const existingResponseIndex = survey.responses.findIndex((r) => r.questionId === questionId);

        if (existingResponseIndex !== -1) {
            // Update existing response
            survey.responses[existingResponseIndex].value = answer;
        } else {
            // Add new response
            survey.responses.push({
                questionId: questionId,
                question: question.q,
                value: answer
            });
        }
    }

    private updateSurveyProgress(survey: Survey, totalQuestions: number): void {
        if (this.currentQuestionIndex < totalQuestions) {
            // Move to next question
            this.currentQuestionIndex++;

            this.assessmentService.setSpecificQuestion(survey.domainName, survey.ageRange || '0-6', this.currentQuestionIndex);
            this.currentQuestion$ = this.assessmentService.getCurrentQuestion();
        } else {
            // Complete the survey since all questions in this age range are answered
            survey.completed = true;
            survey.completedAt = new Date();

            this.messageService.add({
                severity: 'success',
                summary: 'اكتمل',
                detail: 'تم الانتهاء من هذه الفئة العمرية بنجاح'
            });
        }
    }

    navigateToPreviousQuestion(): void {
        this.survey$.pipe(take(1)).subscribe((survey) => {
            if (!survey) return;

            // Check if there are more questions in this age range
            this.assessmentService
                .getTotalQuestionsCount(survey.domainName, survey.ageRange || '0-6')
                .pipe(take(1))
                .subscribe((totalQuestions) => {
                    console.log('totalQuestions', totalQuestions);
                    console.log('survey.currentQuestion', survey.currentQuestion);
                    if (this.currentQuestionIndex >= totalQuestions) {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'تنبيه',
                            detail: 'أنت في السؤال الأخير'
                        });
                        return;
                    }

                    if (this.currentQuestionIndex == 0) {
                        this.assessmentService.getPrevAgeRange(survey.domainName, survey.ageRange || '0-6').subscribe((prevAgeRange) => {
                            if (prevAgeRange) {
                                survey.ageRange = prevAgeRange;
                            }
                        });
                    }
                    // Navigate to next question
                    this.currentQuestionIndex--;
                    this.surveyService.updateSurvey(survey).subscribe();

                    // Also update assessment session
                    // if (this.assessmentSession) {
                    //     this.assessmentSession.currentQuestion = survey.currentQuestion.toString();
                    //     this.assessmentService.startSession(this.assessmentSession);
                    // }

                    // If we're at the last question, show message
                });
        });
    }

    navigateToNextQuestion(): void {
        this.survey$.pipe(take(1)).subscribe((survey) => {
            if (!survey) return;

            // Check if there are more questions in this age range
            this.assessmentService
                .getTotalQuestionsCount(survey.domainName, survey.ageRange || '0-6')
                .pipe(take(1))
                .subscribe((totalQuestions) => {
                    console.log('totalQuestions', totalQuestions);
                    console.log('survey.currentQuestion', survey.currentQuestion);

                    if (this.currentQuestionIndex >= totalQuestions) {
                        this.messageService.add({
                            severity: 'info',
                            summary: 'تنبيه',
                            detail: 'أنت في السؤال الأخير'
                        });
                        return;
                    }

                    if (this.currentQuestionIndex == totalQuestions - 1) {
                        this.assessmentService.getNextAgeRange(survey.domainName, survey.ageRange || '0-6').subscribe((nextAgeRange) => {
                            if (nextAgeRange) {
                                survey.ageRange = nextAgeRange;
                            }
                        });
                    }
                    // Navigate to next question
                    survey.currentQuestion += 1;
                    this.surveyService.updateSurvey(survey).subscribe();

                    // Also update assessment session
                    // if (this.assessmentSession) {
                    //     this.assessmentSession.currentQuestion = survey.currentQuestion.toString();
                    //     this.assessmentService.startSession(this.assessmentSession);
                    // }
                    // If we're at the last question, show message
                });
        });
    }

    navigateToPreviousAgeRange(): void {
        if (!this.assessmentSession) return;
        this.currentQuestionIndex = 0;
        const subscription = this.assessmentService.getAgeRangeFirstQuestionByOffset(-1, this.currentAgeRange, this.assessmentSession.domainName).subscribe((result) => {
            if (result) {
                // Navigate to the previous age range
                this.assessmentService.setSpecificQuestion(this.assessmentSession!.domainName, result.ageRange, this.currentQuestionIndex);

                // Update current survey if available
                this.survey$.pipe(take(1)).subscribe((survey) => {
                    if (survey) {
                        survey.ageRange = result.ageRange;

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
            } else {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'تنبيه',
                    detail: 'لا توجد فئة عمرية سابقة'
                });
            }
        });

        this.subscriptions.push(subscription);
    }

    navigateToNextAgeRange(): void {
        if (!this.assessmentSession) return;
        this.currentQuestionIndex = 0;
        const subscription = this.assessmentService.getAgeRangeFirstQuestionByOffset(1, this.currentAgeRange, this.assessmentSession.domainName).subscribe((result) => {
            if (result) {
                // Navigate to the next age range
                this.assessmentService.setSpecificQuestion(this.assessmentSession!.domainName, result.ageRange, this.currentQuestionIndex);

                // Update current survey if available
                this.survey$.pipe(take(1)).subscribe((survey) => {
                    if (survey) {
                        survey.ageRange = result.ageRange;
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
                this.messageService.add({
                    severity: 'warn',
                    summary: 'تنبيه',
                    detail: 'لا توجد فئة عمرية تالية'
                });
            }
        });

        this.subscriptions.push(subscription);
    }

    private handleAnswerResult(success: boolean, survey: Survey): void {
        if (success) {
            if (survey.completed) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'اكتمل',
                    detail: 'تم إكمال الاستبيان بنجاح'
                });
            }
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'خطأ',
                detail: 'فشل في تحديث الاستبيان'
            });
        }
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
        this.router.navigate(['/app/survey/list']);
    }

    ngOnDestroy(): void {
        // Clean up subscriptions
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
