import {
    collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AssetFile, Product, SearchFilters } from '../types';

const FILES_COL = 'files';
const PRODUCTS_COL = 'products';

// ── File operations ────────────────────────────────────────────────
export async function indexFile(file: AssetFile): Promise<void> {
    await setDoc(doc(db, FILES_COL, file.id), {
        ...file,
        createdAt: Timestamp.fromDate(file.createdAt),
        updatedAt: Timestamp.fromDate(file.updatedAt),
    });
}

export async function searchFiles(filters: SearchFilters): Promise<AssetFile[]> {
    const constraints: ReturnType<typeof where>[] = [];

    if (filters.type && filters.type !== 'all') {
        constraints.push(where('type', '==', filters.type));
    }
    if (filters.asin) {
        constraints.push(where('asin', '==', filters.asin));
    }
    if (filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
    }

    constraints.push(where('status', '==', 'active'));

    const q = query(
        collection(db, FILES_COL),
        ...constraints,
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
        const data = d.data();
        return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as AssetFile;
    });
}

export async function updateFileMeta(id: string, data: Partial<AssetFile>): Promise<void> {
    await updateDoc(doc(db, FILES_COL, id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteFileIndex(id: string): Promise<void> {
    await deleteDoc(doc(db, FILES_COL, id));
}

// ── Product operations ─────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
    const snapshot = await getDocs(collection(db, PRODUCTS_COL));
    return snapshot.docs.map((d) => {
        const data = d.data();
        return {
            ...data,
            asin: d.id,
            lastUpload: data.lastUpload?.toDate?.() || new Date(),
        } as Product;
    });
}

export async function addProduct(product: Product): Promise<void> {
    await setDoc(doc(db, PRODUCTS_COL, product.asin), {
        ...product,
        lastUpload: Timestamp.fromDate(product.lastUpload),
    });
}

export async function getFilesByFolder(folderId: string): Promise<AssetFile[]> {
    const q = query(
        collection(db, FILES_COL),
        where('driveFolderId', '==', folderId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
        const data = d.data();
        return {
            ...data,
            id: d.id,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as AssetFile;
    });
}
