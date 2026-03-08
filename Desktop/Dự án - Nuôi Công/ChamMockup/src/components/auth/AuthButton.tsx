'use client';

import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAppStore } from '@/stores/useAppStore';
import { LogIn, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

export default function AuthButton() {
    const { user, setUser } = useAppStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                });
            } else {
                setUser({ uid: null, email: null, photoURL: null });
            }
        });

        return () => unsubscribe();
    }, [setUser]);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (user.uid) {
        return (
            <div className="flex items-center gap-3 pr-2">
                <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                        {user.email}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                        Pro Plan
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="group relative flex items-center gap-2 p-1 pl-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900 transition-all"
                >
                    {user.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.photoURL}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                    )}
                    <div className="pr-2">
                        <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                    </div>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98]"
        >
            <LogIn className="w-4 h-4" />
            Đăng nhập
        </button>
    );
}
