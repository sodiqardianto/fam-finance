ALTER TABLE "users" ADD COLUMN "supabase_uid" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_supabase_uid_unique" UNIQUE("supabase_uid");