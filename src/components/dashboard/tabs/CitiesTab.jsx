import { MapPin, ChevronDown, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CityMap from "@/components/dashboard/CityMap";
import CityDetailPanel from "@/components/dashboard/CityDetailPanel.jsx";

export default function CitiesTab({ cities, selectedCity, onSelectCity }) {
  const sorted = [...cities].sort((a, b) => b.impressions - a.impressions);
  const isSelected = !!selectedCity;

  return (
    <div className="space-y-5">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {isSelected ? (
            <button
              onClick={() => onSelectCity(null)}
              className="w-8 h-8 rounded-xl border border-primary bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-sora font-bold text-foreground text-lg">
              {isSelected ? selectedCity.city : "Cidades"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isSelected ? `${selectedCity.state} · performance detalhada` : "Distribuição geográfica e performance por cidade"}
            </p>
          </div>
        </div>

        {/* City selector (visible only when a city is selected) */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <select
                value={selectedCity.city}
                onChange={(e) => {
                  const found = cities.find((c) => c.city === e.target.value);
                  if (found) onSelectCity(found);
                }}
                className="appearance-none bg-card border border-border rounded-xl text-sm font-medium text-foreground px-3 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-muted/40 transition-colors"
              >
                {sorted.map((c) => (
                  <option key={c.city} value={c.city}>{c.city}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map — full when no city selected */}
      {!isSelected && (
        <motion.div
          key="full-map"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CityMap cities={cities} selectedCity={selectedCity} onSelectCity={onSelectCity} />
        </motion.div>
      )}

      {/* Detail panel (only when a city is selected) */}
      <AnimatePresence mode="wait">
        {isSelected && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <CityDetailPanel city={selectedCity} cities={cities} onSelectCity={onSelectCity} onBack={() => onSelectCity(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}