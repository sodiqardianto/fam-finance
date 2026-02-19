import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach Supabase JWT token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export interface DbUser {
  id: string;
  supabaseUid: string;
  name: string;
  email: string;
  familyId: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string | null;
  inviteExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: DbUser;
  family: Family;
  inviteCode?: string;
}

export interface UserStatusResponse {
  registered: boolean;
  hasFamily?: boolean;
  user?: DbUser;
}

export interface FamilySummaryResponse {
  familyBalance: number;
  myPrivateBalance: number;
  totalSavings: number;
}

export interface Transaction {
  id: string;
  familyId: string;
  userId: string;
  amount: string;
  source: string | null;
  category: string;
  description: string | null;
  type: 'income' | 'expense' | 'non_financial';
  fundSource: 'family' | 'private' | 'savings';
  date: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  familyId: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Public endpoints (no auth required)
export const authApi = {
  checkStatus: (email: string): Promise<UserStatusResponse> => 
    api.get(`/auth/status?email=${encodeURIComponent(email)}`),
  
  // Protected endpoints - require Supabase token
  register: async (name: string, email: string): Promise<AuthResponse> => {
    // Ensure we have a session before making the request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }
    return api.post('/auth/register', { name, email });
  },
  
  join: async (name: string, email: string, inviteCode: string): Promise<AuthResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }
    return api.post('/auth/join', { name, email, inviteCode });
  },
  
  getMe: (): Promise<{ user: DbUser }> => api.get('/auth/me'),
};

export const transactionsApi = {
  list: (cacheBust?: string): Promise<Transaction[]> => 
    api.get(`/transactions${cacheBust ? `?${cacheBust}` : ''}`),
  
  summary: (cacheBust?: string): Promise<FamilySummaryResponse> => 
    api.get(`/family/summary${cacheBust ? `?${cacheBust}` : ''}`),
  
  savingsGoals: {
    list: (cacheBust?: string): Promise<SavingsGoal[]> => 
      api.get(`/savings-goals${cacheBust ? `?${cacheBust}` : ''}`),
    create: (data: { name: string; targetAmount: number }): Promise<SavingsGoal> => 
      api.post('/savings-goals', data),
  },
  
  create: (data: {
    amount: number;
    source?: string;
    category: string;
    description?: string;
    type: 'income' | 'expense' | 'non_financial';
    fundSource: 'family' | 'private' | 'savings';
  }): Promise<Transaction> => api.post('/transactions', data),
};

export default api;
