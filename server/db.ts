import { and, desc, eq, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, User,
  campaigns, InsertCampaign, Campaign,
  contacts, InsertContact, Contact,
  userPreferences, InsertUserPreference,
  crmLeads, InsertCrmLead, CrmLead,
  tasks, InsertTask, Task,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    // Auto-approve owner, keep pending for others on first insert
    if (user.openId === ENV.ownerOpenId) {
      values.approvalStatus = 'approved';
      updateSet.approvalStatus = 'approved';
      values.position = 'ceo';
      updateSet.position = 'ceo';
    }
    if (!values.lastSignedIn) { values.lastSignedIn = new Date(); }
    if (Object.keys(updateSet).length === 0) { updateSet.lastSignedIn = new Date(); }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ─── Campaigns ───────────────────────────────────────────────────────

export async function getCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId))).limit(1);
  return result[0];
}

export async function createCampaign(data: Omit<InsertCampaign, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(campaigns).values(data);
  return result[0].insertId;
}

export async function updateCampaign(id: number, userId: number, data: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(campaigns).set(data).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
}

export async function deleteCampaign(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
}

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalLeads: 0, totalConversions: 0, totalSpent: 0, totalBudget: 0, campaignCount: 0 };
  const result = await db.select({
    totalRevenue: sql<string>`COALESCE(SUM(revenue), 0)`,
    totalLeads: sql<number>`COALESCE(SUM(leads), 0)`,
    totalConversions: sql<number>`COALESCE(SUM(conversions), 0)`,
    totalSpent: sql<string>`COALESCE(SUM(spent), 0)`,
    totalBudget: sql<string>`COALESCE(SUM(budget), 0)`,
    campaignCount: sql<number>`COUNT(*)`,
  }).from(campaigns).where(eq(campaigns.userId, userId));
  return result[0];
}

// ─── Contacts ────────────────────────────────────────────────────────

export async function getContacts(userId: number, opts?: { search?: string; status?: string; sortBy?: string; sortDir?: "asc" | "desc" }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(contacts.userId, userId)];
  if (opts?.search) {
    conditions.push(like(contacts.name, `%${opts.search}%`));
  }
  if (opts?.status && opts.status !== "all") {
    conditions.push(eq(contacts.status, opts.status as any));
  }
  const orderCol = opts?.sortBy === "name" ? contacts.name
    : opts?.sortBy === "email" ? contacts.email
    : opts?.sortBy === "company" ? contacts.company
    : opts?.sortBy === "status" ? contacts.status
    : contacts.createdAt;
  const orderDir = opts?.sortDir === "asc" ? sql`${orderCol} ASC` : sql`${orderCol} DESC`;
  return db.select().from(contacts).where(and(...conditions)).orderBy(orderDir);
}

export async function getContactById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId))).limit(1);
  return result[0];
}

export async function createContact(data: Omit<InsertContact, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contacts).values(data);
  return result[0].insertId;
}

export async function updateContact(id: number, userId: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contacts).set(data).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
}

export async function deleteContact(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
}

// ─── User Preferences ───────────────────────────────────────────────

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  const defaults = { currency: "BRL", language: "pt-BR", budgetAlertThreshold: 80 };
  if (!db) return defaults;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0] ?? defaults;
}

export async function upsertUserPreferences(userId: number, data: Partial<InsertUserPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserPreferences(userId);
  if (existing) {
    await db.update(userPreferences).set(data).where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({ userId, ...data });
  }
}

// ─── CRM Leads (Kanban) ────────────────────────────────────────────

export async function getCrmLeads(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(crmLeads).where(eq(crmLeads.userId, userId)).orderBy(crmLeads.position);
}

export async function getCrmLeadById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(crmLeads).where(and(eq(crmLeads.id, id), eq(crmLeads.userId, userId))).limit(1);
  return result[0];
}

export async function createCrmLead(data: Omit<InsertCrmLead, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(crmLeads).values(data);
  return result[0].insertId;
}

export async function updateCrmLead(id: number, userId: number, data: Partial<InsertCrmLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(crmLeads).set(data).where(and(eq(crmLeads.id, id), eq(crmLeads.userId, userId)));
}

export async function deleteCrmLead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(crmLeads).where(and(eq(crmLeads.id, id), eq(crmLeads.userId, userId)));
}

export async function updateCrmLeadStage(id: number, userId: number, stage: string, position: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(crmLeads).set({ stage: stage as any, position }).where(and(eq(crmLeads.id, id), eq(crmLeads.userId, userId)));
}

// ─── Team (Users with positions) ──────────────────────────────────

export async function getAllTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    position: users.position,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(users.createdAt);
}

export async function updateUserPosition(userId: number, position: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ position: position as any }).where(eq(users.id, userId));
}

// ─── Tasks (Demandas) ─────────────────────────────────────────────

export async function getTasks(opts: { assigneeId?: number; createdById?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts.assigneeId) conditions.push(eq(tasks.assigneeId, opts.assigneeId));
  if (opts.createdById) conditions.push(eq(tasks.createdById, opts.createdById));
  if (conditions.length === 0) {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }
  return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
}

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function createTask(data: Omit<InsertTask, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result[0].insertId;
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Squads ─────────────────────────────────────────────────────────

import {
  squads, InsertSquad,
  clients, InsertClient,
  projects, InsertProject,
  projectFiles, InsertProjectFile,
  squadMembers, InsertSquadMember,
} from "../drizzle/schema";

export async function getSquads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(squads).orderBy(squads.name);
}

export async function getSquadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(squads).where(eq(squads.id, id)).limit(1);
  return result[0];
}

export async function createSquad(data: Omit<InsertSquad, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(squads).values(data);
  return result[0].insertId;
}

export async function updateSquad(id: number, data: Partial<InsertSquad>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(squads).set(data).where(eq(squads.id, id));
}

export async function deleteSquad(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(squads).where(eq(squads.id, id));
}

// ─── Clients ────────────────────────────────────────────────────────

export async function getClientsBySquad(squadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.squadId, squadId)).orderBy(clients.name);
}

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).orderBy(clients.name);
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function createClient(data: Omit<InsertClient, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(data);
  return result[0].insertId;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

// ─── Projects ───────────────────────────────────────────────────────

export async function getProjectsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function createProject(data: Omit<InsertProject, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result[0].insertId;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
}

// ─── Project Files ──────────────────────────────────────────────────

export async function getProjectFiles(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId)).orderBy(desc(projectFiles.createdAt));
}

export async function createProjectFile(data: Omit<InsertProjectFile, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectFiles).values(data);
  return result[0].insertId;
}

export async function deleteProjectFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectFiles).where(eq(projectFiles.id, id));
}

// ─── Squad Members ───────────────────────────────────────────────────────

export async function getSquadMembers(squadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: squadMembers.id,
    squadId: squadMembers.squadId,
    userId: squadMembers.userId,
    role: squadMembers.role,
    createdAt: squadMembers.createdAt,
    userName: users.name,
    userEmail: users.email,
    userPosition: users.position,
  })
    .from(squadMembers)
    .innerJoin(users, eq(squadMembers.userId, users.id))
    .where(eq(squadMembers.squadId, squadId));
}

export async function addSquadMember(data: Omit<InsertSquadMember, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if already a member
  const existing = await db.select().from(squadMembers)
    .where(and(eq(squadMembers.squadId, data.squadId), eq(squadMembers.userId, data.userId)))
    .limit(1);
  if (existing.length > 0) {
    // Update role if already exists
    await db.update(squadMembers).set({ role: data.role }).where(eq(squadMembers.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(squadMembers).values(data);
  return result[0].insertId;
}

export async function removeSquadMember(squadId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(squadMembers).where(and(eq(squadMembers.squadId, squadId), eq(squadMembers.userId, userId)));
}

export async function getUserSquadIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ squadId: squadMembers.squadId })
    .from(squadMembers)
    .where(eq(squadMembers.userId, userId));
  return rows.map(r => r.squadId);
}

export async function getSquadsByIds(ids: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (ids.length === 0) return [];
  const { inArray } = await import("drizzle-orm");
  return db.select().from(squads).where(inArray(squads.id, ids)).orderBy(squads.name);
}

export async function getClientsBySquadIds(squadIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (squadIds.length === 0) return [];
  const { inArray } = await import("drizzle-orm");
  return db.select().from(clients).where(inArray(clients.squadId, squadIds)).orderBy(clients.name);
}

export async function getProjectsByClientIds(clientIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (clientIds.length === 0) return [];
  const { inArray } = await import("drizzle-orm");
  return db.select().from(projects).where(inArray(projects.clientId, clientIds)).orderBy(desc(projects.createdAt));
}

export async function getTasksByAssigneeIds(assigneeIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (assigneeIds.length === 0) return [];
  const { inArray } = await import("drizzle-orm");
  return db.select().from(tasks).where(inArray(tasks.assigneeId, assigneeIds)).orderBy(desc(tasks.createdAt));
}

export async function getSquadMemberUserIds(squadIds: number[]): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  if (squadIds.length === 0) return [];
  const { inArray } = await import("drizzle-orm");
  const rows = await db.select({ userId: squadMembers.userId })
    .from(squadMembers)
    .where(inArray(squadMembers.squadId, squadIds));
  return Array.from(new Set(rows.map(r => r.userId)));
}

// ─── Notifications ──────────────────────────────────────────────────

import { notifications, InsertNotification } from "../drizzle/schema";

export async function getNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
  return result[0]?.count ?? 0;
}

export async function createNotification(data: Omit<InsertNotification, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: 1 })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: 1 })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
}

/**
 * Check tasks due within the next 24 hours or already overdue,
 * and create notifications for assignees if not already notified.
 */
export async function generateDueDateNotifications() {
  const db = await getDb();
  if (!db) return { created: 0 };

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Get all tasks with due dates that are not done
  const allTasks = await db.select().from(tasks)
    .where(and(
      sql`${tasks.dueDate} IS NOT NULL`,
      sql`${tasks.status} != 'done'`
    ));

  let created = 0;

  for (const task of allTasks) {
    if (!task.dueDate) continue;
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < now;
    const isDueSoon = !isOverdue && dueDate <= in24h;

    if (!isOverdue && !isDueSoon) continue;

    const type = isOverdue ? "task_overdue" : "task_due_soon";

    // Check if we already sent this type of notification for this task today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, task.assigneeId),
        eq(notifications.taskId, task.id),
        eq(notifications.type, type),
        sql`${notifications.createdAt} >= ${today}`
      ))
      .limit(1);

    if (existing.length > 0) continue;

    const title = isOverdue
      ? `Tarefa vencida: ${task.title}`
      : `Tarefa vence em breve: ${task.title}`;
    const message = isOverdue
      ? `A tarefa "${task.title}" venceu em ${dueDate.toLocaleDateString("pt-BR")}.`
      : `A tarefa "${task.title}" vence em ${dueDate.toLocaleDateString("pt-BR")} às ${dueDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`;

    await db.insert(notifications).values({
      userId: task.assigneeId,
      type,
      title,
      message,
      taskId: task.id,
      isRead: 0,
    });
    created++;
  }

  return { created };
}

// ─── Dashboard por Cargo ────────────────────────────────────────────

export async function getMyDashboardStats(userId: number, position: string) {
  const db = await getDb();
  if (!db) return { type: "empty" as const, data: {} };

  const adminPositions = ["ceo", "coo"];
  const commercialPositions = ["sdr", "bdr", "closer"];

  // CEO/COO: global metrics
  if (adminPositions.includes(position)) {
    const campaignStats = await db.select({
      totalRevenue: sql<string>`COALESCE(SUM(revenue), 0)`,
      totalLeads: sql<number>`COALESCE(SUM(leads), 0)`,
      totalConversions: sql<number>`COALESCE(SUM(conversions), 0)`,
      totalSpent: sql<string>`COALESCE(SUM(spent), 0)`,
      totalBudget: sql<string>`COALESCE(SUM(budget), 0)`,
      activeCampaigns: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
      totalCampaigns: sql<number>`COUNT(*)`,
    }).from(campaigns);

    const teamCount = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    const squadCount = await db.select({ count: sql<number>`COUNT(*)` }).from(squads);
    const clientCount = await db.select({ count: sql<number>`COUNT(*)` }).from(clients);

    const allTaskStats = await db.select({
      total: sql<number>`COUNT(*)`,
      pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
      done: sql<number>`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`,
      overdue: sql<number>`SUM(CASE WHEN status != 'done' AND dueDate IS NOT NULL AND dueDate < NOW() THEN 1 ELSE 0 END)`,
    }).from(tasks);

    const totalMrr = await db.select({
      totalMrr: sql<string>`COALESCE(SUM(mrrMonthly), 0)`,
    }).from(squads);

    return {
      type: "clevel" as const,
      data: {
        ...campaignStats[0],
        teamCount: teamCount[0]?.count ?? 0,
        squadCount: squadCount[0]?.count ?? 0,
        clientCount: clientCount[0]?.count ?? 0,
        totalMrr: totalMrr[0]?.totalMrr ?? "0",
        tasks: allTaskStats[0] ?? { total: 0, pending: 0, inProgress: 0, done: 0, overdue: 0 },
      },
    };
  }

  // Head: squad-level metrics
  if (position === "head") {
    const squadIds = await getUserSquadIds(userId);
    let squadMrr = "0";
    let squadClientCount = 0;
    let squadMemberCount = 0;
    let squadNames: string[] = [];

    if (squadIds.length > 0) {
      const { inArray } = await import("drizzle-orm");
      const mySquads = await db.select().from(squads).where(inArray(squads.id, squadIds));
      squadNames = mySquads.map(s => s.name);
      squadMrr = mySquads.reduce((sum, s) => sum + parseFloat(String(s.mrrMonthly ?? 0)), 0).toFixed(2);

      const squadClients = await db.select({ count: sql<number>`COUNT(*)` })
        .from(clients).where(inArray(clients.squadId, squadIds));
      squadClientCount = squadClients[0]?.count ?? 0;

      const members = await db.select({ count: sql<number>`COUNT(DISTINCT userId)` })
        .from(squadMembers).where(inArray(squadMembers.squadId, squadIds));
      squadMemberCount = members[0]?.count ?? 0;
    }

    // Tasks from squad members
    const memberIds = squadIds.length > 0 ? await getSquadMemberUserIds(squadIds) : [];
    let taskStats = { total: 0, pending: 0, inProgress: 0, done: 0, overdue: 0 };
    if (memberIds.length > 0) {
      const { inArray } = await import("drizzle-orm");
      const ts = await db.select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
        inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
        done: sql<number>`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`,
        overdue: sql<number>`SUM(CASE WHEN status != 'done' AND dueDate IS NOT NULL AND dueDate < NOW() THEN 1 ELSE 0 END)`,
      }).from(tasks).where(inArray(tasks.assigneeId, memberIds));
      taskStats = ts[0] as any ?? taskStats;
    }

    return {
      type: "head" as const,
      data: {
        squadNames,
        squadCount: squadIds.length,
        squadMrr,
        clientCount: squadClientCount,
        memberCount: squadMemberCount,
        tasks: taskStats,
      },
    };
  }

  // Commercial roles (SDR, BDR, Closer): CRM pipeline metrics
  if (commercialPositions.includes(position)) {
    const myLeads = await db.select().from(crmLeads).where(eq(crmLeads.userId, userId));
    const leadFrio = myLeads.filter(l => l.stage === "lead_frio").length;
    const followUp = myLeads.filter(l => l.stage === "follow_up").length;
    const reuniaoMarcada = myLeads.filter(l => l.stage === "reuniao_marcada").length;
    const totalValue = myLeads.reduce((sum, l) => sum + parseFloat(String(l.value ?? 0)), 0);

    const myTasks = await db.select({
      total: sql<number>`COUNT(*)`,
      pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
      done: sql<number>`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`,
      overdue: sql<number>`SUM(CASE WHEN status != 'done' AND dueDate IS NOT NULL AND dueDate < NOW() THEN 1 ELSE 0 END)`,
    }).from(tasks).where(eq(tasks.assigneeId, userId));

    return {
      type: "commercial" as const,
      data: {
        totalLeads: myLeads.length,
        leadFrio,
        followUp,
        reuniaoMarcada,
        totalValue: totalValue.toFixed(2),
        tasks: myTasks[0] ?? { total: 0, pending: 0, inProgress: 0, done: 0, overdue: 0 },
      },
    };
  }

  // Operational roles (CS, Gestor de Tráfego, Social Media): task-focused metrics
  const myTasks = await db.select({
    total: sql<number>`COUNT(*)`,
    pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    inProgress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)`,
    done: sql<number>`SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END)`,
    overdue: sql<number>`SUM(CASE WHEN status != 'done' AND dueDate IS NOT NULL AND dueDate < NOW() THEN 1 ELSE 0 END)`,
  }).from(tasks).where(eq(tasks.assigneeId, userId));

  const myNotifs = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));

  return {
    type: "operational" as const,
    data: {
      tasks: myTasks[0] ?? { total: 0, pending: 0, inProgress: 0, done: 0, overdue: 0 },
      unreadNotifications: myNotifs[0]?.count ?? 0,
    },
  };
}

// ─── Approval & Member Management ───────────────────────────────────

export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.approvalStatus, "pending")).orderBy(desc(users.createdAt));
}

export async function getAllUsersWithStatus() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    position: users.position,
    role: users.role,
    approvalStatus: users.approvalStatus,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt));
}

export async function approveUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ approvalStatus: "approved" }).where(eq(users.id, userId));
}

export async function rejectUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ approvalStatus: "rejected" }).where(eq(users.id, userId));
}

export async function removeUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Remove from squad members first
  await db.delete(squadMembers).where(eq(squadMembers.userId, userId));
  // Set approval to rejected (soft-remove, keeps data)
  await db.update(users).set({ approvalStatus: "rejected" }).where(eq(users.id, userId));
}

export async function deleteUserPermanently(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Clean up related data
  await db.delete(squadMembers).where(eq(squadMembers.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(userPreferences).where(eq(userPreferences.userId, userId));
  // Delete user
  await db.delete(users).where(eq(users.id, userId));
}
