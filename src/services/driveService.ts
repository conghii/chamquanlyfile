const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

function headers(token: string) {
    return { Authorization: `Bearer ${token}` };
}

/* ── Root folder ─────────────────────────────────────────── */

export async function ensureRootFolder(token: string): Promise<string> {
    const q = encodeURIComponent(
        "name='AmazonAssetManager' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    );
    const res = await fetch(`${DRIVE_API}/files?q=${q}&fields=files(id,name)`, {
        headers: headers(token),
    });
    const data = await res.json();

    if (data.files && data.files.length > 0) {
        return data.files[0].id;
    }
    return createFolder(token, 'AmazonAssetManager', null);
}

/* ── Folder operations ───────────────────────────────────── */

export async function createFolder(
    token: string,
    name: string,
    parentId: string | null
): Promise<string> {
    const metadata: Record<string, unknown> = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentId) metadata.parents = [parentId];

    const res = await fetch(`${DRIVE_API}/files`, {
        method: 'POST',
        headers: { ...headers(token), 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to create folder');
    return data.id;
}

export async function renameFile(
    token: string,
    fileId: string,
    newName: string
): Promise<void> {
    const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
        method: 'PATCH',
        headers: { ...headers(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to rename');
    }
}

export async function deleteFile(token: string, fileId: string): Promise<void> {
    const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
        method: 'DELETE',
        headers: headers(token),
    });
    if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete file');
    }
}

/* ── Upload ──────────────────────────────────────────────── */

export async function uploadFile(
    token: string,
    file: File,
    folderId: string,
    fileName: string,
    onProgress?: (percent: number) => void
): Promise<{ fileId: string; webViewLink: string; thumbnailLink: string }> {
    const metadata = {
        name: fileName,
        parents: [folderId],
    };

    const form = new FormData();
    form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', file);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
            'POST',
            `${UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink,thumbnailLink,name`
        );
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                resolve({
                    fileId: data.id,
                    webViewLink: data.webViewLink || '',
                    thumbnailLink: data.thumbnailLink || '',
                });
            } else {
                reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
        };

        xhr.onerror = () => reject(new Error('Upload network error'));
        xhr.send(form);
    });
}

/* ── List folders (recursive tree) ───────────────────────── */

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
}

export async function listFolders(
    token: string,
    parentId: string
): Promise<DriveFile[]> {
    const allFolders: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
        const q = encodeURIComponent(
            `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
        );
        let url = `${DRIVE_API}/files?q=${q}&fields=nextPageToken,files(id,name,mimeType,parents)&pageSize=100&orderBy=name`;
        if (pageToken) url += `&pageToken=${pageToken}`;

        const res = await fetch(url, { headers: headers(token) });
        const data = await res.json();
        if (data.files) allFolders.push(...data.files);
        pageToken = data.nextPageToken;
    } while (pageToken);

    return allFolders;
}

/** Build a full folder tree from Drive, starting from root */
export async function buildFolderTree(
    token: string,
    rootId: string,
    rootName: string = 'AmazonAssetManager'
): Promise<{
    id: string;
    name: string;
    driveId: string;
    parentId: string | null;
    children: ReturnType<typeof buildFolderTree> extends Promise<infer T> ? T[] : never;
    type: 'product' | 'learning' | 'archive' | 'subfolder';
}> {
    const subFolders = await listFolders(token, rootId);

    const children = await Promise.all(
        subFolders.map(async (f) => {
            const child = await buildFolderTree(token, f.id, f.name);
            return { ...child, parentId: rootId };
        })
    );

    return {
        id: rootId,
        name: rootName,
        driveId: rootId,
        parentId: null,
        children,
        type: guessType(rootName),
    };
}

function guessType(name: string): 'product' | 'learning' | 'archive' | 'subfolder' {
    const lower = name.toLowerCase();
    if (lower.startsWith('b0') || lower.includes('asin')) return 'product';
    if (lower === 'learning' || lower === 'tài liệu') return 'learning';
    if (lower === '_archive' || lower === 'archive') return 'archive';
    return 'subfolder';
}

/* ── List files in a folder ──────────────────────────────── */

export interface DriveFileItem {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    webViewLink?: string;
    thumbnailLink?: string;
    createdTime?: string;
    modifiedTime?: string;
    description?: string;
}

export async function listFiles(token: string, folderId: string): Promise<DriveFileItem[]> {
    const allFiles: DriveFileItem[] = [];
    let pageToken: string | undefined;

    do {
        const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
        const fields =
            'nextPageToken,files(id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime,description)';
        let url = `${DRIVE_API}/files?q=${q}&fields=${fields}&pageSize=100&orderBy=modifiedTime desc`;
        if (pageToken) url += `&pageToken=${pageToken}`;

        const res = await fetch(url, { headers: headers(token) });
        const data = await res.json();
        if (data.files) allFiles.push(...data.files);
        pageToken = data.nextPageToken;
    } while (pageToken);

    return allFiles;
}

export async function listAllFiles(token: string, folderIds: string[]): Promise<DriveFileItem[]> {
    const allFiles: DriveFileItem[] = [];
    const chunkSize = 15; // Drive API limits query length, chunking parent IDs

    for (let i = 0; i < folderIds.length; i += chunkSize) {
        const chunk = folderIds.slice(i, i + chunkSize);
        const parentQuery = chunk.map(id => `'${id}' in parents`).join(' or ');
        const q = encodeURIComponent(`(${parentQuery}) and trashed=false`);
        const fields = 'nextPageToken,files(id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime,description)';

        let pageToken: string | undefined;
        do {
            let url = `${DRIVE_API}/files?q=${q}&fields=${fields}&pageSize=1000&orderBy=modifiedTime desc`;
            if (pageToken) url += `&pageToken=${pageToken}`;

            const res = await fetch(url, { headers: headers(token) });
            const data = await res.json();
            if (data.files) allFiles.push(...data.files);
            pageToken = data.nextPageToken;
        } while (pageToken);
    }

    return allFiles;
}

/* ── Save a link as .url file on Drive ──────────────────── */

export async function saveLink(
    token: string,
    folderId: string,
    name: string,
    url: string,
    tags: string[],
    linkType: string
): Promise<{ fileId: string; webViewLink: string }> {
    // Create a .url file content (Windows Internet Shortcut format)
    const content = `[InternetShortcut]\nURL=${url}\nTags=${tags.join(',')}\nType=${linkType}\n`;

    const metadata = {
        name: `${name}.url`,
        parents: [folderId],
        mimeType: 'text/plain',
        description: JSON.stringify({ url, tags, linkType, isLink: true }),
    };

    const form = new FormData();
    form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append(
        'file',
        new Blob([content], { type: 'text/plain' })
    );

    const res = await fetch(
        `${UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink,name`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Failed to save link');
    return { fileId: data.id, webViewLink: data.webViewLink || '' };
}

/* ── App Config (.app-config.json) ───────────────────────── */

import type { AppConfig } from '../types';

const CONFIG_FILE_NAME = '.app-config.json';

export async function loadAppConfig(token: string, rootId: string): Promise<{ fileId: string | null; config: AppConfig }> {
    // 1. Find the file in the root folder
    const q = encodeURIComponent(`'${rootId}' in parents and name='${CONFIG_FILE_NAME}' and trashed=false`);
    const res = await fetch(`${DRIVE_API}/files?q=${q}&fields=files(id)`, {
        headers: headers(token),
    });
    const data = await res.json();
    const files = data.files || [];

    if (files.length === 0) {
        return { fileId: null, config: { folderMeta: {} } };
    }

    const fileId = files[0].id;

    // 2. Download the file content
    const dlRes = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
        headers: headers(token),
    });

    if (!dlRes.ok) {
        return { fileId, config: { folderMeta: {} } };
    }

    try {
        const text = await dlRes.text();
        const config = JSON.parse(text) as AppConfig;
        return { fileId, config: config || { folderMeta: {} } };
    } catch (e) {
        console.warn('Failed to parse app config', e);
        return { fileId, config: { folderMeta: {} } };
    }
}

export async function saveAppConfig(token: string, rootId: string, fileId: string | null, config: AppConfig): Promise<string> {
    const content = JSON.stringify(config, null, 2);
    const fileBlob = new Blob([content], { type: 'application/json' });

    if (fileId) {
        // Update existing file
        const res = await fetch(`${UPLOAD_API}/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: fileBlob,
        });
        if (!res.ok) throw new Error('Failed to update app config');
        return fileId;
    } else {
        // Create new file
        const metadata = {
            name: CONFIG_FILE_NAME,
            parents: [rootId],
            mimeType: 'application/json',
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', fileBlob);

        const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to create app config');
        return data.id;
    }
}

