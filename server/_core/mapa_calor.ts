// server/_core/mapa_calor.ts

// ==============================
// TYPES
// ==============================

export interface HeatmapData {
  region: string;
  latitude: number;
  longitude: number;
  clicks: number;
  impressions: number;
  conversions: number;
  intensity: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

export interface HeatmapFilters {
  startDate?: string;
  endDate?: string;
  campaignType?: string;
  region?: string;
}

export interface AIInsight {
  type: "performance" | "pattern" | "suggestion";
  message: string;
}

// ==============================
// MOCK DATA (TEMPORÁRIO)
// ==============================

const mockHeatmapData: HeatmapData[] = [
  {
    region: "Brasília",
    latitude: -15.793889,
    longitude: -47.882778,
    clicks: 1200,
    impressions: 5400,
    conversions: 210,
    intensity: 0.9,
  },
  {
    region: "São Paulo",
    latitude: -23.55052,
    longitude: -46.633308,
    clicks: 3200,
    impressions: 10400,
    conversions: 530,
    intensity: 1,
  },
  {
    region: "Rio de Janeiro",
    latitude: -22.906847,
    longitude: -43.172896,
    clicks: 2100,
    impressions: 8300,
    conversions: 410,
    intensity: 0.8,
  },
];

// ==============================
// SERVICE: API GOVERNO
// ==============================

export class GovernmentAdsService {
  private baseUrl: string;

  constructor() {
    // Futuramente substituir pela API real
    this.baseUrl = "https://api-governo-placeholder.com";
  }

  async fetchCampaignData(): Promise<Campaign[]> {
    try {
      // MOCK
      return [
        {
          id: "1",
          name: "Campanha Saúde",
          type: "saude",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Campanha Educação",
          type: "educacao",
          createdAt: new Date().toISOString(),
        },
      ];
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
      throw new Error("Erro ao buscar campanhas");
    }
  }

  async fetchHeatmapData(filters?: HeatmapFilters): Promise<HeatmapData[]> {
    try {
      // Simulação de filtro
      let data = mockHeatmapData;

      if (filters?.region) {
        data = data.filter((d) =>
          d.region.toLowerCase().includes(filters.region!.toLowerCase())
        );
      }

      return data;
    } catch (error) {
      console.error("Erro ao buscar heatmap:", error);
      throw new Error("Erro ao buscar dados do heatmap");
    }
  }
}

// ==============================
// SERVICE: IA PIPELINE
// ==============================

export class AIInsightsService {
  private pipelineUrl: string;

  constructor() {
    this.pipelineUrl = "https://ia-pipeline-placeholder.com";
  }

  async generateInsightsFromHeatmap(
    data: HeatmapData[]
  ): Promise<AIInsight[]> {
    try {
      // MOCK DE IA
      const bestRegion = data.reduce((prev, current) =>
        current.conversions > prev.conversions ? current : prev
      );

      return [
        {
          type: "performance",
          message: `A região com melhor performance é ${bestRegion.region}`,
        },
        {
          type: "pattern",
          message: "Campanhas com maior volume de impressões tendem a converter mais",
        },
        {
          type: "suggestion",
          message: "Aumentar investimento nas regiões com maior taxa de conversão",
        },
      ];
    } catch (error) {
      console.error("Erro na IA:", error);
      throw new Error("Erro ao gerar insights");
    }
  }
}

// ==============================
// CONTROLLER / CORE LOGIC
// ==============================

export class HeatmapController {
  private governmentService: GovernmentAdsService;
  private aiService: AIInsightsService;

  constructor() {
    this.governmentService = new GovernmentAdsService();
    this.aiService = new AIInsightsService();
  }

  async getHeatmapWithInsights(filters?: HeatmapFilters) {
    try {
      const heatmapData = await this.governmentService.fetchHeatmapData(filters);
      const insights = await this.aiService.generateInsightsFromHeatmap(
        heatmapData
      );

      return {
        heatmap: heatmapData,
        insights,
      };
    } catch (error) {
      console.error("Erro geral:", error);
      throw new Error("Erro ao montar dados do heatmap");
    }
  }
}