import { LayoutDashboard } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import TrendChart from "@/components/dashboard/TrendChart";
import TopCityCard from "@/components/dashboard/TopCityCard";

export default function OverviewTab({ metrics, trendData, cities, selectedCity, onSelectCity }) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-sora font-bold text-foreground text-lg">Visão Geral</h2>
          <p className="text-xs text-muted-foreground">KPIs e tendências das campanhas ativas</p>
        </div>
      </div>
      {/* Top City Card */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-1">
        <TopCityCard cities={cities} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.title} {...m} delay={i * 0.05} />
        ))}
      </div>

      {/* Tendência Diária */}
      <TrendChart data={trendData} />
    </div>
  );
}