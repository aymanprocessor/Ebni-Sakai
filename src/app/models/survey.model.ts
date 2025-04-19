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
    responses: { [key: string]: string[] };
    currentQuestion: string;
    currentQuestionIdx: number;
    currentAgeBlock: string;
}
