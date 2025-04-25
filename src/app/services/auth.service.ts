import { Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { BehaviorSubject, from, map, Observable, of, switchMap, catchError, timeout, firstValueFrom, ReplaySubject } from 'rxjs';
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
    currentUser$: BehaviorSubject<UserProfile | null> = new BehaviorSubject<UserProfile | null>(null);
    private initializedSubject = new ReplaySubject<boolean>(1);
    initialized$ = this.initializedSubject.asObservable();
    constructor(
        private auth: Auth,
        private firestore: Firestore,
        private router: Router,
        private sweetalert: SweetalertService
    ) {
        this.initializeAuthState();
    }

    private initializeAuthState() {
        try {
            authState(this.auth)
                .pipe(
                    switchMap((firebaseUser) => {
                        if (firebaseUser) {
                            const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
                            return docData(userDocRef, { idField: 'id' }).pipe(
                                map((userProfile) => {
                                    if (userProfile) {
                                        try {
                                            localStorage.setItem('currentUser', JSON.stringify(userProfile));
                                        } catch (storageError) {
                                            console.warn('Failed to set localStorage:', storageError);
                                        }
                                        return userProfile;
                                    }
                                    return null;
                                }),
                                catchError((error) => {
                                    console.error('Error fetching user profile:', error);
                                    this.sweetalert.showToast('Failed to load user profile', 'error');
                                    return of(null);
                                })
                            );
                        } else {
                            try {
                                localStorage.removeItem('currentUser');
                            } catch (storageError) {
                                console.warn('Failed to remove localStorage:', storageError);
                            }
                            return of(null);
                        }
                    }),
                    catchError((error) => {
                        console.error('Authentication state error:', error);
                        this.sweetalert.showToast('Authentication initialization failed', 'error');
                        return of(null);
                    })
                )
                .subscribe({
                    next: (user) => {
                        console.log('Authentication state:', user);
                        this.currentUser$.next(user as UserProfile);
                        this.initializedSubject.next(true);
                    },
                    error: (err) => {
                        console.error('Subscription error:', err);
                        this.currentUser$.next(null);
                        this.sweetalert.showToast('Authentication service error', 'error');
                    }
                });
        } catch (initError) {
            console.error('Failed to initialize auth state:', initError);
            this.sweetalert.showToast('Authentication service initialization failed', 'error');
        }
    }
    // Add a method to wait for initialization
    waitForInitialization(): Promise<boolean> {
        return firstValueFrom(this.initialized$);
    }

    // Sign in with email and password
    login(email: string, password: string): Promise<any> {
        return signInWithEmailAndPassword(this.auth, email, password)
            .then((userCredential) => {
                // Store user profile in localStorage
                const userProfile = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    firstName: '',
                    lastName: '',
                    role: ''
                };
                localStorage.setItem('currentUser', JSON.stringify(userProfile));
                this.sweetalert.showToast('Login successful', 'success');
                this.router.navigate(['dashboard']);
            })
            .catch((error) => {
                console.error('Login failed:', error);
                this.sweetalert.showToast('Login failed. Please check your credentials.', 'error');
                throw error;
            });
    }

    // Register with email and password
    async register(registerData: RegisterModel): Promise<any> {
        try {
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
        } catch (error) {
            console.error('Registration failed:', error);
            this.sweetalert.showToast('Registration failed. Please try again.', 'error');
            throw error;
        }
    }

    // Set user role in Firestore
    async setUserRole(uid: string, role: string): Promise<void> {
        try {
            const userDocRef = doc(this.firestore, `users/${uid}`);
            await setDoc(userDocRef, { role: role }, { merge: true });
            console.log(`Role set to ${role} for user ${uid}`);
        } catch (error) {
            console.error('Error setting user role:', error);
            this.sweetalert.showToast('Failed to set user role', 'error');
            throw error;
        }
    }

    // Set user data in Firestore
    async setUserData(uid: string, regModel: RegisterModel): Promise<void> {
        try {
            const userDocRef = doc(this.firestore, `users/${uid}`);
            await setDoc(
                userDocRef,
                {
                    firstName: regModel.firstName,
                    lastName: regModel.lastName
                },
                { merge: true }
            );
        } catch (error) {
            console.error('Error setting user data:', error);
            this.sweetalert.showToast('Failed to update user data', 'error');
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
                this.sweetalert.showToast(errorMessage, 'error');
            } else {
                const genericMessage = 'An unexpected error occurred during Google sign-in';
                console.error('Google login failed:', error);
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
            this.sweetalert.showToast('Logout failed', 'error');
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
                    role: 'user',
                    isSubscribed: false,
                    mobile: user.phoneNumber || '',
                    displayName: user.displayName || '',
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    updatedAt: new Date()
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
            this.sweetalert.showToast('Failed to process user profile', 'error');
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
            }),
            catchError((error) => {
                console.error('Error fetching user profile:', error);
                return of(null);
            })
        );
    }

    async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        const userDocRef = doc(this.firestore, `users/${uid}`);
        try {
            return setDoc(userDocRef, data, { merge: true });
        } catch (error) {
            console.error('Failed to update user profile:', error);
            this.sweetalert.showToast('Failed to update profile', 'error');
            throw error;
        }
    }

    isLoggedIn(): boolean {
        return !!this.auth.currentUser;
    }

    // Check if user is an admin
    isAdmin(): Observable<boolean> {
        return this.currentUser$.pipe(map((user) => user?.role === 'admin'));
    }

    isPaidUser(): Observable<boolean> {
        return this.currentUser$.pipe(map((user) => user?.isSubscribed === true));
    }
}
