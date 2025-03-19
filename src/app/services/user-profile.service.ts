import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { getAuth, onAuthStateChanged, signOut, updateProfile, User } from '@angular/fire/auth';
import { initializeApp } from '@angular/fire/app';
import { doc, getDoc, getFirestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { environment } from '../env/env';
import { UserProfile } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {
    private auth = getAuth(initializeApp(environment.firebase));
    private db = getFirestore();

    currentUser = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUser.asObservable();
    constructor() {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser.next(user);
        });
    }

    async getUserProfile(uid: string): Promise<UserProfile | null> {
        try {
            const userDoc = await getDoc(doc(this.db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data() as UserProfile;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    async updateUserProfile(profile: Partial<UserProfile>): Promise<void> {
        if (!this.currentUser.value) throw new Error('No authenticated user');

        const uid = this.currentUser.value.uid;
        const userRef = doc(this.db, 'users', uid);

        try {
            const now = new Date();
            const userData = {
                ...profile,
                uid,
                updatedAt: now
            };

            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // Create new profile
                await setDoc(userRef, {
                    ...userData,
                    createdAt: now
                });
            } else {
                // Update existing profile
                await updateDoc(userRef, userData);
            }

            // Update Auth Profile if display name changed
            if (profile.displayName) {
                await updateProfile(this.currentUser.value, {
                    displayName: profile.displayName
                });
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Sign out
    signOut(): Promise<void> {
        return signOut(this.auth);
    }
}
