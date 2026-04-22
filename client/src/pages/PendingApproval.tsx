import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, ShieldCheck } from "lucide-react";

export default function PendingApproval() {
  const { user, logout } = useAuth();

  const status = (user as any)?.approvalStatus;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center space-y-4 pb-2">
          {status === "rejected" ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-serif">Acesso Negado</CardTitle>
              <CardDescription className="text-base">
                Seu acesso foi negado por um administrador. Se acredita que isso é um erro, entre em contato com o responsável pela plataforma.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl font-serif">Aguardando Aprovação</CardTitle>
              <CardDescription className="text-base">
                Sua conta foi criada com sucesso! Um administrador (CEO ou COO) precisa aprovar seu acesso antes que você possa utilizar a plataforma.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Nome:</span> {user?.name || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Email:</span> {user?.email || "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Status:</span>{" "}
              <span className={status === "rejected" ? "text-destructive font-medium" : "text-amber-500 font-medium"}>
                {status === "rejected" ? "Rejeitado" : "Pendente"}
              </span>
            </p>
          </div>

          {status !== "rejected" && (
            <p className="text-xs text-muted-foreground text-center">
              Esta página será atualizada automaticamente quando seu acesso for aprovado.
            </p>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
