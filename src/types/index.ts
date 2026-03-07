export type FileType = 'image' | 'video' | 'text' | 'pdf' | 'xlsx' | 'link' | 'other';

export type FileStatus = 'active' | 'archived' | 'deleted';

export type KanbanStatus = 'todo' | 'in_progress' | 'review' | 'approved';

export type ViewMode = 'grid' | 'kanban' | 'list';

export interface AssetFile {
    id: string;
    driveId: string;
    name: string;
    originalName: string;
    type: FileType;
    mimeType: string;
    size: number;
    asin: string | null;
    productName: string | null;
    category: string;
    tags: string[];
    thumbnailUrl: string;
    webViewLink: string;
    downloadUrl: string;
    driveFolderId: string;
    createdAt: Date;
    updatedAt: Date;
    uploadedBy: string;
    status: FileStatus;
    kanbanStatus?: KanbanStatus;
    isStarred?: boolean;
}

export interface Product {
    asin: string;
    name: string;
    driveFolderId: string;
    fileCount: number;
    lastUpload: Date;
}

export interface FolderNode {
    id: string;
    name: string;
    driveId: string;
    parentId: string | null;
    children: FolderNode[];
    type: 'product' | 'learning' | 'archive' | 'subfolder';
    isStarred?: boolean;
}

export interface FolderMeta {
    icon?: string;
    order?: number;
    isStarred?: boolean;
}

export interface Label {
    id: string;
    name: string;
    color: string;
}

export interface AsinItem {
    id?: string;
    asin: string;
    code?: string;
    name: string;
    productName?: string;
    marketplace?: string;
}

export interface KanbanColumn {
    id: string;
    title: string;
    icon?: string;
    color?: string;
}

export interface AppConfig {
    folderMeta: Record<string, FolderMeta>;
    labels?: Label[];
    asins?: AsinItem[];
    kanbanColumns?: KanbanColumn[];
}

export interface UploadFileData {
    file: File;
    suggestedName: string;
    type: FileType;
    asin: string | null;
    productName: string | null;
    category: string;
    tags: string[];
    targetFolderId: string;
}

export interface SearchFilters {
    query: string;
    type: FileType | 'all';
    tags: string[];
    asin: string | null;
    dateFrom: Date | null;
    dateTo: Date | null;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    accessToken: string;
}
