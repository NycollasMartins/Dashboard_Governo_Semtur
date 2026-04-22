import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, approvedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign,
  getDashboardStats,
  getContacts, getContactById, createContact, updateContact, deleteContact,
  getUserPreferences, upsertUserPreferences,
  updateUserProfile,
  getCrmLeads, getCrmLeadById, createCrmLead, updateCrmLead, deleteCrmLead, updateCrmLeadStage,
  getAllTeamMembers, updateUserPosition,
  getTasks, getAllTasks, getTaskById, createTask, updateTask, deleteTask,
  getSquads, getSquadById, createSquad, updateSquad, deleteSquad,
  getClientsBySquad, getAllClients, getClientById, createClient, updateClient, deleteClient,
  getProjectsByClient, getAllProjects, getProjectById, createProject, updateProject, deleteProject,
  getProjectFiles, createProjectFile, deleteProjectFile,
  getSquadMembers, addSquadMember, removeSquadMember,
  getUserSquadIds, getSquadsByIds, getClientsBySquadIds, getProjectsByClientIds,
  getTasksByAssigneeIds, getSquadMemberUserIds,
  getNotificationsByUser, getUnreadNotificationCount, createNotification,
  markNotificationRead, markAllNotificationsRead, generateDueDateNotifications,
  getMyDashboardStats,
  getPendingUsers, getAllUsersWithStatus, approveUser, rejectUser, removeUser, deleteUserPermanently,
} from "./db";
import { storagePut } from "./storage";

// ─── Position / Role Helpers ──────────────────────────────────────────

const POSITIONS = ["ceo", "coo", "head", "cs", "gestor_trafego", "social_media", "sdr", "bdr", "closer"] as const;
type Position = typeof POSITIONS[number];

const ADMIN_POSITIONS: Position[] = ["ceo", "coo"];
const MANAGER_POSITIONS: Position[] = ["ceo", "coo", "head"];
const COMMERCIAL_POSITIONS: Position[] = ["sdr", "bdr", "closer"];

function getUserPosition(user: { position?: string | null }): Position {
  return (user.position as Position) || "cs";
}

function isAdminPosition(pos: Position): boolean {
  return ADMIN_POSITIONS.includes(pos);
}

function isManagerPosition(pos: Position): boolean {
  return MANAGER_POSITIONS.includes(pos);
}

// Middleware: only CEO/COO (requires approved)
const adminPositionProcedure = approvedProcedure.use(({ ctx, next }) => {
  const pos = getUserPosition(ctx.user);
  if (!isAdminPosition(pos)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas CEO e COO podem realizar esta ação" });
  }
  return next({ ctx: { ...ctx, userPosition: pos } });
});

// Middleware: CEO/COO/Head (requires approved)
const managerProcedure = approvedProcedure.use(({ ctx, next }) => {
  const pos = getUserPosition(ctx.user);
  if (!isManagerPosition(pos)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas CEO, COO e Head podem realizar esta ação" });
  }
  return next({ ctx: { ...ctx, userPosition: pos } });
});

// Middleware: only C-level CEO/COO (requires approved)
const cLevelProcedure = approvedProcedure.use(({ ctx, next }) => {
  const pos = getUserPosition(ctx.user);
  if (!isAdminPosition(pos)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao C-level (CEO/COO)" });
  }
  return next({ ctx: { ...ctx, userPosition: pos } });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  dashboard: router({
    stats: cLevelProcedure.query(async ({ ctx }) => {
      return getDashboardStats(ctx.user.id);
    }),
    myStats: protectedProcedure.query(async ({ ctx }) => {
      const pos = getUserPosition(ctx.user);
      return getMyDashboardStats(ctx.user.id, pos);
    }),
  }),

  campaigns: router({
    list: cLevelProcedure.query(async ({ ctx }) => {
      return getCampaigns(ctx.user.id);
    }),
    getById: cLevelProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getCampaignById(input.id, ctx.user.id);
      }),
    create: cLevelProcedure
      .input(z.object({
        name: z.string().min(1),
        platform: z.string().min(1),
        status: z.enum(["active", "paused", "ended"]).default("active"),
        budget: z.string(),
        spent: z.string().optional(),
        revenue: z.string().optional(),
        leads: z.number().optional(),
        conversions: z.number().optional(),
        impressions: z.number().optional(),
        clicks: z.number().optional(),
        startDate: z.date(),
        endDate: z.date().nullable().optional(),
        description: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createCampaign({
          ...input,
          userId: ctx.user.id,
          spent: input.spent ?? "0",
          revenue: input.revenue ?? "0",
          leads: input.leads ?? 0,
          conversions: input.conversions ?? 0,
          impressions: input.impressions ?? 0,
          clicks: input.clicks ?? 0,
        });
        return { id };
      }),
    update: cLevelProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        platform: z.string().min(1).optional(),
        status: z.enum(["active", "paused", "ended"]).optional(),
        budget: z.string().optional(),
        spent: z.string().optional(),
        revenue: z.string().optional(),
        leads: z.number().optional(),
        conversions: z.number().optional(),
        impressions: z.number().optional(),
        clicks: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().nullable().optional(),
        description: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCampaign(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: cLevelProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCampaign(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  contacts: router({
    list: cLevelProcedure
      .input(z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        sortBy: z.string().optional(),
        sortDir: z.enum(["asc", "desc"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return getContacts(ctx.user.id, input);
      }),
    getById: cLevelProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getContactById(input.id, ctx.user.id);
      }),
    create: cLevelProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().nullable().optional(),
        company: z.string().nullable().optional(),
        status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).default("new"),
        source: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        campaignId: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createContact({ ...input, userId: ctx.user.id });
        return { id };
      }),
    update: cLevelProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().nullable().optional(),
        company: z.string().nullable().optional(),
        status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
        source: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        campaignId: z.number().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateContact(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: cLevelProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteContact(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  preferences: router({
    get: approvedProcedure.query(async ({ ctx }) => {
      return getUserPreferences(ctx.user.id);
    }),
    update: approvedProcedure
      .input(z.object({
        currency: z.string().optional(),
        language: z.string().optional(),
        budgetAlertThreshold: z.number().min(1).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  profile: router({
    update: approvedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  crmLeads: router({
    list: approvedProcedure.query(async ({ ctx }) => {
      return getCrmLeads(ctx.user.id);
    }),
    getById: approvedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getCrmLeadById(input.id, ctx.user.id);
      }),
    create: approvedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        company: z.string().nullable().optional(),
        source: z.string().nullable().optional(),
        stage: z.enum(["lead_frio", "follow_up", "reuniao_marcada"]).default("lead_frio"),
        value: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        position: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createCrmLead({
          ...input,
          userId: ctx.user.id,
          position: input.position ?? 0,
        });
        return { id };
      }),
    update: approvedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        company: z.string().nullable().optional(),
        source: z.string().nullable().optional(),
        stage: z.enum(["lead_frio", "follow_up", "reuniao_marcada"]).optional(),
        value: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        position: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateCrmLead(id, ctx.user.id, data);
        return { success: true };
      }),
    moveStage: approvedProcedure
      .input(z.object({
        id: z.number(),
        stage: z.enum(["lead_frio", "follow_up", "reuniao_marcada"]),
        position: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateCrmLeadStage(input.id, ctx.user.id, input.stage, input.position);
        return { success: true };
      }),
    delete: approvedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCrmLead(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Team Management ──────────────────────────────────────────────

  team: router({
    list: approvedProcedure.query(async () => {
      return getAllTeamMembers();
    }),
    updatePosition: adminPositionProcedure
      .input(z.object({
        userId: z.number(),
        position: z.enum(["ceo", "coo", "head", "cs", "gestor_trafego", "social_media", "sdr", "bdr", "closer"]),
      }))
      .mutation(async ({ input }) => {
        await updateUserPosition(input.userId, input.position);
        return { success: true };
      }),
  }),

  // ─── Tasks (Demandas) ─────────────────────────────────────────────

  tasks: router({
    // List: CEO/COO see all, Head sees squad members' tasks, others see only own
    list: approvedProcedure.query(async ({ ctx }) => {
      const pos = getUserPosition(ctx.user);
      if (isAdminPosition(pos)) {
        return getAllTasks();
      }
      if (pos === "head") {
        // Head sees only tasks of their squad members
        const squadIds = await getUserSquadIds(ctx.user.id);
        if (squadIds.length === 0) return getTasks({ assigneeId: ctx.user.id });
        const memberIds = await getSquadMemberUserIds(squadIds);
        if (memberIds.length === 0) return getTasks({ assigneeId: ctx.user.id });
        // Include the Head's own tasks too
        if (!memberIds.includes(ctx.user.id)) memberIds.push(ctx.user.id);
        return getTasksByAssigneeIds(memberIds);
      }
      // CS, Gestor de Tráfego, Social Media, SDR, BDR, Closer: only their own tasks
      return getTasks({ assigneeId: ctx.user.id });
    }),

    getById: approvedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const task = await getTaskById(input.id);
        if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Demanda não encontrada" });
        const pos = getUserPosition(ctx.user);
        // Non-managers can only see their own tasks
        if (!isManagerPosition(pos) && task.assigneeId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para ver esta demanda" });
        }
        return task;
      }),

    // Create: CEO/COO/Head can create and assign to anyone
    create: managerProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        status: z.enum(["pending", "in_progress", "done"]).default("pending"),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        assigneeId: z.number(),
        dueDate: z.date().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createTask({
          ...input,
          createdById: ctx.user.id,
        });
        return { id };
      }),

    // Update: CEO/COO can update any; Head can update squad tasks; members can update own status
    update: approvedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        status: z.enum(["pending", "in_progress", "done"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assigneeId: z.number().optional(),
        dueDate: z.date().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const task = await getTaskById(input.id);
        if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Demanda não encontrada" });

        const pos = getUserPosition(ctx.user);

        if (isAdminPosition(pos) || pos === "head") {
          // Full edit access
          const { id, ...data } = input;
          await updateTask(id, data);
          return { success: true };
        }

        // Members can only update status of their own tasks
        if (task.assigneeId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para editar esta demanda" });
        }
        // Members can only change status
        if (input.status) {
          await updateTask(input.id, { status: input.status });
        }
        return { success: true };
      }),

    // Delete: only CEO/COO
    delete: adminPositionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTask(input.id);
        return { success: true };
      }),
  }),

  // ─── Squads ────────────────────────────────────────────────────────────

  squads: router({
    // List: CEO/COO see all, Head sees only their squads
    list: approvedProcedure.query(async ({ ctx }) => {
      const pos = getUserPosition(ctx.user);
      if (isAdminPosition(pos)) {
        return getSquads();
      }
      // Head and others: only their squads
      const squadIds = await getUserSquadIds(ctx.user.id);
      if (squadIds.length === 0) return [];
      return getSquadsByIds(squadIds);
    }),
    getById: approvedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getSquadById(input.id);
      }),
    create: managerProcedure
      .input(z.object({
        name: z.string().min(1),
        headId: z.number().nullable().optional(),
        mrrMonthly: z.string().optional(),
        roiMin: z.string().optional(),
        roiMax: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createSquad({
          name: input.name,
          headId: input.headId ?? null,
          mrrMonthly: input.mrrMonthly ?? "0",
          roiMin: input.roiMin ?? "0",
          roiMax: input.roiMax ?? "0",
        });
        return { id };
      }),
    update: managerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        headId: z.number().nullable().optional(),
        mrrMonthly: z.string().optional(),
        roiMin: z.string().optional(),
        roiMax: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSquad(id, data);
        return { success: true };
      }),
    delete: adminPositionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSquad(input.id);
        return { success: true };
      }),
  }),

  // ─── Clients ───────────────────────────────────────────────────────────

  clients: router({
    list: approvedProcedure
      .input(z.object({ squadId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (input?.squadId) return getClientsBySquad(input.squadId);
        const pos = getUserPosition(ctx.user);
        if (isAdminPosition(pos)) return getAllClients();
        // Head and others: only clients from their squads
        const squadIds = await getUserSquadIds(ctx.user.id);
        if (squadIds.length === 0) return [];
        return getClientsBySquadIds(squadIds);
      }),
    getById: approvedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getClientById(input.id);
      }),
    create: managerProcedure
      .input(z.object({
        squadId: z.number(),
        name: z.string().min(1),
        email: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        pipelineStage: z.enum(["prospeccao", "onboarding", "ativo", "churn_risk", "churned"]).default("prospeccao"),
        businessHours: z.string().nullable().optional(),
        businessDays: z.string().nullable().optional(),
        clinicLocation: z.string().nullable().optional(),
        highDemandRegion: z.string().nullable().optional(),
        paymentMethod: z.string().nullable().optional(),
        paymentNotes: z.string().nullable().optional(),
        monthlyBudget: z.string().optional(),
        currentRoi: z.string().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createClient({
          ...input,
          monthlyBudget: input.monthlyBudget ?? "0",
          currentRoi: input.currentRoi ?? "0",
        });
        return { id };
      }),
    update: approvedProcedure
      .input(z.object({
        id: z.number(),
        squadId: z.number().optional(),
        name: z.string().min(1).optional(),
        email: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        pipelineStage: z.enum(["prospeccao", "onboarding", "ativo", "churn_risk", "churned"]).optional(),
        businessHours: z.string().nullable().optional(),
        businessDays: z.string().nullable().optional(),
        clinicLocation: z.string().nullable().optional(),
        highDemandRegion: z.string().nullable().optional(),
        paymentMethod: z.string().nullable().optional(),
        paymentNotes: z.string().nullable().optional(),
        monthlyBudget: z.string().optional(),
        currentRoi: z.string().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateClient(id, data);
        return { success: true };
      }),
    delete: adminPositionProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClient(input.id);
        return { success: true };
      }),
  }),

  // ─── Projects ──────────────────────────────────────────────────────────

  projects: router({
    list: approvedProcedure
      .input(z.object({ clientId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (input?.clientId) return getProjectsByClient(input.clientId);
        const pos = getUserPosition(ctx.user);
        if (isAdminPosition(pos)) return getAllProjects();
        // Head and others: only projects from their squads' clients
        const squadIds = await getUserSquadIds(ctx.user.id);
        if (squadIds.length === 0) return [];
        const squadClients = await getClientsBySquadIds(squadIds);
        const clientIds = squadClients.map(c => c.id);
        if (clientIds.length === 0) return [];
        return getProjectsByClientIds(clientIds);
      }),
    getById: approvedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getProjectById(input.id);
      }),
    create: approvedProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        status: z.enum(["active", "paused", "completed"]).default("active"),
      }))
      .mutation(async ({ input }) => {
        const id = await createProject(input);
        return { id };
      }),
    update: approvedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        status: z.enum(["active", "paused", "completed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProject(id, data);
        return { success: true };
      }),
    delete: approvedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ─── Squad Members ──────────────────────────────────────────────────────

  squadMembers: router({
    list: approvedProcedure
      .input(z.object({ squadId: z.number() }))
      .query(async ({ input }) => {
        return getSquadMembers(input.squadId);
      }),
    add: managerProcedure
      .input(z.object({
        squadId: z.number(),
        userId: z.number(),
        role: z.enum(["head", "member"]).default("member"),
      }))
      .mutation(async ({ input }) => {
        const id = await addSquadMember(input);
        return { id };
      }),
    remove: managerProcedure
      .input(z.object({
        squadId: z.number(),
        userId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await removeSquadMember(input.squadId, input.userId);
        return { success: true };
      }),
    mySquads: approvedProcedure.query(async ({ ctx }) => {
      return getUserSquadIds(ctx.user.id);
    }),
  }),

  // ─── Project Files (Mídias de Captação) ─────────────────────────────────

  projectFiles: router({
    list: approvedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getProjectFiles(input.projectId);
      }),
    upload: approvedProcedure
      .input(z.object({
        projectId: z.number(),
        fileName: z.string().min(1),
        fileBase64: z.string().min(1),
        mimeType: z.string().min(1),
        fileSize: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.fileBase64, "base64");
        const fileKey = `projects/${input.projectId}/${Date.now()}-${input.fileName}`;
        const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
        const id = await createProjectFile({
          projectId: input.projectId,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: key,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          uploadedById: ctx.user.id,
        });
        return { id, url, key };
      }),
    delete: approvedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProjectFile(input.id);
        return { success: true };
      }),
   }),

  // ─── Notifications ────────────────────────────────────────────────────────────
  notifications: router({
    list: approvedProcedure.query(async ({ ctx }) => {
      return getNotificationsByUser(ctx.user.id);
    }),
    unreadCount: approvedProcedure.query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),
    markRead: approvedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),
    markAllRead: approvedProcedure
      .mutation(async ({ ctx }) => {
        await markAllNotificationsRead(ctx.user.id);
        return { success: true };
      }),
    // Endpoint to trigger due-date check (called by frontend polling or manually)
    checkDueDates: approvedProcedure
      .mutation(async () => {
        const result = await generateDueDateNotifications();
        return result;
      }),
  }),

  // ─── Member Management (C-level only) ──────────────────────────────────────
  members: router({
    listAll: cLevelProcedure.query(async () => {
      return getAllUsersWithStatus();
    }),
    pending: cLevelProcedure.query(async () => {
      return getPendingUsers();
    }),
    pendingCount: protectedProcedure.query(async ({ ctx }) => {
      const pos = getUserPosition(ctx.user);
      if (!isAdminPosition(pos)) return 0;
      const pending = await getPendingUsers();
      return pending.length;
    }),
    approve: cLevelProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await approveUser(input.userId);
        return { success: true };
      }),
    reject: cLevelProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await rejectUser(input.userId);
        return { success: true };
      }),
    remove: cLevelProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await removeUser(input.userId);
        return { success: true };
      }),
    deletePermanently: cLevelProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteUserPermanently(input.userId);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;

/* Inicio Mapa de Calor */

import { heatmapRouter } from "./_core/systemRouter";

export const appRouter = t.router({
  // outros...
  heatmap: heatmapRouter,
});

/* Fim Mapa de Calor */