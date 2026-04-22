import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Users,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Building2,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  PhoneCall,
  CalendarCheck,
  Snowflake,
  BarChart3,
  Bell,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo } from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const POSITION_LABELS: Record<string, string> = {
  ceo: "CEO",
  coo: "COO",
  head: "Head de Squad",
  cs: "Customer Success",
  gestor_trafego: "Gestor de Tráfego",
  social_media: "Social Media",
  sdr: "SDR",
  bdr: "BDR",
  closer: "Closer",
};

function KpiCard({
  title, value, subtitle, icon: Icon, color, loading,
}: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; color?: string; loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="bg-card border-border/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-28" /><Skeleton className="h-3 w-24" /></div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="bg-card border-border/50 hover:border-border transition-colors duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color ?? "bg-primary/10"}`}>
            <Icon className={`h-5 w-5 ${color ? "text-white" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.name !== "Quantidade" ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
};

const PIE_COLORS = [
  "oklch(0.65 0.18 250)",  // blue
  "oklch(0.70 0.18 160)",  // green
  "oklch(0.70 0.18 50)",   // amber
  "oklch(0.65 0.20 340)",  // pink
  "oklch(0.60 0.18 300)",  // purple
];

// ─── C-Level Dashboard ──────────────────────────────────────────────

function CLevelDashboard({ data, isLoading }: { data: any; isLoading: boolean }) {
  const d = data?.data;
  const totalRevenue = d ? parseFloat(String(d.totalRevenue ?? 0)) : 0;
  const totalLeads = d?.totalLeads ?? 0;
  const totalConversions = d?.totalConversions ?? 0;
  const totalSpent = d ? parseFloat(String(d.totalSpent ?? 0)) : 0;
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;
  const totalMrr = d ? parseFloat(String(d.totalMrr ?? 0)) : 0;

  const taskData = useMemo(() => {
    if (!d?.tasks) return [];
    return [
      { name: "Pendentes", value: d.tasks.pending ?? 0 },
      { name: "Em Progresso", value: d.tasks.inProgress ?? 0 },
      { name: "Concluídas", value: d.tasks.done ?? 0 },
      { name: "Vencidas", value: d.tasks.overdue ?? 0 },
    ].filter(i => i.value > 0);
  }, [d]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Executivo</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral completa da operação</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Receita Total" value={formatCurrency(totalRevenue)} subtitle={`${d?.activeCampaigns ?? 0} campanhas ativas`} icon={DollarSign} color="bg-emerald-500/20" loading={isLoading} />
        <KpiCard title="Total de Leads" value={totalLeads.toLocaleString("pt-BR")} subtitle={`${totalConversions} conversões`} icon={Users} color="bg-blue-500/20" loading={isLoading} />
        <KpiCard title="ROI Geral" value={`${roi.toFixed(1)}%`} subtitle={`Gasto: ${formatCurrency(totalSpent)}`} icon={TrendingUp} color="bg-amber-500/20" loading={isLoading} />
        <KpiCard title="MRR Total" value={formatCurrency(totalMrr)} subtitle={`${d?.squadCount ?? 0} squads · ${d?.clientCount ?? 0} clientes`} icon={BarChart3} color="bg-purple-500/20" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Equipe" value={String(d?.teamCount ?? 0)} subtitle="membros cadastrados" icon={UserCheck} loading={isLoading} />
        <KpiCard title="Squads" value={String(d?.squadCount ?? 0)} subtitle="squads ativos" icon={Building2} loading={isLoading} />
        <KpiCard title="Campanhas" value={String(d?.totalCampaigns ?? 0)} subtitle={`${d?.activeCampaigns ?? 0} ativas`} icon={Briefcase} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Distribuição de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            {taskData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">Nenhuma tarefa registrada</div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="name">
                      {taskData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              {taskData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}: <span className="text-foreground font-medium">{item.value}</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Resumo Operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tarefas Pendentes</span><span className="font-medium text-amber-400">{d?.tasks?.pending ?? 0}</span></div>
              <Progress value={d?.tasks?.total ? ((d.tasks.pending ?? 0) / d.tasks.total) * 100 : 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Em Progresso</span><span className="font-medium text-blue-400">{d?.tasks?.inProgress ?? 0}</span></div>
              <Progress value={d?.tasks?.total ? ((d.tasks.inProgress ?? 0) / d.tasks.total) * 100 : 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Concluídas</span><span className="font-medium text-emerald-400">{d?.tasks?.done ?? 0}</span></div>
              <Progress value={d?.tasks?.total ? ((d.tasks.done ?? 0) / d.tasks.total) * 100 : 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Vencidas</span><span className="font-medium text-red-400">{d?.tasks?.overdue ?? 0}</span></div>
              <Progress value={d?.tasks?.total ? ((d.tasks.overdue ?? 0) / d.tasks.total) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Head Dashboard ─────────────────────────────────────────────────

function HeadDashboard({ data, isLoading }: { data: any; isLoading: boolean }) {
  const d = data?.data;
  const squadMrr = d ? parseFloat(String(d.squadMrr ?? 0)) : 0;

  const taskBarData = useMemo(() => {
    if (!d?.tasks) return [];
    return [
      { name: "Pendentes", valor: d.tasks.pending ?? 0, fill: "oklch(0.70 0.18 50)" },
      { name: "Em Progresso", valor: d.tasks.inProgress ?? 0, fill: "oklch(0.65 0.18 250)" },
      { name: "Concluídas", valor: d.tasks.done ?? 0, fill: "oklch(0.70 0.18 160)" },
      { name: "Vencidas", valor: d.tasks.overdue ?? 0, fill: "oklch(0.65 0.20 340)" },
    ];
  }, [d]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard do Squad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {d?.squadNames?.length ? `Squads: ${d.squadNames.join(", ")}` : "Visão geral do seu squad"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="MRR do Squad" value={formatCurrency(squadMrr)} subtitle={`${d?.squadCount ?? 0} squad(s)`} icon={DollarSign} color="bg-emerald-500/20" loading={isLoading} />
        <KpiCard title="Clientes" value={String(d?.clientCount ?? 0)} subtitle="clientes no squad" icon={Building2} color="bg-blue-500/20" loading={isLoading} />
        <KpiCard title="Membros" value={String(d?.memberCount ?? 0)} subtitle="membros do squad" icon={Users} color="bg-purple-500/20" loading={isLoading} />
        <KpiCard title="Tarefas Totais" value={String(d?.tasks?.total ?? 0)} subtitle={`${d?.tasks?.overdue ?? 0} vencidas`} icon={ListTodo} color="bg-amber-500/20" loading={isLoading} />
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Status das Tarefas do Squad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskBarData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.014 260)" vertical={false} />
                <XAxis dataKey="name" stroke="oklch(0.60 0.02 260)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.60 0.02 260)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" name="Quantidade" radius={[6, 6, 0, 0]} barSize={48}>
                  {taskBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Commercial Dashboard (SDR/BDR/Closer) ─────────────────────────

function CommercialDashboard({ data, isLoading, position }: { data: any; isLoading: boolean; position: string }) {
  const d = data?.data;
  const totalValue = d ? parseFloat(String(d.totalValue ?? 0)) : 0;

  const pipelineData = useMemo(() => {
    if (!d) return [];
    return [
      { name: "Lead Frio", valor: d.leadFrio ?? 0, fill: "oklch(0.65 0.18 250)" },
      { name: "Follow Up", valor: d.followUp ?? 0, fill: "oklch(0.70 0.18 50)" },
      { name: "Reunião Marcada", valor: d.reuniaoMarcada ?? 0, fill: "oklch(0.70 0.18 160)" },
    ];
  }, [d]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Comercial</h1>
        <p className="text-sm text-muted-foreground mt-1">Seus indicadores como {POSITION_LABELS[position] ?? position}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total de Leads" value={String(d?.totalLeads ?? 0)} subtitle="no seu pipeline" icon={Users} color="bg-blue-500/20" loading={isLoading} />
        <KpiCard title="Lead Frio" value={String(d?.leadFrio ?? 0)} subtitle="aguardando contato" icon={Snowflake} color="bg-cyan-500/20" loading={isLoading} />
        <KpiCard title="Follow Up" value={String(d?.followUp ?? 0)} subtitle="em acompanhamento" icon={PhoneCall} color="bg-amber-500/20" loading={isLoading} />
        <KpiCard title="Reunião Marcada" value={String(d?.reuniaoMarcada ?? 0)} subtitle="agendadas" icon={CalendarCheck} color="bg-emerald-500/20" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pipeline de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.014 260)" vertical={false} />
                  <XAxis dataKey="name" stroke="oklch(0.60 0.02 260)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.60 0.02 260)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" name="Quantidade" radius={[6, 6, 0, 0]} barSize={56}>
                    {pipelineData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Suas Tarefas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <KpiCard title="Valor Total no Pipeline" value={formatCurrency(totalValue)} icon={DollarSign} loading={isLoading} />
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-amber-400" /><span className="text-sm">Pendentes</span></div>
                <span className="text-sm font-semibold">{d?.tasks?.pending ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3"><Target className="h-4 w-4 text-blue-400" /><span className="text-sm">Em Progresso</span></div>
                <span className="text-sm font-semibold">{d?.tasks?.inProgress ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /><span className="text-sm">Concluídas</span></div>
                <span className="text-sm font-semibold">{d?.tasks?.done ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3"><AlertTriangle className="h-4 w-4 text-red-400" /><span className="text-sm">Vencidas</span></div>
                <span className="text-sm font-semibold">{d?.tasks?.overdue ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Operational Dashboard (CS/Gestor/Social Media) ─────────────────

function OperationalDashboard({ data, isLoading, position }: { data: any; isLoading: boolean; position: string }) {
  const d = data?.data;
  const tasks = d?.tasks ?? { total: 0, pending: 0, inProgress: 0, done: 0, overdue: 0 };
  const completionRate = tasks.total > 0 ? ((tasks.done / tasks.total) * 100) : 0;

  const taskPieData = useMemo(() => {
    return [
      { name: "Pendentes", value: tasks.pending ?? 0 },
      { name: "Em Progresso", value: tasks.inProgress ?? 0 },
      { name: "Concluídas", value: tasks.done ?? 0 },
      { name: "Vencidas", value: tasks.overdue ?? 0 },
    ].filter(i => i.value > 0);
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Operacional</h1>
        <p className="text-sm text-muted-foreground mt-1">Seus indicadores como {POSITION_LABELS[position] ?? position}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Tarefas Totais" value={String(tasks.total)} subtitle={`${completionRate.toFixed(0)}% concluídas`} icon={ListTodo} color="bg-blue-500/20" loading={isLoading} />
        <KpiCard title="Pendentes" value={String(tasks.pending)} subtitle="aguardando início" icon={Clock} color="bg-amber-500/20" loading={isLoading} />
        <KpiCard title="Em Progresso" value={String(tasks.inProgress)} subtitle="em andamento" icon={Target} color="bg-cyan-500/20" loading={isLoading} />
        <KpiCard title="Vencidas" value={String(tasks.overdue)} subtitle="precisam de atenção" icon={AlertTriangle} color="bg-red-500/20" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Distribuição das Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            {taskPieData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">Nenhuma tarefa atribuída</div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="name">
                      {taskPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-4 justify-center mt-2">
              {taskPieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}: <span className="text-foreground font-medium">{item.value}</span></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="text-center">
              <p className="text-5xl font-bold tracking-tight">{completionRate.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground mt-2">Taxa de conclusão</p>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-lg font-semibold text-emerald-400">{tasks.done}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-lg font-semibold text-amber-400">{tasks.pending + tasks.inProgress}</p>
                <p className="text-xs text-muted-foreground">Em aberto</p>
              </div>
            </div>
            {(d?.unreadNotifications ?? 0) > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Bell className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-amber-300">{d.unreadNotifications} notificação(ões) não lida(s)</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Home Component ────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const { data: myStats, isLoading } = trpc.dashboard.myStats.useQuery();

  const position = (user as any)?.position as string | null | undefined;
  const dashType = myStats?.type ?? "empty";

  if (dashType === "clevel" || (!myStats && (position === "ceo" || position === "coo"))) {
    return <CLevelDashboard data={myStats} isLoading={isLoading} />;
  }

  if (dashType === "head") {
    return <HeadDashboard data={myStats} isLoading={isLoading} />;
  }

  if (dashType === "commercial") {
    return <CommercialDashboard data={myStats} isLoading={isLoading} position={position ?? "sdr"} />;
  }

  if (dashType === "operational") {
    return <OperationalDashboard data={myStats} isLoading={isLoading} position={position ?? "cs"} />;
  }

  // Fallback loading
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Carregando seus indicadores...</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <KpiCard key={i} title="" value="" icon={Target} loading />)}
      </div>
    </div>
  );
}
