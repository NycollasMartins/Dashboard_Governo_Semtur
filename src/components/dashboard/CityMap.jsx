import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Maximize2, Minimize2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n;
}

function InvalidateSize({ trigger }) {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 50); }, [trigger]);
  return null;
}

function MapMarkers({ cities, selectedCity, onSelectCity, maxImp }) {
  const sorted = [...cities].sort((a, b) => b.impressions - a.impressions);
  const validCities = cities.filter((c) => c.lat && c.lng && !(c.lat === -14.5 && c.lng === -51.5));
  return validCities.map((c) => {
    const rank = sorted.findIndex((s) => s.city === c.city) + 1;
    const radius = 8 + (c.impressions / maxImp) * 28;
    const isSelected = selectedCity?.city === c.city;

    const rankIcon = L.divIcon({
      className: "",
      html: `<div style="width:${radius * 2}px;height:${radius * 2}px;display:flex;align-items:center;justify-content:center;pointer-events:none;">
        <span style="font-size:${radius > 22 ? 13 : 10}px;font-weight:700;color:#fff;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,0.4)">${rank}</span>
      </div>`,
      iconSize: [radius * 2, radius * 2],
      iconAnchor: [radius, radius],
    });

    return [
      <CircleMarker
        key={c.city + "-circle"}
        center={[c.lat, c.lng]}
        radius={radius}
        pathOptions={{
          fillColor: isSelected ? "#E68A40" : "#234578",
          fillOpacity: isSelected ? 0.9 : 0.6,
          color: isSelected ? "#c96e28" : "#1a3460",
          weight: isSelected ? 2.5 : 1.5,
        }}
        eventHandlers={{ click: () => onSelectCity(c) }}
      >
        <Tooltip direction="top" offset={[0, -radius]} opacity={1}>
          <div className="text-xs">
            <strong>#{rank} {c.city} – {c.state}</strong><br />
            Impressões: {fmt(c.impressions)}<br />
            Cliques: {fmt(c.clicks)} | CTR: {c.ctr}%
          </div>
        </Tooltip>
      </CircleMarker>,
      <Marker
        key={c.city + "-rank"}
        position={[c.lat, c.lng]}
        icon={rankIcon}
        interactive={false}
        zIndexOffset={1000}
      />
    ];
  });
}

function RankingSidebar({ selectedCity, onSelectCity, cities }) {
  const sorted = [...cities].sort((a, b) => b.impressions - a.impressions);

  return (
    <div className="w-2/5 flex-shrink-0 border-l border-border flex flex-col bg-card">
      <div className="px-4 py-3.5 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ranking de Performance</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((city, i) => {
          const isSelected = selectedCity?.city === city.city;
          const maxImp = sorted[0].impressions;
          const pct = Math.round((city.impressions / maxImp) * 100);
          return (
            <button
              key={city.city}
              onClick={() => onSelectCity(isSelected ? null : city)}
              className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors flex items-center gap-3 ${isSelected ? "bg-primary/8" : "hover:bg-muted/30"}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>{city.city}</p>
                  <span className="text-xs font-bold text-foreground shrink-0">{city.impressions >= 1000 ? (city.impressions / 1000).toFixed(0) + "K" : city.impressions}</span>
                </div>
                <div className="w-full bg-border rounded-full h-1 mt-1.5">
                  <div className="h-1 rounded-full bg-primary/50" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">{city.state}</span>
                  <span className={`text-[10px] font-medium ${city.ctr >= 2.1 ? "text-emerald-500" : city.ctr >= 1.9 ? "text-amber-500" : "text-muted-foreground"}`}>CTR {city.ctr}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CityMap({ cities, selectedCity, onSelectCity, mini = false }) {
  const [fullscreen, setFullscreen] = useState(false);
  const maxImp = Math.max(...cities.map((c) => c.impressions));

  const mapInstance = (trigger) => (
    <MapContainer
      center={[-14.5, -51.5]}
      zoom={4}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={trigger}
      zoomControl={!mini}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <InvalidateSize trigger={trigger} />
      <MapMarkers cities={cities} selectedCity={selectedCity} onSelectCity={onSelectCity} maxImp={maxImp} />
    </MapContainer>
  );

  // Mini mode: just the raw map, no chrome
  if (mini) {
    return <div style={{ height: "100%", width: "100%" }}>{mapInstance(false)}</div>;
  }

  const header = (
    <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-sora font-semibold text-foreground text-sm">Distribuição por Cidade</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Tamanho do círculo = volume de impressões · Clique para detalhes</p>
      </div>
      <button
        onClick={() => setFullscreen((f) => !f)}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Normal card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-card rounded-2xl card-glow overflow-hidden"
      >
        {header}
        <div className="flex" style={{ height: 560 }}>
          <div className="flex-1 min-w-0">
            {!fullscreen && mapInstance(false)}
            {fullscreen && (
              <div className="h-full flex items-center justify-center bg-muted/20">
                <p className="text-sm text-muted-foreground">Mapa em tela cheia</p>
              </div>
            )}
          </div>
          <RankingSidebar cities={cities} selectedCity={selectedCity} onSelectCity={onSelectCity} />
        </div>
      </motion.div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-card flex flex-col"
          >
            {header}
            <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0">{mapInstance(true)}</div>
            <RankingSidebar cities={cities} selectedCity={selectedCity} onSelectCity={onSelectCity} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}