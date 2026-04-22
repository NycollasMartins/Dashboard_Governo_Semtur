import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, CheckCircle2, Clock, AlertCircle, CircleDot } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const ADMIN_POSITIONS = ["ceo", "coo"];
const MANAGER_POSITIONS = ["ceo", "coo", "head"];

const STATUS_CONFIG = {
  pending: { label: "Pendente", icon: Clock, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
  in_progress: { label: "Em Andamento", icon: CircleDot, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  done: { label: "Concluída", icon: CheckCircle2, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
};

const PRIORITY_CONFIG = {
  low: { label: "Baixa", color: "text-muted-foreground", bgColor: "bg-muted/50", borderColor: "border-border" },
  medium: { label: "Média", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  high: { label: "Alta", color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
  urgent: { label: "Urgente", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30" },
};

const POSITION_LABELS: Record<string, string> = {
  ceo: "CEO",
  coo: "COO",
  head: "Head",
  cs: "CS",
  gestor_trafego: "Gestor de Tráfego",
  social_media: "Social Media",
  sdr: "SDR",
  bdr: "BDR",
  closer: "Closer",
};

type TaskItem = {
  id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId: number;
  createdById: number;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function Tasks() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: tasks = [], isLoading } = trpc.tasks.list.useQuery();
  const { data: members = [] } = trpc.team.list.useQuery();

  // For Heads: fetch squad members to filter assignee dropdown
  const { data: userSquads = [] } = trpc.squads.list.useQuery();
  const firstSquadId = useMemo(() => userSquads[0]?.id ?? null, [userSquads]);
  const { data: squadMembersList = [] } = trpc.squadMembers.list.useQuery(
    { squadId: firstSquadId! },
    { enabled: !!firstSquadId }
  );

  const currentPos = (user?.position as string) || "cs";
  const isManager = MANAGER_POSITIONS.includes(currentPos);
  const isAdmin = ADMIN_POSITIONS.includes(currentPos);
  const isHead = currentPos === "head";

  // Filter assignable members: Heads see only their squad members, CEO/COO see all
  const assignableMembers = useMemo(() => {
    if (isAdmin) return members as any[];
    if (isHead && squadMembersList.length > 0) {
      const squadUserIds = new Set(squadMembersList.map((sm: any) => sm.userId));
      return (members as any[]).filter((m: any) => squadUserIds.has(m.id));
    }
    // Fallback: show only self
    return (members as any[]).filter((m: any) => m.id === user?.id);
  }, [members, squadMembersList, isAdmin, isHead, user?.id]);

  const createMut = trpc.tasks.create.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Demanda criada"); },
    onError: (err) => toast.error(err.message || "Erro ao criar demanda"),
  });
  const updateMut = trpc.tasks.update.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Demanda atualizada"); },
    onError: (err) => toast.error(err.message || "Erro ao atualizar demanda"),
  });
  const deleteMut = trpc.tasks.delete.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Demanda excluída"); },
    onError: (err) => toast.error(err.message || "Erro ao excluir demanda"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as "pending" | "in_progress" | "done",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    assigneeId: 0,
    dueDate: "",
  });

  const filteredTasks = useMemo(() => {
    if (filterStatus === "all") return tasks as TaskItem[];
    return (tasks as TaskItem[]).filter((t) => t.status === filterStatus);
  }, [tasks, filterStatus]);

  const memberMap = useMemo(() => {
    const map: Record<number, any> = {};
    for (const m of members as any[]) {
      map[m.id] = m;
    }
    return map;
  }, [members]);

  function openCreateDialog() {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      assigneeId: (members as any[])[0]?.id || 0,
      dueDate: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(task: TaskItem) {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formData.title.trim()) { toast.error("Título é obrigatório"); return; }
    if (!formData.assigneeId) { toast.error("Selecione um responsável"); return; }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      assigneeId: formData.assigneeId,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
    };

    if (editingTask) {
      updateMut.mutate({ id: editingTask.id, ...payload });
    } else {
      createMut.mutate(payload);
    }
    setDialogOpen(false);
  }

  // Stats
  const statCounts = useMemo(() => {
    const t = tasks as TaskItem[];
    return {
      total: t.length,
      pending: t.filter((x) => x.status === "pending").length,
      in_progress: t.filter((x) => x.status === "in_progress").length,
      done: t.filter((x) => x.status === "done").length,
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Demandas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isManager
              ? "Gerencie e atribua demandas para a equipe"
              : "Suas demandas e tarefas atribuídas"}
          </p>
        </div>
        {isManager && (
          <Button onClick={openCreateDialog} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Demanda
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <p className="text-2xl font-bold mt-1">{statCounts.total}</p>
          </CardContent>
        </Card>
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card key={key} className={`border ${cfg.borderColor} ${cfg.bgColor}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
                </div>
                <p className="text-2xl font-bold mt-1">{statCounts[key]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        {["all", "pending", "in_progress", "done"].map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
            className="text-xs h-7"
          >
            {s === "all" ? "Todas" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
          </Button>
        ))}
      </div>

      {/* Tasks Table */}
      <Card className="border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Demanda</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const statusCfg = STATUS_CONFIG[task.status];
                const priorityCfg = PRIORITY_CONFIG[task.priority];
                const assignee = memberMap[task.assigneeId];
                const StatusIcon = statusCfg.icon;

                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {assignee?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm">{assignee?.name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {POSITION_LABELS[assignee?.position || "cs"] || "CS"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Inline status change for members on their own tasks */}
                      {!isManager && task.assigneeId === user?.id ? (
                        <Select
                          value={task.status}
                          onValueChange={(val) => {
                            updateMut.mutate({ id: task.id, status: val as any });
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                <div className="flex items-center gap-1.5">
                                  <v.icon className={`h-3 w-3 ${v.color}`} />
                                  <span>{v.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`${statusCfg.bgColor} ${statusCfg.color} ${statusCfg.borderColor} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${priorityCfg.bgColor} ${priorityCfg.color} ${priorityCfg.borderColor}`}>
                        {priorityCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {isManager && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => openEditDialog(task)} className="cursor-pointer">
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Editar
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => deleteMut.mutate({ id: task.id })}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    {filterStatus === "all" ? "Nenhuma demanda encontrada" : "Nenhuma demanda com este status"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar Demanda" : "Nova Demanda"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título *</Label>
              <Input
                id="task-title"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Título da demanda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Descrição</Label>
              <Textarea
                id="task-desc"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detalhes da demanda..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Select
                  value={formData.assigneeId ? String(formData.assigneeId) : ""}
                  onValueChange={(val) => setFormData((p) => ({ ...p, assigneeId: parseInt(val) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableMembers.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        <div className="flex items-center gap-2">
                          <span>{m.name || "Sem nome"}</span>
                          <span className="text-muted-foreground text-xs">
                            ({POSITION_LABELS[m.position || "cs"] || "CS"})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData((p) => ({ ...p, priority: val as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <span className={v.color}>{v.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData((p) => ({ ...p, status: val as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-1.5">
                          <v.icon className={`h-3 w-3 ${v.color}`} />
                          <span>{v.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Prazo</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? "Salvar" : "Criar Demanda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
