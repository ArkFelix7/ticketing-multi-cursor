"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
import { auth } from '@/lib/firebase/config';
import { User } from '@/types/user';
import { Company } from '@/types/company';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  currentCompany: Company | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to clear error
  const clearError = useCallback(() => setError(null), []);

  // Fetch user and company data robustly
  const fetchUserData = useCallback(async (user: FirebaseUser) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const userResponse = await fetch(`/api/users/${user.uid}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserProfile(userData.user);
        if (userData.user?.company && userData.user.company.slug) {
          try {
            const companyController = new AbortController();
            const companyTimeoutId = setTimeout(() => companyController.abort(), 5000);
            const companyResponse = await fetch(`/api/companies/${userData.user.company.slug}`, {
              signal: companyController.signal,
              cache: 'no-store'
            });
            clearTimeout(companyTimeoutId);
            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              setCurrentCompany(companyData.company);
            } else {
              setCurrentCompany(null);
              setError(`Company not found for slug: ${userData.user.company.slug}`);
              if (companyResponse.status === 404) {
                console.warn(`Company with slug ${userData.user.company.slug} not found`);
              }
            }
          } catch (companyError: any) {
            setCurrentCompany(null);
            setError("Error fetching company data: " + (companyError?.message || companyError));
            console.error("Error fetching company data:", companyError);
          }
        } else {
          setCurrentCompany(null);
        }
      } else {
        setUserProfile(null);
        setCurrentCompany(null);
        if (userResponse.status === 404) {
          setError("User exists in Firebase but not in database. Please register.");
        } else {
          setError("Error fetching user data: " + (await userResponse.text()));
        }
      }
    } catch (error: any) {
      setUserProfile(null);
      setCurrentCompany(null);
      setError("Error fetching user data: " + (error?.message || error));
      console.error("Error fetching user data:", error);
    }
  }, []);

  // Auth state effect
  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(prev => {
        if (JSON.stringify(prev) === JSON.stringify(user)) return prev;
        return user;
      });
      if (user) {
        try {
          await fetchUserData(user);
        } catch (error: any) {
          setError("Error fetching user data: " + (error?.message || error));
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserProfile(null);
        setCurrentCompany(null);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });
    loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 3000);
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [fetchUserData]);

  // Auth functions
  async function signUp(email: string, password: string, displayName: string): Promise<void> {
    clearError();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      // User data will be created via API in the registration flow
    } catch (error: any) {
      setError("Error signing up: " + (error?.message || error));
      console.error("Error signing up:", error);
      throw error;
    }
  }

  async function signIn(email: string, password: string): Promise<FirebaseUser> {
    clearError();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Defensive: ensure user exists in DB, create if missing
      const userResponse = await fetch(`/api/users/${user.uid}`);
      if (userResponse.ok) {
        // User exists in DB, return user
        return user;
      } else if (userResponse.status === 404) {
        // User missing in DB, create it
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }),
        });
        if (!createResponse.ok) {
          throw new Error('Failed to create user profile in database.');
        }
        // User created in DB, return user
        return user;
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error: any) {
      setError("Error signing in: " + (error?.message || error));
      console.error("Error signing in:", error);
      throw error;
    }
  }

  async function signOut() {
    clearError();
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
      setCurrentCompany(null);
      setCurrentUser(null);
    } catch (error: any) {
      setError("Error signing out: " + (error?.message || error));
      console.error("Error signing out:", error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    clearError();
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError("Error resetting password: " + (error?.message || error));
      console.error("Error resetting password:", error);
      throw error;
    }
  }

  async function updateUserProfile(displayName: string, photoURL?: string) {
    clearError();
    try {
      if (!currentUser) throw new Error("No authenticated user");
      await updateProfile(currentUser, {
        displayName,
        photoURL: photoURL || currentUser.photoURL
      });
      if (userProfile) {
        const response = await fetch(`/api/users/${currentUser.uid}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName,
            photoURL: photoURL || userProfile.photoURL
          }),
        });
        if (response.ok) {
          const updatedUser = await response.json();
          setUserProfile(updatedUser.user);
        } else {
          throw new Error(`Failed to update user profile: ${await response.text()}`);
        }
      }
    } catch (error: any) {
      setError("Error updating profile: " + (error?.message || error));
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  async function updateUserEmail(email: string) {
    clearError();
    try {
      if (!currentUser) throw new Error("No authenticated user");
      await updateEmail(currentUser, email);
      if (userProfile) {
        const response = await fetch(`/api/users/${currentUser.uid}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        if (response.ok) {
          const updatedUser = await response.json();
          setUserProfile(updatedUser.user);
        } else {
          throw new Error(`Failed to update user email: ${await response.text()}`);
        }
      }
    } catch (error: any) {
      setError("Error updating email: " + (error?.message || error));
      console.error("Error updating email:", error);
      throw error;
    }
  }

  async function updateUserPassword(password: string) {
    clearError();
    try {
      if (!currentUser) throw new Error("No authenticated user");
      await updatePassword(currentUser, password);
    } catch (error: any) {
      setError("Error updating password: " + (error?.message || error));
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
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
      {isLoading && <div className="flex items-center justify-center min-h-screen">Loading...</div>}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg max-w-lg">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={clearError} className="ml-2 text-red-700 hover:underline font-bold">Dismiss</button>
          </div>
        </div>
      )}
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
