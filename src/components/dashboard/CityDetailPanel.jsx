import { motion } from "framer-motion";
import { TrendingUp, MousePointerClick, Monitor, Lock } from "lucide-react";
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n;
}



export default function CityDetailPanel({ city, cities, onBack, onSelectCity }) {
  // Clicks by creative format from real city data
  const creativeData = city.creativeBreakdown
    ? Object.entries(city.creativeBreakdown)
        .map(([criativo, cliques]) => ({ criativo, cliques }))
        .sort((a, b) => b.cliques - a.cliques)
    : [];

  const metrics = [
    { label: "Impressões", value: fmt(city.impressions), icon: Monitor, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Cliques", value: fmt(city.clicks), icon: MousePointerClick, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "CTR", value: city.ctr + "%", icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50" },

  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.28 }}
      className="space-y-5"
    >
      {/* Metrics — full width, all in one row */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              className="bg-card rounded-2xl card-glow px-5 py-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="font-sora font-bold text-foreground text-lg leading-tight">{m.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Click Analysis section heading */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.18 }}
        className="flex items-center gap-3"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
          <MousePointerClick className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-sora font-bold text-foreground text-base">Análise de Cliques</h3>
          <p className="text-xs text-muted-foreground">Distribuição e comportamento dos usuários que clicaram em {city.city}</p>
        </div>
      </motion.div>

      {/* Hourly clicks chart + pie chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.22 }}
        className="flex gap-4"
      >
        {/* Clicks by creative format bar chart */}
        <div className="flex-1 bg-card rounded-2xl card-glow px-5 pt-5 pb-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground font-sora">Cliques por Formato de Criativo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total de cliques agrupados por formato</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={creativeData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="criativo" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                formatter={(val) => [`${val} cliques`, "Cliques"]}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Bar dataKey="cliques" fill="#3579BC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>


      </motion.div>

      {/* Clickers list — data unavailable */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-card rounded-2xl card-glow overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border">
          <h4 className="font-sora font-semibold text-foreground text-sm">Pessoas que clicaram</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Usuários que interagiram com a campanha em {city.city}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Dado indisponível</p>
          <p className="text-xs text-muted-foreground max-w-xs">Os dados individuais de usuários que clicaram nesta campanha não estão disponíveis na fonte de dados atual.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}