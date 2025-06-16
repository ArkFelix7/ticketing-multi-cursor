   export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  companyId: string;
  role: 'admin' | 'agent' | 'manager';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserInvite {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'manager';
  companyId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}