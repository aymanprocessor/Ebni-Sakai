import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subscription, BehaviorSubject } from 'rxjs';
import { switchMap, tap, map, finalize, catchError, take } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { AssessmentService } from '../../../services/assessment.service';
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

@Component({
    selector: 'app-survey-question',
    standalone: true,
    imports: [CommonModule, ButtonModule, ToolbarModule, CardModule, ProgressBarModule, BadgeModule, ProgressSpinnerModule],
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
    totalQuestions = 0;
    private subscriptions: Subscription[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private surveyService: SurveyService,
        private childService: ChildrenService,
        private assessmentService: AssessmentService
    ) {
        this.survey$ = of(undefined);
        this.currentQuestion$ = of(null);
        this.child$ = of(undefined);
    }

    ngOnInit(): void {
        this.initSurvey();
        console.log(this.assessmentService.getAgeRangeWithOffset('55-66', -2));
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
                            this.loadTotalQuestions(survey);
                        }
                    }),
                    catchError((error) => {
                        console.error('Error loading survey:', error);
                        this.loading = false;
                        this.error = true;
                        // this.showErrorMessage('فشل في تحميل بيانات الاستبيان');
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

    private initRelatedData(): void {
        // Get child data when survey is loaded
        this.child$ = this.survey$.pipe(
            switchMap((survey) => {
                if (!survey || !survey.childId) return of(undefined);
                return this.childService.getChildrenByUid(survey.childId);
            })
        );

        // Get the current question from the assessment data
        this.currentQuestion$ = this.survey$.pipe(
            switchMap((survey) => {
                if (!survey) return of(null);

                const currentQuestionId = survey.currentQuestion.toString();
                const domain = survey.domainName;
                const ageRange = survey.ageRange || '0-6';
                return this.assessmentService.getAgeRangeFirstQuestionByOffset(-2, ageRange, domain);
            })
        );
    }

    private loadTotalQuestions(survey: Survey): void {
        const subscription = this.assessmentService.getTotalQuestionsCount(survey.domainName, survey.ageRange || '0-6').subscribe(
            (count) => (this.totalQuestions = count),
            (error) => console.error('Error loading question count:', error)
        );

        this.subscriptions.push(subscription);
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
        if (survey.currentQuestion < totalQuestions) {
            // Move to next question
            survey.currentQuestion += 1;
        } else {
            // Complete the survey
            survey.completed = true;
            survey.completedAt = new Date();
        }
    }

    private handleAnswerResult(success: boolean, survey: Survey): void {
        if (success) {
            if (survey.completed) {
                console.log('Survey completed successfully');
            }
        } else {
            console.error('Failed to update survey');
        }
    }

    private handleAnswerError(error: any): void {
        console.error('Error updating survey:', error);
    }

    navigateHome(): void {
        this.router.navigate(['/']);
    }

    ngOnDestroy(): void {
        // Clean up subscriptions
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
