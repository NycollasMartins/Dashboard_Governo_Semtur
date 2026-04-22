import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function Budget() {
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();
  const { data: prefs } = trpc.preferences.get.useQuery();

  const alertThreshold = prefs?.budgetAlertThreshold ?? 80;

  const budgetData = campaigns?.map((c) => {
    const budget = parseFloat(String(c.budget));
    const spent = parseFloat(String(c.spent));
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = Math.max(budget - spent, 0);
    return { ...c, budgetNum: budget, spentNum: spent, pct, remaining };
  }) ?? [];

  const totalBudget = budgetData.reduce((s, c) => s + c.budgetNum, 0);
  const totalSpent = budgetData.reduce((s, c) => s + c.spentNum, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudget = budgetData.filter((c) => c.pct >= alertThreshold);

  const chartData = budgetData.map((c) => ({
    name: c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name,
    orçamento: c.budgetNum,
    gasto: c.spentNum,
    pct: c.pct,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Card key={i} className="bg-card border-border/50"><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orçamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Controle de gastos por campanha
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Orçamento Total</p>
                <p className="text-2xl font-semibold tracking-tight">{formatCurrency(totalBudget)}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Total Gasto</p>
                <p className="text-2xl font-semibold tracking-tight">{formatCurrency(totalSpent)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={totalPct} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">{totalPct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-card border-border/50 ${overBudget.length > 0 ? "border-amber-500/30" : ""}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Alertas</p>
                <p className="text-2xl font-semibold tracking-tight">{overBudget.length}</p>
                <p className="text-xs text-muted-foreground">
                  campanhas acima de {alertThreshold}% do orçamento
                </p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${overBudget.length > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                {overBudget.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Orçamento vs Gasto por Campanha</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.014 260)" vertical={false} />
                  <XAxis dataKey="name" stroke="oklch(0.60 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.60 0.02 260)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orçamento" name="Orçamento" fill="oklch(0.65 0.18 250)" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="gasto" name="Gasto" radius={[4, 4, 0, 0]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.pct > 90 ? "oklch(0.62 0.22 25)" : entry.pct > alertThreshold ? "oklch(0.75 0.14 80)" : "oklch(0.72 0.16 165)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-campaign budget list */}
      <div className="space-y-3">
        <h2 className="text-base font-medium">Detalhamento por Campanha</h2>
        {budgetData.length === 0 ? (
          <Card className="bg-card border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma campanha encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {budgetData.map((c) => (
              <Card key={c.id} className={`bg-card border-border/50 ${c.pct >= alertThreshold ? "border-amber-500/30" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="text-sm font-medium truncate">{c.name}</h3>
                      <Badge variant="outline" className="text-xs shrink-0">{c.platform}</Badge>
                    </div>
                    {c.pct >= 90 && (
                      <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/15 shrink-0">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Crítico
                      </Badge>
                    )}
                    {c.pct >= alertThreshold && c.pct < 90 && (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/15 shrink-0">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Atenção
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">
                          {formatCurrency(c.spentNum)} de {formatCurrency(c.budgetNum)}
                        </span>
                        <span className="font-medium">{c.pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            c.pct > 90 ? "bg-red-400" : c.pct > alertThreshold ? "bg-amber-400" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(c.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Restante</p>
                      <p className="text-sm font-medium">{formatCurrency(c.remaining)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
