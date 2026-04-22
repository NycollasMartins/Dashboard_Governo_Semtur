import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip } from "recharts";
import { trpc } from "@/lib/trpc";

interface HeatmapData {
  latitude: number;
  longitude: number;
  intensity: number;
  region: string;
}

interface Insight {
  type: string;
  message: string;
}

export default function HeatmapGoverno() {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  const query = trpc.heatmap.getHeatmapWithInsights.useQuery();

  useEffect(() => {
    if (query.data) {
      setData(query.data.heatmap);
      setInsights(query.data.insights);
    }
  }, [query.data]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Heatmap Governo</h1>

      <div className="grid grid-cols-3 gap-6">
        
        {/* HEATMAP */}
        <Card className="col-span-2 p-4">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <XAxis dataKey="longitude" name="Longitude" />
              <YAxis dataKey="latitude" name="Latitude" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={data} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        {/* INSIGHTS */}
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Insights IA</h2>
          {insights.map((insight, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-muted text-sm"
            >
              {insight.message}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}