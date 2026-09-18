'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, waitForPendingWrites } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingOut: boolean;
  signupSuccess: boolean;
  dismissSignupSuccess: () => void;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (displayName: string, e: string, p: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateSemesterConfig: (name: string, startDate: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingOut, setSigningOut] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    const loadingFallback = window.setTimeout(() => setLoading(false), 1500);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setSigningOut(false);
      // Never hold the whole application behind a networked profile read.
      setLoading(false);
      if (currentUser) {
        void (async () => {
          try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Pico',
              email: currentUser.email || '',
              avatarUrl: currentUser.photoURL || null,
              semesterConfig: {
                semesterName: 'August 2026',
                semesterStartDate: '2026-09-01',
              },
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setProfile(initialProfile);
          }

          } catch (err) {
            console.error('Error fetching user profile:', err);
          }
        })();
      } else {
        setProfile(null);
      }
    });

    return () => { window.clearTimeout(loadingFallback); unsubscribe(); };
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (displayName: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName });
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        displayName: displayName || 'Pico',
        email,
        avatarUrl: null,
        semesterConfig: {
          semesterName: 'August 2026',
          semesterStartDate: '2026-09-01',
        },
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setProfile(newProfile);
      setSignupSuccess(true);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    if (cred.user) {
      const userDocRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: cred.user.uid,
          displayName: cred.user.displayName || 'Pico',
          email: cred.user.email || '',
          avatarUrl: cred.user.photoURL || null,
          semesterConfig: {
            semesterName: 'August 2026',
            semesterStartDate: '2026-09-01',
          },
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOutUser = async () => {
    // Hide protected UI immediately while allowing locally accepted writes a brief chance to flush.
    setSigningOut(true);
    setProfile(null);
    try {
      await Promise.race([waitForPendingWrites(db), new Promise<void>((resolve) => window.setTimeout(resolve, 2000))]);
    } catch {
      // Sign-out must never leave the application in an in-between state.
    }
    await signOut(auth).catch((error) => {
      setSigningOut(false);
      throw error;
    });
  };

  const updateSemesterConfig = async (semesterName: string, semesterStartDate: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        semesterConfig: { semesterName, semesterStartDate },
      });
      setProfile((prev) =>
        prev
          ? { ...prev, semesterConfig: { semesterName, semesterStartDate } }
          : null
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signingOut,
        signupSuccess,
        dismissSignupSuccess: () => setSignupSuccess(false),
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPassword,
        signOutUser,
        updateSemesterConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
