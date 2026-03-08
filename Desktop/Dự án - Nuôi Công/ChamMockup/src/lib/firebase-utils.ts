import { storage, db } from './firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { GeneratedMockup } from '@/types';

export async function uploadMockupImage(uid: string, mockupId: string, base64: string): Promise<string> {
    const storageRef = ref(storage, `mockups/${uid}/${mockupId}.png`);
    // uploadString handles data:image/png;base64,... format
    await uploadString(storageRef, base64, 'data_url');
    return getDownloadURL(storageRef);
}

export async function saveMockupToFirestore(uid: string, mockup: GeneratedMockup) {
    const mockupsRef = collection(db, 'users', uid, 'mockups');
    // Avoid saving large base64 strings to Firestore metadata
    const { ...meta } = mockup;

    await addDoc(mockupsRef, {
        ...meta,
        userId: uid,
        serverTimestamp: Timestamp.now(),
    });
}

export async function getUserMockups(uid: string): Promise<GeneratedMockup[]> {
    const mockupsRef = collection(db, 'users', uid, 'mockups');
    const q = query(mockupsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        firebaseId: doc.id, // record firestore id for future deletes
    } as GeneratedMockup));
}

export async function deleteUserMockup(uid: string, firebaseId: string) {
    const docRef = doc(db, 'users', uid, 'mockups', firebaseId);
    await deleteDoc(docRef);
}

export async function toggleUserFavorite(uid: string, firebaseId: string, isFavorite: boolean) {
    const docRef = doc(db, 'users', uid, 'mockups', firebaseId);
    await updateDoc(docRef, { isFavorite });
}
