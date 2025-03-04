export interface UserProfile {
    uid: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
    displayName?: string;
    avatar?: string;
    role?: string;
    createdAt: Date;
    updatedAt: Date;
}
