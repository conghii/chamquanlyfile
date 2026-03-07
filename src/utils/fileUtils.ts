import type { FileType } from '../types';

const MIME_TYPE_MAP: Record<string, FileType> = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'image/gif': 'image',
    'video/mp4': 'video',
    'video/quicktime': 'video',
    'video/webm': 'video',
    'text/plain': 'text',
    'application/msword': 'text',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text',
    'application/pdf': 'pdf',
    'application/vnd.ms-excel': 'xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/csv': 'xlsx',
};

const TYPE_PREFIX: Record<FileType, string> = {
    image: 'IMG',
    video: 'VID',
    text: 'TXT',
    pdf: 'PDF',
    xlsx: 'XLS',
    link: 'LINK',
    other: 'FILE',
};

export function detectFileType(file: File): FileType {
    return MIME_TYPE_MAP[file.type] || 'other';
}

export function suggestFileName(
    type: FileType,
    asin: string | null,
    variant: string,
    purpose: string,
    productName?: string | null
): string {
    const prefix = TYPE_PREFIX[type];

    // Combine ASIN and Product Name safely
    let asinPart = asin || 'GENERAL';
    if (asin && productName) {
        // e.g. B0DTQ34TKQ_Positive_Pickle
        const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
        if (sanitizedName) {
            asinPart = `${asin}_${sanitizedName}`;
        }
    }

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const parts = [prefix, asinPart, variant, purpose, date].filter(Boolean);
    return parts.join('_').toUpperCase();
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
}

export function getTypeLabel(type: FileType): string {
    const labels: Record<FileType, string> = {
        image: 'Image',
        video: 'Video',
        text: 'Text',
        pdf: 'PDF',
        xlsx: 'Spreadsheet',
        link: 'Link',
        other: 'File',
    };
    return labels[type];
}

export function getTypeColor(type: FileType): string {
    const colors: Record<FileType, string> = {
        image: '#10b981',
        video: '#8b5cf6',
        text: '#3b82f6',
        pdf: '#ef4444',
        xlsx: '#f59e0b',
        link: '#06b6d4',
        other: '#6b7280',
    };
    return colors[type];
}
