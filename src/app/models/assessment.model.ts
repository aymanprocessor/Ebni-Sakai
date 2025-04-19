import { Domain } from './survey-question.model';

export interface DevelopmentAssessment {
    [domain: string]: Domain;
}

export interface AssessmentSession {
    ageRange: string;
    childId: string;
    domainName: string;
    responses: { [key: string]: string[] };
    currentQuestion: string;
    currentQuestionIdx: number;
    currentAgeBlock: string;
}
