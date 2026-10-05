import { motion } from "framer-motion";
import { Monitor, Video, FileText, Zap } from "lucide-react";

const formatIcons = { Display: Monitor, Video: Video, Native: FileText };

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n;
}

export default function TopCreatives({ creatives }) {
  const sorted = [...creatives].sort((a, b) => b.impressions - a.impressions).slice(0, 6);
  const max = sorted[0]?.impressions || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="bg-card rounded-2xl card-glow overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-sora font-semibold text-foreground text-sm">Top Criativos por Impressão</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Ranking dos criativos com maior alcance</p>
      </div>
      <div className="p-6 space-y-4">
        {sorted.map((c, i) => {
          const Icon = formatIcons[c.format] || Monitor;
          const pct = (c.impressions / max) * 100;
          const colors = [
            "bg-primary",
            "bg-accent",
            "bg-success",
            "bg-warning",
            "bg-primary/70",
            "bg-accent/70",
          ];
          return (
            <div key={c.id} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="text-xs text-muted-foreground">{c.ctr}% CTR</span>
                  <span className="text-xs font-semibold text-foreground">{fmt(c.impressions)}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${colors[i]} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}