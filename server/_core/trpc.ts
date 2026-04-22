import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG, PENDING_APPROVAL_ERR_MSG, REJECTED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Requires authenticated user (does NOT check approval status)
// Used for auth.me so pending users can still check their status
export const protectedProcedure = t.procedure.use(requireUser);

// Requires authenticated AND approved user
const requireApproved = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  if (ctx.user.approvalStatus === "rejected") {
    throw new TRPCError({ code: "FORBIDDEN", message: REJECTED_ERR_MSG });
  }

  if (ctx.user.approvalStatus === "pending") {
    throw new TRPCError({ code: "FORBIDDEN", message: PENDING_APPROVAL_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const approvedProcedure = t.procedure.use(requireApproved);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
