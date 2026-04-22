import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Check, X, UserMinus, Trash2, Clock, ShieldCheck, ShieldX,
  Users, UserCheck, UserX
} from "lucide-react";

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

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Check }> = {
  approved: { label: "Aprovado", variant: "default", icon: ShieldCheck },
  pending: { label: "Pendente", variant: "secondary", icon: Clock },
  rejected: { label: "Rejeitado", variant: "destructive", icon: ShieldX },
};

export default function Members() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: allMembers, isLoading } = trpc.members.listAll.useQuery();
  const { data: pendingUsers } = trpc.members.pending.useQuery();

  const approveMut = trpc.members.approve.useMutation({
    onSuccess: () => {
      toast.success("Usuário aprovado com sucesso!");
      utils.members.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMut = trpc.members.reject.useMutation({
    onSuccess: () => {
      toast.success("Usuário rejeitado.");
      utils.members.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMut = trpc.members.remove.useMutation({
    onSuccess: () => {
      toast.success("Membro removido do dashboard.");
      utils.members.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = trpc.members.deletePermanently.useMutation({
    onSuccess: () => {
      toast.success("Usuário excluído permanentemente.");
      utils.members.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const approved = allMembers?.filter(m => m.approvalStatus === "approved") ?? [];
  const pending = pendingUsers ?? [];
  const rejected = allMembers?.filter(m => m.approvalStatus === "rejected") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold tracking-tight">Gestão de Membros</h1>
        <p className="text-muted-foreground mt-1">Aprove, rejeite ou remova membros da plataforma.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approved.length}</p>
              <p className="text-xs text-muted-foreground">Membros Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Aguardando Aprovação</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejected.length}</p>
              <p className="text-xs text-muted-foreground">Rejeitados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={pending.length > 0 ? "pending" : "approved"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {pending.length > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Ativos ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados ({rejected.length})</TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum usuário aguardando aprovação.</p>
              </CardContent>
            </Card>
          ) : (
            pending.map((m) => (
              <Card key={m.id} className="border-border/50 border-l-4 border-l-amber-500">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{m.name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{m.email || "Sem email"}</p>
                    <p className="text-xs text-muted-foreground">
                      Registrado em {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMut.mutate({ userId: m.id })}
                      disabled={approveMut.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMut.mutate({ userId: m.id })}
                      disabled={rejectMut.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="space-y-3">
          {isLoading ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">Carregando...</CardContent>
            </Card>
          ) : (
            approved.map((m) => (
              <Card key={m.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {(m.name || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{m.name || "Sem nome"}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {POSITION_LABELS[m.position || ""] || "Sem cargo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{m.email || "Sem email"}</p>
                      <p className="text-xs text-muted-foreground">
                        Último acesso: {new Date(m.lastSignedIn).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Don't allow removing yourself or other C-levels */}
                    {m.id !== user?.id && !["ceo", "coo"].includes(m.position || "") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              <strong>{m.name}</strong> perderá acesso ao dashboard. Esta ação pode ser revertida aprovando o usuário novamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => removeMut.mutate({ userId: m.id })}
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-3">
          {rejected.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldX className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum usuário rejeitado.</p>
              </CardContent>
            </Card>
          ) : (
            rejected.map((m) => (
              <Card key={m.id} className="border-border/50 opacity-75">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{m.name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{m.email || "Sem email"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveMut.mutate({ userId: m.id })}
                      disabled={approveMut.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Reaprovar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Todos os dados de <strong>{m.name}</strong> serão removidos permanentemente. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMut.mutate({ userId: m.id })}
                          >
                            Excluir Permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
