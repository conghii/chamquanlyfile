/**
 * Firestore Service — CRUD Operations
 * ────────────────────────────────────
 * Firebase v9+ modular SDK. All functions take teamId as first param.
 * Uses team-scoped subcollections: teams/{teamId}/[files|folders|asins|activity|members]
 */

import {
    collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
    query, where, orderBy, limit, startAfter,
    serverTimestamp, increment, runTransaction, writeBatch, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS, validateAsinCode, validateFolder, validateFile } from './firestore-schema';

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

/** Convert Firestore doc snapshot to plain object with id */
function docToObj(docSnap) {
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        ...data,
        id: docSnap.id,
        // Auto-convert common Timestamp fields to JS Date
        ...(data.createdAt?.toDate && { createdAt: data.createdAt.toDate() }),
        ...(data.updatedAt?.toDate && { updatedAt: data.updatedAt.toDate() }),
        ...(data.uploadedAt?.toDate && { uploadedAt: data.uploadedAt.toDate() }),
        ...(data.joinedAt?.toDate && { joinedAt: data.joinedAt.toDate() }),
    };
}

/** Convert query snapshot to array of plain objects */
function snapToArray(snapshot) {
    return snapshot.docs.map(d => {
        const data = d.data();
        return {
            ...data,
            id: d.id,
            ...(data.createdAt?.toDate && { createdAt: data.createdAt.toDate() }),
            ...(data.updatedAt?.toDate && { updatedAt: data.updatedAt.toDate() }),
            ...(data.uploadedAt?.toDate && { uploadedAt: data.uploadedAt.toDate() }),
            ...(data.joinedAt?.toDate && { joinedAt: data.joinedAt.toDate() }),
        };
    });
}

/** Ref shorthand helpers */
const filesCol = (teamId) => collection(db, COLLECTIONS.FILES(teamId));
const foldersCol = (teamId) => collection(db, COLLECTIONS.FOLDERS(teamId));
const asinsCol = (teamId) => collection(db, COLLECTIONS.ASINS(teamId));
const activityCol = (teamId) => collection(db, COLLECTIONS.ACTIVITY(teamId));
const membersCol = (teamId) => collection(db, COLLECTIONS.MEMBERS(teamId));
const teamDoc = (teamId) => doc(db, COLLECTIONS.TEAMS, teamId);
const fileDoc = (teamId, fileId) => doc(db, COLLECTIONS.FILES(teamId), fileId);
const folderDoc = (teamId, folderId) => doc(db, COLLECTIONS.FOLDERS(teamId), folderId);
const asinDoc = (teamId, asinId) => doc(db, COLLECTIONS.ASINS(teamId), asinId);
const memberDoc = (teamId, uid) => doc(db, COLLECTIONS.MEMBERS(teamId), uid);

/* ═══════════════════════════════════════════════════════════════
   Activity Logging (internal)
   ═══════════════════════════════════════════════════════════════ */

async function logActivity(teamId, { action, fileId = null, fileName = '', userId = '', userName = '', details = {} }) {
    await addDoc(activityCol(teamId), {
        action,
        fileId,
        fileName,
        userId,
        userName,
        details,
        createdAt: serverTimestamp(),
    });
}

/* ═══════════════════════════════════════════════════════════════
   FILES
   ═══════════════════════════════════════════════════════════════ */

/**
 * Get paginated files in a folder.
 * @returns {{ files: Array, lastDoc: DocumentSnapshot|null }}
 */
export async function getFilesInFolder(teamId, folderId, options = {}) {
    const {
        limit: pageSize = 50,
        startAfter: startAfterDoc = null,
        sortBy = 'uploadedAt',
        sortDir = 'desc',
    } = options;

    const constraints = [
        where('folderId', '==', folderId),
        orderBy(sortBy, sortDir),
        limit(pageSize),
    ];

    if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
    }

    const q = query(filesCol(teamId), ...constraints);
    const snapshot = await getDocs(q);

    return {
        files: snapToArray(snapshot),
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
}

/**
 * Get a single file by ID.
 */
export async function getFileById(teamId, fileId) {
    const snap = await getDoc(fileDoc(teamId, fileId));
    return docToObj(snap);
}

/**
 * Create file metadata + increment folder.fileCount + asin.fileCount + log activity.
 * Uses transaction for atomicity.
 * @returns {string} The new file document ID.
 */
export async function createFileMetadata(teamId, fileData) {
    const validation = validateFile(fileData);
    if (!validation.valid) throw new Error(validation.errors.join(', '));

    const newFileRef = doc(filesCol(teamId));

    await runTransaction(db, async (transaction) => {
        // Increment folder fileCount
        const folderRef = folderDoc(teamId, fileData.folderId);
        transaction.update(folderRef, { fileCount: increment(1) });

        // Increment ASIN fileCount if assigned
        if (fileData.asinId) {
            const asinRef = asinDoc(teamId, fileData.asinId);
            transaction.update(asinRef, { fileCount: increment(1) });
        }

        // Create file document
        transaction.set(newFileRef, {
            ...fileData,
            uploadedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });

    // Log activity (non-critical, outside transaction)
    await logActivity(teamId, {
        action: 'upload',
        fileId: newFileRef.id,
        fileName: fileData.name,
        userId: fileData.uploadedBy?.uid || '',
        userName: fileData.uploadedBy?.displayName || '',
        details: { folderId: fileData.folderId },
    }).catch(() => { });

    return newFileRef.id;
}

/**
 * Update file metadata + set updatedAt + log activity.
 */
export async function updateFile(teamId, fileId, updates) {
    await updateDoc(fileDoc(teamId, fileId), {
        ...updates,
        updatedAt: serverTimestamp(),
    });

    await logActivity(teamId, {
        action: 'rename',
        fileId,
        fileName: updates.name || '',
        details: updates,
    }).catch(() => { });
}

/**
 * Delete file metadata + decrement folder & asin fileCount + log activity.
 * Uses transaction for atomicity.
 */
export async function deleteFileMetadata(teamId, fileId) {
    const fileSnap = await getDoc(fileDoc(teamId, fileId));
    if (!fileSnap.exists()) return;
    const file = fileSnap.data();

    await runTransaction(db, async (transaction) => {
        // Decrement folder fileCount
        if (file.folderId) {
            transaction.update(folderDoc(teamId, file.folderId), { fileCount: increment(-1) });
        }
        // Decrement ASIN fileCount
        if (file.asinId) {
            transaction.update(asinDoc(teamId, file.asinId), { fileCount: increment(-1) });
        }
        // Delete the file doc
        transaction.delete(fileDoc(teamId, fileId));
    });

    await logActivity(teamId, {
        action: 'delete',
        fileId,
        fileName: file.name || '',
        details: { folderId: file.folderId },
    }).catch(() => { });
}

/**
 * Move file to a new folder. Updates folderId and adjusts fileCount on both folders.
 * Uses transaction for atomicity.
 */
export async function moveFile(teamId, fileId, newFolderId) {
    const fileSnap = await getDoc(fileDoc(teamId, fileId));
    if (!fileSnap.exists()) throw new Error('File not found');
    const file = fileSnap.data();
    const oldFolderId = file.folderId;

    if (oldFolderId === newFolderId) return; // No-op

    await runTransaction(db, async (transaction) => {
        // Decrement old folder
        if (oldFolderId) {
            transaction.update(folderDoc(teamId, oldFolderId), { fileCount: increment(-1) });
        }
        // Increment new folder
        transaction.update(folderDoc(teamId, newFolderId), { fileCount: increment(1) });
        // Update file
        transaction.update(fileDoc(teamId, fileId), {
            folderId: newFolderId,
            updatedAt: serverTimestamp(),
        });
    });

    await logActivity(teamId, {
        action: 'move',
        fileId,
        fileName: file.name || '',
        details: { from: oldFolderId, to: newFolderId },
    }).catch(() => { });
}

/**
 * Batch update multiple files (max 500 per batch).
 */
export async function bulkUpdateFiles(teamId, fileIds, updates) {
    const BATCH_SIZE = 500;
    for (let i = 0; i < fileIds.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = fileIds.slice(i, i + BATCH_SIZE);
        chunk.forEach(id => {
            batch.update(fileDoc(teamId, id), {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        });
        await batch.commit();
    }

    await logActivity(teamId, {
        action: 'bulk_upload',
        fileName: `${fileIds.length} files`,
        details: { fileIds: fileIds.slice(0, 10), updates },
    }).catch(() => { });
}

/**
 * Search files with filters.
 */
export async function searchFiles(teamId, filters = {}) {
    const { query: searchQuery, asinId, tags, mimeType, folderId } = filters;

    const constraints = [];

    if (folderId) constraints.push(where('folderId', '==', folderId));
    if (asinId) constraints.push(where('asinId', '==', asinId));
    if (mimeType) constraints.push(where('mimeType', '==', mimeType));
    if (tags && tags.length > 0) constraints.push(where('tags', 'array-contains-any', tags));

    constraints.push(orderBy('uploadedAt', 'desc'));
    constraints.push(limit(100));

    const q = query(filesCol(teamId), ...constraints);
    const snapshot = await getDocs(q);
    let results = snapToArray(snapshot);

    // Client-side name filter (Firestore doesn't support substring search)
    if (searchQuery) {
        const lq = searchQuery.toLowerCase();
        results = results.filter(f =>
            f.name?.toLowerCase().includes(lq) ||
            f.originalName?.toLowerCase().includes(lq)
        );
    }

    return results;
}

/* ═══════════════════════════════════════════════════════════════
   FOLDERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Get all folders (flat list — client builds tree using parentId).
 */
export async function getFolders(teamId) {
    const snapshot = await getDocs(foldersCol(teamId));
    return snapToArray(snapshot);
}

/**
 * Create a new folder.
 * @returns {string} New folder document ID.
 */
export async function createFolder(teamId, data) {
    const validation = validateFolder(data);
    if (!validation.valid) throw new Error(validation.errors.join(', '));

    const docRef = await addDoc(foldersCol(teamId), {
        name: data.name.trim(),
        parentId: data.parentId || null,
        driveFolderId: data.driveFolderId || '',
        type: data.type || 'general',
        fileCount: 0,
        createdBy: data.createdBy || '',
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}

/**
 * Rename a folder.
 */
export async function renameFolder(teamId, folderId, newName) {
    if (!newName || !newName.trim()) throw new Error('Tên folder không được để trống');
    await updateDoc(folderDoc(teamId, folderId), { name: newName.trim() });
}

/**
 * Delete a folder + all files inside + log activity.
 */
export async function deleteFolder(teamId, folderId) {
    // Get all files in this folder
    const q = query(filesCol(teamId), where('folderId', '==', folderId));
    const snapshot = await getDocs(q);

    // Batch delete files
    const BATCH_SIZE = 500;
    const fileDocs = snapshot.docs;
    for (let i = 0; i < fileDocs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        fileDocs.slice(i, i + BATCH_SIZE).forEach(d => batch.delete(d.ref));
        await batch.commit();
    }

    // Delete the folder document
    await deleteDoc(folderDoc(teamId, folderId));

    await logActivity(teamId, {
        action: 'delete',
        fileName: `Folder + ${fileDocs.length} files`,
        details: { folderId, filesDeleted: fileDocs.length },
    }).catch(() => { });
}

/* ═══════════════════════════════════════════════════════════════
   ASINS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Get all ASINs for a team.
 */
export async function getAsins(teamId) {
    const snapshot = await getDocs(query(asinsCol(teamId), orderBy('code', 'asc')));
    return snapToArray(snapshot);
}

/**
 * Create a new ASIN with validation.
 * @returns {string} New ASIN document ID.
 */
export async function createAsin(teamId, data) {
    const validation = validateAsinCode(data.code);
    if (!validation.valid) throw new Error(validation.error);

    const docRef = await addDoc(asinsCol(teamId), {
        code: data.code.trim().toUpperCase(),
        productName: data.productName?.trim() || '',
        fileCount: 0,
        createdAt: serverTimestamp(),
        createdBy: data.createdBy || '',
    });

    return docRef.id;
}

/**
 * Delete ASIN + unset asinId on all files that reference it.
 */
export async function deleteAsin(teamId, asinId) {
    // Unset asinId on all linked files
    const q = query(filesCol(teamId), where('asinId', '==', asinId));
    const snapshot = await getDocs(q);

    const BATCH_SIZE = 500;
    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        snapshot.docs.slice(i, i + BATCH_SIZE).forEach(d => {
            batch.update(d.ref, { asinId: null, updatedAt: serverTimestamp() });
        });
        await batch.commit();
    }

    // Delete ASIN doc
    await deleteDoc(asinDoc(teamId, asinId));
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY
   ═══════════════════════════════════════════════════════════════ */

/**
 * Get recent activity log.
 */
export async function getRecentActivity(teamId, options = {}) {
    const { limit: pageSize = 20, fileId = null } = options;

    const constraints = [];
    if (fileId) constraints.push(where('fileId', '==', fileId));
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize));

    const q = query(activityCol(teamId), ...constraints);
    const snapshot = await getDocs(q);
    return snapToArray(snapshot);
}

/* ═══════════════════════════════════════════════════════════════
   TEAM
   ═══════════════════════════════════════════════════════════════ */

/**
 * Get team settings.
 */
export async function getTeamSettings(teamId) {
    const snap = await getDoc(teamDoc(teamId));
    return docToObj(snap);
}

/**
 * Update team settings (merge).
 */
export async function updateTeamSettings(teamId, settings) {
    await updateDoc(teamDoc(teamId), {
        settings,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get all team members.
 */
export async function getTeamMembers(teamId) {
    const snapshot = await getDocs(membersCol(teamId));
    return snapToArray(snapshot);
}
