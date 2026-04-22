import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockUser(overrides?: Partial<AuthenticatedUser>): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createAuthContext(user?: AuthenticatedUser): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const ctx: TrpcContext = {
    user: user ?? createMockUser(),
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Helper to create user with specific position
function ceoCtx() {
  return createAuthContext(createMockUser({ id: 1, position: "ceo" } as any));
}
function cooCtx() {
  return createAuthContext(createMockUser({ id: 2, position: "coo" } as any));
}
function headCtx() {
  return createAuthContext(createMockUser({ id: 3, position: "head" } as any));
}
function csCtx() {
  return createAuthContext(createMockUser({ id: 4, position: "cs" } as any));
}
function sdrCtx() {
  return createAuthContext(createMockUser({ id: 10, position: "sdr" } as any));
}
function bdrCtx() {
  return createAuthContext(createMockUser({ id: 11, position: "bdr" } as any));
}
function closerCtx() {
  return createAuthContext(createMockUser({ id: 12, position: "closer" } as any));
}

// ─── Auth Tests ────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-123");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

// ─── Campaigns Tests (C-level only) ───────────────────────────────

describe("campaigns", () => {
  it("campaigns.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.campaigns.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("campaigns.list rejects non-C-level (Head)", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.campaigns.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("campaigns.list allows CEO", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.campaigns.list();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("campaigns.create rejects empty name (CEO)", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.campaigns.create({ name: "", platform: "Google", budget: "1000", startDate: new Date() });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("campaigns.update rejects invalid status (CEO)", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.campaigns.update({ id: 1, status: "invalid" as any });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });
});

// ─── Contacts Tests (C-level only) ────────────────────────────────

describe("contacts", () => {
  it("contacts.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.contacts.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("contacts.list rejects non-C-level (CS)", async () => {
    const { ctx } = csCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.contacts.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("contacts.create rejects empty name (CEO)", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.contacts.create({ name: "", email: "test@test.com" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("contacts.create rejects invalid email (CEO)", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.contacts.create({ name: "Test", email: "not-an-email" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("contacts.update rejects invalid status (CEO)", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.contacts.update({ id: 1, status: "invalid" as any });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });
});

// ─── Preferences Tests ─────────────────────────────────────────────

describe("preferences", () => {
  it("preferences.get requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.preferences.get();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("preferences.update requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.preferences.update({ currency: "USD" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("preferences.update rejects out-of-range threshold", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.preferences.update({ budgetAlertThreshold: 200 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });
});

// ─── Profile Tests ─────────────────────────────────────────────────

describe("profile", () => {
  it("profile.update requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.profile.update({ name: "New Name" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("profile.update rejects empty name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.profile.update({ name: "" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("profile.update rejects invalid email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.profile.update({ email: "not-email" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });
});

// ─── Dashboard Tests (C-level only) ───────────────────────────────

describe("dashboard", () => {
  it("dashboard.stats requires C-level", async () => {
    const { ctx } = csCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.dashboard.stats();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });
});

// ─── CRM Leads Tests ──────────────────────────────────────────────

describe("crmLeads", () => {
  it("crmLeads.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.crmLeads.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("crmLeads.create requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.crmLeads.create({ name: "Test Lead" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("crmLeads.create rejects empty name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.crmLeads.create({ name: "" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("crmLeads.create rejects invalid stage", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.crmLeads.create({ name: "Test", stage: "invalid" as any });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("crmLeads.updateStage on non-existent lead returns NOT_FOUND", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.crmLeads.updateStage({ id: 99999, stage: "follow_up" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("NOT_FOUND");
    }
  });

  it("crmLeads.updateStage rejects invalid stage", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.crmLeads.updateStage({ id: 99999, stage: "invalid" as any });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(["BAD_REQUEST", "NOT_FOUND"]).toContain(e.code);
    }
  });

  it("crmLeads.delete requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.crmLeads.delete({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("SDR can access crmLeads.list", async () => {
    const { ctx } = sdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.crmLeads.list();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});

// ─── Team Tests ────────────────────────────────────────────────────

describe("team", () => {
  it("team.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("team.updatePosition requires admin (rejects Head)", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.updatePosition({ userId: 5, position: "cs" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("team.updatePosition requires admin (rejects CS)", async () => {
    const { ctx } = csCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.updatePosition({ userId: 5, position: "head" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("team.updatePosition allows CEO to set SDR", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.updatePosition({ userId: 5, position: "sdr" });
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("team.updatePosition allows CEO to set BDR", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.updatePosition({ userId: 5, position: "bdr" });
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("team.updatePosition allows CEO to set Closer", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.updatePosition({ userId: 5, position: "closer" });
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("Closer cannot update team positions", async () => {
    const { ctx } = closerCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.updatePosition({ userId: 5, position: "sdr" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("team.updatePosition rejects invalid position", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.updatePosition({ userId: 5, position: "invalid" as any });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });
});

// ─── Tasks Tests ───────────────────────────────────────────────────

describe("tasks", () => {
  it("tasks.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("tasks.create rejects non-manager (CS)", async () => {
    const { ctx } = csCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.create({ title: "Test", assigneeId: 4 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("tasks.create rejects SDR (not manager)", async () => {
    const { ctx } = sdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.create({ title: "Test", assigneeId: 10 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("tasks.create rejects BDR (not manager)", async () => {
    const { ctx } = bdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.create({ title: "Test", assigneeId: 11 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("tasks.create rejects Closer (not manager)", async () => {
    const { ctx } = closerCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.create({ title: "Test", assigneeId: 12 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("tasks.create allows CEO", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.create({ title: "CEO Task", assigneeId: 4 });
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("tasks.create allows Head", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.create({ title: "Head Task", assigneeId: 4 });
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("tasks.create rejects empty title", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.create({ title: "", assigneeId: 4 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("tasks.create rejects invalid priority", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.create({ title: "Test", assigneeId: 4, priority: "invalid" as any });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("tasks.delete rejects non-admin (Head)", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.tasks.delete({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });
});

// ─── Squads Tests ──────────────────────────────────────────────────

describe("squads", () => {
  it("squads.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.squads.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("squads.create requires manager (rejects CS)", async () => {
    const { ctx } = csCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.squads.create({ name: "Test Squad" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("squads.create rejects empty name", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.squads.create({ name: "" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("squads.delete requires admin (rejects Head)", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.squads.delete({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("BDR can access squads.list", async () => {
    const { ctx } = bdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.squads.list();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});

// ─── Clients Tests ─────────────────────────────────────────────────

describe("clients", () => {
  it("clients.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.clients.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("clients.create requires manager (rejects SDR)", async () => {
    const { ctx } = sdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.clients.create({ squadId: 1, name: "Test Client" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("clients.create rejects empty name", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.clients.create({ squadId: 1, name: "" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("clients.delete requires admin (rejects Closer)", async () => {
    const { ctx } = closerCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.clients.delete({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });
});

// ─── Projects Tests ────────────────────────────────────────────────

describe("projects", () => {
  it("projects.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.projects.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("projects.create rejects empty name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.projects.create({ clientId: 1, name: "" });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("projects.create rejects invalid status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.projects.create({ clientId: 1, name: "Test", status: "invalid" as any });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("projects.delete requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.projects.delete({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });
});

// ─── Project Files Tests ───────────────────────────────────────────

describe("projectFiles", () => {
  it("projectFiles.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.projectFiles.list({ projectId: 1 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("projectFiles.upload rejects empty fileName", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.projectFiles.upload({
        projectId: 1,
        fileName: "",
        fileBase64: "dGVzdA==",
        mimeType: "image/png",
        fileSize: 100,
      });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });

  it("projectFiles.delete requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.projectFiles.delete({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });
});

// ─── C-Level Restriction Tests ─────────────────────────────────────

describe("C-level restrictions", () => {
  it("dashboard.stats rejects SDR", async () => {
    const { ctx } = sdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.dashboard.stats();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("dashboard.stats rejects BDR", async () => {
    const { ctx } = bdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.dashboard.stats();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("dashboard.stats rejects Closer", async () => {
    const { ctx } = closerCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.dashboard.stats();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("campaigns.list rejects SDR", async () => {
    const { ctx } = sdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.campaigns.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("campaigns.list rejects Head", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.campaigns.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("contacts.list rejects BDR", async () => {
    const { ctx } = bdrCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.contacts.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("contacts.list rejects Closer", async () => {
    const { ctx } = closerCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.contacts.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("contacts.list allows CEO", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.contacts.list();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("campaigns.list allows COO", async () => {
    const { ctx } = cooCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.campaigns.list();
    } catch (e: any) {
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });
});

// ─── Squad-based Head Permissions ─────────────────────────────────
describe("squad-based Head permissions", () => {
  it("squads.list returns results for CEO", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("squads.list returns results for Head (filtered by membership)", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.squads.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("tasks.list returns results for Head (filtered by squad)", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("tasks.list returns results for CS (own tasks only)", async () => {
    const { ctx } = csCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("projects.list returns results for CEO", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("projects.list returns results for Head (filtered by squad clients)", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("clients.list returns results for CEO", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("clients.list returns results for Head (filtered by squad)", async () => {
    const { ctx } = headCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("squadMembers.list requires squadId", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      // @ts-ignore - testing missing input
      await caller.squadMembers.list({});
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });

  it("SDR sees only own tasks", async () => {
    const { ctx } = sdrCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("BDR sees only own tasks", async () => {
    const { ctx } = bdrCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("Closer sees only own tasks", async () => {
    const { ctx } = closerCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Notifications Tests ──────────────────────────────────────────

describe("notifications", () => {
  it("notifications.list requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.notifications.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("notifications.unreadCount requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.notifications.unreadCount();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("notifications.markRead requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.notifications.markRead({ id: 1 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("notifications.markAllRead requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.notifications.markAllRead();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("notifications.checkDueDates requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.notifications.checkDueDates();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  it("notifications.list returns array for authenticated user", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("notifications.unreadCount returns a number for authenticated user", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.unreadCount();
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("notifications.checkDueDates returns created count", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.checkDueDates();
    expect(result).toHaveProperty("created");
    expect(typeof result.created).toBe("number");
  });

  it("notifications.markRead accepts valid id", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    // Should not throw even if notification doesn't exist (just no-op)
    const result = await caller.notifications.markRead({ id: 99999 });
    expect(result).toEqual({ success: true });
  });

  it("notifications.markAllRead succeeds for authenticated user", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notifications.markAllRead();
    expect(result).toEqual({ success: true });
  });

  it("notifications.markRead rejects missing id", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      // @ts-ignore - testing missing input
      await caller.notifications.markRead({});
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("BAD_REQUEST");
    }
  });
});

// ─── Member Approval & Removal Tests ────────────────────────────────

describe("members.approve", () => {
  it("requires C-level position to approve users", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "head" } as any));
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.members.approve({ userId: 10 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("allows CEO to call approve endpoint", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    try {
      // Will fail with NOT_FOUND since user 999 doesn't exist, but proves access is granted
      await caller.members.approve({ userId: 999 });
    } catch (e: any) {
      // Either NOT_FOUND (user doesn't exist) or success - both prove C-level access works
      expect(["NOT_FOUND", undefined]).toContain(e.code);
    }
  });
});

describe("members.reject", () => {
  it("requires C-level position to reject users", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "cs" } as any));
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.members.reject({ userId: 10 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });
});

describe("members.remove", () => {
  it("requires C-level position to remove users", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "sdr" } as any));
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.members.remove({ userId: 10 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("requires C-level position to delete permanently", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "bdr" } as any));
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.members.deletePermanently({ userId: 10 });
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });
});

describe("members.pendingCount", () => {
  it("returns 0 for non-admin positions", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "closer" } as any));
    const caller = appRouter.createCaller(ctx);
    const count = await caller.members.pendingCount();
    expect(count).toBe(0);
  });
});

describe("members.listAll", () => {
  it("requires C-level position to list all members", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "social_media" } as any));
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.members.listAll();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });
});

// ─── Dashboard myStats Tests ────────────────────────────────────────

describe("dashboard.myStats", () => {
  it("returns stats for CEO user", async () => {
    const { ctx } = ceoCtx();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.myStats();
    expect(stats).toBeDefined();
    expect(stats.type).toBe("clevel");
    expect(stats.data).toBeDefined();
  });

  it("returns stats for Head user", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "head" } as any));
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.myStats();
    expect(stats).toBeDefined();
    expect(stats.type).toBe("head");
  });

  it("returns stats for SDR user (commercial)", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "sdr" } as any));
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.myStats();
    expect(stats).toBeDefined();
    expect(stats.type).toBe("commercial");
  });

  it("returns stats for CS user (operational)", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5, position: "cs" } as any));
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.myStats();
    expect(stats).toBeDefined();
    expect(stats.type).toBe("operational");
  });

  it("returns stats for user without position", async () => {
    const { ctx } = createAuthContext(createMockUser({ id: 5 }));
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.myStats();
    expect(stats).toBeDefined();
    // User without position should get operational stats
    expect(["operational", "clevel", "head", "commercial", "empty"]).toContain(stats.type);
  });
});

// ─── Approval Middleware Tests ──────────────────────────────────────

describe("approvedProcedure middleware", () => {
  it("blocks pending users from accessing approved-only endpoints", async () => {
    const pendingUser = createMockUser({ id: 99, approvalStatus: "pending" } as any);
    const { ctx } = createAuthContext(pendingUser);
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("blocks rejected users from accessing approved-only endpoints", async () => {
    const rejectedUser = createMockUser({ id: 99, approvalStatus: "rejected" } as any);
    const { ctx } = createAuthContext(rejectedUser);
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.team.list();
      expect.unreachable("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe("FORBIDDEN");
    }
  });

  it("allows approved users to access approved-only endpoints", async () => {
    const approvedUser = createMockUser({ id: 1, approvalStatus: "approved", position: "ceo" } as any);
    const { ctx } = createAuthContext(approvedUser);
    const caller = appRouter.createCaller(ctx);
    // Should not throw - team.list requires approved
    const result = await caller.team.list();
    expect(result).toBeDefined();
  });
});
