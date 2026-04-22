import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  PanelLeft,
  Activity,
  Kanban,
  Crown,
  ChevronDown,
  ChevronRight,
  UsersRound,
  FolderOpen,
  ListTodo,
  UserCheck,
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Map } from "lucide-react";

// ─── Position / Visibility Helpers ──────────────────────────────────

type Position = "ceo" | "coo" | "head" | "cs" | "gestor_trafego" | "social_media" | "sdr" | "bdr" | "closer";

const C_LEVEL: Position[] = ["ceo", "coo"];

function isCLevel(pos: string | null | undefined): boolean {
  return C_LEVEL.includes((pos || "") as Position);
}

// ─── Menu Types ─────────────────────────────────────────────────────

type MenuItem = { icon: any; label: string; path: string; cLevelOnly?: boolean };
type MenuSection = {
  title: string | null;
  items: MenuItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

function buildMenuSections(userPosition: string | null | undefined): MenuSection[] {
  const isC = isCLevel(userPosition);

  const sections: MenuSection[] = [
    {
      title: null,
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      ],
    },
    {
      title: "Análises",
      collapsible: true,
      defaultOpen: true,
      items: [
        {
          icon: Map,
          label: "Heatmap Governo",
          path: "/heatmap",
          cLevelOnly: true,
        },
      ],
    },
    {
      title: "Operacional",
      collapsible: true,
      defaultOpen: true,
      items: [
        { icon: Megaphone, label: "Campanhas", path: "/campaigns", cLevelOnly: true },
        { icon: Wallet, label: "Orçamento", path: "/budget", cLevelOnly: true },
        { icon: BarChart3, label: "Relatórios", path: "/reports", cLevelOnly: true },
        { icon: UsersRound, label: "Squads", path: "/squads" },
        { icon: FolderOpen, label: "Projetos", path: "/projects" },
        { icon: ListTodo, label: "Tarefas", path: "/tasks" },
      ].filter((item) => !item.cLevelOnly || isC),
    },
    {
      title: "Comercial",
      collapsible: true,
      defaultOpen: true,
      items: [
        { icon: Kanban, label: "CRM Pipeline", path: "/operational" },
        { icon: UserCheck, label: "Contatos", path: "/contacts", cLevelOnly: true },
      ].filter((item) => !item.cLevelOnly || isC),
    },
    {
      title: "Gestão",
      items: [
        { icon: Crown, label: "Equipe", path: "/team" },
        { icon: Users, label: "Membros", path: "/members", cLevelOnly: true },
      ].filter((item) => !item.cLevelOnly || isC),
    },
  ];

  return sections.filter((s) => s.items.length > 0);
}

// ─── Pending Members Badge (C-level only) ─────────────────────────────

function PendingMembersBadge() {
  const [, setLocation] = useLocation();
  const { data: pendingCount = 0 } = trpc.members.pendingCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  if (pendingCount === 0) return null;

  return (
    <button
      onClick={() => setLocation("/members")}
      className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
      title={`${pendingCount} usuário(s) aguardando aprovação`}
    >
      <UserCheck className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Pendentes</span>
      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1">
        {pendingCount}
      </span>
    </button>
  );
}

// ─── Notification Bell Component ────────────────────────────────────────

function NotificationBell() {
  const utils = trpc.useUtils();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
  });
  const { data: notificationsList = [] } = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Trigger due date check every 5 minutes
  const checkDueDatesMut = trpc.notifications.checkDueDates.useMutation({
    onSuccess: (result) => {
      if (result.created > 0) {
        utils.notifications.list.invalidate();
        utils.notifications.unreadCount.invalidate();
      }
    },
  });

  useEffect(() => {
    // Check on mount
    checkDueDatesMut.mutate();
    // Then every 5 minutes
    const interval = setInterval(() => {
      checkDueDatesMut.mutate();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markReadMut = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllReadMut = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const [, setLocation] = useLocation();

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "task_due_soon": return <Clock className="h-4 w-4 text-amber-400 shrink-0" />;
      case "task_overdue": return <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />;
      case "task_assigned": return <UserCheck className="h-4 w-4 text-blue-400 shrink-0" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground shrink-0" />;
    }
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min`;
    if (diffH < 24) return `${diffH}h`;
    return `${diffD}d`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 shadow-lg animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => markAllReadMut.mutate()}
              disabled={markAllReadMut.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notificationsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Você será notificado sobre prazos de tarefas</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notificationsList.slice(0, 50).map((notif: any) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/30 cursor-pointer ${
                    notif.isRead === 0 ? "bg-primary/[0.03]" : ""
                  }`}
                  onClick={() => {
                    if (notif.isRead === 0) markReadMut.mutate({ id: notif.id });
                    if (notif.taskId) setLocation("/tasks");
                  }}
                >
                  <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${notif.isRead === 0 ? "font-medium" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      {notif.isRead === 0 && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    {notif.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(notif.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-semibold tracking-tight">AdPulse</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
              Faça login para acessar seu painel de gestão de marketing digital.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const userPosition = (user as any)?.position as string | null | undefined;

  const menuSections = useMemo(() => buildMenuSections(userPosition), [userPosition]);
  const allMenuItems = useMemo(() => menuSections.flatMap((s) => s.items), [menuSections]);
  const activeMenuItem = allMenuItems.find((item) => item.path === location);

  // Collapsible section state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuSections.forEach((s) => {
      if (s.collapsible && s.title) {
        initial[s.title] = !(s.defaultOpen ?? true);
      }
    });
    return initial;
  });

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-semibold tracking-tight truncate text-sm">
                    AdPulse CRM
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2 py-2">
            {menuSections.map((section, sIdx) => {
              const isSectionCollapsed = section.title ? collapsedSections[section.title] : false;
              const hasActiveChild = section.items.some((item) => item.path === location);

              return (
                <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
                  {section.title && !isCollapsed && (
                    <div className="px-3 mb-1.5">
                      {section.collapsible ? (
                        <button
                          onClick={() => toggleSection(section.title!)}
                          className="flex items-center gap-1 w-full text-left group/section hover:text-muted-foreground transition-colors"
                        >
                          {isSectionCollapsed ? (
                            <ChevronRight className="h-3 w-3 text-muted-foreground/50 transition-transform" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-muted-foreground/50 transition-transform" />
                          )}
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 group-hover/section:text-muted-foreground/80 transition-colors">
                            {section.title}
                          </span>
                          {isSectionCollapsed && hasActiveChild && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                          {section.title}
                        </span>
                      )}
                    </div>
                  )}
                  {section.title && isCollapsed && (
                    <div className="mx-auto w-6 border-t border-border/40 mb-2" />
                  )}
                  {(!isSectionCollapsed || isCollapsed) && (
                    <SidebarMenu>
                      {section.items.map((item) => {
                        const isActive = location === item.path;
                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => setLocation(item.path)}
                              tooltip={item.label}
                              className="h-10 transition-all font-normal"
                            >
                              <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                              <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  )}
                </div>
              );
            })}

            {/* Settings at the bottom of content */}
            <div className="mt-auto pt-4">
              {!isCollapsed && (
                <div className="mx-3 border-t border-border/30 mb-2" />
              )}
              {isCollapsed && (
                <div className="mx-auto w-6 border-t border-border/40 mb-2" />
              )}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location === "/settings"}
                    onClick={() => setLocation("/settings")}
                    tooltip="Configurações"
                    className="h-10 transition-all font-normal"
                  >
                    <Settings className={`h-4 w-4 ${location === "/settings" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={location === "/settings" ? "font-medium" : ""}>Configurações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border border-border/50 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {user?.email || ""}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top bar with notification bell */}
        <div className="flex border-b border-border/30 h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {isMobile && (
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
            )}
            <span className="font-medium text-sm tracking-tight text-foreground">
              {activeMenuItem?.label ?? "Menu"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCLevel(userPosition) && <PendingMembersBadge />}
            <NotificationBell />
            <div className="h-6 w-px bg-border/40 mx-1" />
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border border-border/50">
                <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.name || "Usuário"}</span>
            </div>
          </div>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
