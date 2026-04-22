import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});

/* Inicio Mapa de Calor */
import { HeatmapController } from "./mapa_calor";

const heatmapController = new HeatmapController();

export const heatmapRouter = t.router({
  getHeatmapWithInsights: t.procedure.query(async () => {
    return heatmapController.getHeatmapWithInsights();
  }),
});
/* Fim Mapa de Calor */