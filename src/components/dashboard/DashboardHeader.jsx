import { motion } from "framer-motion";
import { Radio, RefreshCw } from "lucide-react";

export default function DashboardHeader() {
  const now = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Radio className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-sora font-bold text-foreground text-xl tracking-tight">
            Mídia Programática
          </h1>
          <span className="gradient-badge text-xs font-semibold px-2.5 py-0.5 rounded-full">
            LIVE
          </span>
        </div>
        <p className="text-sm text-muted-foreground pl-10.5">
          Campanhas ativas por cidade · Atualizado: {now}
        </p>
      </div>
      <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-2 hover:bg-muted self-start sm:self-auto">
        <RefreshCw className="w-3.5 h-3.5" />
        Atualizar dados
      </button>
    </motion.div>
  );
}