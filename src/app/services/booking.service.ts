import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, deleteDoc, query, where, getDoc, onSnapshot, DocumentReference, Timestamp, runTransaction } from '@angular/fire/firestore';
import { Observable, from, map, switchMap, of, BehaviorSubject, combineLatest } from 'rxjs';
import { AuthService } from './auth.service';
import { Booking } from '../models/booking.model';
import { TimeSlot } from '../models/time-slot.model';

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private timeSlotsSubject = new BehaviorSubject<TimeSlot[]>([]);
    timeSlots$ = this.timeSlotsSubject.asObservable();

    private readonly TIME_SLOTS_COLLECTION = 'timeSlots';
    private readonly BOOKINGS_COLLECTION = 'bookings';

    constructor(
        private firestore: Firestore,
        private authService: AuthService
    ) {
        // Initialize the timeSlots listener
        this.initTimeSlotListener();
    }

    private initTimeSlotListener(): void {
        const timeSlotsRef = collection(this.firestore, this.TIME_SLOTS_COLLECTION);

        // Listen for changes in the timeSlots collection
        onSnapshot(
            timeSlotsRef,
            (snapshot) => {
                const timeSlots = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        startTime: data['startTime']?.toDate(),
                        endTime: data['endTime']?.toDate(),
                        isBooked: data['isBooked'] || false,
                        createdBy: data['createdBy'],
                        updatedAt: data['updatedAt']?.toDate()
                    } as TimeSlot;
                });

                this.timeSlotsSubject.next(timeSlots);
            },
            (error) => {
                console.error('Error getting time slots:', error);
            }
        );
    }

    // Get all available time slots (not booked)
    getAvailableTimeSlots(): Observable<TimeSlot[]> {
        return this.timeSlots$.pipe(map((slots) => slots.filter((slot) => !slot.isBooked)));
    }

    // Get all time slots (for admin)
    getAllTimeSlots(): Observable<TimeSlot[]> {
        return this.timeSlots$;
    }

    // Create a new time slot (admin only)
    async createTimeSlot(timeSlot: Omit<TimeSlot, 'id'>): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to create a time slot');
        }

        const timeSlotsRef = collection(this.firestore, this.TIME_SLOTS_COLLECTION);
        const newTimeSlotRef = doc(timeSlotsRef);

        const timeSlotData = {
            startTime: Timestamp.fromDate(timeSlot.startTime),
            endTime: Timestamp.fromDate(timeSlot.endTime),
            isBooked: false,
            createdBy: currentUser.uid,
            updatedAt: Timestamp.now()
        };

        await setDoc(newTimeSlotRef, timeSlotData);
        return newTimeSlotRef.id;
    }

    // Update a time slot (admin only)
    async updateTimeSlot(id: string, timeSlot: Partial<TimeSlot>): Promise<void> {
        const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${id}`);

        const updateData: any = {
            updatedAt: Timestamp.now()
        };

        if (timeSlot.startTime) {
            updateData.startTime = Timestamp.fromDate(timeSlot.startTime);
        }

        if (timeSlot.endTime) {
            updateData.endTime = Timestamp.fromDate(timeSlot.endTime);
        }

        if (typeof timeSlot.isBooked !== 'undefined') {
            updateData.isBooked = timeSlot.isBooked;
        }

        await updateDoc(timeSlotRef, updateData);
    }

    // Delete a time slot (admin only)
    async deleteTimeSlot(id: string): Promise<void> {
        const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${id}`);
        await deleteDoc(timeSlotRef);
    }

    // Book a time slot
    async bookTimeSlot(timeSlotId: string, notes?: string): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to book a time slot');
        }

        const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);

        // Use a transaction to ensure the time slot isn't booked by someone else
        return runTransaction(this.firestore, async (transaction) => {
            const timeSlotDoc = await transaction.get(timeSlotRef);

            if (!timeSlotDoc.exists()) {
                throw new Error('Time slot does not exist');
            }

            const timeSlotData = timeSlotDoc.data();

            if (timeSlotData['isBooked']) {
                throw new Error('Time slot is already booked');
            }

            // Create a new booking
            const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
            const newBookingRef = doc(bookingsRef);

            const bookingData = {
                timeSlotId,
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Unknown User',
                userEmail: currentUser.email,
                bookingDate: Timestamp.now(),
                notes: notes || '',
                status: 'confirmed'
            };

            // Update the time slot to mark it as booked
            transaction.update(timeSlotRef, {
                isBooked: true,
                updatedAt: Timestamp.now(),
                bookedBy: currentUser.uid
            });

            // Create the booking document
            transaction.set(newBookingRef, bookingData);

            return newBookingRef.id;
        });
    }

    // Get bookings for current user
    getUserBookings(): Observable<Booking[]> {
        return this.authService.currentUser$.pipe(
            switchMap((user) => {
                if (!user) return of([]);

                const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
                const q = query(bookingsRef, where('userId', '==', user.uid));

                return collectionData(q, { idField: 'id' }).pipe(
                    switchMap((bookings) => {
                        if (bookings.length === 0) return of([]);

                        // For each booking, get the corresponding time slot
                        const bookingsWithTimeSlots = bookings.map((booking) => {
                            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${booking['timeSlotId']}`);
                            return from(getDoc(timeSlotRef)).pipe(
                                map((timeSlotDoc) => {
                                    const timeSlotData = timeSlotDoc.data();
                                    return {
                                        id: booking['id'],
                                        timeSlotId: booking['timeSlotId'],
                                        userId: booking['userId'],
                                        userName: booking['userName'],
                                        userEmail: booking['userEmail'],
                                        bookingDate: booking['bookingDate']?.toDate(),
                                        notes: booking['notes'] || '',
                                        status: booking['status'],
                                        timeSlot: {
                                            id: timeSlotDoc.id,
                                            startTime: timeSlotData?.['startTime']?.toDate(),
                                            endTime: timeSlotData?.['endTime']?.toDate(),
                                            isBooked: true
                                        } as TimeSlot
                                    } as Booking;
                                })
                            );
                        });

                        // Combine all observables
                        return combineLatest(bookingsWithTimeSlots);
                    })
                );
            })
        );
    }

    // Get all bookings (admin only)
    getAllBookings(): Observable<Booking[]> {
        const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);

        return collectionData(bookingsRef, { idField: 'id' }).pipe(
            switchMap((bookings) => {
                if (bookings.length === 0) return of([]);

                // For each booking, get the corresponding time slot
                const bookingsWithTimeSlots = bookings.map((booking) => {
                    const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${booking['timeSlotId']}`);
                    return from(getDoc(timeSlotRef)).pipe(
                        map((timeSlotDoc) => {
                            const timeSlotData = timeSlotDoc.data();
                            return {
                                id: booking['id'],
                                timeSlotId: booking['timeSlotId'],
                                userId: booking['userId'],
                                userName: booking['userName'],
                                userEmail: booking['userEmail'],
                                bookingDate: booking['bookingDate']?.toDate(),
                                notes: booking['notes'] || '',
                                status: booking['status'],
                                timeSlot: {
                                    id: timeSlotDoc.id,
                                    startTime: timeSlotData?.['startTime']?.toDate(),
                                    endTime: timeSlotData?.['endTime']?.toDate(),
                                    isBooked: true
                                } as TimeSlot
                            } as Booking;
                        })
                    );
                });

                // Combine all observables
                return combineLatest(bookingsWithTimeSlots);
            })
        );
    }

    // Cancel a booking (user or admin)
    async cancelBooking(bookingId: string): Promise<void> {
        const bookingRef = doc(this.firestore, `${this.BOOKINGS_COLLECTION}/${bookingId}`);
        const bookingDoc = await getDoc(bookingRef);

        if (!bookingDoc.exists()) {
            throw new Error('Booking does not exist');
        }

        const bookingData = bookingDoc.data();
        const timeSlotId = bookingData['timeSlotId'];

        // Use a transaction to ensure consistency
        await runTransaction(this.firestore, async (transaction) => {
            // Update the booking status
            transaction.update(bookingRef, {
                status: 'cancelled',
                updatedAt: Timestamp.now()
            });

            // Free up the time slot
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
            transaction.update(timeSlotRef, {
                isBooked: false,
                bookedBy: null,
                updatedAt: Timestamp.now()
            });
        });
    }

    // Helper function to combine multiple observables
    private combineLatest<T>(observables: Observable<T>[]): Observable<T[]> {
        return new Observable<T[]>((observer) => {
            if (observables.length === 0) {
                observer.next([]);
                observer.complete();
                return;
            }

            let values: T[] = new Array(observables.length);
            let completed = 0;
            let hasValues = 0;

            observables.forEach((observable, index) => {
                observable.subscribe(
                    (value) => {
                        if (values[index] === undefined) {
                            hasValues++;
                        }
                        values[index] = value;
                        if (hasValues === observables.length) {
                            observer.next([...values]);
                        }
                    },
                    (error) => observer.error(error),
                    () => {
                        completed++;
                        if (completed === observables.length) {
                            observer.complete();
                        }
                    }
                );
            });
        });
    }
}
