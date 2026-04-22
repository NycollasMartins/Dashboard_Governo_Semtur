import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Wallet, BarChart3, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const sections = [
  {
    icon: Megaphone,
    title: "Campanhas",
    description: "Gerencie suas campanhas publicitárias, acompanhe status e performance de cada uma.",
    path: "/campaigns",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Wallet,
    title: "Orçamento",
    description: "Controle o orçamento de cada campanha com barras de progresso e alertas de limite.",
    path: "/budget",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Visualize relatórios de desempenho com gráficos de dispersão e filtros por período.",
    path: "/reports",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
];

export default function Commercial() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comercial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie campanhas, orçamentos e relatórios de desempenho
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <Card
            key={section.path}
            className="group cursor-pointer border-border/40 hover:border-border/60 transition-all duration-300 hover:shadow-lg"
            onClick={() => setLocation(section.path)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-xl ${section.bgColor} flex items-center justify-center`}>
                  <section.icon className={`h-5 w-5 ${section.color}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-base mt-3">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
