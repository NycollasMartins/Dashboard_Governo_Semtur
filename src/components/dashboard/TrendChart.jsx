import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 mt-1" style={{ color: p.fill }}>
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: p.fill }} />
          {p.name === "impressions" ? "Impressões" : "Cliques"}:{" "}
          <span className="font-semibold ml-1">{p.value.toLocaleString("pt-BR")}</span>
        </p>
      ))}
    </div>
  );
}

export default function TrendChart({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-2xl card-glow overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-sora font-semibold text-foreground text-sm">Tendência Diária</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Impressões e cliques nos últimos 11 dias</p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,88%)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(220,15%,50%)" }}
              axisLine={false}
              tickLine={false}
            />
            {/* Left axis: impressions */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11, fill: "#3579BC" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? v / 1000 + "K" : v}
            />
            {/* Right axis: clicks */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#E68A40" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? v / 1000 + "K" : v}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220,15%,93%)", radius: 4 }} />
            <Bar yAxisId="left" dataKey="impressions" name="impressions" fill="#3579BC" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Line yAxisId="right" type="monotone" dataKey="clicks" name="clicks" stroke="#E68A40" strokeWidth={2} dot={{ r: 3, fill: "#E68A40" }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-2 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#3579BC" }} />
            <span className="text-xs text-muted-foreground">Impressões</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ background: "#E68A40" }} />
            <span className="text-xs text-muted-foreground">Cliques</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}