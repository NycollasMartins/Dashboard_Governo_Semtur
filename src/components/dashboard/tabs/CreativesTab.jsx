import { motion } from "framer-motion";
import { Layers, MousePointerClick, TrendingUp, Award, Users } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend
} from "recharts";

const GENDER_DATA = [
  { name: "Masculino", value: 54, color: "#3579BC" },
  { name: "Feminino", value: 43, color: "#E87D4F" },
  { name: "Desconhecido", value: 3, color: "#A0AEC0" },
];

const AGE_DATA = [
  { faixa: "18–24", pessoas: 12 },
  { faixa: "25–34", pessoas: 28 },
  { faixa: "35–44", pessoas: 31 },
  { faixa: "45–54", pessoas: 18 },
  { faixa: "55–64", pessoas: 8 },
  { faixa: "65+", pessoas: 3 },
];

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

const COLORS = ["#3579BC", "#4A8FCC", "#5CA5DC", "#6EBBEC", "#80D1FC", "#92E7FF"];

export default function CreativesTab({ campaignData }) {
  // Aggregate by creative
  const map = {};
  (campaignData || []).forEach((r) => {
    const criativo = r.criativo || "Desconhecido";
    if (!map[criativo]) map[criativo] = { criativo, impressions: 0, clicks: 0 };
    map[criativo].impressions += r.impressoes_display || 0;
    map[criativo].clicks += r.cliques_display || 0;
  });

  const creatives = Object.values(map)
    .map((c) => ({
      ...c,
      ctr: c.impressions > 0 ? parseFloat((c.clicks / c.impressions * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const topByClicks = creatives[0] || null;
  const topByCTR = [...creatives].sort((a, b) => b.ctr - a.ctr)[0] || null;
  const ctrChartData = [...creatives].sort((a, b) => b.ctr - a.ctr);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Layers className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-sora font-bold text-foreground text-lg">Criativos</h2>
          <p className="text-xs text-muted-foreground">Performance real dos formatos de criativo por cliques e CTR</p>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top by clicks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-card rounded-2xl card-glow p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <MousePointerClick className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Criativo com mais Cliques</p>
            <p className="font-sora font-bold text-foreground text-base truncate">{topByClicks?.criativo || "—"}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-emerald-600 font-semibold">{topByClicks ? fmt(topByClicks.clicks) + " cliques" : "—"}</span>
              <span className="text-xs text-muted-foreground">CTR {topByClicks?.ctr}%</span>
            </div>
          </div>
        </motion.div>

        {/* Top by CTR */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06 }}
          className="bg-card rounded-2xl card-glow p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-violet-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Melhor CTR</p>
            <p className="font-sora font-bold text-foreground text-base truncate">{topByCTR?.criativo || "—"}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-violet-600 font-semibold">{topByCTR ? topByCTR.ctr + "%" : "—"}</span>
              <span className="text-xs text-muted-foreground">{topByCTR ? fmt(topByCTR.impressions) + " impressões" : "—"}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTR chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.1 }}
        className="bg-card rounded-2xl card-glow px-5 pt-5 pb-4"
      >
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground font-sora flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            CTR por Formato de Criativo
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Taxa de cliques (%) por formato</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ctrChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="criativo" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} unit="%" />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
              formatter={(val) => [`${val}%`, "CTR"]}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Bar dataKey="ctr" radius={[4, 4, 0, 0]}>
              {ctrChartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Clicks chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.16 }}
        className="bg-card rounded-2xl card-glow px-5 pt-5 pb-4"
      >
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground font-sora flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
            Cliques por Formato de Criativo
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Total de cliques agrupados por formato</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={creatives} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="criativo" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
              formatter={(val) => [`${fmt(val)}`, "Cliques"]}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
              {creatives.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
      {/* Gender + Age charts side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.22 }}
          className="bg-card rounded-2xl card-glow px-5 pt-5 pb-4"
        >
          <div className="mb-2">
            <p className="text-sm font-semibold text-foreground font-sora flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Distribuição por Gênero
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Estimativa do público impactado</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={GENDER_DATA}
                cx="50%"
                cy="45%"
                outerRadius={75}
                dataKey="value"
                label={({ name, value }) => `${value}%`}
                labelLine={false}
              >
                {GENDER_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                formatter={(val) => [`${val}%`, "Participação"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Age bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.28 }}
          className="bg-card rounded-2xl card-glow px-5 pt-5 pb-4"
        >
          <div className="mb-2">
            <p className="text-sm font-semibold text-foreground font-sora flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" />
              Distribuição por Idade
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Faixa etária do público impactado (%)</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={AGE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                formatter={(val) => [`${val}%`, "Participação"]}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Bar dataKey="pessoas" radius={[4, 4, 0, 0]} fill="#7C3AED" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}