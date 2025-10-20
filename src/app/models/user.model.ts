export interface UserProfile {
    uid: string;
    firstName: string;
    lastName: string;
    mobile?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role: 'admin' | 'user' | 'paid' | 'specialist';
    isNewUser: boolean;
    createdAt: Date;
    updatedAt?: Date;
    lastLogin: Date;
    isSubscribed: boolean;
    // Permission arrays - if set, override role-based permissions
    gamePermissions?: number[];
    scalePermissions?: number[];
    // Optional expiry timestamps for user-specific access. If present and in the future,
    // the corresponding user-specific permissions are considered active. Stored as JS Date in Firestore.
    gameAccessExpires?: Date | null;
    scaleAccessExpires?: Date | null;
}
