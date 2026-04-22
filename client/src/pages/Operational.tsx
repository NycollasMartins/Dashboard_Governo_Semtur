import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, GripVertical, MoreHorizontal, Pencil, Trash2, User, Mail, Phone, Building2, DollarSign, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Stage = "lead_frio" | "follow_up" | "reuniao_marcada";

const STAGES: { id: Stage; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { id: "lead_frio", label: "Lead Frio", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  { id: "follow_up", label: "Follow Up", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  { id: "reuniao_marcada", label: "Reunião Marcada", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
];

type CrmLead = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  stage: Stage;
  value: string | null;
  notes: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Sortable Lead Card ──────────────────────────────────────────────

function SortableLeadCard({
  lead,
  onEdit,
  onDelete,
}: {
  lead: CrmLead;
  onEdit: (lead: CrmLead) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: { type: "lead", lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <LeadCard lead={lead} onEdit={onEdit} onDelete={onDelete} dragListeners={listeners} />
    </div>
  );
}

function LeadCard({
  lead,
  onEdit,
  onDelete,
  dragListeners,
  isOverlay,
}: {
  lead: CrmLead;
  onEdit?: (lead: CrmLead) => void;
  onDelete?: (id: number) => void;
  dragListeners?: any;
  isOverlay?: boolean;
}) {
  return (
    <Card className={`group border-border/40 bg-card/80 hover:bg-card transition-all duration-200 ${isOverlay ? "shadow-2xl ring-2 ring-primary/30 rotate-2" : "hover:shadow-md"}`}>
      <CardContent className="p-3.5">
        <div className="flex items-start gap-2">
          <button
            {...dragListeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
              {!isOverlay && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded hover:bg-accent shrink-0">
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => onEdit?.(lead)} className="cursor-pointer">
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete?.(lead.id)} className="cursor-pointer text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {lead.company && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{lead.company}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{lead.phone}</span>
                </div>
              )}
            </div>
            {lead.value && parseFloat(lead.value) > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                <DollarSign className="h-3 w-3" />
                R$ {parseFloat(lead.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            )}
            {lead.source && (
              <div className="mt-1.5">
                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-accent/50 text-muted-foreground font-medium">
                  {lead.source}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Droppable Column ────────────────────────────────────────────────

function KanbanColumn({
  stage,
  leads,
  onEdit,
  onDelete,
  onAddNew,
}: {
  stage: typeof STAGES[number];
  leads: CrmLead[];
  onEdit: (lead: CrmLead) => void;
  onDelete: (id: number) => void;
  onAddNew: (stage: Stage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: "column", stage: stage.id },
  });

  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);

  return (
    <div className="flex flex-col min-w-[300px] w-[340px] shrink-0">
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl border ${stage.borderColor} ${stage.bgColor}`}>
        <div className="flex items-center gap-2.5">
          <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.bgColor} ${stage.color} border ${stage.borderColor}`}>
            {leads.length}
          </span>
        </div>
        <button
          onClick={() => onAddNew(stage.id)}
          className={`h-7 w-7 flex items-center justify-center rounded-lg hover:bg-background/50 transition-colors ${stage.color}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 rounded-b-xl border border-t-0 border-border/30 bg-background/30 min-h-[200px] transition-colors duration-200 ${
          isOver ? "bg-primary/5 border-primary/30" : ""
        }`}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40">
            <User className="h-8 w-8 mb-2" />
            <p className="text-xs">Nenhum lead nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function Operational() {
  const utils = trpc.useUtils();
  const { data: leads = [], isLoading } = trpc.crmLeads.list.useQuery();
  const createMut = trpc.crmLeads.create.useMutation({
    onSuccess: () => { utils.crmLeads.list.invalidate(); toast.success("Lead criado com sucesso"); },
    onError: () => toast.error("Erro ao criar lead"),
  });
  const updateMut = trpc.crmLeads.update.useMutation({
    onSuccess: () => { utils.crmLeads.list.invalidate(); toast.success("Lead atualizado"); },
    onError: () => toast.error("Erro ao atualizar lead"),
  });
  const moveMut = trpc.crmLeads.moveStage.useMutation({
    onSuccess: () => { utils.crmLeads.list.invalidate(); },
    onError: () => toast.error("Erro ao mover lead"),
  });
  const deleteMut = trpc.crmLeads.delete.useMutation({
    onSuccess: () => { utils.crmLeads.list.invalidate(); toast.success("Lead excluído"); },
    onError: () => toast.error("Erro ao excluir lead"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [formStage, setFormStage] = useState<Stage>("lead_frio");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    value: "",
    notes: "",
  });
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const leadsByStage = useMemo(() => {
    const map: Record<Stage, CrmLead[]> = {
      lead_frio: [],
      follow_up: [],
      reuniao_marcada: [],
    };
    for (const lead of leads as CrmLead[]) {
      if (map[lead.stage]) {
        map[lead.stage].push(lead);
      }
    }
    // Sort by position within each stage
    for (const key of Object.keys(map) as Stage[]) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [leads]);

  const activeLead = useMemo(
    () => (activeId ? (leads as CrmLead[]).find((l) => l.id === activeId) : null),
    [activeId, leads]
  );

  function openCreateDialog(stage: Stage) {
    setEditingLead(null);
    setFormStage(stage);
    setFormData({ name: "", email: "", phone: "", company: "", source: "", value: "", notes: "" });
    setDialogOpen(true);
  }

  function openEditDialog(lead: CrmLead) {
    setEditingLead(lead);
    setFormStage(lead.stage);
    setFormData({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      source: lead.source || "",
      value: lead.value || "",
      notes: lead.notes || "",
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      company: formData.company.trim() || null,
      source: formData.source.trim() || null,
      value: formData.value.trim() || null,
      notes: formData.notes.trim() || null,
      stage: formStage,
    };
    if (editingLead) {
      updateMut.mutate({ id: editingLead.id, ...payload });
    } else {
      const stageLeads = leadsByStage[formStage];
      createMut.mutate({ ...payload, position: stageLeads.length });
    }
    setDialogOpen(false);
  }

  function handleDelete(id: number) {
    deleteMut.mutate({ id });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    const activeLead = activeData.lead as CrmLead;
    let targetStage: Stage;
    let targetPosition: number;

    // Determine target stage and position
    if (overData?.type === "column") {
      // Dropped on empty column
      targetStage = overData.stage as Stage;
      targetPosition = leadsByStage[targetStage].length;
    } else if (overData?.type === "lead") {
      // Dropped on another lead
      const overLead = overData.lead as CrmLead;
      targetStage = overLead.stage;
      const stageLeads = leadsByStage[targetStage];
      const overIndex = stageLeads.findIndex((l) => l.id === overLead.id);
      targetPosition = overIndex >= 0 ? overIndex : stageLeads.length;
    } else {
      // Fallback: check if over.id is a stage
      if (["lead_frio", "follow_up", "reuniao_marcada"].includes(over.id as string)) {
        targetStage = over.id as Stage;
        targetPosition = leadsByStage[targetStage].length;
      } else {
        return;
      }
    }

    // Only mutate if something changed
    if (activeLead.stage !== targetStage || activeLead.position !== targetPosition) {
      moveMut.mutate({
        id: activeLead.id,
        stage: targetStage,
        position: targetPosition,
      });
    }
  }

  function handleDragOver(event: DragOverEvent) {
    // We handle everything in dragEnd
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">CRM Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seus leads arrastando entre as etapas do funil
          </p>
        </div>
        <Button onClick={() => openCreateDialog("lead_frio")} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              leads={leadsByStage[stage.id]}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onAddNew={openCreateDialog}
            />
          ))}
          <DragOverlay>
            {activeLead ? (
              <div className="w-[320px]">
                <LeadCard lead={activeLead} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Nome *</Label>
                <Input
                  id="lead-name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nome do lead"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead-phone">Telefone</Label>
                <Input
                  id="lead-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-company">Empresa</Label>
                <Input
                  id="lead-company"
                  value={formData.company}
                  onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lead-source">Origem</Label>
                <Input
                  id="lead-source"
                  value={formData.source}
                  onChange={(e) => setFormData((p) => ({ ...p, source: e.target.value }))}
                  placeholder="Google Ads, Facebook..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-value">Valor (R$)</Label>
                <Input
                  id="lead-value"
                  value={formData.value}
                  onChange={(e) => setFormData((p) => ({ ...p, value: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-stage">Etapa</Label>
              <Select value={formStage} onValueChange={(v) => setFormStage(v as Stage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-notes">Observações</Label>
              <Textarea
                id="lead-notes"
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Anotações sobre o lead..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLead ? "Salvar" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
