/**
 * useFileManager — Custom React Hook
 * ────────────────────────────────────
 * Bridges Firestore metadata service + Google Drive API service.
 * Manages files, folders, ASINs with coordinated operations.
 */

import { useState, useReducer, useCallback, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../services/firestore-schema';
import * as fs from '../services/firestoreService';
import * as drive from '../services/driveService';

/* ═══════════════════════════════════════════════════════════════
   Access Token Helper
   ═══════════════════════════════════════════════════════════════ */

/**
 * Get the Google OAuth access token for Drive API calls.
 * The token is stored in the user profile during sign-in via
 * GoogleAuthProvider.credentialFromResult().
 *
 * IMPORTANT: The OAuth access token from initial sign-in expires (~1 hour).
 * For long sessions, the user may need to re-authenticate.
 * We store it in sessionStorage as fallback and attempt re-auth on TOKEN_EXPIRED.
 */
function getAccessToken() {
    // Try sessionStorage first (set during sign-in)
    const stored = sessionStorage.getItem('google_access_token');
    if (stored) return stored;

    // Fall back to null — caller should handle re-auth
    return null;
}

/**
 * Store access token after sign-in.
 * Call this from your auth flow after signInWithGoogle().
 */
export function setAccessToken(token) {
    if (token) sessionStorage.setItem('google_access_token', token);
}

/* ═══════════════════════════════════════════════════════════════
   State Reducer
   ═══════════════════════════════════════════════════════════════ */

const initialState = {
    files: [],
    folders: [],
    asins: [],
    loading: false,
    error: null,
    uploadProgress: null,   // [{fileName, status, progress}] | null
    lastDoc: null,           // Firestore cursor for pagination
    hasMore: true,
    currentFolderId: null,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload, error: null };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'CLEAR_ERROR':
            return { ...state, error: null };

        case 'SET_FILES':
            return { ...state, files: action.payload.files, lastDoc: action.payload.lastDoc, hasMore: action.payload.hasMore, loading: false };
        case 'APPEND_FILES':
            return { ...state, files: [...state.files, ...action.payload.files], lastDoc: action.payload.lastDoc, hasMore: action.payload.hasMore, loading: false };
        case 'UPDATE_FILE': {
            const updated = state.files.map(f => f.id === action.payload.id ? { ...f, ...action.payload.updates } : f);
            return { ...state, files: updated };
        }
        case 'REMOVE_FILE':
            return { ...state, files: state.files.filter(f => f.id !== action.payload) };
        case 'ADD_FILE':
            return { ...state, files: [action.payload, ...state.files] };

        case 'SET_FOLDERS':
            return { ...state, folders: action.payload };
        case 'SET_ASINS':
            return { ...state, asins: action.payload };

        case 'SET_UPLOAD_PROGRESS':
            return { ...state, uploadProgress: action.payload };
        case 'UPDATE_UPLOAD_ITEM': {
            if (!state.uploadProgress) return state;
            const progress = [...state.uploadProgress];
            progress[action.payload.index] = { ...progress[action.payload.index], ...action.payload.updates };
            return { ...state, uploadProgress: progress };
        }
        case 'CLEAR_UPLOAD_PROGRESS':
            return { ...state, uploadProgress: null };

        case 'SET_CURRENT_FOLDER':
            return { ...state, currentFolderId: action.payload, files: [], lastDoc: null, hasMore: true };

        default:
            return state;
    }
}

/* ═══════════════════════════════════════════════════════════════
   Retry Utility
   ═══════════════════════════════════════════════════════════════ */

async function withRetry(fn, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === maxRetries) throw err;
            await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        }
    }
}

/* ═══════════════════════════════════════════════════════════════
   useFileManager Hook
   ═══════════════════════════════════════════════════════════════ */

export default function useFileManager(teamId) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const abortRef = useRef(null);         // Cancel pending folder loads
    const mountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    // Safe dispatch — only if still mounted
    const safeDispatch = useCallback((action) => {
        if (mountedRef.current) dispatch(action);
    }, []);

    /* ── Get current user info ── */
    const getCurrentUser = useCallback(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('Chưa đăng nhập');
        return { uid: user.uid, displayName: user.displayName || '' };
    }, []);

    /* ── Get access token (with TOKEN_EXPIRED handling) ── */
    const requireToken = useCallback(() => {
        const token = getAccessToken();
        if (!token) throw new Error('TOKEN_EXPIRED');
        return token;
    }, []);

    /* ── Handle errors from Drive/Firestore ── */
    const handleError = useCallback((err, context = '') => {
        console.error(`[useFileManager] ${context}:`, err);

        if (err.code === 'TOKEN_EXPIRED' || err.message === 'TOKEN_EXPIRED') {
            safeDispatch({ type: 'SET_ERROR', payload: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
            // Trigger re-auth — parent should listen for this error
            return;
        }

        safeDispatch({ type: 'SET_ERROR', payload: err.message || `Lỗi: ${context}` });
    }, [safeDispatch]);

    /* ═══════════════════════════════════════════════════════════
       FOLDERS — real-time listener (onSnapshot)
       ═══════════════════════════════════════════════════════════ */

    useEffect(() => {
        if (!teamId) return;

        const q = query(collection(db, COLLECTIONS.FOLDERS(teamId)));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const folders = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    ...data,
                    id: d.id,
                    ...(data.createdAt?.toDate && { createdAt: data.createdAt.toDate() }),
                };
            });
            safeDispatch({ type: 'SET_FOLDERS', payload: folders });
        }, (err) => {
            console.error('[useFileManager] Folders onSnapshot error:', err);
        });

        return unsubscribe;
    }, [teamId, safeDispatch]);

    /* ═══════════════════════════════════════════════════════════
       ASINs — load once, refresh on demand
       ═══════════════════════════════════════════════════════════ */

    const loadAsins = useCallback(async () => {
        if (!teamId) return;
        try {
            const asins = await fs.getAsins(teamId);
            safeDispatch({ type: 'SET_ASINS', payload: asins });
        } catch (err) {
            handleError(err, 'loadAsins');
        }
    }, [teamId, safeDispatch, handleError]);

    useEffect(() => { loadAsins(); }, [loadAsins]);

    /* ═══════════════════════════════════════════════════════════
       FILES — pull-based with pagination
       ═══════════════════════════════════════════════════════════ */

    /**
     * Load files for a specific folder (or all files if folderId is null).
     * Cancels any pending load from a previous folder switch.
     */
    const loadFolder = useCallback(async (folderId, options = {}) => {
        if (!teamId) return;

        // Cancel previous pending request
        if (abortRef.current) abortRef.current.cancelled = true;
        const ctrl = { cancelled: false };
        abortRef.current = ctrl;

        safeDispatch({ type: 'SET_CURRENT_FOLDER', payload: folderId });
        safeDispatch({ type: 'SET_LOADING', payload: true });

        try {
            const result = await fs.getFilesInFolder(teamId, folderId, {
                limit: options.limit || 50,
                sortBy: options.sortBy || 'uploadedAt',
                sortDir: options.sortDir || 'desc',
            });

            if (ctrl.cancelled) return; // Folder changed while loading

            safeDispatch({
                type: 'SET_FILES',
                payload: {
                    files: result.files,
                    lastDoc: result.lastDoc,
                    hasMore: result.files.length >= (options.limit || 50),
                },
            });
        } catch (err) {
            if (!ctrl.cancelled) handleError(err, 'loadFolder');
        }
    }, [teamId, safeDispatch, handleError]);

    /**
     * Load more files (next page).
     */
    const loadMore = useCallback(async () => {
        if (!teamId || !state.hasMore || !state.lastDoc || state.loading) return;

        safeDispatch({ type: 'SET_LOADING', payload: true });

        try {
            const result = await fs.getFilesInFolder(teamId, state.currentFolderId, {
                limit: 50,
                startAfter: state.lastDoc,
            });

            safeDispatch({
                type: 'APPEND_FILES',
                payload: {
                    files: result.files,
                    lastDoc: result.lastDoc,
                    hasMore: result.files.length >= 50,
                },
            });
        } catch (err) {
            handleError(err, 'loadMore');
        }
    }, [teamId, state.hasMore, state.lastDoc, state.loading, state.currentFolderId, safeDispatch, handleError]);

    /* ═══════════════════════════════════════════════════════════
       UPLOAD FILES
       Drive upload → Firestore metadata → progress tracking
       ═══════════════════════════════════════════════════════════ */

    /**
     * Upload one or more files.
     * @param {Array<{file, name, folderId, asinId?, tags?, parentDriveFolderId}>} fileDataArray
     * @returns {{ successful: number, failed: Array<{file, error}> }}
     */
    const uploadFiles = useCallback(async (fileDataArray) => {
        if (!teamId) throw new Error('No team ID');
        const token = requireToken();
        const user = getCurrentUser();

        // Init progress
        const progress = fileDataArray.map(fd => ({
            fileName: fd.name || fd.file.name,
            status: 'pending',
            progress: 0,
        }));
        safeDispatch({ type: 'SET_UPLOAD_PROGRESS', payload: progress });

        const successful = [];
        const failed = [];

        for (let i = 0; i < fileDataArray.length; i++) {
            const fd = fileDataArray[i];

            try {
                // Step 1: Upload to Google Drive
                safeDispatch({ type: 'UPDATE_UPLOAD_ITEM', payload: { index: i, updates: { status: 'uploading', progress: 30 } } });

                const driveResult = await drive.uploadFile(token, {
                    file: fd.file,
                    fileName: fd.name || fd.file.name,
                    parentFolderId: fd.parentDriveFolderId,
                    mimeType: fd.file.type,
                });

                safeDispatch({ type: 'UPDATE_UPLOAD_ITEM', payload: { index: i, updates: { status: 'saving_metadata', progress: 70 } } });

                // Step 2: Create Firestore metadata
                const fileId = await withRetry(() =>
                    fs.createFileMetadata(teamId, {
                        name: fd.name || fd.file.name,
                        originalName: fd.file.name,
                        mimeType: fd.file.type || 'application/octet-stream',
                        size: fd.file.size,
                        folderId: fd.folderId,
                        driveFileId: driveResult.driveFileId,
                        driveUrl: driveResult.driveUrl,
                        thumbnailUrl: driveResult.thumbnailUrl,
                        asinId: fd.asinId || null,
                        tags: fd.tags || [],
                        kanbanStatus: fd.kanbanStatus || '',
                        uploadedBy: { uid: user.uid, displayName: user.displayName },
                    })
                );

                safeDispatch({ type: 'UPDATE_UPLOAD_ITEM', payload: { index: i, updates: { status: 'done', progress: 100 } } });

                // Add to local state if in current folder
                if (fd.folderId === state.currentFolderId) {
                    safeDispatch({
                        type: 'ADD_FILE',
                        payload: {
                            id: fileId,
                            name: fd.name || fd.file.name,
                            originalName: fd.file.name,
                            mimeType: fd.file.type,
                            size: fd.file.size,
                            folderId: fd.folderId,
                            driveFileId: driveResult.driveFileId,
                            driveUrl: driveResult.driveUrl,
                            thumbnailUrl: driveResult.thumbnailUrl,
                            asinId: fd.asinId || null,
                            tags: fd.tags || [],
                            kanbanStatus: fd.kanbanStatus || '',
                            uploadedBy: { uid: user.uid, displayName: user.displayName },
                            uploadedAt: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                }

                successful.push({ fileId, driveFileId: driveResult.driveFileId });
            } catch (err) {
                console.error(`[useFileManager] Upload failed for "${fd.name || fd.file.name}":`, err);
                safeDispatch({ type: 'UPDATE_UPLOAD_ITEM', payload: { index: i, updates: { status: 'error', progress: 0, error: err.message } } });
                failed.push({ file: fd, error: err.message });
            }
        }

        return { successful: successful.length, failed };
    }, [teamId, state.currentFolderId, requireToken, getCurrentUser, safeDispatch]);

    /* ═══════════════════════════════════════════════════════════
       DELETE FILE
       Drive delete → Firestore delete (with retry)
       ═══════════════════════════════════════════════════════════ */

    const deleteFile = useCallback(async (fileId) => {
        if (!teamId) return;
        const token = requireToken();

        try {
            // Get file metadata first
            const file = await fs.getFileById(teamId, fileId);
            if (!file) throw new Error('File not found');

            // Step 1: Delete from Drive
            await drive.deleteFile(token, file.driveFileId);

            // Step 2: Delete from Firestore (with retry)
            await withRetry(() => fs.deleteFileMetadata(teamId, fileId));

            // Update local state
            safeDispatch({ type: 'REMOVE_FILE', payload: fileId });
        } catch (err) {
            handleError(err, 'deleteFile');
            throw err;
        }
    }, [teamId, requireToken, safeDispatch, handleError]);

    /* ═══════════════════════════════════════════════════════════
       MOVE FILE
       Drive move → Firestore move
       ═══════════════════════════════════════════════════════════ */

    const moveFile = useCallback(async (fileId, newFolderId) => {
        if (!teamId) return;
        const token = requireToken();

        try {
            const file = await fs.getFileById(teamId, fileId);
            if (!file) throw new Error('File not found');

            // Get Drive folder IDs for both old and new folders
            const oldFolder = state.folders.find(f => f.id === file.folderId);
            const newFolder = state.folders.find(f => f.id === newFolderId);

            if (!newFolder) throw new Error('Destination folder not found');

            // Step 1: Move on Drive
            if (oldFolder?.driveFolderId && newFolder.driveFolderId) {
                await drive.moveFileOnDrive(token, {
                    driveFileId: file.driveFileId,
                    oldParentId: oldFolder.driveFolderId,
                    newParentId: newFolder.driveFolderId,
                });
            }

            // Step 2: Move in Firestore
            await withRetry(() => fs.moveFile(teamId, fileId, newFolderId));

            // Update local state — remove from current view if folder changed
            if (state.currentFolderId && file.folderId === state.currentFolderId) {
                safeDispatch({ type: 'REMOVE_FILE', payload: fileId });
            }
        } catch (err) {
            handleError(err, 'moveFile');
            throw err;
        }
    }, [teamId, state.folders, state.currentFolderId, requireToken, safeDispatch, handleError]);

    /* ═══════════════════════════════════════════════════════════
       RENAME FILE
       Drive rename → Firestore rename
       ═══════════════════════════════════════════════════════════ */

    const renameFile = useCallback(async (fileId, newName) => {
        if (!teamId) return;
        const token = requireToken();

        try {
            const file = await fs.getFileById(teamId, fileId);
            if (!file) throw new Error('File not found');

            // Step 1: Rename on Drive
            await drive.renameFileOnDrive(token, {
                driveFileId: file.driveFileId,
                newName,
            });

            // Step 2: Rename in Firestore
            await withRetry(() => fs.updateFile(teamId, fileId, { name: newName }));

            // Update local state
            safeDispatch({ type: 'UPDATE_FILE', payload: { id: fileId, updates: { name: newName } } });
        } catch (err) {
            handleError(err, 'renameFile');
            throw err;
        }
    }, [teamId, requireToken, safeDispatch, handleError]);

    /* ═══════════════════════════════════════════════════════════
       UPDATE FILE METADATA
       (tags, asinId, kanbanStatus — Firestore only, no Drive change)
       ═══════════════════════════════════════════════════════════ */

    const updateFileMeta = useCallback(async (fileId, updates) => {
        if (!teamId) return;

        try {
            await fs.updateFile(teamId, fileId, updates);
            safeDispatch({ type: 'UPDATE_FILE', payload: { id: fileId, updates } });
        } catch (err) {
            handleError(err, 'updateFileMeta');
            throw err;
        }
    }, [teamId, safeDispatch, handleError]);

    /* ═══════════════════════════════════════════════════════════
       BULK UPDATE FILES
       ═══════════════════════════════════════════════════════════ */

    const bulkUpdateFiles = useCallback(async (fileIds, updates) => {
        if (!teamId) return;

        try {
            await fs.bulkUpdateFiles(teamId, fileIds, updates);
            // Update local state
            fileIds.forEach(id => {
                safeDispatch({ type: 'UPDATE_FILE', payload: { id, updates } });
            });
        } catch (err) {
            handleError(err, 'bulkUpdateFiles');
            throw err;
        }
    }, [teamId, safeDispatch, handleError]);

    /* ═══════════════════════════════════════════════════════════
       FOLDER ACTIONS
       ═══════════════════════════════════════════════════════════ */

    const createFolder = useCallback(async (name, parentId = null) => {
        if (!teamId) return;
        const token = requireToken();
        const user = getCurrentUser();

        try {
            // Find parent Drive folder ID
            const parentFolder = parentId ? state.folders.find(f => f.id === parentId) : null;
            const parentDriveId = parentFolder?.driveFolderId || null;

            // Step 1: Create on Drive
            let driveFolderId = '';
            if (parentDriveId) {
                const driveResult = await drive.createDriveFolder(token, { name, parentFolderId: parentDriveId });
                driveFolderId = driveResult.driveFolderId;
            }

            // Step 2: Create in Firestore
            await fs.createFolder(teamId, {
                name,
                parentId,
                driveFolderId,
                type: 'general',
                createdBy: user.uid,
            });
            // Folders are updated via onSnapshot listener — no local dispatch needed
        } catch (err) {
            handleError(err, 'createFolder');
            throw err;
        }
    }, [teamId, state.folders, requireToken, getCurrentUser, handleError]);

    const renameFolder = useCallback(async (folderId, newName) => {
        if (!teamId) return;

        try {
            await fs.renameFolder(teamId, folderId, newName);
            // Folders updated via onSnapshot
        } catch (err) {
            handleError(err, 'renameFolder');
            throw err;
        }
    }, [teamId, handleError]);

    const deleteFolder = useCallback(async (folderId) => {
        if (!teamId) return;
        const token = requireToken();

        try {
            const folder = state.folders.find(f => f.id === folderId);

            // Step 1: Delete Drive folder
            if (folder?.driveFolderId) {
                await drive.deleteDriveFolder(token, folder.driveFolderId).catch(() => {
                    // Drive folder might already be gone — continue
                    console.warn('[useFileManager] Drive folder delete failed, continuing...');
                });
            }

            // Step 2: Delete Firestore folder + files
            await fs.deleteFolder(teamId, folderId);
            // Folders updated via onSnapshot
        } catch (err) {
            handleError(err, 'deleteFolder');
            throw err;
        }
    }, [teamId, state.folders, requireToken, handleError]);

    /* ═══════════════════════════════════════════════════════════
       ASIN ACTIONS
       ═══════════════════════════════════════════════════════════ */

    const createAsin = useCallback(async (code, productName) => {
        if (!teamId) return;
        const user = getCurrentUser();

        try {
            await fs.createAsin(teamId, { code, productName, createdBy: user.uid });
            await loadAsins(); // Refresh list
        } catch (err) {
            handleError(err, 'createAsin');
            throw err;
        }
    }, [teamId, getCurrentUser, loadAsins, handleError]);

    const deleteAsin = useCallback(async (asinId) => {
        if (!teamId) return;

        try {
            await fs.deleteAsin(teamId, asinId);
            await loadAsins(); // Refresh list
        } catch (err) {
            handleError(err, 'deleteAsin');
            throw err;
        }
    }, [teamId, loadAsins, handleError]);

    /* ═══════════════════════════════════════════════════════════
       RETURN PUBLIC API
       ═══════════════════════════════════════════════════════════ */

    return {
        // State
        files: state.files,
        folders: state.folders,
        asins: state.asins,
        loading: state.loading,
        error: state.error,
        uploadProgress: state.uploadProgress,
        hasMore: state.hasMore,

        // File actions
        uploadFiles,
        deleteFile,
        moveFile,
        renameFile,
        updateFileMeta,
        bulkUpdateFiles,

        // Folder actions
        loadFolder,
        createFolder,
        renameFolder,
        deleteFolder,

        // ASIN actions
        createAsin,
        deleteAsin,

        // Pagination
        loadMore,

        // Upload progress clear
        clearUploadProgress: useCallback(() => safeDispatch({ type: 'CLEAR_UPLOAD_PROGRESS' }), [safeDispatch]),

        // Error clear
        clearError: useCallback(() => safeDispatch({ type: 'CLEAR_ERROR' }), [safeDispatch]),
    };
}
