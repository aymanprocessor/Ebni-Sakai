import { Injectable } from '@angular/core';
import { Child } from '../models/child.model';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where, docData } from '@angular/fire/firestore';
import { DatePipe } from '@angular/common';
import { UserProfileService } from './user-profile.service';
import { AuthService } from './auth.service';
import { authState, Auth } from '@angular/fire/auth';
import { Logger } from './logger.service';

@Injectable({
    providedIn: 'root'
})
export class ChildrenService {
    private childrenCollection;
    private childrenSubject = new BehaviorSubject<Child[]>([]);

    constructor(
        private firestore: Firestore,
        private userServ: UserProfileService,
        private authServ: AuthService,
        private auth: Auth
    ) {
        Logger.log('Children Constructor Started');
        this.childrenCollection = collection(this.firestore, 'children');
        this.loadChildren();
    }

    private loadChildren() {
        const childrenQuery = query(this.childrenCollection);
        collectionData(childrenQuery, { idField: 'id' })
            .pipe(
                map((children) =>
                    children.map(
                        (child) =>
                            ({
                                ...child,
                                id: child['id'] as string,
                                birthday: child['birthday'] instanceof Date ? child['birthday'] : new Date(child['birthday']),
                                gender: child['gender'] as 'Male' | 'Female'
                            }) as Child
                    )
                )
            )
            .subscribe((children) => {
                this.childrenSubject.next(children);
            });
    }

    getChildrenByUid(uid: string): Observable<Child> {
        return docData(doc(this.firestore, `children/${uid}`), { idField: 'id' }).pipe(
            map((child) => child as Child),
            catchError((error) => {
                console.error('Error fetching child:', error);
                return of(null);
            })
        ) as Observable<Child>;
    }

    getUserChildren(): Observable<Child[]> {
        return authState(this.auth).pipe(
            switchMap((user) => {
                if (!user) return of([]);
                const childrenQuery = query(this.childrenCollection, where('uid', '==', user.uid));
                return collectionData(childrenQuery, { idField: 'id' }) as Observable<Child[]>;
            })
        );
    }
    getChildren(): Observable<Child[]> {
        return this.childrenSubject.asObservable();
    }

    addChild(child: Omit<Child, 'id'>): Observable<Child> {
        child.birthday.setHours(0, 0, 0, 0);
        console.debug('Adding child:', child);
        const childToAdd = {
            ...child,
            birthday: child.birthday.toDateString(),
            status: 'active',
            uid: this.userServ.currentUser.value?.uid
        };

        return from(addDoc(this.childrenCollection, childToAdd)).pipe(
            switchMap((docRef) => {
                console.debug('from Doc', docRef);
                // Ensure id is a non-null string
                const childId = docRef.id || '';

                // Update the document to include its own ID
                const docReference = doc(this.firestore, this.childrenCollection.path, childId);
                return from(updateDoc(docReference, { id: childId })).pipe(
                    map(() => {
                        const newChild: Child = {
                            ...child,
                            id: childId
                        };

                        const currentChildren = this.childrenSubject.value;
                        const updatedChildren = [...currentChildren, newChild];
                        this.childrenSubject.next(updatedChildren);

                        return newChild;
                    })
                );
            }),
            catchError((error) => {
                console.error('Error adding child:', error);
                return of(null as unknown as Child);
            })
        );
    }
    updateChild(updatedChild: Child): Observable<Child | null> {
        updatedChild.birthday.setHours(0, 0, 0, 0);

        if (!updatedChild.id) {
            return of(null);
        }

        const childDocRef = doc(this.firestore, `children/${updatedChild.id}`);
        const { id, ...childData } = updatedChild;

        // Convert birthday to ISO string for Firestore
        const dataToUpdate = {
            ...childData,
            birthday: childData.birthday.toDateString()
        };

        return from(updateDoc(childDocRef, dataToUpdate)).pipe(
            map(() => {
                const currentChildren = this.childrenSubject.value;
                const index = currentChildren.findIndex((c) => c.id === updatedChild.id);
                if (index !== -1) {
                    const updatedChildren = [...currentChildren];
                    updatedChildren[index] = updatedChild;
                    this.childrenSubject.next(updatedChildren);
                }
                return updatedChild;
            }),
            catchError((error) => {
                console.error('Error updating child:', error);
                return of(null);
            })
        );
    }

    deleteChild(childId: string): Observable<boolean> {
        const childDocRef = doc(this.firestore, `children/${childId}`);

        return from(deleteDoc(childDocRef)).pipe(
            map(() => {
                const currentChildren = this.childrenSubject.value;
                const updatedChildren = currentChildren.filter((c) => c.id !== childId);
                this.childrenSubject.next(updatedChildren);
                return true;
            }),
            catchError((error) => {
                console.error('Error deleting child:', error);
                return of(false);
            })
        );
    }

    calculateAge(birthday: Date | string): { en: string; ar: string } {
        const today = new Date();
        const birthDate = birthday instanceof Date ? birthday : new Date(birthday);

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();

        // Adjust years and months if birthday hasn't occurred this year
        if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
            years--;
            months = 12 + months;
        }

        // Handle case when months become negative
        if (months < 0) {
            years--;
            months += 12;
        }

        // Adjust months if day of month hasn't been reached
        if (today.getDate() < birthDate.getDate()) {
            months--;
        }

        // Ensure months is non-negative
        months = Math.max(0, months);

        // Return formatted string in English and Arabic
        return {
            en: `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`,
            ar: `${years} سنة${years !== 1 ? '' : ''}, ${months} شهر${months !== 1 ? '' : ''}`
        };
    }

    // Calculate age in months from birth date
    calculateAgeInMonths(birthDate: Date): number {
        const today = new Date();
        const birthDateT = new Date(birthDate);
        let months = (today.getFullYear() - birthDateT.getFullYear()) * 12;
        months -= birthDateT.getMonth();
        months += today.getMonth();

        // Adjust for day of month
        if (today.getDate() < birthDateT.getDate()) {
            months--;
        }

        return months;
    }
    // Get age range from birth date
    getAgeRangeFromBirthDate(birthDate: Date): string {
        const ageInMonths = this.calculateAgeInMonths(birthDate);
        return this.getAgeRange(ageInMonths);
    }

    // Calculate age range based on age in months
    getAgeRange(ageInMonths: number): string {
        if (ageInMonths <= 6) return '0-6';
        if (ageInMonths <= 12) return '7-12';
        if (ageInMonths <= 18) return '13-18';
        if (ageInMonths <= 24) return '19-24';
        if (ageInMonths <= 30) return '25-30';
        if (ageInMonths <= 36) return '31-36';
        if (ageInMonths <= 42) return '37-42';
        if (ageInMonths <= 54) return '43-54';
        if (ageInMonths <= 66) return '55-66';
        if (ageInMonths <= 78) return '67-78';
        return '79-90';
    }
}
