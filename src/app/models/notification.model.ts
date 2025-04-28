// src/app/models/notification.model.ts
export interface Notification {
    id?: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    createdAt: Date;
    readAt?: Date;
    userId?: string;
    userRole?: 'admin' | 'user' | 'specialist' | 'paid';
    targetRoles?: string[];
    targetUsers?: string[];
    isGlobal?: boolean;
    isRead?: boolean;
    priority?: 'low' | 'medium' | 'high';
    metadata?: Record<string, any>;
    expiresAt?: Date;
}
