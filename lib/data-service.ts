// Data access layer using Firebase for Auth and Prisma (Supabase) for Database via API Routes

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// User Authentication - Uses Firebase Auth
export async function createUserAccount(email: string, password: string, displayName: string) {
  try {
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(userCredential.user, { displayName });
    
    // Store user in database via API route
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create user profile');
    }
    
    return {
      firebaseUser: userCredential.user
    };
    
  } catch (error: any) {
    console.error('Error in createUserAccount:', error);
    throw error;
  }
}

// Company Creation - Uses API Route
export async function createCompany(ownerId: string, name: string, slug: string, supportEmail: string) {
  try {
    const response = await fetch('/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ownerId,
        name,
        slug,
        supportEmail,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create company');
    }
    
    const data = await response.json();
    return data.company;
  } catch (error: any) {
    console.error('Error in createCompany:', error);
    throw error;
  }
}

// Sign in user with email and password
export async function signInUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Get company details
export async function getCompanyBySlug(slug: string) {
  try {
    const response = await fetch(`/api/companies/${slug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch company');
    }
    const data = await response.json();
    return data.company;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}
