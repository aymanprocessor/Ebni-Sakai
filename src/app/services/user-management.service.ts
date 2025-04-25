// src/app/services/user-management.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, deleteDoc, getDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, deleteUser as deleteAuthUser, signInWithEmailAndPassword, signOut, updateEmail, updatePassword } from '@angular/fire/auth';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserProfile } from '../models/user.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserManagementService {
    private usersCollection = 'users';

    constructor(
        private firestore: Firestore,
        private auth: Auth,
        private authService: AuthService
    ) {}

    // Get all users
    getAllUsers(): Observable<UserProfile[]> {
        const usersRef = collection(this.firestore, this.usersCollection);
        return collectionData(usersRef, { idField: 'uid' }) as Observable<UserProfile[]>;
    }

    // Get user by ID
    getUserById(uid: string): Observable<UserProfile | null> {
        const userRef = doc(this.firestore, `${this.usersCollection}/${uid}`);
        return from(getDoc(userRef)).pipe(map((doc) => (doc.exists() ? ({ uid: doc.id, ...doc.data() } as UserProfile) : null)));
    }

    // Create new user (for admin only)
    async createUser(userData: Partial<UserProfile> & { password: string }): Promise<string> {
        try {
            // Store current user
            const currentUser = this.auth.currentUser;

            // Create new user with email and password
            const userCredential = await createUserWithEmailAndPassword(this.auth, userData.email!, userData.password);

            const uid = userCredential.user.uid;

            // Create user profile in Firestore
            const userRef = doc(this.firestore, `${this.usersCollection}/${uid}`);
            const newUserProfile: UserProfile = {
                uid,
                email: userData.email!,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                role: userData.role || 'user',
                isSubscribed: userData.isSubscribed || false,
                mobile: userData.mobile || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                isNewUser: true,
                lastLogin: new Date()
            };

            await setDoc(userRef, newUserProfile);

            // Sign out the newly created user
            await signOut(this.auth);

            // If there was a current user, sign them back in
            if (currentUser?.email) {
                // Note: This requires storing or getting the current user's password
                // In practice, you might need to handle this differently
                console.log('Need to restore current admin session');
            }

            return uid;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Update user profile
    async updateUser(userData: Partial<UserProfile>): Promise<void> {
        if (!userData.uid) {
            throw new Error('User ID is required');
        }

        const userRef = doc(this.firestore, `${this.usersCollection}/${userData.uid}`);

        const updateData = {
            ...userData,
            updatedAt: new Date()
        };

        await updateDoc(userRef, updateData);
    }

    // Update user email (requires authentication)
    async updateUserEmail(uid: string, newEmail: string): Promise<void> {
        try {
            const user = this.auth.currentUser;
            if (user && user.uid === uid) {
                await updateEmail(user, newEmail);
                await this.updateUser({ uid, email: newEmail });
            } else {
                throw new Error('Cannot update email for other users');
            }
        } catch (error) {
            console.error('Error updating email:', error);
            throw error;
        }
    }

    // Update user password (requires authentication)
    async updateUserPassword(uid: string, newPassword: string): Promise<void> {
        try {
            const user = this.auth.currentUser;
            if (user && user.uid === uid) {
                await updatePassword(user, newPassword);
            } else {
                throw new Error('Cannot update password for other users');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    // Delete user
    async deleteUser(uid: string): Promise<void> {
        try {
            // Delete from Firestore
            const userRef = doc(this.firestore, `${this.usersCollection}/${uid}`);
            await deleteDoc(userRef);

            // Note: Deleting from Firebase Auth requires special handling
            // This would typically require an admin SDK or cloud function
            console.log('User deleted from Firestore. Auth deletion requires admin privileges.');
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Update user role
    async updateUserRole(uid: string, role: string): Promise<void> {
        const userRef = doc(this.firestore, `${this.usersCollection}/${uid}`);
        await updateDoc(userRef, { role, updatedAt: new Date() });
    }

    // Update subscription status
    async updateSubscriptionStatus(uid: string, isSubscribed: boolean): Promise<void> {
        const userRef = doc(this.firestore, `${this.usersCollection}/${uid}`);
        await updateDoc(userRef, { isSubscribed, updatedAt: new Date() });
    }
}
