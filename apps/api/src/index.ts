import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "./db";
import { families, users, transactions, savingsGoals } from "./db/schema";
import { eq, desc } from "drizzle-orm";
import {
  authMiddleware,
  getExternalId,
  getUserEmail,
  getUserName,
  getAvatarUrl,
} from "./middleware/auth";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3011",
      "http://localhost:3010",
      "http://localhost:3001",
      "http://localhost:3000",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

app.get("/", (c) => {
  return c.text("Fam Finance API - Local PostgreSQL");
});

app.get("/health", async (c) => {
  try {
    await db.execute("SELECT 1");
    return c.json({
      status: "ok",
      database: "connected",
      env: {
        nodeEnv: process.env.NODE_ENV || "development",
      },
    });
  } catch (error: any) {
    return c.json(
      {
        status: "error",
        database: "disconnected",
        message: error.message,
      },
      500,
    );
  }
});

// ============================================
// PUBLIC ENDPOINTS (No Auth Required)
// ============================================

// Check user status - public endpoint
app.get("/auth/status", async (c) => {
  const email = c.req.query("email");
  if (!email) return c.json({ error: "Email is required" }, 400);

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return c.json({ registered: false });
    }

    return c.json({
      registered: true,
      hasFamily: !!user.familyId,
      user,
    });
  } catch (error: any) {
    console.error("Database error in /auth/status:", error);
    return c.json(
      {
        error: "Failed to check status",
        message: error.message,
      },
      500,
    );
  }
});

// ============================================
// PROTECTED ENDPOINTS (Require Auth Token)
// ============================================

// Apply auth middleware to protected routes
app.use("/auth/register", authMiddleware);
app.use("/auth/join", authMiddleware);
app.use("/family/*", authMiddleware);
app.use("/transactions/*", authMiddleware);
app.use("/savings-goals/*", authMiddleware);

// Registration for the first partner
app.post("/auth/register", async (c) => {
  const externalId = getExternalId(c);
  const email = getUserEmail(c);
  const name = getUserName(c) || email?.split("@")[0] || "User";
  const avatarUrl = getAvatarUrl(c);

  if (!externalId || !email) {
    return c.json({ error: "Invalid authentication" }, 401);
  }

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.externalId, externalId));
    if (existingUser) {
      return c.json({ error: "User already registered" }, 400);
    }

    // 1. Create Family
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [newFamily] = await db
      .insert(families)
      .values({
        name: `${name}'s Family`,
        inviteCode,
        inviteExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .returning();

    // 2. Create User
    const [newUser] = await db
      .insert(users)
      .values({
        externalId,
        name,
        email,
        familyId: newFamily.id,
        avatarUrl,
      })
      .returning();

    return c.json({
      user: newUser,
      family: newFamily,
      inviteCode,
    });
  } catch (error: any) {
    console.error(error);
    return c.json(
      { error: "Registration failed", message: error.message },
      500,
    );
  }
});

// Join family using invite code
app.post("/auth/join", async (c) => {
  const externalId = getExternalId(c);
  const email = getUserEmail(c);
  const name = getUserName(c) || email?.split("@")[0] || "User";
  const avatarUrl = getAvatarUrl(c);

  if (!externalId || !email) {
    return c.json({ error: "Invalid authentication" }, 401);
  }

  const { inviteCode } = await c.req.json();
  if (!inviteCode) {
    return c.json({ error: "Invite code is required" }, 400);
  }

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.externalId, externalId));
    if (existingUser) {
      return c.json({ error: "User already registered" }, 400);
    }

    // 1. Find Family by invite code
    const [family] = await db
      .select()
      .from(families)
      .where(eq(families.inviteCode, inviteCode));

    if (!family) {
      return c.json({ error: "Invalid invite code" }, 400);
    }

    if (family.inviteExpiry && family.inviteExpiry < new Date()) {
      return c.json({ error: "Invite code expired" }, 400);
    }

    // 2. Create User linked to family
    const [newUser] = await db
      .insert(users)
      .values({
        externalId,
        name,
        email,
        familyId: family.id,
        avatarUrl,
      })
      .returning();

    return c.json({
      user: newUser,
      family,
    });
  } catch (error: any) {
    console.error(error);
    return c.json({ error: "Join failed", message: error.message }, 500);
  }
});

// Get current user info (protected)
app.get("/auth/me", authMiddleware, async (c) => {
  const externalId = getExternalId(c);

  if (!externalId) {
    return c.json({ error: "Invalid authentication" }, 401);
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.externalId, externalId));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user });
  } catch (error: any) {
    console.error(error);
    return c.json(
      { error: "Failed to fetch user", message: error.message },
      500,
    );
  }
});

// --- DASHBOARD & SUMMARY ENDPOINTS ---

app.get("/family/summary", async (c) => {
  const externalId = getExternalId(c);
  if (!externalId) return c.json({ error: "Unauthorized" }, 401);

  try {
    // Get user from local DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.externalId, externalId));
    if (!user || !user.familyId) {
      return c.json({ error: "User or family not found" }, 404);
    }

    const allTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.familyId, user.familyId));

    let familyBalance = 0;
    let myPrivateBalance = 0;
    let totalSavings = 0;

    allTransactions.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === "non_financial") {
        familyBalance += amt; // Non-financial counts towards family contribution
      } else if (t.fundSource === "family") {
        if (t.type === "income") familyBalance += amt;
        if (t.type === "expense") familyBalance -= amt;
      } else if (t.fundSource === "private" && t.userId === user.id) {
        if (t.type === "income") myPrivateBalance += amt;
        if (t.type === "expense") myPrivateBalance -= amt;
      } else if (t.fundSource === "savings") {
        if (t.type === "income") totalSavings += amt;
        if (t.type === "expense") totalSavings -= amt;
      }
    });

    return c.json({
      familyBalance,
      myPrivateBalance,
      totalSavings,
    });
  } catch (error: any) {
    console.error("Database error in /family/summary:", error);
    return c.json(
      {
        error: "Failed to fetch summary",
        message: error.message,
      },
      500,
    );
  }
});

app.get("/savings-goals", async (c) => {
  const externalId = getExternalId(c);
  if (!externalId) return c.json({ error: "Unauthorized" }, 401);

  try {
    // Get user from local DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.externalId, externalId));
    if (!user || !user.familyId) {
      return c.json({ error: "User or family not found" }, 404);
    }

    const data = await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.familyId, user.familyId));
    return c.json(data);
  } catch (error: any) {
    console.error("Database error in GET /savings-goals:", error);
    return c.json(
      {
        error: "Failed to fetch savings goals",
        message: error.message,
      },
      500,
    );
  }
});

app.post("/savings-goals", async (c) => {
  const externalId = getExternalId(c);
  if (!externalId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const { name, targetAmount } = body;

  if (!name || !targetAmount) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    // Get user from local DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.externalId, externalId));
    if (!user || !user.familyId) {
      return c.json({ error: "User or family not found" }, 404);
    }

    const [newGoal] = await db
      .insert(savingsGoals)
      .values({
        familyId: user.familyId,
        name,
        targetAmount: targetAmount.toString(),
        currentAmount: "0",
        status: "active",
      })
      .returning();

    return c.json(newGoal);
  } catch (error: any) {
    console.error("Database error in POST /savings-goals:", error);
    return c.json(
      { error: "Failed to create savings goal", message: error.message },
      500,
    );
  }
});

// --- TRANSACTION ENDPOINTS ---

// Get family transactions
app.get("/transactions", async (c) => {
  const externalId = getExternalId(c);
  if (!externalId) return c.json({ error: "Unauthorized" }, 401);

  try {
    // Get user from local DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.externalId, externalId));
    if (!user || !user.familyId) {
      return c.json({ error: "User or family not found" }, 404);
    }

    const data = await db
      .select()
      .from(transactions)
      .where(eq(transactions.familyId, user.familyId))
      .orderBy(desc(transactions.date));

    return c.json(data);
  } catch (error: any) {
    console.error("Database error in GET /transactions:", error);
    return c.json(
      { error: "Failed to fetch transactions", message: error.message },
      500,
    );
  }
});

// Create transaction
app.post("/transactions", async (c) => {
  const externalId = getExternalId(c);
  if (!externalId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const { amount, source, category, description, type, fundSource } = body;

  if (!amount || !category || !type || !fundSource) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    // Get user from local DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.externalId, externalId));
    if (!user || !user.familyId) {
      return c.json({ error: "User or family not found" }, 404);
    }

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        familyId: user.familyId,
        userId: user.id,
        amount: amount.toString(),
        source,
        category,
        description,
        type,
        fundSource,
      })
      .returning();

    return c.json(newTransaction);
  } catch (error: any) {
    console.error("Database error in POST /transactions:", error);
    return c.json(
      {
        error: "Failed to create transaction",
        message: error.message,
      },
      500,
    );
  }
});

export default app;
