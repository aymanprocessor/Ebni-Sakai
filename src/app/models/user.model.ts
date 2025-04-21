export interface UserProfile {
    uid: string;
    firstName: string;
    lastName: string;
    mobile?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role: 'admin' | 'user' | 'paid';
    isNewUser: boolean;
    createdAt: Date;
    updatedAt?: Date;
    lastLogin: Date;
    isSubscribed: boolean;
}
