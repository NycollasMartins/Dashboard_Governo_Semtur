import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n;
}

const PODIUM_CONFIG = [
  { pos: 1, medal: "🥇", bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", label: "1°", height: "h-24" },
  { pos: 2, medal: "🥈", bg: "bg-slate-50 border-slate-200", text: "text-slate-500", label: "2°", height: "h-16" },
  { pos: 3, medal: "🥉", bg: "bg-orange-50 border-orange-200", text: "text-orange-600", label: "3°", height: "h-12" },
];

function PodiumCard({ city, config, isSelected, onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: config.pos * 0.07 }}
      onClick={onClick}
      className={`flex-1 rounded-2xl border p-4 text-left transition-all cursor-pointer ${config.bg} ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{config.medal}</span>
        <span className={`text-xs font-bold ${config.text}`}>{config.label}</span>
      </div>
      <p className="text-sm font-bold text-foreground leading-tight">{city.city}</p>
      <p className="text-xs text-muted-foreground mb-3">{city.state}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Impressões</span>
          <span className="font-semibold text-foreground">{fmt(city.impressions)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Cliques</span>
          <span className="font-semibold text-foreground">{fmt(city.clicks)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">CTR</span>
          <span className={`font-semibold ${city.ctr >= 2.1 ? "text-success" : city.ctr >= 1.9 ? "text-warning" : "text-foreground"}`}>{city.ctr}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Gasto</span>
          <span className="font-semibold text-foreground">R$ {(city.spend / 1000).toFixed(1)}K</span>
        </div>
      </div>
    </motion.button>
  );
}

export default function CityTable({ cities, onSelectCity, selectedCity }) {
  const sorted = [...cities].sort((a, b) => b.impressions - a.impressions);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Reorder podium: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumConfigs = { 0: PODIUM_CONFIG[1], 1: PODIUM_CONFIG[0], 2: PODIUM_CONFIG[2] };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="bg-card rounded-2xl card-glow overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-primary" />
        <h2 className="font-sora font-semibold text-foreground text-sm">Ranking por Cidade</h2>
      </div>

      {/* Podium */}
      <div className="px-6 pt-5 pb-4 flex gap-3 items-end">
        {podiumOrder.map((city, i) => {
          const config = podiumConfigs[i];
          const isSelected = selectedCity?.city === city.city;
          return (
            <PodiumCard
              key={city.city}
              city={city}
              config={config}
              isSelected={isSelected}
              onClick={() => onSelectCity(isSelected ? null : city)}
            />
          );
        })}
      </div>

      {/* Rest of the list */}
      {rest.length > 0 && (
        <div className="border-t border-border">
          {rest.map((c, i) => {
            const isSelected = selectedCity?.city === c.city;
            return (
              <div
                key={c.city}
                onClick={() => onSelectCity(isSelected ? null : c)}
                className={`flex items-center justify-between px-6 py-3 border-b border-border/50 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 4}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.city}</p>
                    <p className="text-xs text-muted-foreground">{c.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs text-right">
                  <div>
                    <p className="text-muted-foreground">Impressões</p>
                    <p className="font-semibold text-foreground">{fmt(c.impressions)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cliques</p>
                    <p className="font-semibold text-foreground">{fmt(c.clicks)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CTR</p>
                    <span className={`font-semibold ${c.ctr >= 2.1 ? "text-success" : c.ctr >= 1.9 ? "text-warning" : "text-foreground"}`}>{c.ctr}%</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gasto</p>
                    <p className="font-semibold text-foreground">R$ {(c.spend / 1000).toFixed(1)}K</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}