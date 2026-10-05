import { Radio, LayoutDashboard, MapPin, Layers } from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "cities", label: "Cidades", icon: MapPin },
  { id: "creatives", label: "Criativos", icon: Layers },
];

export default function Sidebar({ activeTab, onChangeTab }) {
  return (
    <aside className="w-56 flex-shrink-0 bg-card border-r border-border flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Radio className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-sora font-bold text-foreground text-sm leading-tight">SemTur</p>
          <p className="text-xs text-muted-foreground">Maceió</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChangeTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <span className="gradient-badge text-xs font-semibold px-2.5 py-1 rounded-full">LIVE</span>
      </div>
    </aside>
  );
}