export interface TimeSlot {
    id: string;
    startTime: Date;
    endTime: Date;
    isBooked: boolean;
    createdBy?: string;
    bookedBy?: string;
    updatedAt?: Date;
}
