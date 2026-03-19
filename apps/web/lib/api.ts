import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

// Types
export interface DbUser {
  id: string;
  externalId: string;
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
  type: "income" | "expense" | "non_financial";
  fundSource: "family" | "private" | "savings";
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

// Helpers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const session = await getSession();
  if (!session || !session.user) return {};

  const sessionUser = session.user as SessionUser;
  const subject = sessionUser.id ?? sessionUser.email;

  if (!subject) {
    return {};
  }

  const mockToken = btoa(
    JSON.stringify({
      sub: subject,
      email: sessionUser.email,
      name: sessionUser.name,
      picture: sessionUser.image,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    }),
  );

  return {
    Authorization: `Bearer ${mockToken}`,
    "Content-Type": "application/json",
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }
  return response.json();
}

// API Implementation
export const authApi = {
  checkStatus: async (email: string): Promise<UserStatusResponse> => {
    const response = await fetch(
      `${API_URL}/auth/status?email=${encodeURIComponent(email)}`,
    );
    return handleResponse<UserStatusResponse>(response);
  },

  register: async (name: string, email: string): Promise<AuthResponse> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, email }),
    });
    return handleResponse<AuthResponse>(response);
  },

  join: async (
    name: string,
    email: string,
    inviteCode: string,
  ): Promise<AuthResponse> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/auth/join`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, email, inviteCode }),
    });
    return handleResponse<AuthResponse>(response);
  },

  getMe: async (): Promise<{ user: DbUser }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/auth/me`, {
      headers,
    });
    return handleResponse<{ user: DbUser }>(response);
  },
};

export const transactionsApi = {
  list: async (): Promise<Transaction[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/transactions`, {
      headers,
    });
    return handleResponse<Transaction[]>(response);
  },

  create: async (data: {
    amount: number;
    source?: string;
    category: string;
    description?: string;
    type: "income" | "expense" | "non_financial";
    fundSource: "family" | "private" | "savings";
  }): Promise<Transaction> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Transaction>(response);
  },

  summary: async (): Promise<FamilySummaryResponse> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/family/summary`, {
      headers,
    });
    return handleResponse<FamilySummaryResponse>(response);
  },

  savingsGoals: {
    list: async (): Promise<SavingsGoal[]> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/savings-goals`, {
        headers,
      });
      return handleResponse<SavingsGoal[]>(response);
    },

    create: async (data: {
      name: string;
      targetAmount: number;
    }): Promise<SavingsGoal> => {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/savings-goals`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse<SavingsGoal>(response);
    },
  },
};

export const savingsApi = transactionsApi.savingsGoals;
