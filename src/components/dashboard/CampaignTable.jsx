import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Monitor, Video, FileText } from "lucide-react";

const channelIcons = { Display: Monitor, Video: Video, Native: FileText };

const statusConfig = {
  active: { label: "Ativa", class: "bg-success/10 text-success border-success/20" },
  paused: { label: "Pausada", class: "bg-warning/10 text-warning border-warning/20" },
};

function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

export default function CampaignTable({ campaigns }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-2xl card-glow overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-sora font-semibold text-foreground text-sm">Campanhas Ativas</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Visão geral de investimento e progresso</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Campanha", "Canal", "Status", "Budget", "Progresso", "Período"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const Icon = channelIcons[c.channel] || Monitor;
              const pct = Math.round((c.spent / c.budget) * 100);
              const { label, class: cls } = statusConfig[c.status] || statusConfig.active;
              return (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{c.channel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}>{label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatCurrency(c.spent)}</p>
                      <p className="text-xs text-muted-foreground">de {formatCurrency(c.budget)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-foreground">{c.startDate} → {c.endDate}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}