/**
 * Firestore Schema & Validation
 * ─────────────────────────────
 * Defines document schemas for the Amazon Asset Manager.
 * All data is scoped under teams/{teamId}/...
 */

/* ═══════════════════════════════════════════════════════════════
   Collection Paths
   ═══════════════════════════════════════════════════════════════ */

export const COLLECTIONS = {
    TEAMS: 'teams',
    MEMBERS: (teamId) => `teams/${teamId}/members`,
    FOLDERS: (teamId) => `teams/${teamId}/folders`,
    FILES: (teamId) => `teams/${teamId}/files`,
    ASINS: (teamId) => `teams/${teamId}/asins`,
    ACTIVITY: (teamId) => `teams/${teamId}/activity`,
};

/* ═══════════════════════════════════════════════════════════════
   Schema Definitions (for reference & validation)
   ═══════════════════════════════════════════════════════════════ */

/**
 * teams/{teamId}
 */
export const teamSchema = {
    name: '',                   // String — "Team ABC"
    ownerId: '',                // String — Firebase Auth UID of the owner
    driveRootFolderId: '',      // String — Google Drive root folder ID
    settings: {
        namingTemplate: '{ASIN}_{type}_{version}_{date}',
        kanbanColumns: [],        // [{id, title, icon, color}]
        defaultView: 'grid',      // "grid" | "list" | "kanban"
    },
    createdAt: null,            // Timestamp
};

/**
 * teams/{teamId}/members/{uid}
 */
export const memberSchema = {
    role: 'editor',             // "admin" | "editor" | "viewer"
    displayName: '',
    email: '',
    photoURL: '',
    joinedAt: null,             // Timestamp
};

/**
 * teams/{teamId}/folders/{folderId}
 */
export const folderSchema = {
    name: '',
    parentId: null,             // String | null — null = root folder
    driveFolderId: '',          // Google Drive folder ID
    type: 'general',            // "product" | "learning" | "storage" | "general"
    fileCount: 0,               // Denormalized count, incremented on add/remove file
    createdBy: '',              // UID
    createdAt: null,            // Timestamp
};

/**
 * teams/{teamId}/files/{fileId}
 */
export const fileSchema = {
    name: '',                   // Display name (can be renamed)
    originalName: '',           // Original file name at upload time
    mimeType: '',               // "image/jpeg", "application/pdf", etc.
    size: 0,                    // Bytes
    folderId: '',               // Reference to folder doc ID
    driveFileId: '',            // Google Drive file ID
    driveUrl: '',               // Full Drive viewing URL
    thumbnailUrl: null,         // Drive thumbnail URL or null
    asinId: null,               // String | null — reference to ASIN doc ID
    tags: [],                   // [String]
    kanbanStatus: '',           // Matches column.id in team.settings.kanbanColumns
    uploadedBy: {
        uid: '',
        displayName: '',
    },
    uploadedAt: null,           // Timestamp
    updatedAt: null,            // Timestamp
};

/**
 * teams/{teamId}/asins/{asinId}
 */
export const asinSchema = {
    code: '',                   // "B0ABC12345" — 10 chars, starts with B0
    productName: '',
    fileCount: 0,               // Denormalized count
    createdAt: null,            // Timestamp
    createdBy: '',              // UID
};

/**
 * teams/{teamId}/activity/{auto-id}
 */
export const activitySchema = {
    action: '',                 // "upload" | "delete" | "move" | "rename" | "assign_asin" | "change_status" | "bulk_upload"
    fileId: null,               // String | null
    fileName: '',
    userId: '',
    userName: '',
    details: {},                // { from: "folder_a", to: "folder_b" } etc.
    createdAt: null,            // Timestamp
};

/* ═══════════════════════════════════════════════════════════════
   Validation Functions
   ═══════════════════════════════════════════════════════════════ */

/**
 * Validate ASIN code format (10 chars, alphanumeric, starts with B0).
 * @param {string} code
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateAsinCode(code) {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'ASIN code is required' };
    }
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 10) {
        return { valid: false, error: 'ASIN phải có đúng 10 ký tự' };
    }
    if (!/^[A-Z0-9]{10}$/.test(trimmed)) {
        return { valid: false, error: 'ASIN chỉ chứa chữ và số' };
    }
    if (!trimmed.startsWith('B0')) {
        return { valid: false, error: 'ASIN phải bắt đầu bằng B0' };
    }
    return { valid: true };
}

/**
 * Validate folder data before creation.
 */
export function validateFolder(data) {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        errors.push('Tên folder không được để trống');
    }
    if (data.name && data.name.trim().length > 100) {
        errors.push('Tên folder tối đa 100 ký tự');
    }
    const validTypes = ['product', 'learning', 'storage', 'general'];
    if (data.type && !validTypes.includes(data.type)) {
        errors.push(`Loại folder phải là: ${validTypes.join(', ')}`);
    }
    return { valid: errors.length === 0, errors };
}

/**
 * Validate file data before creation.
 */
export function validateFile(data) {
    const errors = [];
    if (!data.name || !data.name.trim()) errors.push('Tên file không được để trống');
    if (!data.folderId) errors.push('File phải thuộc một folder');
    if (!data.driveFileId) errors.push('Drive file ID là bắt buộc');
    if (typeof data.size !== 'number' || data.size < 0) errors.push('Kích thước file không hợp lệ');
    return { valid: errors.length === 0, errors };
}

/**
 * Valid values for member roles.
 */
export const MEMBER_ROLES = ['admin', 'editor', 'viewer'];

/**
 * Valid activity action types.
 */
export const ACTIVITY_ACTIONS = [
    'upload', 'delete', 'move', 'rename',
    'assign_asin', 'change_status', 'bulk_upload',
];

/**
 * Valid default view options.
 */
export const VIEW_OPTIONS = ['grid', 'list', 'kanban'];

/**
 * Valid folder types.
 */
export const FOLDER_TYPES = ['product', 'learning', 'storage', 'general'];
