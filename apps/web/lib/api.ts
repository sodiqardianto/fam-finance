import { supabase } from './supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Types matched with DB Schema (snake_case)
interface DbUserRow {
  id: string;
  supabase_uid: string;
  name: string;
  email: string;
  family_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface FamilyRow {
  id: string;
  name: string;
  invite_code: string | null;
  invite_expiry: string | null;
  created_at: string;
  updated_at: string;
}

interface TransactionRow {
  id: string;
  family_id: string;
  user_id: string;
  amount: number;
  source: string | null;
  category: string;
  description: string | null;
  type: 'income' | 'expense' | 'non_financial';
  fund_source: 'family' | 'private' | 'savings';
  date: string;
  created_at: string;
}

interface SavingsGoalRow {
  id: string;
  family_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Frontend Interfaces (camelCase)
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

// Mappers
const mapUser = (row: DbUserRow): DbUser => ({
  id: row.id,
  supabaseUid: row.supabase_uid,
  name: row.name,
  email: row.email,
  familyId: row.family_id,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapFamily = (row: FamilyRow): Family => ({
  id: row.id,
  name: row.name,
  inviteCode: row.invite_code,
  inviteExpiry: row.invite_expiry,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  familyId: row.family_id,
  userId: row.user_id,
  amount: String(row.amount),
  source: row.source,
  category: row.category,
  description: row.description,
  type: row.type,
  fundSource: row.fund_source,
  date: row.date,
  createdAt: row.created_at,
});

const mapSavingsGoal = (row: SavingsGoalRow): SavingsGoal => ({
  id: row.id,
  familyId: row.family_id,
  name: row.name,
  targetAmount: String(row.target_amount),
  currentAmount: String(row.current_amount),
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helpers
const getCurrentDbUser = async (): Promise<DbUserRow> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single();

  if (error || !data) throw new Error("User profile not found");
  return data as DbUserRow;
};

// API Implementation
export const authApi = {
  checkStatus: async (email: string): Promise<UserStatusResponse> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows found
      console.error("Error checking status:", error);
      throw error;
    }

    if (!data) {
      return { registered: false, hasFamily: false };
    }

    return {
      registered: true,
      hasFamily: !!data.family_id,
      user: mapUser(data as DbUserRow),
    };
  },

  register: async (name: string, email: string): Promise<AuthResponse> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error("Not authenticated");

    // 1. Create Family
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: `${name}'s Family`,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (familyError) throw familyError;

    // 2. Create User linked to Family
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        supabase_uid: authUser.id,
        name,
        email,
        family_id: family.id,
        avatar_url: authUser.user_metadata.avatar_url,
      })
      .select()
      .single();

    if (userError) throw userError;

    return {
      user: mapUser(user as DbUserRow),
      family: mapFamily(family as FamilyRow),
      inviteCode: family.invite_code!,
    };
  },

  join: async (name: string, email: string, inviteCode: string): Promise<AuthResponse> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error("Not authenticated");

    // 1. Find Family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (familyError || !family) throw new Error("Invalid invite code");

    // 2. Create User linked to Family
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        supabase_uid: authUser.id,
        name,
        email,
        family_id: family.id,
        avatar_url: authUser.user_metadata.avatar_url,
      })
      .select()
      .single();

    if (userError) throw userError;

    return {
      user: mapUser(user as DbUserRow),
      family: mapFamily(family as FamilyRow),
    };
  },

  getMe: async (): Promise<{ user: DbUser }> => {
    const dbUser = await getCurrentDbUser();
    return { user: mapUser(dbUser) };
  },
};

export const transactionsApi = {
  list: async (cacheBust?: string): Promise<Transaction[]> => {
    const user = await getCurrentDbUser();
    if (!user.family_id) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('family_id', user.family_id)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data as TransactionRow[]).map(mapTransaction);
  },

  create: async (data: {
    amount: number;
    source?: string;
    category: string;
    description?: string;
    type: 'income' | 'expense' | 'non_financial';
    fundSource: 'family' | 'private' | 'savings';
  }): Promise<Transaction> => {
    const user = await getCurrentDbUser();
    if (!user.family_id) throw new Error("No family associated");

    const { data: tx, error } = await supabase
      .from('transactions')
      .insert({
        family_id: user.family_id,
        user_id: user.id,
        amount: data.amount,
        source: data.source,
        category: data.category,
        description: data.description,
        type: data.type,
        fund_source: data.fundSource,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return mapTransaction(tx as TransactionRow);
  },

  summary: async (cacheBust?: string): Promise<FamilySummaryResponse> => {
    const user = await getCurrentDbUser();
    if (!user.family_id) return { familyBalance: 0, myPrivateBalance: 0, totalSavings: 0 };

    // Fetch all transactions for the family
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('family_id', user.family_id);

    // Fetch savings goals
    const { data: goals, error: goalsError } = await supabase
      .from('savings_goals')
      .select('current_amount')
      .eq('family_id', user.family_id);

    if (txError) throw txError;
    if (goalsError) throw goalsError;

    const transactions = (txs as TransactionRow[]);
    
    // Calculate Family Balance (fund_source = 'family')
    const familyBalance = transactions
      .filter(t => t.fund_source === 'family')
      .reduce((acc, t) => {
        const amt = Number(t.amount);
        return t.type === 'income' ? acc + amt : t.type === 'expense' ? acc - amt : acc;
      }, 0);

    // Calculate My Private Balance (fund_source = 'private' AND user_id = me)
    const myPrivateBalance = transactions
      .filter(t => t.fund_source === 'private' && t.user_id === user.id)
      .reduce((acc, t) => {
        const amt = Number(t.amount);
        return t.type === 'income' ? acc + amt : t.type === 'expense' ? acc - amt : acc;
      }, 0);

    // Calculate Total Savings
    const totalSavings = (goals as { current_amount: number }[]).reduce(
      (acc, g) => acc + Number(g.current_amount), 
      0
    );

    return { familyBalance, myPrivateBalance, totalSavings };
  },

  savingsGoals: {
    list: async (cacheBust?: string): Promise<SavingsGoal[]> => {
      const user = await getCurrentDbUser();
      if (!user.family_id) return [];

      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('family_id', user.family_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as SavingsGoalRow[]).map(mapSavingsGoal);
    },

    create: async (data: { name: string; targetAmount: number }): Promise<SavingsGoal> => {
      const user = await getCurrentDbUser();
      if (!user.family_id) throw new Error("No family associated");

      const { data: goal, error } = await supabase
        .from('savings_goals')
        .insert({
          family_id: user.family_id,
          name: data.name,
          target_amount: data.targetAmount,
          current_amount: 0,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return mapSavingsGoal(goal as SavingsGoalRow);
    },
  },
};

export const savingsApi = transactionsApi.savingsGoals;

export default supabase;
