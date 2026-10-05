import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue, color, delay = 0 }) {
  const IconComp = Icon;
  const colorMap = {
    purple: "bg-primary/10 text-primary",
    cyan: "bg-accent/10 text-accent",
    green: "bg-success/10 text-success",
    orange: "bg-warning/10 text-warning",
    red: "bg-destructive/10 text-destructive",
  };

  const isPositive = trend === "up";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="metric-card group cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.purple}`}>
          <IconComp className="w-5 h-5" />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-sora font-700 text-foreground tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}