import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { UserProfile } from '../types';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

export async function signInWithGoogle(): Promise<UserProfile> {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;

    return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        accessToken: credential?.accessToken || '',
    };
}

export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}
