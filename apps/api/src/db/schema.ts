import { pgTable, uuid, text, timestamp, numeric, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense', 'non_financial']);
export const fundSourceEnum = pgEnum('fund_source', ['family', 'private', 'savings']);
export const agreementStatusEnum = pgEnum('agreement_status', ['pending', 'agreed', 'rejected']);
export const agreementTypeEnum = pgEnum('agreement_type', ['allocation', 'big_expense', 'savings_goal']);

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').unique(),
  inviteExpiry: timestamp('invite_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  supabaseUid: text('supabase_uid').notNull().unique(), // Link ke Supabase Auth
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  familyId: uuid('family_id').references(() => families.id),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: numeric('amount', { precision: 20, scale: 2 }).notNull(),
  source: text('source'), // e.g., "Gaji", "Hadiah", "Masak"
  date: timestamp('date').defaultNow().notNull(),
  category: text('category').notNull(),
  description: text('description'),
  type: transactionTypeEnum('type').notNull(),
  fundSource: fundSourceEnum('fund_source').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savingsGoals = pgTable('savings_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  name: text('name').notNull(),
  targetAmount: numeric('target_amount', { precision: 20, scale: 2 }).notNull(),
  currentAmount: numeric('current_amount', { precision: 20, scale: 2 }).default('0').notNull(),
  status: text('status').default('active').notNull(), // active, achieved
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const agreements = pgTable('agreements', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  type: agreementTypeEnum('type').notNull(),
  status: agreementStatusEnum('status').default('pending').notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  confirmedBy: uuid('confirmed_by').references(() => users.id),
  metadata: jsonb('metadata'), // stores details like allocation percentages or expense details
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
