import { SurveyResponse } from './survey-response.model';

export interface Survey {
    id?: string;
    childId: string;
    childName: string;
    domain: string;
    domainName: string;
    ageRange?: string;
    createdAt: Date;
    completedAt?: Date;
    completed: boolean;
    responses: SurveyResponse[];
    currentQuestion: string;
    currentQuestionIdx: number;
    currentAgeBlock: string;
}
