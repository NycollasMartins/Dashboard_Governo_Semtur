// server/_core/mapa_calor.styles.ts

export const heatmapStyles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "24px",
  },

  header: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#E5E7EB",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "20px",
  },

  heatmapCard: {
    background: "#111827",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },

  insightsCard: {
    background: "#1F2937",
    borderRadius: "12px",
    padding: "16px",
  },

  insightItem: {
    marginBottom: "12px",
    padding: "10px",
    borderRadius: "8px",
    background: "#374151",
    color: "#F9FAFB",
    fontSize: "14px",
  },

  legend: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
    fontSize: "12px",
    color: "#9CA3AF",
  },
};