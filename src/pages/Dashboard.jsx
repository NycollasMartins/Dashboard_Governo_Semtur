import { useState, useEffect } from "react";
import { Monitor, MousePointerClick, TrendingUp, DollarSign } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewTab from "@/components/dashboard/tabs/OverviewTab";
import CitiesTab from "@/components/dashboard/tabs/CitiesTab";
import CreativesTab from "@/components/dashboard/tabs/CreativesTab";
import { CAMPAIGNS, CITIES_DATA, CREATIVES, DAILY_TREND } from "@/lib/mockData";
import AIAssistant from "@/components/AIAssistant";
import { base44 } from "@/api/base44Client";

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

function buildMetrics(data) {
  const totalImpressions = data.reduce((s, r) => s + (r.impressoes_display || 0), 0);
  const totalClicks = data.reduce((s, r) => s + (r.cliques_display || 0), 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : "0.00";

  return [
    { title: "Impressões Totais", value: fmt(totalImpressions), subtitle: "Dados reais da planilha", icon: Monitor, trendValue: null, trend: "up", color: "purple" },
    { title: "Cliques Totais", value: fmt(totalClicks), subtitle: "Dados reais da planilha", icon: MousePointerClick, trendValue: null, trend: "up", color: "cyan" },
    { title: "CTR Médio", value: avgCTR + "%", subtitle: "Todas as campanhas", icon: TrendingUp, trendValue: null, trend: "up", color: "green" },
    { title: "Investimento Total", value: "R$ 0", subtitle: "Dado não disponível", icon: DollarSign, trendValue: null, trend: "up", color: "orange" },
  ];
}

// Coordenadas por cidade (chave = valor exato do campo "estado" na planilha)
const GEO_COORDS = {
  // Cidades confirmadas na planilha
  "Araçatuba":          { lat: -21.2091, lng: -50.4328, state: "SP" },
  "Belo Horizonte":     { lat: -19.9167, lng: -43.9345, state: "MG" },
  "Uberlândia":         { lat: -18.9186, lng: -48.2772, state: "MG" },
  "Cuiabá":             { lat: -15.6014, lng: -56.0979, state: "MT" },
  "Foz do Iguaçu":      { lat: -25.5163, lng: -54.5854, state: "PR" },
  // Cidades SP com sufixo " SP" (como aparecem na planilha)
  "São José do Rio Preto SP": { lat: -20.8113, lng: -49.3758, state: "SP" },
  "Ribeirão Preto SP":  { lat: -21.1784, lng: -47.8103, state: "SP" },
  "Ubatuba SP":         { lat: -23.4337, lng: -45.0838, state: "SP" },
  "Sorocaba SP":        { lat: -23.5015, lng: -47.4526, state: "SP" },
  "Campinas SP":        { lat: -22.9056, lng: -47.0608, state: "SP" },
  "Santos SP":          { lat: -23.9608, lng: -46.3336, state: "SP" },
  "Bauru SP":           { lat: -22.3246, lng: -49.0618, state: "SP" },
  "Presidente Prudente":{ lat: -22.1256, lng: -51.3889, state: "SP" },
  "Cascavel":           { lat: -24.9578, lng: -53.4595, state: "PR" },
  // Outras cidades brasileiras comuns
  "São Paulo":          { lat: -23.5505, lng: -46.6333, state: "SP" },
  "Rio de Janeiro":     { lat: -22.9068, lng: -43.1729, state: "RJ" },
  "Brasília":           { lat: -15.7801, lng: -47.9292, state: "DF" },
  "Curitiba":           { lat: -25.4290, lng: -49.2671, state: "PR" },
  "Porto Alegre":       { lat: -30.0346, lng: -51.2177, state: "RS" },
  "Salvador":           { lat: -12.9711, lng: -38.5108, state: "BA" },
  "Fortaleza":          { lat: -3.7327,  lng: -38.5270, state: "CE" },
  "Recife":             { lat: -8.0539,  lng: -34.8811, state: "PE" },
  "Manaus":             { lat: -3.1190,  lng: -60.0217, state: "AM" },
  "Belém":              { lat: -1.4558,  lng: -48.5044, state: "PA" },
  "Goiânia":            { lat: -16.6869, lng: -49.2648, state: "GO" },
  "Florianópolis":      { lat: -27.5954, lng: -48.5480, state: "SC" },
  "Natal":              { lat: -5.7945,  lng: -35.2110, state: "RN" },
  "Maceió":             { lat: -9.6658,  lng: -35.7350, state: "AL" },
  "Teresina":           { lat: -5.0892,  lng: -42.8016, state: "PI" },
  "Campo Grande":       { lat: -20.4697, lng: -54.6201, state: "MS" },
  "Porto Velho":        { lat: -8.7612,  lng: -63.9004, state: "RO" },
  "Macapá":             { lat: 0.0349,   lng: -51.0694, state: "AP" },
  "Rio Branco":         { lat: -9.9754,  lng: -67.8249, state: "AC" },
  "Boa Vista":          { lat: 2.8235,   lng: -60.6758, state: "RR" },
  "Palmas":             { lat: -10.2491, lng: -48.3243, state: "TO" },
  "São Luís":           { lat: -2.5297,  lng: -44.3028, state: "MA" },
  "Aracaju":            { lat: -10.9472, lng: -37.0731, state: "SE" },
  "João Pessoa":        { lat: -7.1195,  lng: -34.8450, state: "PB" },
  "Vitória":            { lat: -20.2976, lng: -40.2958, state: "ES" },
  "Campinas":           { lat: -22.9056, lng: -47.0608, state: "SP" },
  "Ribeirão Preto":     { lat: -21.1784, lng: -47.8103, state: "SP" },
  "Santos":             { lat: -23.9608, lng: -46.3336, state: "SP" },
  "São José dos Campos":{ lat: -23.1794, lng: -45.8869, state: "SP" },
  "Sorocaba":           { lat: -23.5015, lng: -47.4526, state: "SP" },
  "Osasco":             { lat: -23.5329, lng: -46.7916, state: "SP" },
  "Bauru":              { lat: -22.3246, lng: -49.0618, state: "SP" },
  "São José do Rio Preto": { lat: -20.8113, lng: -49.3758, state: "SP" },
  "Londrina":           { lat: -23.3045, lng: -51.1696, state: "PR" },
  "Maringá":            { lat: -23.4205, lng: -51.9333, state: "PR" },
  "Joinville":          { lat: -26.3044, lng: -48.8487, state: "SC" },
  "Niterói":            { lat: -22.8833, lng: -43.1036, state: "RJ" },
  "Duque de Caxias":    { lat: -22.7854, lng: -43.3116, state: "RJ" },
  "Juiz de Fora":       { lat: -21.7642, lng: -43.3503, state: "MG" },
  "Contagem":           { lat: -19.9317, lng: -44.0536, state: "MG" },
  "Feira de Santana":   { lat: -12.2664, lng: -38.9663, state: "BA" },
  "Mogi das Cruzes":    { lat: -23.5222, lng: -46.1875, state: "SP" },
};

function buildTrendData(data) {
  const map = {};
  data.forEach((r) => {
    const dia = r.dia || "";
    if (!dia) return;
    if (!map[dia]) map[dia] = { date: dia, impressions: 0, clicks: 0 };
    map[dia].impressions += r.impressoes_display || 0;
    map[dia].clicks += r.cliques_display || 0;
  });
  // Sort by date (dd/mm/yyyy) and take last 11 days
  return Object.values(map)
    .sort((a, b) => {
      const [da, ma, ya] = a.date.split("/").map(Number);
      const [db, mb, yb] = b.date.split("/").map(Number);
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    })
    .slice(-11);
}

function buildTopCities(data) {
  const map = {};
  const topCreativeMap = {};
  data.forEach((r) => {
    const name = r.estado || "";
    if (!name) return;
    if (!map[name]) map[name] = { city: name, impressions: 0, clicks: 0 };
    map[name].impressions += r.impressoes_display || 0;
    map[name].clicks += r.cliques_display || 0;
    // track creative breakdown and top creative by clicks
    if (r.criativo) {
      if (!topCreativeMap[name]) topCreativeMap[name] = {};
      topCreativeMap[name][r.criativo] = (topCreativeMap[name][r.criativo] || 0) + (r.cliques_display || 0);
    }
  });
  return Object.values(map)
    .map((c) => {
      const geo = GEO_COORDS[c.city] || null;
      const creatives = topCreativeMap[c.city] || {};
      const topCreative = Object.entries(creatives).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
      return {
        ...c,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        state: geo?.state ?? c.city,
        spend: 0,
        topCreative,
        creativeBreakdown: creatives,
        ctr: c.impressions > 0 ? (c.clicks / c.impressions * 100).toFixed(2) : "0.00",
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [campaignData, setCampaignData] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [realMetrics, setRealMetrics] = useState(null);
  const [realTopCities, setRealTopCities] = useState([]);
  const [realTrendData, setRealTrendData] = useState([]);

  useEffect(() => {
    base44.entities.CampaignData.list('created_date', 1000).then((data) => {
      setRealMetrics(buildMetrics(data));
      setRealTopCities(buildTopCities(data));
      setRealTrendData(buildTrendData(data));
      setCampaignData(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="flex-1 min-w-0 px-6 lg:px-10 py-8 space-y-6 overflow-y-auto">
        {activeTab === "overview" && (
          <OverviewTab
            metrics={realMetrics || buildMetrics([])}
            trendData={realTrendData.length > 0 ? realTrendData : DAILY_TREND}
            cities={realTopCities}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
          />
        )}
        {activeTab === "cities" && (
          <CitiesTab
            cities={realTopCities.length > 0 ? realTopCities : CITIES_DATA}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
          />
        )}
        {activeTab === "creatives" && (
          <CreativesTab campaignData={campaignData} />
        )}
      </main>
      <AIAssistant />
    </div>
  );
}