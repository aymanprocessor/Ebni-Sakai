import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, deleteDoc, query, where, getDoc, onSnapshot, DocumentReference, Timestamp, runTransaction, writeBatch, getDocs, documentId, addDoc } from '@angular/fire/firestore';
import { Observable, from, map, switchMap, of, BehaviorSubject, combineLatest, take, shareReplay, tap, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { Booking } from '../models/booking.model';
import { TimeSlot } from '../models/time-slot.model';

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private timeSlotsSubject = new BehaviorSubject<TimeSlot[]>([]);
    timeSlots$ = this.timeSlotsSubject.asObservable().pipe(shareReplay(1));

    private readonly TIME_SLOTS_COLLECTION = 'timeSlots';
    private readonly BOOKINGS_COLLECTION = 'bookings';

    private timeSlotsCache = new Map<string, TimeSlot>();

    constructor(
        private firestore: Firestore,
        private authService: AuthService
    ) {
        this.initTimeSlotListener();
    }

    private initTimeSlotListener(): void {
        const timeSlotsRef = collection(this.firestore, this.TIME_SLOTS_COLLECTION);

        const currentTime = new Date();
        currentTime.setHours(0, 0, 0, 0);

        onSnapshot(
            query(timeSlotsRef, where('startTime', '>=', Timestamp.fromDate(currentTime))),
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const doc = change.doc;
                    const data = doc.data();
                    const timeSlot = {
                        id: doc.id,
                        startTime: data['startTime']?.toDate(),
                        endTime: data['endTime']?.toDate(),
                        isBooked: data['isBooked'] || false,
                        createdBy: data['createdBy'],
                        updatedAt: data['updatedAt']?.toDate()
                    } as TimeSlot;

                    if (change.type === 'removed') {
                        this.timeSlotsCache.delete(doc.id);
                    } else {
                        this.timeSlotsCache.set(doc.id, timeSlot);
                    }
                });

                const timeSlots = Array.from(this.timeSlotsCache.values());
                this.timeSlotsSubject.next(timeSlots);
            },
            (error) => {
                console.error('Error fetching time slots:', error);
            }
        );
    }

    private async getTimeSlotsBatch(timeSlotIds: string[]): Promise<Map<string, TimeSlot>> {
        const timeSlotMap = new Map<string, TimeSlot>();

        const uncachedIds = timeSlotIds.filter((id) => {
            const cached = this.timeSlotsCache.get(id);
            if (cached) {
                timeSlotMap.set(id, cached);
                return false;
            }
            return true;
        });

        if (uncachedIds.length === 0) {
            return timeSlotMap;
        }

        const chunks = [];
        for (let i = 0; i < uncachedIds.length; i += 10) {
            chunks.push(uncachedIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const q = query(collection(this.firestore, this.TIME_SLOTS_COLLECTION), where(documentId(), 'in', chunk));

            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => {
                const data = doc.data();
                const timeSlot = {
                    id: doc.id,
                    startTime: data['startTime']?.toDate(),
                    endTime: data['endTime']?.toDate(),
                    isBooked: data['isBooked'] || false,
                    createdBy: data['createdBy'],
                    updatedAt: data['updatedAt']?.toDate()
                } as TimeSlot;

                timeSlotMap.set(doc.id, timeSlot);
                this.timeSlotsCache.set(doc.id, timeSlot);
            });
        }

        return timeSlotMap;
    }

    getUserBookings(): Observable<Booking[]> {
        return this.authService.currentUser$.pipe(
            switchMap((user) => {
                console.log('getUserBookings - Current user:', user);
                if (!user) {
                    console.log('No user found, returning empty array');
                    return of([]);
                }

                return new Observable<Booking[]>((subscriber) => {
                    const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
                    // Temporarily remove the status filter to avoid index requirement
                    const q = query(bookingsRef, where('userId', '==', user.uid));

                    console.log('Setting up onSnapshot listener');

                    const unsubscribe = onSnapshot(
                        q,
                        async (snapshot) => {
                            console.log('onSnapshot triggered, documents:', snapshot.size);

                            // Filter out cancelled bookings in memory
                            const bookingsData = snapshot.docs.map((doc) => {
                                const data = doc.data();
                                return {
                                    id: doc.id,
                                    timeSlotId: data['timeSlotId'],
                                    userId: data['userId'],
                                    userName: data['userName'],
                                    userEmail: data['userEmail'],
                                    bookingDate: data['bookingDate']?.toDate(),
                                    notes: data['notes'] || '',
                                    status: data['status']
                                };
                            });
                            // .filter((booking) => booking.status !== 'cancelled');

                            if (bookingsData.length === 0) {
                                subscriber.next([]);
                                return;
                            }

                            // Get all unique timeSlotIds
                            const timeSlotIds = [...new Set(bookingsData.map((booking) => booking.timeSlotId))];

                            try {
                                // Fetch time slots for all bookings
                                const timeSlotMap = await this.getTimeSlotsBatch(timeSlotIds);

                                // Combine bookings with their timeSlots
                                const bookingsWithTimeSlots = bookingsData.map(
                                    (booking) =>
                                        ({
                                            ...booking,
                                            timeSlot: timeSlotMap.get(booking.timeSlotId)
                                        }) as Booking
                                );

                                subscriber.next(bookingsWithTimeSlots);
                            } catch (error) {
                                console.error('Error fetching time slots:', error);
                                // Return bookings without timeSlots if there's an error
                                subscriber.next(bookingsData as Booking[]);
                            }
                        },
                        (error) => {
                            console.error('onSnapshot error:', error);
                            subscriber.error(error);
                        }
                    );

                    // Cleanup function
                    return () => {
                        console.log('Unsubscribing from onSnapshot');
                        unsubscribe();
                    };
                });
            }),
            shareReplay(1)
        );
    }

    // Add this method to your existing BookingService
    getBookingsBySpecialistId(specialistId: string): Observable<Booking[]> {
        const bookingsRef = collection(this.firestore, 'bookings');
        const q = query(bookingsRef, where('assignedSpecialistId', '==', specialistId));
        return collectionData(q, { idField: 'id' }).pipe() as Observable<Booking[]>;
    }
    getSpecialistBookingCount(specialistId: string): Observable<number> {
        const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
        const q = query(bookingsRef, where('assignedSpecialistId', '==', specialistId), where('status', 'in', ['confirmed', 'panding']));

        return collectionData(q).pipe(
            map((bookings) => bookings.length),
            catchError(() => of(0))
        );
    }

    /**
     * Book an appointment with a specialist
     */
    bookSpecialist(specialistId: string, startTime: Date, endTime: Date, notes: string = ''): Observable<string> {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('User must be authenticated to book a specialist');
        }
        return from(Promise.resolve(currentUser)).pipe(
            map((user) => {
                if (!user) throw new Error('User must be authenticated to book a specialist');
                return user;
            }),
            switchMap((user) => {
                // Create a new booking document
                const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);

                const bookingData = {
                    userId: user.uid,
                    specialistId: specialistId,
                    userName: user.displayName || '',
                    userEmail: user.email || '',
                    startTime: Timestamp.fromDate(startTime),
                    endTime: Timestamp.fromDate(endTime),
                    bookingDate: Timestamp.now(),
                    notes: notes,
                    status: 'confirmed'
                };

                return from(addDoc(bookingsRef, bookingData)).pipe(map((docRef) => docRef.id));
            })
        );
    }

    // Also update the bookTimeSlotWithSpecialist method
    async bookTimeSlotWithSpecialist(timeSlotId: string, notes: string = '', specialistId: string): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('المستخدم يجب أن يكون مسجل الدخول لحجز موعد');
        }

        if (!specialistId) {
            throw new Error('لم يتم تحديد المتخصص');
        }

        return runTransaction(this.firestore, async (transaction) => {
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
            const timeSlotDoc = await transaction.get(timeSlotRef);

            if (!timeSlotDoc.exists()) {
                throw new Error('الفترة الزمنية غير موجودة');
            }

            const timeSlotData = timeSlotDoc.data();
            if (timeSlotData['isBooked']) {
                throw new Error('الفترة الزمنية محجوزة بالفعل');
            }

            // Create booking with assigned specialist
            const bookingRef = doc(collection(this.firestore, this.BOOKINGS_COLLECTION));
            const bookingData = {
                timeSlotId: timeSlotId,
                userId: currentUser.uid,
                userName: currentUser.displayName || '',
                userEmail: currentUser.email || '',
                bookingDate: Timestamp.now(),
                notes: notes,
                status: 'panding',
                assignedSpecialistId: specialistId
            };

            transaction.set(bookingRef, bookingData);

            // Update time slot
            transaction.update(timeSlotRef, {
                isBooked: true,
                bookedBy: currentUser.uid,
                updatedAt: Timestamp.now()
            });

            return bookingRef.id;
        });
    }
    // Create single time slot
    async createTimeSlot(timeSlot: Omit<TimeSlot, 'id'>): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to create time slots');
        }

        const newTimeSlotRef = doc(collection(this.firestore, this.TIME_SLOTS_COLLECTION));
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

    // Create multiple time slots using batch
    async createMultipleTimeSlots(timeSlots: Omit<TimeSlot, 'id'>[]): Promise<string[]> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to create time slots');
        }

        const batch = writeBatch(this.firestore);
        const timeSlotIds: string[] = [];

        for (const timeSlot of timeSlots) {
            const newTimeSlotRef = doc(collection(this.firestore, this.TIME_SLOTS_COLLECTION));
            const timeSlotData = {
                startTime: Timestamp.fromDate(timeSlot.startTime),
                endTime: Timestamp.fromDate(timeSlot.endTime),
                isBooked: false,
                createdBy: currentUser.uid,
                updatedAt: Timestamp.now()
            };

            batch.set(newTimeSlotRef, timeSlotData);
            timeSlotIds.push(newTimeSlotRef.id);
        }

        await batch.commit();
        return timeSlotIds;
    }

    // Update time slot
    async updateTimeSlot(timeSlotId: string, timeSlotData: Partial<TimeSlot>): Promise<void> {
        const updateData: any = {
            updatedAt: Timestamp.now()
        };

        if (timeSlotData.startTime) {
            updateData.startTime = Timestamp.fromDate(timeSlotData.startTime);
        }

        if (timeSlotData.endTime) {
            updateData.endTime = Timestamp.fromDate(timeSlotData.endTime);
        }

        if (timeSlotData.isBooked !== undefined) {
            updateData.isBooked = timeSlotData.isBooked;
        }

        const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
        await updateDoc(timeSlotRef, updateData);
    }

    // Delete time slot
    async deleteTimeSlot(timeSlotId: string): Promise<void> {
        const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
        await deleteDoc(timeSlotRef);
    }

    // Book a time slot
    async bookTimeSlot(timeSlotId: string, notes: string = ''): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to book a time slot');
        }

        return runTransaction(this.firestore, async (transaction) => {
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
            const timeSlotDoc = await transaction.get(timeSlotRef);

            if (!timeSlotDoc.exists()) {
                throw new Error('Time slot not found');
            }

            const timeSlotData = timeSlotDoc.data();
            if (timeSlotData['isBooked']) {
                throw new Error('Time slot is already booked');
            }

            // Create booking
            const bookingRef = doc(collection(this.firestore, this.BOOKINGS_COLLECTION));
            const bookingData = {
                timeSlotId: timeSlotId,
                userId: currentUser.uid,
                userName: currentUser.displayName || '',
                userEmail: currentUser.email || '',
                bookingDate: Timestamp.now(),
                notes: notes,
                status: 'panding'
            };

            transaction.set(bookingRef, bookingData);

            // Update time slot
            transaction.update(timeSlotRef, {
                isBooked: true,
                bookedBy: currentUser.uid,
                updatedAt: Timestamp.now()
            });

            return bookingRef.id;
        });
    }

    // Cancel a booking
    async cancelBooking(bookingId: string, timeSlotId: string): Promise<void> {
        await runTransaction(this.firestore, async (transaction) => {
            const bookingRef = doc(this.firestore, `${this.BOOKINGS_COLLECTION}/${bookingId}`);
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);

            transaction.update(bookingRef, {
                status: 'cancelled',
                updatedAt: Timestamp.now()
            });

            transaction.update(timeSlotRef, {
                isBooked: false,
                bookedBy: null,
                updatedAt: Timestamp.now()
            });
        });
    }

    // Check for conflicts
    async checkForConflicts(startTime: Date, endTime: Date): Promise<boolean> {
        const existingSlots = this.timeSlotsSubject.getValue();

        return existingSlots.some((slot) => {
            return (startTime >= slot.startTime && startTime < slot.endTime) || (endTime > slot.startTime && endTime <= slot.endTime) || (startTime <= slot.startTime && endTime >= slot.endTime);
        });
    }

    // Get available time slots
    getAvailableTimeSlots(): Observable<TimeSlot[]> {
        return this.timeSlots$.pipe(map((slots) => slots.filter((slot) => !slot.isBooked)));
    }

    // Get all time slots
    getAllTimeSlots(): Observable<TimeSlot[]> {
        return this.timeSlots$;
    }

    // Get time slots in range
    getTimeSlotsInRange(startDate: Date, endDate: Date): Observable<TimeSlot[]> {
        return this.timeSlots$.pipe(map((slots) => slots.filter((slot) => slot.startTime >= startDate && slot.startTime <= endDate)));
    }

    // Get available slots grouped by date
    getAvailableSlotsGroupedByDate(): Observable<{ date: string; slots: TimeSlot[] }[]> {
        return this.timeSlots$.pipe(
            map((slots) => {
                const availableSlots = slots.filter((slot) => !slot.isBooked);

                const grouped = availableSlots.reduce(
                    (acc, slot) => {
                        const dateStr = slot.startTime.toDateString();
                        if (!acc[dateStr]) {
                            acc[dateStr] = [];
                        }
                        acc[dateStr].push(slot);
                        return acc;
                    },
                    {} as Record<string, TimeSlot[]>
                );

                return Object.entries(grouped).map(([date, slots]) => ({
                    date,
                    slots: slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                }));
            })
        );
    }

    /**
     * Get bookings in a specific time range (for checking specialist availability)
     */
    getBookingsInTimeRange(startTime: Date, endTime: Date): Observable<Booking[]> {
        const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);

        // Query bookings that overlap with the specified time range
        // A booking overlaps if:
        // 1. It starts during our time range, OR
        // 2. It ends during our time range, OR
        // 3. It completely encompasses our time range
        return from(getDocs(query(bookingsRef, where('status', '!=', 'cancelled'), where('startTime', '<=', Timestamp.fromDate(endTime)), where('endTime', '>=', Timestamp.fromDate(startTime))))).pipe(
            map((snapshot) => {
                return snapshot.docs.map(
                    (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data(),
                            startTime: doc.data()['startTime']?.toDate(),
                            endTime: doc.data()['endTime']?.toDate(),
                            bookingDate: doc.data()['bookingDate']?.toDate()
                        }) as Booking
                );
            })
        );
    }

    /**
     * Get all bookings for a specific specialist
     */
    getSpecialistBookings(specialistId: string): Observable<Booking[]> {
        const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);

        return from(getDocs(query(bookingsRef, where('specialistId', '==', specialistId), where('status', '!=', 'cancelled')))).pipe(
            map((snapshot) => {
                return snapshot.docs.map(
                    (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data(),
                            startTime: doc.data()['startTime']?.toDate(),
                            endTime: doc.data()['endTime']?.toDate(),
                            bookingDate: doc.data()['bookingDate']?.toDate()
                        }) as Booking
                );
            })
        );
    }

    // Clear cache
    clearCache(): void {
        this.timeSlotsCache.clear();
        this.timeSlotsSubject.next([]);
    }

    // Update booking status
    async updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'completed'): Promise<void> {
        try {
            const bookingRef = doc(this.firestore, `${this.BOOKINGS_COLLECTION}/${bookingId}`);

            // First, get the current booking to check if it exists
            const bookingSnapshot = await getDoc(bookingRef);

            if (!bookingSnapshot.exists()) {
                throw new Error('Booking not found');
            }

            // Update the booking status
            await updateDoc(bookingRef, {
                status: status,
                updatedAt: Timestamp.now()
            });

            // If booking is cancelled, also update the time slot
            if (status === 'cancelled') {
                const bookingData = bookingSnapshot.data();
                const timeSlotId = bookingData['timeSlotId'];

                if (timeSlotId) {
                    const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
                    await updateDoc(timeSlotRef, {
                        isBooked: false,
                        updatedAt: Timestamp.now()
                    });
                }
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
            throw error;
        }
    }
}
