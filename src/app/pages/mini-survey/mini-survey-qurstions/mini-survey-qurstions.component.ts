import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { N8nFirestoreService } from '../../../services/n8n-firestore.service';

interface Question {
    ans: string;
    q: string;
    th?: string;
}

interface QuestionResponse {
    [key: string]: Question;
}

@Component({
    selector: 'app-mini-survey-qurstions',
    imports: [CommonModule],
    templateUrl: './mini-survey-qurstions.component.html',
    styleUrl: './mini-survey-qurstions.component.scss'
})
export class MiniSurveyQurstionsComponent implements OnInit {
    surveyId: string | null = null;
    questions: Question[] = [];
    questionKeys: string[] = [];

    // Age range navigation
    ageRanges: string[] = ['0-6', '6-12', '13-18', '18-24', '24-36'];
    currentAgeRangeIndex: number = 2; // Default to '13-18'

    // Navigation stack
    navigationStack: { ageRange: string; questions: Question[]; questionKeys: string[] }[] = [];
    currentStackIndex: number = -1;

    constructor(
        private route: ActivatedRoute,
        private n8nFirestoreSerivice: N8nFirestoreService
    ) {}

    ngOnInit(): void {
        this.surveyId = this.route.snapshot.paramMap.get('id')!;
        this.loadCurrentAgeRange();
    }

    get currentAgeRange(): string {
        return this.ageRanges[this.currentAgeRangeIndex];
    }

    get canGoToNextAgeRange(): boolean {
        return this.currentAgeRangeIndex < this.ageRanges.length - 1;
    }

    get canGoToPrevAgeRange(): boolean {
        return this.currentAgeRangeIndex > 0;
    }

    loadCurrentAgeRange() {
        // Check if we already have this age range in stack

        this.sendRequest(this.currentAgeRange);
    }

    sendRequest(ageRange?: string) {
        const payload = {
            id: this.surveyId,
            currentAgeRange: ageRange || this.currentAgeRange,
            domain: 'physical development'
        };

        this.n8nFirestoreSerivice.getAgeRangeBlockQuestions(payload).subscribe({
            next: (response: any) => {
                console.log('Response:', response);
                this.processQuestionResponse(response);
            },
            error: (error) => {
                console.error('Error:', error);
            }
        });
    }

    nextAgeRange() {
        // if (this.canGoToNextAgeRange) {
        //     this.currentAgeRangeIndex++;
        //     // Check if we already have data for this age range in stack
        //     const existingIndex = this.navigationStack.findIndex((item) => item.ageRange === this.currentAgeRange);
        //     if (existingIndex >= 0) {
        //         this.loadFromStack(existingIndex);
        //     } else {
        //         this.loadCurrentAgeRange();
        //     }
        // }
    }

    prevAgeRange() {
        if (this.canGoToPrevAgeRange) {
            this.currentAgeRangeIndex--;

            // Check if we already have data for this age range in stack

            this.loadCurrentAgeRange();
        }
    }

    processQuestionResponse(response: QuestionResponse) {
        this.questionKeys = Object.keys(response);
        this.questions = this.questionKeys.map((key) => response[key]);
    }

    selectAnswer(questionIndex: number, answer: 'yes' | 'no') {
        this.questions[questionIndex].ans = answer;
    }

    submitAnswers() {
        console.log('All answers from all age ranges:', allAnswers);

        const payload = {
            id: this.surveyId,
            data: allAnswers
        };

        this.n8nFirestoreSerivice.saveAnswers(payload).subscribe({
            next: (response) => {
                console.log('Answers submitted successfully:', response);
            },
            error: (error) => {
                console.error('Error submitting answers:', error);
                alert('حدث خطأ أثناء إرسال الإجابات. يرجى المحاولة مرة أخرى.');
            },
            complete: () => {
                console.log('Answer submission complete.');
            }
        });

        // Clear cookies after successful submission

        alert('تم إرسال جميع الإجابات بنجاح!');
    }

    getAnswers() {
        return this.questionKeys.map((key, index) => ({
            questionId: key,
            questionIndex: index + 1,
            question: this.questions[index].q,
            answer: this.questions[index].ans,
            ageRange: this.currentAgeRange
        }));
    }
}
