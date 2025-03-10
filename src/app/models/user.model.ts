export interface UserProfile {
    uid: string;
    firstName: string;
    lastName: string;
    mobile?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role?: string;
    isNewUser: boolean;
    createdAt: Date;
    updatedAt?: Date;
    lastLogin: Date;
}
