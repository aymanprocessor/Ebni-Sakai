import { TimeSlot } from './time-slot.model';

export interface Booking {
    id: string;
    timeSlotId: string;
    userId: string;
    userName: string;
    userEmail: string;
    assignedSpecialistId?: string;
    assignedSpecialistName?: string;
    bookingDate: Date;
    notes: string;
    status: 'confirmed' | 'cancelled' | 'completed' | 'panding';
    timeSlot?: TimeSlot;
}
