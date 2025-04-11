export interface QuestionItem {
    q: string;
    th?: string;
}

export interface AgeRange {
    [questionIndex: string]: QuestionItem;
}

export interface Domain {
    [ageRange: string]: AgeRange;
}

export interface SurveyQuestion {
    [domain: string]: Domain;
}
