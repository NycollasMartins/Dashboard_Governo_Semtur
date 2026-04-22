import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Shield, Users, Briefcase, Megaphone, Palette, Loader2, PhoneCall, Target, Handshake } from "lucide-react";
import { toast } from "sonner";

const POSITIONS = [
  { value: "ceo", label: "CEO", icon: Crown, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30", description: "Acesso total ao sistema" },
  { value: "coo", label: "COO", icon: Shield, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30", description: "Acesso total ao sistema" },
  { value: "head", label: "Head", icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", description: "Gerencia o squad e atribui demandas" },
  { value: "cs", label: "CS", icon: Briefcase, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30", description: "Vê apenas suas demandas" },
  { value: "gestor_trafego", label: "Gestor de Tráfego", icon: Megaphone, color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30", description: "Vê apenas suas demandas" },
  { value: "social_media", label: "Social Media", icon: Palette, color: "text-pink-400", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/30", description: "Vê apenas suas demandas" },
  { value: "sdr", label: "SDR", icon: PhoneCall, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30", description: "Prospecção e qualificação de leads" },
  { value: "bdr", label: "BDR", icon: Target, color: "text-indigo-400", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/30", description: "Desenvolvimento de negócios" },
  { value: "closer", label: "Closer", icon: Handshake, color: "text-rose-400", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/30", description: "Fechamento de vendas" },
] as const;

function getPositionInfo(pos: string | null | undefined) {
  return POSITIONS.find((p) => p.value === pos) || POSITIONS[3]; // default to CS
}

export default function Team() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: members = [], isLoading } = trpc.team.list.useQuery();
  const updatePositionMut = trpc.team.updatePosition.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Cargo atualizado com sucesso");
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar cargo"),
  });

  const currentUserPos = user?.position || "cs";
  const canEditPositions = currentUserPos === "ceo" || currentUserPos === "coo";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os membros da equipe e seus cargos
        </p>
      </div>

      {/* Position Cards Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {POSITIONS.map((pos) => {
          const count = members.filter((m: any) => (m.position || "cs") === pos.value).length;
          const Icon = pos.icon;
          return (
            <Card key={pos.value} className={`border ${pos.borderColor} ${pos.bgColor}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${pos.color}`} />
                  <span className={`text-xs font-semibold ${pos.color}`}>{pos.label}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{pos.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Table */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Último Acesso</TableHead>
                {canEditPositions && <TableHead className="w-[200px]">Alterar Cargo</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member: any) => {
                const posInfo = getPositionInfo(member.position);
                const Icon = posInfo.icon;
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                            {member.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.name || "Sem nome"}</p>
                          {member.id === user?.id && (
                            <span className="text-[10px] text-muted-foreground">(você)</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${posInfo.bgColor} ${posInfo.color} ${posInfo.borderColor} gap-1.5`}>
                        <Icon className="h-3 w-3" />
                        {posInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.lastSignedIn
                        ? new Date(member.lastSignedIn).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                    {canEditPositions && (
                      <TableCell>
                        <Select
                          value={member.position || "cs"}
                          onValueChange={(val) => {
                            updatePositionMut.mutate({ userId: member.id, position: val as any });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POSITIONS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                <div className="flex items-center gap-2">
                                  <p.icon className={`h-3 w-3 ${p.color}`} />
                                  <span>{p.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEditPositions ? 5 : 4} className="text-center py-10 text-muted-foreground">
                    Nenhum membro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
