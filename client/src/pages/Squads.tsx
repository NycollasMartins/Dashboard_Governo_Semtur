import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Building2,
  Clock,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  UserPlus,
  UserMinus,
  Shield,
} from "lucide-react";

const PIPELINE_STAGES = [
  { value: "prospeccao", label: "Prospecção", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  { value: "onboarding", label: "Onboarding", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  { value: "ativo", label: "Ativo", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  { value: "churn_risk", label: "Risco de Churn", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  { value: "churned", label: "Churned", color: "bg-red-500/15 text-red-400 border-red-500/20" },
] as const;

function getPipelineBadge(stage: string) {
  const s = PIPELINE_STAGES.find((p) => p.value === stage) ?? PIPELINE_STAGES[0];
  return <Badge variant="outline" className={`${s.color} text-xs font-medium`}>{s.label}</Badge>;
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

export default function Squads() {
  const [selectedSquadId, setSelectedSquadId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showSquadDialog, setShowSquadDialog] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingSquad, setEditingSquad] = useState<any>(null);
  const [editingClient, setEditingClient] = useState<any>(null);

  // Squad form
  const [squadForm, setSquadForm] = useState({ name: "", mrrMonthly: "", roiMin: "", roiMax: "", headId: "" });
  // Client form
  const [clientForm, setClientForm] = useState({
    name: "", email: "", phone: "", pipelineStage: "prospeccao" as string,
    businessHours: "", businessDays: "", clinicLocation: "", highDemandRegion: "",
    paymentMethod: "", paymentNotes: "", monthlyBudget: "", currentRoi: "", notes: "",
  });

  const utils = trpc.useUtils();
  const { data: squads = [], isLoading: squadsLoading } = trpc.squads.list.useQuery();
  const { data: teamMembers = [] } = trpc.team.list.useQuery();
  const { data: clients = [], isLoading: clientsLoading } = trpc.clients.list.useQuery(
    selectedSquadId ? { squadId: selectedSquadId } : undefined
  );

  const selectedSquad = useMemo(() => squads.find((s: any) => s.id === selectedSquadId), [squads, selectedSquadId]);
  const selectedClient = useMemo(() => clients.find((c: any) => c.id === selectedClientId), [clients, selectedClientId]);

  const [showMembersDialog, setShowMembersDialog] = useState(false);

  // Squad members query
  const { data: squadMembers = [], isLoading: membersLoading } = trpc.squadMembers.list.useQuery(
    { squadId: selectedSquadId! },
    { enabled: !!selectedSquadId }
  );

  const addMemberMut = trpc.squadMembers.add.useMutation({
    onSuccess: () => { utils.squadMembers.list.invalidate(); setShowMembersDialog(false); toast.success("Membro adicionado ao squad"); },
    onError: (e) => toast.error(e.message),
  });
  const removeMemberMut = trpc.squadMembers.remove.useMutation({
    onSuccess: () => { utils.squadMembers.list.invalidate(); toast.success("Membro removido do squad"); },
    onError: (e) => toast.error(e.message),
  });

  const squadMemberIds = useMemo(() => new Set(squadMembers.map((m: any) => m.userId)), [squadMembers]);
  const availableMembers = useMemo(() => teamMembers.filter((m: any) => !squadMemberIds.has(m.id)), [teamMembers, squadMemberIds]);

  const POSITION_LABELS: Record<string, string> = {
    ceo: "CEO", coo: "COO", head: "Head", cs: "CS",
    gestor_trafego: "Gestor de Tr\u00e1fego", social_media: "Social Media",
    sdr: "SDR", bdr: "BDR", closer: "Closer",
  };

  const createSquadMut = trpc.squads.create.useMutation({
    onSuccess: () => { utils.squads.list.invalidate(); setShowSquadDialog(false); toast.success("Squad criado com sucesso"); },
    onError: (e) => toast.error(e.message),
  });
  const updateSquadMut = trpc.squads.update.useMutation({
    onSuccess: () => { utils.squads.list.invalidate(); setShowSquadDialog(false); toast.success("Squad atualizado"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSquadMut = trpc.squads.delete.useMutation({
    onSuccess: () => { utils.squads.list.invalidate(); setSelectedSquadId(null); toast.success("Squad excluído"); },
    onError: (e) => toast.error(e.message),
  });

  const createClientMut = trpc.clients.create.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); setShowClientDialog(false); toast.success("Cliente adicionado"); },
    onError: (e) => toast.error(e.message),
  });
  const updateClientMut = trpc.clients.update.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); setShowClientDialog(false); setSelectedClientId(null); toast.success("Cliente atualizado"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteClientMut = trpc.clients.delete.useMutation({
    onSuccess: () => { utils.clients.list.invalidate(); setSelectedClientId(null); toast.success("Cliente excluído"); },
    onError: (e) => toast.error(e.message),
  });

  function openNewSquad() {
    setEditingSquad(null);
    setSquadForm({ name: "", mrrMonthly: "", roiMin: "", roiMax: "", headId: "" });
    setShowSquadDialog(true);
  }

  function openEditSquad(squad: any) {
    setEditingSquad(squad);
    setSquadForm({
      name: squad.name,
      mrrMonthly: String(squad.mrrMonthly ?? ""),
      roiMin: String(squad.roiMin ?? ""),
      roiMax: String(squad.roiMax ?? ""),
      headId: squad.headId ? String(squad.headId) : "",
    });
    setShowSquadDialog(true);
  }

  function saveSquad() {
    const payload = {
      name: squadForm.name,
      mrrMonthly: squadForm.mrrMonthly || "0",
      roiMin: squadForm.roiMin || "0",
      roiMax: squadForm.roiMax || "0",
      headId: squadForm.headId ? parseInt(squadForm.headId) : null,
    };
    if (editingSquad) {
      updateSquadMut.mutate({ id: editingSquad.id, ...payload });
    } else {
      createSquadMut.mutate(payload);
    }
  }

  function openNewClient() {
    setEditingClient(null);
    setClientForm({
      name: "", email: "", phone: "", pipelineStage: "prospeccao",
      businessHours: "", businessDays: "", clinicLocation: "", highDemandRegion: "",
      paymentMethod: "", paymentNotes: "", monthlyBudget: "", currentRoi: "", notes: "",
    });
    setShowClientDialog(true);
  }

  function openEditClient(client: any) {
    setEditingClient(client);
    setClientForm({
      name: client.name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      pipelineStage: client.pipelineStage ?? "prospeccao",
      businessHours: client.businessHours ?? "",
      businessDays: client.businessDays ?? "",
      clinicLocation: client.clinicLocation ?? "",
      highDemandRegion: client.highDemandRegion ?? "",
      paymentMethod: client.paymentMethod ?? "",
      paymentNotes: client.paymentNotes ?? "",
      monthlyBudget: String(client.monthlyBudget ?? ""),
      currentRoi: String(client.currentRoi ?? ""),
      notes: client.notes ?? "",
    });
    setShowClientDialog(true);
  }

  function saveClient() {
    if (!selectedSquadId) return;
    const payload = {
      squadId: selectedSquadId,
      name: clientForm.name,
      email: clientForm.email || null,
      phone: clientForm.phone || null,
      pipelineStage: clientForm.pipelineStage as any,
      businessHours: clientForm.businessHours || null,
      businessDays: clientForm.businessDays || null,
      clinicLocation: clientForm.clinicLocation || null,
      highDemandRegion: clientForm.highDemandRegion || null,
      paymentMethod: clientForm.paymentMethod || null,
      paymentNotes: clientForm.paymentNotes || null,
      monthlyBudget: clientForm.monthlyBudget || "0",
      currentRoi: clientForm.currentRoi || "0",
      notes: clientForm.notes || null,
    };
    if (editingClient) {
      updateClientMut.mutate({ id: editingClient.id, ...payload });
    } else {
      createClientMut.mutate(payload);
    }
  }

  // ─── Client Detail View ───────────────────────────────────────────
  if (selectedClientId && selectedClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedClientId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{selectedClient.name}</h1>
            <p className="text-sm text-muted-foreground">Detalhes do cliente</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditClient(selectedClient)}>
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
              onClick={() => { if (confirm("Excluir este cliente?")) deleteClientMut.mutate({ id: selectedClient.id }); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Orçamento Mensal</p>
                  <p className="text-xl font-semibold">{formatCurrency(selectedClient.monthlyBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ROI Atual</p>
                  <p className="text-xl font-semibold">{Number(selectedClient.currentRoi).toFixed(1)}x</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pipeline</p>
                  <div className="mt-1">{getPipelineBadge(selectedClient.pipelineStage)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações da Clínica */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Informações da Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Horário de Funcionamento</p>
                  <p className="text-sm">{selectedClient.businessHours || "Não informado"}</p>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Dias de Funcionamento</p>
                  <p className="text-sm">{selectedClient.businessDays || "Não informado"}</p>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Localização da Clínica</p>
                  <p className="text-sm">{selectedClient.clinicLocation || "Não informado"}</p>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Região de Maior Demanda para Tráfego</p>
                  <p className="text-sm">{selectedClient.highDemandRegion || "Não informado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Pagamento */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Pagamento e Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Forma de Pagamento das Campanhas</p>
                  <p className="text-sm">{selectedClient.paymentMethod || "Não informado"}</p>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Observações de Pagamento</p>
                  <p className="text-sm">{selectedClient.paymentNotes || "Nenhuma observação"}</p>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">E-mail</p>
                  <p className="text-sm">{selectedClient.email || "Não informado"}</p>
                </div>
              </div>
              <Separator className="bg-border/30" />
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Telefone</p>
                  <p className="text-sm">{selectedClient.phone || "Não informado"}</p>
                </div>
              </div>
              {selectedClient.notes && (
                <>
                  <Separator className="bg-border/30" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Notas</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedClient.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Squad Detail View (clients list) ─────────────────────────────
  if (selectedSquadId && selectedSquad) {
    const squadClients = clients;
    const totalMRR = squadClients.reduce((sum: number, c: any) => sum + Number(c.monthlyBudget || 0), 0);
    const avgRoi = squadClients.length > 0
      ? squadClients.reduce((sum: number, c: any) => sum + Number(c.currentRoi || 0), 0) / squadClients.length
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSquadId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{selectedSquad.name}</h1>
            <p className="text-sm text-muted-foreground">Pipeline de clientes do squad</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditSquad(selectedSquad)}>
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar Squad
            </Button>
            <Button size="sm" onClick={openNewClient}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Novo Cliente
            </Button>
          </div>
        </div>

        {/* Squad KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">MRR Mensal</p>
                  <p className="text-xl font-semibold">{formatCurrency(selectedSquad.mrrMonthly)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Faixa de ROI</p>
                  <p className="text-xl font-semibold">{Number(selectedSquad.roiMin).toFixed(1)}x – {Number(selectedSquad.roiMax).toFixed(1)}x</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                  <p className="text-xl font-semibold">{squadClients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Squad Members */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Membros do Squad
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowMembersDialog(true)}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Adicionar
            </Button>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : squadMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum membro neste squad</p>
              </div>
            ) : (
              <div className="space-y-2">
                {squadMembers.map((sm: any) => {
                  const member = teamMembers.find((m: any) => m.id === sm.userId);
                  if (!member) return null;
                  return (
                    <div key={sm.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background/50">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {(member.name || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name || member.email}</p>
                        <p className="text-xs text-muted-foreground">{(member.position ? POSITION_LABELS[member.position] : null) || member.position || "Sem cargo"}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {sm.role === "head" ? "Head" : "Membro"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Remover ${member.name || member.email} do squad?`)) {
                            removeMemberMut.mutate({ squadId: selectedSquadId!, userId: sm.userId });
                          }
                        }}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Member Dialog */}
        <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Membro ao Squad</DialogTitle>
              <DialogDescription>Selecione um membro da equipe para adicionar</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto">
              {availableMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Todos os membros j\u00e1 est\u00e3o neste squad</p>
                </div>
              ) : (
                availableMembers.map((member: any) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      addMemberMut.mutate({
                        squadId: selectedSquadId!,
                        userId: member.id,
                        role: member.position === "head" ? "head" : "member",
                      });
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background/50 hover:bg-accent/30 transition-all text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {(member.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name || member.email}</p>
                      <p className="text-xs text-muted-foreground">{(member.position ? POSITION_LABELS[member.position] : null) || member.position || "Sem cargo"}</p>
                    </div>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMembersDialog(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pipeline */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Pipeline de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : squadClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum cliente neste squad</p>
                <Button size="sm" className="mt-3" onClick={openNewClient}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar Cliente
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {squadClients.map((client: any) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-background/50 hover:bg-accent/30 transition-all text-left group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.email || client.phone || "Sem contato"}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-sm font-medium">{formatCurrency(client.monthlyBudget)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">ROI</p>
                        <p className="text-sm font-medium">{Number(client.currentRoi).toFixed(1)}x</p>
                      </div>
                      {getPipelineBadge(client.pipelineStage)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Dialog */}
        <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
              <DialogDescription>Preencha as informações do cliente</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} placeholder="Nome do cliente" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pipeline</Label>
                    <Select value={clientForm.pipelineStage} onValueChange={(v) => setClientForm({ ...clientForm, pipelineStage: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Informações da Clínica</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horário de Funcionamento</Label>
                    <Input value={clientForm.businessHours} onChange={(e) => setClientForm({ ...clientForm, businessHours: e.target.value })} placeholder="08:00 - 18:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dias de Funcionamento</Label>
                    <Input value={clientForm.businessDays} onChange={(e) => setClientForm({ ...clientForm, businessDays: e.target.value })} placeholder="Seg a Sex" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Localização da Clínica</Label>
                    <Input value={clientForm.clinicLocation} onChange={(e) => setClientForm({ ...clientForm, clinicLocation: e.target.value })} placeholder="Endereço completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Região de Maior Demanda</Label>
                    <Input value={clientForm.highDemandRegion} onChange={(e) => setClientForm({ ...clientForm, highDemandRegion: e.target.value })} placeholder="Bairros / regiões" />
                  </div>
                </div>
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Financeiro</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Orçamento Mensal (R$)</Label>
                    <Input value={clientForm.monthlyBudget} onChange={(e) => setClientForm({ ...clientForm, monthlyBudget: e.target.value })} placeholder="5000" type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label>ROI Atual (x)</Label>
                    <Input value={clientForm.currentRoi} onChange={(e) => setClientForm({ ...clientForm, currentRoi: e.target.value })} placeholder="3.5" type="number" step="0.1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Input value={clientForm.paymentMethod} onChange={(e) => setClientForm({ ...clientForm, paymentMethod: e.target.value })} placeholder="Cartão, Boleto, Pix..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Obs. Pagamento</Label>
                    <Input value={clientForm.paymentNotes} onChange={(e) => setClientForm({ ...clientForm, paymentNotes: e.target.value })} placeholder="Observações" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} placeholder="Observações gerais..." rows={3} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClientDialog(false)}>Cancelar</Button>
              <Button onClick={saveClient} disabled={!clientForm.name || createClientMut.isPending || updateClientMut.isPending}>
                {(createClientMut.isPending || updateClientMut.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingClient ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Squads List View ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Squads</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus squads, clientes e métricas</p>
        </div>
        <Button onClick={openNewSquad}>
          <Plus className="h-4 w-4 mr-2" /> Novo Squad
        </Button>
      </div>

      {squadsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : squads.length === 0 ? (
        <Card className="bg-card/50 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">Nenhum squad criado ainda</p>
            <Button size="sm" className="mt-4" onClick={openNewSquad}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Criar Primeiro Squad
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {squads.map((squad: any) => {
            const headMember = teamMembers.find((m: any) => m.id === squad.headId);
            return (
              <Card
                key={squad.id}
                className="bg-card/50 border-border/40 hover:border-border/60 transition-all cursor-pointer group"
                onClick={() => setSelectedSquadId(squad.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{squad.name}</p>
                        {headMember && (
                          <p className="text-xs text-muted-foreground">Head: {headMember.name}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">MRR</p>
                      <p className="text-sm font-semibold mt-0.5">{formatCurrency(squad.mrrMonthly)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ROI</p>
                      <p className="text-sm font-semibold mt-0.5">{Number(squad.roiMin).toFixed(1)}x–{Number(squad.roiMax).toFixed(1)}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Clientes</p>
                      <p className="text-sm font-semibold mt-0.5">—</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Squad Dialog */}
      <Dialog open={showSquadDialog} onOpenChange={setShowSquadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSquad ? "Editar Squad" : "Novo Squad"}</DialogTitle>
            <DialogDescription>Configure as informações do squad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={squadForm.name} onChange={(e) => setSquadForm({ ...squadForm, name: e.target.value })} placeholder="Nome do squad" />
            </div>
            <div className="space-y-2">
              <Label>Head</Label>
              <Select value={squadForm.headId} onValueChange={(v) => setSquadForm({ ...squadForm, headId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar head" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.filter((m: any) => m.position === "head" || m.position === "ceo" || m.position === "coo").map((m: any) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name || m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>MRR (R$)</Label>
                <Input value={squadForm.mrrMonthly} onChange={(e) => setSquadForm({ ...squadForm, mrrMonthly: e.target.value })} placeholder="0" type="number" />
              </div>
              <div className="space-y-2">
                <Label>ROI Min</Label>
                <Input value={squadForm.roiMin} onChange={(e) => setSquadForm({ ...squadForm, roiMin: e.target.value })} placeholder="0" type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label>ROI Max</Label>
                <Input value={squadForm.roiMax} onChange={(e) => setSquadForm({ ...squadForm, roiMax: e.target.value })} placeholder="0" type="number" step="0.1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSquadDialog(false)}>Cancelar</Button>
            <Button onClick={saveSquad} disabled={!squadForm.name || createSquadMut.isPending || updateSquadMut.isPending}>
              {(createSquadMut.isPending || updateSquadMut.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSquad ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
