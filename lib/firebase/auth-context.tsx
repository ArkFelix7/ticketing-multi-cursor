"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '@/types/user';
import { Company } from '@/types/company';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  currentCompany: Company | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchUserData(user: FirebaseUser) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUserProfile(userData);
        
        // Fetch company data
        const companyDocRef = doc(db, 'companies', userData.companyId);
        const companyDoc = await getDoc(companyDocRef);
        
        if (companyDoc.exists()) {
          setCurrentCompany(companyDoc.data() as Company);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserData(user);
      } else {
        setUserProfile(null);
        setCurrentCompany(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auth functions
  async function signUp(email: string, password: string, displayName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(userCredential.user, {
        displayName
      });
      
      // Default user is created with no company - company registration is a separate flow
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  }

  async function signIn(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  async function updateUserProfile(displayName: string, photoURL?: string) {
    try {
      if (!currentUser) throw new Error("No authenticated user");
      
      await updateProfile(currentUser, {
        displayName,
        photoURL: photoURL || currentUser.photoURL
      });
      
      // Update in Firestore
      if (userProfile) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          ...userProfile,
          displayName,
          photoURL: photoURL || userProfile.photoURL
        }, { merge: true });
        
        // Update local state
        setUserProfile({
          ...userProfile,
          displayName,
          photoURL: photoURL || userProfile.photoURL
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  async function updateUserEmail(email: string) {
    try {
      if (!currentUser) throw new Error("No authenticated user");
      
      await updateEmail(currentUser, email);
      
      // Update in Firestore
      if (userProfile) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          ...userProfile,
          email
        }, { merge: true });
        
        // Update local state
        setUserProfile({
          ...userProfile,
          email
        });
      }
    } catch (error) {
      console.error("Error updating email:", error);
      throw error;
    }
  }

  async function updateUserPassword(password: string) {
    try {
      if (!currentUser) throw new Error("No authenticated user");
      await updatePassword(currentUser, password);
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  }

  const value = {
    currentUser,
    userProfile,
    currentCompany,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
