import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell,
} from "recharts";
import { useState, useMemo } from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
}

const periodOptions = [
  { label: "7 dias", value: "7d", days: 7 },
  { label: "30 dias", value: "30d", days: 30 },
  { label: "90 dias", value: "90d", days: 90 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-4 py-3 shadow-xl max-w-xs">
      <p className="text-sm font-medium mb-2">{data.name}</p>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Budget Pacing: <span className="text-foreground font-medium">{data.budgetPacing.toFixed(1)}%</span></p>
        <p className="text-xs text-muted-foreground">Performance KPI: <span className="text-foreground font-medium">{data.kpiPerformance.toFixed(1)}%</span></p>
        <p className="text-xs text-muted-foreground">Receita: <span className="text-foreground font-medium">{formatCurrency(data.revenue)}</span></p>
      </div>
    </div>
  );
};

function getQuadrantColor(budgetPacing: number, kpiPerformance: number) {
  if (budgetPacing <= 100 && kpiPerformance >= 100) return "oklch(0.65 0.18 250)";
  if (budgetPacing <= 100 && kpiPerformance < 100) return "oklch(0.75 0.14 80)";
  if (budgetPacing > 100 && kpiPerformance >= 100) return "oklch(0.72 0.16 165)";
  return "oklch(0.62 0.22 25)";
}

export default function Reports() {
  const [period, setPeriod] = useState("30d");
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();

  const scatterData = useMemo(() => {
    if (!campaigns) return [];
    const selectedPeriod = periodOptions.find((p) => p.value === period);
    const days = selectedPeriod?.days ?? 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return campaigns
      .filter((c) => {
        const startDate = new Date(c.startDate);
        const endDate = c.endDate ? new Date(c.endDate) : new Date();
        // Campaign must overlap with the selected period
        return startDate <= new Date() && endDate >= cutoff;
      })
      .map((c) => {
        const budget = parseFloat(String(c.budget));
        const spent = parseFloat(String(c.spent));
        const revenue = parseFloat(String(c.revenue));
        const budgetPacing = budget > 0 ? (spent / budget) * 100 : 0;
        const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
        const kpiPerformance = Math.max(0, Math.min(200, 100 + roi));

        return {
          name: c.name,
          budgetPacing,
          kpiPerformance,
          revenue,
          size: Math.max(revenue / 100, 50),
          fill: getQuadrantColor(budgetPacing, kpiPerformance),
        };
      });
  }, [campaigns, period]);

  const summaryStats = useMemo(() => {
    if (!scatterData.length) return null;
    const avgPacing = scatterData.reduce((s, d) => s + d.budgetPacing, 0) / scatterData.length;
    const avgKpi = scatterData.reduce((s, d) => s + d.kpiPerformance, 0) / scatterData.length;
    const totalRevenue = scatterData.reduce((s, d) => s + d.revenue, 0);
    const idealCount = scatterData.filter((d) => d.budgetPacing <= 100 && d.kpiPerformance >= 100).length;
    return { avgPacing, avgKpi, totalRevenue, idealCount };
  }, [scatterData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise de desempenho das campanhas</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {periodOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {summaryStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground font-medium">Pacing Médio</p>
              <p className="text-xl font-semibold mt-1">{summaryStats.avgPacing.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground font-medium">KPI Médio</p>
              <p className="text-xl font-semibold mt-1">{summaryStats.avgKpi.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground font-medium">Receita Total</p>
              <p className="text-xl font-semibold mt-1">{formatCurrency(summaryStats.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground font-medium">Campanhas Ideais</p>
              <p className="text-xl font-semibold mt-1">{summaryStats.idealCount} <span className="text-sm text-muted-foreground font-normal">de {scatterData.length}</span></p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-medium">Budget Pacing vs Performance KPI</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full" style={{ background: "oklch(0.65 0.18 250)" }} /><span className="text-muted-foreground">Ideal</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full" style={{ background: "oklch(0.72 0.16 165)" }} /><span className="text-muted-foreground">Bom</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full" style={{ background: "oklch(0.75 0.14 80)" }} /><span className="text-muted-foreground">Atenção</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full" style={{ background: "oklch(0.62 0.22 25)" }} /><span className="text-muted-foreground">Crítico</span></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {scatterData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">Sem dados para o período</h3>
              <p className="text-sm text-muted-foreground">Crie campanhas ou ajuste o filtro de período para visualizar os relatórios.</p>
            </div>
          ) : (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.014 260)" />
                  <XAxis type="number" dataKey="budgetPacing" name="Budget Pacing" unit="%" stroke="oklch(0.60 0.02 260)" fontSize={12} tickLine={false} axisLine={false}
                    label={{ value: "Budget Pacing (%)", position: "bottom", offset: 0, style: { fill: "oklch(0.60 0.02 260)", fontSize: 11 } }} />
                  <YAxis type="number" dataKey="kpiPerformance" name="KPI Performance" unit="%" stroke="oklch(0.60 0.02 260)" fontSize={12} tickLine={false} axisLine={false}
                    label={{ value: "KPI Performance (%)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "oklch(0.60 0.02 260)", fontSize: 11 } }} />
                  <ZAxis type="number" dataKey="size" range={[60, 400]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
