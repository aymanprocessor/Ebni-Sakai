export interface Child {
    id?: string;
    name: string;
    birthday: Date;
    gender: 'Male' | 'Female';
    status: string;
    uid: string;
    ageInMonths: number;
    hasDisability?: boolean;
}
