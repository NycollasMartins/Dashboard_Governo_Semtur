import { Megaphone } from "lucide-react";
import CampaignTable from "@/components/dashboard/CampaignTable";
import TopCreatives from "@/components/dashboard/TopCreatives";

export default function CampaignsTab({ campaigns, creatives }) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-sora font-bold text-foreground text-lg">Campanhas</h2>
          <p className="text-xs text-muted-foreground">Investimento, progresso e criativos em destaque</p>
        </div>
      </div>
      <TopCreatives creatives={creatives} />
      <CampaignTable campaigns={campaigns} />
    </div>
  );
}