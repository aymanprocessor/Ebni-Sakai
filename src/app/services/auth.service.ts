import { Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    currentUser$: Observable<User | null>;

    constructor(private auth: Auth) {
        this.currentUser$ = authState(this.auth);
    }

    // Sign in with email and password
    login(email: string, password: string): Promise<any> {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    // Register with email and password
    register(email: string, password: string): Promise<any> {
        return createUserWithEmailAndPassword(this.auth, email, password);
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }
    // Sign out
    logout(): Promise<void> {
        return signOut(this.auth);
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
