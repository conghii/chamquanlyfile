/**
 * Google Drive API v3 Service
 * ───────────────────────────
 * Pure fetch()-based wrapper. No Firebase imports.
 * All functions receive accessToken externally.
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

const RESUMABLE_THRESHOLD = 5 * 1024 * 1024; // 5 MB
const MAX_RETRIES = 3;

/* ═══════════════════════════════════════════════════════════════
   Error Handling
   ═══════════════════════════════════════════════════════════════ */

class DriveError extends Error {
    constructor(code, message, status) {
        super(message);
        this.name = 'DriveError';
        this.code = code;      // "TOKEN_EXPIRED" | "PERMISSION_DENIED" | "FILE_NOT_FOUND" | "RATE_LIMIT" | "UNKNOWN"
        this.status = status;  // HTTP status code
    }
}

function mapError(status, fileId = '', action = '') {
    const ctx = fileId ? ` [file: ${fileId}]` : '';
    switch (status) {
        case 401: return new DriveError('TOKEN_EXPIRED', `Token hết hạn. Vui lòng đăng nhập lại.${ctx}`, 401);
        case 403: return new DriveError('PERMISSION_DENIED', `Không có quyền truy cập.${ctx}`, 403);
        case 404: return new DriveError('FILE_NOT_FOUND', `File không tồn tại trên Drive.${ctx}`, 404);
        case 429: return new DriveError('RATE_LIMIT', `Quá nhiều request. Đang thử lại...${ctx}`, 429);
        default: return new DriveError('UNKNOWN', `Lỗi Drive API (${status}) khi ${action}${ctx}`, status);
    }
}

/** Sleep utility for retry backoff */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Fetch with retry on 429 (rate limit) — exponential backoff.
 */
async function fetchWithRetry(url, options, { retries = MAX_RETRIES, fileId = '', action = '' } = {}) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const res = await fetch(url, options);

        if (res.ok) return res;

        if (res.status === 429 && attempt < retries) {
            const waitMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            console.warn(`[DriveService] Rate limited on ${action}. Retry ${attempt + 1}/${retries} in ${Math.round(waitMs)}ms`);
            await sleep(waitMs);
            continue;
        }

        // Non-retriable error or final retry failed
        throw mapError(res.status, fileId, action);
    }
}

/** Standard auth headers */
function authHeaders(accessToken, extra = {}) {
    return {
        Authorization: `Bearer ${accessToken}`,
        ...extra,
    };
}

/* ═══════════════════════════════════════════════════════════════
   UPLOAD
   ═══════════════════════════════════════════════════════════════ */

/**
 * Upload a single file to Google Drive.
 * Uses multipart upload for small files, resumable for files > 5MB.
 *
 * @param {string} accessToken
 * @param {Object} params
 * @param {File} params.file - Browser File object
 * @param {string} params.fileName - Display name on Drive
 * @param {string} params.parentFolderId - Drive folder ID
 * @param {string} [params.mimeType] - Override MIME type
 * @returns {{ driveFileId: string, driveUrl: string, thumbnailUrl: string }}
 */
export async function uploadFile(accessToken, { file, fileName, parentFolderId, mimeType }) {
    const fileMime = mimeType || file.type || 'application/octet-stream';

    if (file.size > RESUMABLE_THRESHOLD) {
        return resumableUpload(accessToken, file, fileName, parentFolderId, fileMime);
    }
    return multipartUpload(accessToken, file, fileName, parentFolderId, fileMime);
}

/** Multipart upload (< 5MB) */
async function multipartUpload(accessToken, file, fileName, parentFolderId, mimeType) {
    const metadata = {
        name: fileName,
        mimeType,
        parents: [parentFolderId],
    };

    const boundary = '===DRIVE_UPLOAD_BOUNDARY===';
    const body = buildMultipartBody(boundary, metadata, file, mimeType);

    const res = await fetchWithRetry(
        `${UPLOAD_API}?uploadType=multipart&fields=id,webViewLink`,
        {
            method: 'POST',
            headers: authHeaders(accessToken, {
                'Content-Type': `multipart/related; boundary=${boundary}`,
            }),
            body,
        },
        { action: 'multipart upload', fileId: fileName }
    );

    const data = await res.json();
    return {
        driveFileId: data.id,
        driveUrl: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
        thumbnailUrl: getThumbnailUrl(data.id),
    };
}

/** Build multipart request body */
function buildMultipartBody(boundary, metadata, file, mimeType) {
    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const filePart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const end = `\r\n--${boundary}--`;

    return new Blob([metaPart, filePart, file, end]);
}

/** Resumable upload (> 5MB) */
async function resumableUpload(accessToken, file, fileName, parentFolderId, mimeType) {
    // Step 1: Initiate resumable session
    const initRes = await fetchWithRetry(
        `${UPLOAD_API}?uploadType=resumable&fields=id,webViewLink`,
        {
            method: 'POST',
            headers: authHeaders(accessToken, {
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Upload-Content-Type': mimeType,
                'X-Upload-Content-Length': file.size.toString(),
            }),
            body: JSON.stringify({
                name: fileName,
                mimeType,
                parents: [parentFolderId],
            }),
        },
        { action: 'initiate resumable upload', fileId: fileName }
    );

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) throw new DriveError('UNKNOWN', 'Không thể khởi tạo resumable upload', 500);

    // Step 2: Upload the file content
    const uploadRes = await fetchWithRetry(
        uploadUrl,
        {
            method: 'PUT',
            headers: {
                'Content-Type': mimeType,
                'Content-Length': file.size.toString(),
            },
            body: file,
        },
        { action: 'resumable upload content', fileId: fileName }
    );

    const data = await uploadRes.json();
    return {
        driveFileId: data.id,
        driveUrl: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
        thumbnailUrl: getThumbnailUrl(data.id),
    };
}

/* ═══════════════════════════════════════════════════════════════
   BULK UPLOAD
   ═══════════════════════════════════════════════════════════════ */

/**
 * Upload multiple files sequentially (avoids rate limits).
 *
 * @param {string} accessToken
 * @param {Array<{file, fileName, parentFolderId, mimeType?}>} files
 * @param {Function} [onProgress] - Called after each file: (index, total, result)
 * @returns {Array<{driveFileId, driveUrl, thumbnailUrl, success, error?}>}
 */
export async function bulkUploadFiles(accessToken, files, onProgress) {
    const results = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const result = await uploadFile(accessToken, files[i]);
            results.push({ ...result, success: true });
            if (onProgress) onProgress(i, files.length, { ...result, success: true });
        } catch (error) {
            const errResult = {
                driveFileId: null,
                driveUrl: null,
                thumbnailUrl: null,
                success: false,
                error: error.message || 'Upload failed',
            };
            results.push(errResult);
            if (onProgress) onProgress(i, files.length, errResult);
            console.error(`[DriveService] bulkUpload: File ${i + 1}/${files.length} failed:`, error.message);
        }
    }

    return results;
}

/* ═══════════════════════════════════════════════════════════════
   DOWNLOAD & THUMBNAIL
   ═══════════════════════════════════════════════════════════════ */

/**
 * Get direct download URL.
 * @param {string} driveFileId
 * @returns {string}
 */
export function getDownloadUrl(driveFileId) {
    return `https://drive.google.com/uc?export=download&id=${driveFileId}`;
}

/**
 * Get thumbnail URL with configurable size.
 * @param {string} driveFileId
 * @param {number} [size=400]
 * @returns {string}
 */
export function getThumbnailUrl(driveFileId, size = 400) {
    return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w${size}`;
}

/* ═══════════════════════════════════════════════════════════════
   DELETE
   ═══════════════════════════════════════════════════════════════ */

/**
 * Delete a file from Google Drive.
 * @returns {boolean} success
 */
export async function deleteFile(accessToken, driveFileId) {
    try {
        await fetchWithRetry(
            `${DRIVE_API}/${driveFileId}`,
            {
                method: 'DELETE',
                headers: authHeaders(accessToken),
            },
            { action: 'delete file', fileId: driveFileId }
        );
        return true;
    } catch (error) {
        // 404 = already deleted, treat as success
        if (error.code === 'FILE_NOT_FOUND') return true;
        throw error;
    }
}

/* ═══════════════════════════════════════════════════════════════
   FOLDER OPERATIONS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Create a folder on Google Drive.
 * @returns {{ driveFolderId: string }}
 */
export async function createDriveFolder(accessToken, { name, parentFolderId }) {
    const res = await fetchWithRetry(
        `${DRIVE_API}?fields=id`,
        {
            method: 'POST',
            headers: authHeaders(accessToken, {
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
                name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentFolderId ? [parentFolderId] : [],
            }),
        },
        { action: 'create folder', fileId: name }
    );

    const data = await res.json();
    return { driveFolderId: data.id };
}

/**
 * Delete a folder from Google Drive.
 * @returns {boolean} success
 */
export async function deleteDriveFolder(accessToken, driveFolderId) {
    return deleteFile(accessToken, driveFolderId);
}

/**
 * Move a file between folders on Google Drive.
 */
export async function moveFileOnDrive(accessToken, { driveFileId, oldParentId, newParentId }) {
    const params = new URLSearchParams({
        addParents: newParentId,
        removeParents: oldParentId,
        fields: 'id,parents',
    });

    await fetchWithRetry(
        `${DRIVE_API}/${driveFileId}?${params.toString()}`,
        {
            method: 'PATCH',
            headers: authHeaders(accessToken, {
                'Content-Type': 'application/json',
            }),
        },
        { action: 'move file', fileId: driveFileId }
    );
}

/* ═══════════════════════════════════════════════════════════════
   RENAME
   ═══════════════════════════════════════════════════════════════ */

/**
 * Rename a file or folder on Google Drive.
 */
export async function renameFileOnDrive(accessToken, { driveFileId, newName }) {
    await fetchWithRetry(
        `${DRIVE_API}/${driveFileId}?fields=id`,
        {
            method: 'PATCH',
            headers: authHeaders(accessToken, {
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({ name: newName }),
        },
        { action: 'rename file', fileId: driveFileId }
    );
}
