import { Timestamp } from 'rxjs';

// src/app/models/specialist.model.ts
export interface Specialist {
    availabilitySchedule: any;
    id: string;
    uid: string; // Linked to user ID in Firebase Auth
    firstName: string;
    lastName: string;
    email: string;
    photoURL?: string;
    bio?: string;
    specialties?: string[];
    rating?: number;
    totalReviews?: number;
    isAvailable: boolean;
    availableTimeSlots?: string[]; // IDs of available time slots
    createdAt: any; // When the profile was created
    updatedAt: any;
}
