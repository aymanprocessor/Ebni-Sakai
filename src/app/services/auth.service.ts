import { Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { BehaviorSubject, from, map, Observable, of, switchMap } from 'rxjs';
import { UserProfile } from '../models/user.model';
import { doc, docData, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { FirebaseError } from '@angular/fire/app';
import { SweetalertService } from './sweetalert.service';
import { RegisterModel } from '../pages/register-parent/register.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
    currentUser$: BehaviorSubject<UserProfile | null> = new BehaviorSubject<UserProfile | null>(null);

    userProfile$: Observable<UserProfile | null> = this.currentUser$.pipe(
        switchMap((user) => {
            if (user) {
                return this.getUserProfile(user.uid);
            }
            return of(null);
        })
    );
    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private router: Router,
        private sweetalert: SweetalertService
    ) {
        authState(this.auth)
            .pipe(
                switchMap((firebaseUser) => {
                    if (firebaseUser) {
                        const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
                        return docData(userDocRef).pipe(
                            map((userProfile) => {
                                if (userProfile) {
                                    localStorage.setItem('currentUser', JSON.stringify(userProfile));
                                    return userProfile;
                                }
                                return null;
                            })
                        );
                    } else {
                        localStorage.removeItem('currentUser');
                        return of(null);
                    }
                })
            )
            .subscribe((user) => {
                this.currentUser$.next(user as UserProfile);
            });

        this.auth.onAuthStateChanged(async (user) => {
            this.userSubject.next(user);
            if (user) {
                this.checkUserProfile(user);
            }
        });
    }

    // Sign in with email and password
    login(email: string, password: string): Promise<any> {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    // Register with email and password
    async register(registerData: RegisterModel): Promise<any> {
        const { email, password, firstName, lastName, role } = registerData;
        const res = await createUserWithEmailAndPassword(this.auth, email, password);
        const user = res.user;
        if (user) {
            // Store user profile with role in Firestore
            await this.checkUserProfile(user);
            // Ensure role is set correctly
            await this.setUserRole(user.uid, role);
            await this.setUserData(user.uid, registerData);
        }
        return res;
    }

    // Set user role in Firestore
    async setUserRole(uid: string, role: string): Promise<void> {
        try {
            const userDocRef = doc(this.firestore, `users/${uid}`);
            await setDoc(userDocRef, { role: role }, { merge: true });
            console.log(`Role set to ${role} for user ${uid}`);
        } catch (error) {
            console.error('Error setting user role:', error);
            throw error;
        }
    }

    // Set user role in Firestore
    async setUserData(uid: string, regModel: RegisterModel): Promise<void> {
        try {
            const userDocRef = doc(this.firestore, `users/${uid}`);
            await setDoc(userDocRef, { firstName: regModel.firstName, lastName: regModel.lastName }, { merge: true });
        } catch (error) {
            console.error('Error setting user role:', error);
            throw error;
        }
    }

    async googleLogin(): Promise<User | null> {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            return result.user;
        } catch (error) {
            // Type guard to handle Firebase auth errors
            if (error instanceof FirebaseError) {
                const errorCode = error.code;
                let errorTitle = 'Google Sign-in Failed';
                let errorMessage: string;

                switch (errorCode) {
                    case 'auth/popup-blocked':
                        errorMessage = 'The popup was blocked by your browser. Please allow popups for this website.';
                        break;
                    case 'auth/popup-closed-by-user':
                        errorMessage = 'The sign-in popup was closed before completing authentication.';
                        break;
                    case 'auth/cancelled-popup-request':
                        errorMessage = 'Multiple popup requests were detected. Only one popup can be opened at a time.';
                        break;
                    case 'auth/account-exists-with-different-credential':
                        errorMessage = 'An account already exists with the same email but different sign-in credentials.';
                        break;
                    case 'auth/unauthorized-domain':
                        errorMessage = 'This domain is not authorized for OAuth operations.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'Google sign-in is not enabled. Please contact support.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This user account has been disabled by an administrator.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'A network error occurred. Please check your connection and try again.';
                        break;
                    case 'auth/timeout':
                        errorMessage = 'The operation has timed out. Please try again.';
                        break;
                    case 'auth/web-storage-unsupported':
                        errorMessage = 'Web storage is not supported in this browser.';
                        break;
                    default:
                        errorMessage = `Login failed: ${error.message}`;
                }

                console.error('Google login failed:', errorMessage, error);

                // Show SweetAlert notification
                this.sweetalert.showToast(errorMessage, 'error');
            } else {
                const genericMessage = 'An unexpected error occurred during Google sign-in';
                console.error('Google login failed:', error);

                // Show SweetAlert for generic errors
                this.sweetalert.showToast(genericMessage, 'error');
            }
            return null;
        }
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }
    // Sign out
    async logout(): Promise<void> {
        try {
            await signOut(this.auth);
            this.router.navigate(['auth/login']);
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }

    // Check if user profile exists, create if first login
    private async checkUserProfile(user: User): Promise<void> {
        try {
            const userDocRef = doc(this.firestore, `users/${user.uid}`);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // First login - create profile
                const nameParts = user.displayName?.split(' ') || ['', ''];
                const newUser: UserProfile = {
                    uid: user.uid,
                    email: user.email || '',
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',

                    photoURL: user.photoURL || '',
                    isNewUser: true,
                    createdAt: new Date(),
                    lastLogin: new Date()
                };

                await setDoc(userDocRef, newUser);
                // Redirect to profile completion
                this.router.navigate(['/complete-profile']);
            } else {
                // Update last login only, role is set separately by setUserRole
                await setDoc(userDocRef, { lastLogin: new Date() }, { merge: true });
                // We know user profile exists, redirect to dashboard
                this.router.navigate(['/dashboard']);
            }
        } catch (error) {
            console.error('Error checking user profile:', error);
        }
    }

    getUserProfile(uid: string): Observable<UserProfile | null> {
        const userDocRef = doc(this.firestore, `users/${uid}`);
        return from(getDoc(userDocRef)).pipe(
            switchMap((docSnap) => {
                if (docSnap.exists()) {
                    return of(docSnap.data() as UserProfile);
                }
                return of(null);
            })
        );
    }

    async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        const userDocRef = doc(this.firestore, `users/${uid}`);
        return setDoc(userDocRef, data, { merge: true });
    }
    isLoggedIn(): boolean {
        return !!this.auth.currentUser;
    }
    // Get current user as an observable
    // getCurrentUser(): Observable<firebase.default.User | null> {
    //   return new Observable((observer) => {
    //     const unsubscribe = onAuthStateChanged(this.auth, (user) => {
    //       observer.next(user);
    //     });
    //     return () => unsubscribe(); // Cleanup subscription
    //   });
    // }
}
