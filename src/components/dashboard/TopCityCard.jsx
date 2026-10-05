import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n;
}

function cardTone(position) {
  if (position === 1) {
    return "border-[#E68A40]/60 bg-[#E68A40]/10 shadow-[0_14px_30px_-18px_rgba(230,138,64,0.8)]";
  }
  if (position === 2) return "border-[#234578]/25 bg-[#234578]/6";
  return "border-[#234578]/20 bg-[#234578]/5";
}

function badgeTone(position) {
  if (position === 1) return "bg-[#E68A40]/18 text-[#E68A40] border-[#E68A40]/40";
  if (position === 2) return "bg-[#234578]/12 text-[#234578] border-[#234578]/25";
  return "bg-[#234578]/10 text-[#234578] border-[#234578]/20";
}

function CityRankCard({ city, position, delay }) {
  if (!city) return null;

  const isFirst = position === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-2xl border p-5 sm:p-6 min-h-[230px] sm:min-h-[260px] flex flex-col justify-center items-center text-center font-sora ${cardTone(position)} ${isFirst ? "sm:-translate-y-2 sm:scale-[1.04]" : ""}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className={`h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center font-sora text-sm font-bold ${badgeTone(position)}`}>
          {position}o
        </div>
        <div className="min-w-0">
          <p className={`leading-tight ${isFirst ? "text-lg sm:text-xl font-bold text-[#234578]" : "text-base sm:text-lg font-semibold text-foreground"}`}>
            {city.city}
          </p>
          <p className="text-xs text-muted-foreground">{city.state}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 w-full text-center">
        <div className="rounded-lg bg-background/70 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Impressões</p>
          <p className={`mt-1 text-sm font-semibold ${isFirst ? "text-[#E68A40]" : "text-foreground"}`}>{fmt(city.impressions)}</p>
        </div>
        <div className="rounded-lg bg-background/70 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Cliques</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{fmt(city.clicks)}</p>
        </div>
        <div className="rounded-lg bg-background/70 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">CTR</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{city.ctr}%</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TopCityCard({ cities }) {
  const sorted = [...cities].sort((a, b) => b.impressions - a.impressions);
  const topThree = sorted.slice(0, 3);
  const [first, second, third] = topThree;
  if (!first) return null;
  const rankedForDisplay = [
    second ? { city: second, position: 2 } : null,
    { city: first, position: 1 },
    third ? { city: third, position: 3 } : null,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-2xl card-glow overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        <h2 className="font-sora font-semibold text-foreground text-sm">Top Cidades</h2>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-center">
          {rankedForDisplay.map((item, index) => (
            <CityRankCard
              key={`${item.city.city}-${item.city.state}`}
              city={item.city}
              position={item.position}
              delay={0.15 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}