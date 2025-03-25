import { state } from '@angular/animations';
export interface Child {
    id?: string;
    name: string;
    birthday: Date;
    gender: 'Male' | 'Female';
    status: string;
}
