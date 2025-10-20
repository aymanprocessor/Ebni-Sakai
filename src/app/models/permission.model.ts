export interface Permission {
    resourceType: 'game' | 'scale';
    resourceId: number;
    allowed: boolean;
}

export interface RolePermissions {
    role: 'admin' | 'user' | 'paid' | 'specialist';
    gamePermissions: number[]; // Array of game IDs the role can access
    scalePermissions: number[]; // Array of scale IDs the role can access
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
    admin: {
        role: 'admin',
        gamePermissions: [], // Admin has all permissions by default
        scalePermissions: []
    },
    user: {
        role: 'user',
        gamePermissions: [],
        scalePermissions: []
    },
    paid: {
        role: 'paid',
        gamePermissions: [], // All games accessible by default
        scalePermissions: [] // All scales accessible by default
    },
    specialist: {
        role: 'specialist',
        gamePermissions: [], // Controlled by admin
        scalePermissions: [] // Controlled by admin
    }
};
