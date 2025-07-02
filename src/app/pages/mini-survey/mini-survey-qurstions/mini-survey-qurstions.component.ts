import { state } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { N8nFirestoreService } from '../../../services/n8n-firestore.service';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CardModule } from 'primeng/card';

interface Question {
    id: string;
    domain: string;
    ans: string;
    q: string;
    th?: string;
}

interface QuestionResponse {
    [key: string]: Question;
}

interface AgeRangeData {
    ageRange: string;
    questions: Question[];
    questionKeys: string[];
    answers: any[];
}

interface StorageAnswers {
    [domain: string]: {
        [ageRange: string]: {
            [questionId: string]: {
                questionIndex: number;
                question: string;
                answer: string;
            };
        };
    };
}

@Component({
    selector: 'app-mini-survey-qurstions',
    imports: [CommonModule, ButtonModule, ToolbarModule, SelectButtonModule, RadioButtonModule, CardModule],
    templateUrl: './mini-survey-qurstions.component.html',
    styleUrl: './mini-survey-qurstions.component.scss',
    changeDetection: ChangeDetectionStrategy.Default
})
export class MiniSurveyQurstionsComponent implements OnInit {
    surveyId: string | null = null;
    questions: Question[] = [];
    questionKeys: string[] = [];
    isLoading: boolean = false;
    currentDomainAr: string = '';
    currentDomainEn: string = '';
    // Age range navigation
    ageRanges: string[] = ['0-6', '7-12', '13-18', '18-24', '25-36', '37-42', '43-54', '55-66', '67-78', '79-90'];
    currentAgeRangeIndex: number = 0; // Default to '13-18'

    // Local storage keys
    private get ageRangeStackKey(): string {
        return `survey_${this.surveyId}_age_range_stack`;
    }

    private get answersKey(): string {
        return `survey_${this.surveyId}_answers`;
    }

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private n8nFirestoreSerivice: N8nFirestoreService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.surveyId = this.route.snapshot.paramMap.get('id')!;
        this.loadFromLocalStorage();
        this.loadCurrentAgeRange();
    }

    get currentAgeRange(): string {
        return this.ageRanges[this.currentAgeRangeIndex];
    }

    // Local Storage Methods
    private loadFromLocalStorage() {
        try {
            // Load age range navigation state
            const savedStack = localStorage.getItem(this.ageRangeStackKey);
            if (savedStack) {
                const stackData = JSON.parse(savedStack);
                this.currentAgeRangeIndex = stackData.currentIndex || 2;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    private saveAgeRangeToLocalStorage() {
        try {
            const stackData = {
                currentIndex: this.currentAgeRangeIndex,
                currentAgeRange: this.currentAgeRange,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.ageRangeStackKey, JSON.stringify(stackData));
        } catch (error) {
            console.error('Error saving age range to localStorage:', error);
        }
    }

    private saveCurrentAnswersToLocalStorage() {
        try {
            // Get existing answers from localStorage
            const existingAnswers: StorageAnswers = this.getStoredAnswers();
            const currentDomain = this.currentDomainEn.toLowerCase();

            // Initialize domain if it doesn't exist
            if (!existingAnswers[currentDomain]) {
                existingAnswers[currentDomain] = {};
            }

            // Initialize age range within domain if it doesn't exist
            if (!existingAnswers[currentDomain][this.currentAgeRange]) {
                existingAnswers[currentDomain][this.currentAgeRange] = {};
            }

            // Save current age range answers for the current domain
            this.questionKeys.forEach((key, index) => {
                if (this.questions[index] && this.questions[index].ans) {
                    existingAnswers[currentDomain][this.currentAgeRange][key] = {
                        questionIndex: index + 1,
                        question: this.questions[index].q,
                        answer: this.questions[index].ans
                    };
                }
            });

            localStorage.setItem(this.answersKey, JSON.stringify(existingAnswers));
        } catch (error) {
            console.error('Error saving answers to localStorage:', error);
        }
    }

    private getStoredAnswers(): StorageAnswers {
        try {
            const stored = localStorage.getItem(this.answersKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error getting stored answers:', error);
            return {};
        }
    }

    private loadAnswersFromLocalStorage() {
        try {
            const storedAnswers = this.getStoredAnswers();
            const currentDomain = this.currentDomainEn.toLowerCase();
            const currentDomainAnswers = storedAnswers[currentDomain];
            const currentAgeRangeAnswers = currentDomainAnswers?.[this.currentAgeRange];

            if (currentAgeRangeAnswers && this.questions.length > 0) {
                this.questionKeys.forEach((key, index) => {
                    if (currentAgeRangeAnswers[key] && this.questions[index]) {
                        this.questions[index].ans = currentAgeRangeAnswers[key].answer;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading answers from localStorage:', error);
        }
    }

    private getAllStoredAnswers(): any[] {
        const storedAnswers = this.getStoredAnswers();
        const allAnswers: any[] = [];

        Object.keys(storedAnswers).forEach((domain) => {
            Object.keys(storedAnswers[domain]).forEach((ageRange) => {
                Object.keys(storedAnswers[domain][ageRange]).forEach((questionId) => {
                    allAnswers.push({
                        questionId,
                        domain,
                        ageRange,
                        ...storedAnswers[domain][ageRange][questionId]
                    });
                });
            });
        });

        return allAnswers;
    }

    async loadCurrentAgeRange() {
        // Check if we have cached data for this age range
        // const cachedData = this.getCachedAgeRangeData(this.currentAgeRange);
        // if (cachedData) {
        //     this.questions = cachedData.questions;
        //     this.questionKeys = cachedData.questionKeys;
        //     this.loadAnswersFromLocalStorage();
        //     return;
        // }

        // Load from server
        await this.getAgeRangeBlockQuestions();
    }

    private getCachedAgeRangeData(ageRange: string): AgeRangeData | null {
        try {
            const cacheKey = `survey_${this.surveyId}_${ageRange}_data`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Error getting cached data:', error);
        }
        return null;
    }

    private cacheAgeRangeData(ageRange: string, questions: Question[], questionKeys: string[]) {
        try {
            const cacheKey = `survey_${this.surveyId}_${ageRange}_data`;
            const data: AgeRangeData = {
                ageRange,
                questions: JSON.parse(JSON.stringify(questions)), // Deep clone
                questionKeys: [...questionKeys],
                answers: []
            };
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error caching age range data:', error);
        }
    }

    refreshRoute() {
        const currentUrl = this.router.url;
        this.router.navigateByUrl('/mini-survey/' + this.surveyId, { skipLocationChange: true }).then(() => {
            this.router.navigate([currentUrl]);
        });
    }

    async getAgeRangeBlockQuestions() {
        const response: any = await firstValueFrom(this.n8nFirestoreSerivice.getAgeRangeBlockQuestionsFromStatus(this.surveyId!));
        console.log('Response Question:', response);
        this.currentDomainAr = response.currentDomainAr;
        this.currentDomainEn = response.currentDomainEn;
        if (response.success) {
            if (response.status.isCompleted === 'true') {
                this.router.navigateByUrl('app/complete-survey');
                return;
            }
            this.processQuestionResponse(response.questions);
            // Cache the data
            this.cacheAgeRangeData(this.currentAgeRange, this.questions, this.questionKeys);
            // Load any existing answers
            this.loadAnswersFromLocalStorage();
            //refresh page to reflect changes
            // this.refreshRoute();
        } else {
            if (response.code === 1002) {
                this.router.navigateByUrl('/error', {
                    state: { errorMessage: response.error, errorTitle: 'خطأ ' }
                });
            }
        }
    }

    async nextAgeRange() {
        this.isLoading = true;

        const payload = {
            action: 'next age range',
            id: this.surveyId,
            questions: this.questions
        };

        try {
            const response: any = await firstValueFrom(this.n8nFirestoreSerivice.postAction(payload));
            console.log('Response Post Action:', response);

            if (response.success) {
                await this.getAgeRangeBlockQuestions();
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            this.isLoading = false;
            // window.location.reload(); // Reload the page to reflect changes
        }
    }

    disableSubmit() {
        return this.questions.some((question) => question.ans === '');
    }

    processQuestionResponse(response: any) {
        console.log('Processing question response:', response);
        this.questionKeys = Object.keys(response);
        this.questions = this.questionKeys.map((key) => response[key]);
        this.refreshRoute();
        this.cdr.detectChanges(); // Ensure view updates after processing
    }

    selectAnswer(questionIndex: number, answer: 'yes' | 'no') {
        this.questions[questionIndex].ans = answer;
        this.questions[questionIndex].domain = this.currentDomainEn.toLowerCase(); // Set domain for the question
        // Auto-save answers when user selects an answer
        this.saveCurrentAnswersToLocalStorage();
    }

    submitAnswers() {
        // Save current answers before submitting
        this.saveCurrentAnswersToLocalStorage();

        // Get all stored answers
        const allAnswers = this.getAllStoredAnswers();
        console.log('All answers from all domains and age ranges:', allAnswers);

        const payload = {
            id: this.surveyId,
            data: allAnswers
        };

        this.n8nFirestoreSerivice.saveAnswers(payload).subscribe({
            next: (response) => {
                console.log('Answers submitted successfully:', response);
                // Clear localStorage after successful submission
                this.clearSurveyData();
                alert('تم إرسال جميع الإجابات بنجاح!');
            },
            error: (error) => {
                console.error('Error submitting answers:', error);
                alert('حدث خطأ أثناء إرسال الإجابات. يرجى المحاولة مرة أخرى.');
            },
            complete: () => {
                console.log('Answer submission complete.');
            }
        });
    }

    private clearSurveyData() {
        try {
            // Clear all survey-related data from localStorage
            const keysToRemove = [this.ageRangeStackKey, this.answersKey];

            // Also clear cached age range data
            this.ageRanges.forEach((ageRange) => {
                keysToRemove.push(`survey_${this.surveyId}_${ageRange}_data`);
            });

            keysToRemove.forEach((key) => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Error clearing survey data:', error);
        }
    }

    getAnswers() {
        return this.questionKeys.map((key, index) => ({
            questionId: key,
            questionIndex: index + 1,
            question: this.questions[index].q,
            answer: this.questions[index].ans,
            ageRange: this.currentAgeRange,
            domain: this.questions[index].domain // Ensure domain is set
        }));
    }

    // Utility method to check how much data is stored
    getStorageInfo() {
        try {
            const ageRangeData = localStorage.getItem(this.ageRangeStackKey);
            const answersData = localStorage.getItem(this.answersKey);

            console.log('Age Range Stack:', ageRangeData ? JSON.parse(ageRangeData) : null);
            console.log('Stored Answers:', answersData ? JSON.parse(answersData) : null);

            return {
                ageRangeStack: ageRangeData ? JSON.parse(ageRangeData) : null,
                answers: answersData ? JSON.parse(answersData) : null
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
}
