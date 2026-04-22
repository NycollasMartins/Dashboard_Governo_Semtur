import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  FolderOpen,
  Upload,
  FileImage,
  FileVideo,
  FileText,
  Trash2,
  ArrowLeft,
  Loader2,
  Download,
  Eye,
  ChevronRight,
  Building2,
  Edit,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  paused: { label: "Pausado", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  completed: { label: "Concluído", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
};

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-400" />;
  if (mimeType?.startsWith("video/")) return <FileVideo className="h-5 w-5 text-purple-400" />;
  return <FileText className="h-5 w-5 text-muted-foreground" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Projects() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectForm, setProjectForm] = useState({ clientId: "", name: "", description: "", status: "active" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: projects = [], isLoading } = trpc.projects.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: files = [], isLoading: filesLoading } = trpc.projectFiles.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const selectedProject = useMemo(() => projects.find((p: any) => p.id === selectedProjectId), [projects, selectedProjectId]);
  const projectClient = useMemo(() => {
    if (!selectedProject) return null;
    return clients.find((c: any) => c.id === selectedProject.clientId);
  }, [selectedProject, clients]);

  const createProjectMut = trpc.projects.create.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); setShowProjectDialog(false); toast.success("Projeto criado"); },
    onError: (e) => toast.error(e.message),
  });
  const updateProjectMut = trpc.projects.update.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); setShowProjectDialog(false); toast.success("Projeto atualizado"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteProjectMut = trpc.projects.delete.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); setSelectedProjectId(null); toast.success("Projeto excluído"); },
    onError: (e) => toast.error(e.message),
  });

  const uploadFileMut = trpc.projectFiles.upload.useMutation({
    onSuccess: () => { utils.projectFiles.list.invalidate(); toast.success("Arquivo enviado"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteFileMut = trpc.projectFiles.delete.useMutation({
    onSuccess: () => { utils.projectFiles.list.invalidate(); toast.success("Arquivo excluído"); },
    onError: (e) => toast.error(e.message),
  });

  function openNewProject() {
    setEditingProject(null);
    setProjectForm({ clientId: "", name: "", description: "", status: "active" });
    setShowProjectDialog(true);
  }

  function openEditProject(project: any) {
    setEditingProject(project);
    setProjectForm({
      clientId: String(project.clientId),
      name: project.name,
      description: project.description ?? "",
      status: project.status,
    });
    setShowProjectDialog(true);
  }

  function saveProject() {
    if (!projectForm.clientId || !projectForm.name) return;
    const payload = {
      clientId: parseInt(projectForm.clientId),
      name: projectForm.name,
      description: projectForm.description || null,
      status: projectForm.status as "active" | "paused" | "completed",
    };
    if (editingProject) {
      updateProjectMut.mutate({ id: editingProject.id, ...payload });
    } else {
      createProjectMut.mutate(payload);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedProjectId || !e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede 10MB`);
          continue;
        }
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(file);
        });
        await uploadFileMut.mutateAsync({
          projectId: selectedProjectId,
          fileName: file.name,
          fileBase64: base64,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ─── Project Detail View (Files) ─────────────────────────────────
  if (selectedProjectId && selectedProject) {
    const status = STATUS_MAP[selectedProject.status] ?? STATUS_MAP.active;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedProjectId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{selectedProject.name}</h1>
              <Badge variant="outline" className={`${status.color} text-xs`}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {projectClient ? `Cliente: ${projectClient.name}` : "Projeto"} · Mídias de captação
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditProject(selectedProject)}>
              <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
              onClick={() => { if (confirm("Excluir este projeto e todos os arquivos?")) deleteProjectMut.mutate({ id: selectedProject.id }); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
            </Button>
          </div>
        </div>

        {selectedProject.description && (
          <Card className="bg-card/50 border-border/40">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Upload Area */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              Arquivos e Mídias
            </CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.psd,.ai,.svg"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                {uploading ? "Enviando..." : "Upload"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : files.length === 0 ? (
              <div
                className="border-2 border-dashed border-border/40 rounded-xl p-12 text-center cursor-pointer hover:border-border/60 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Arraste ou clique para enviar mídias de captação</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Imagens, vídeos, PDFs — máx. 10MB por arquivo</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map((file: any) => {
                  const isImage = file.mimeType?.startsWith("image/");
                  const isVideo = file.mimeType?.startsWith("video/");
                  return (
                    <div key={file.id} className="group relative border border-border/30 rounded-xl overflow-hidden bg-background/50 hover:border-border/50 transition-all">
                      {isImage ? (
                        <div className="aspect-video bg-muted/20 flex items-center justify-center overflow-hidden">
                          <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" />
                        </div>
                      ) : isVideo ? (
                        <div className="aspect-video bg-muted/20 flex items-center justify-center">
                          <video src={file.fileUrl} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted/10 flex items-center justify-center">
                          {getFileIcon(file.mimeType)}
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-xs font-medium truncate">{file.fileName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {file.fileSize ? formatFileSize(file.fileSize) : "—"}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="secondary" size="icon" className="h-7 w-7">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </a>
                        <a href={file.fileUrl} download={file.fileName}>
                          <Button variant="secondary" size="icon" className="h-7 w-7">
                            <Download className="h-3 w-3" />
                          </Button>
                        </a>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Excluir este arquivo?")) deleteFileMut.mutate({ id: file.id }); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Projects List View ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie projetos e mídias de captação por cliente</p>
        </div>
        <Button onClick={openNewProject} disabled={clients.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Novo Projeto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-card/50 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">Nenhum projeto criado ainda</p>
            {clients.length === 0 && (
              <p className="text-xs text-muted-foreground/60 mt-1">Crie um cliente em Squads primeiro</p>
            )}
            {clients.length > 0 && (
              <Button size="sm" className="mt-4" onClick={openNewProject}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Criar Primeiro Projeto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => {
            const client = clients.find((c: any) => c.id === project.clientId);
            const status = STATUS_MAP[project.status] ?? STATUS_MAP.active;
            return (
              <Card
                key={project.id}
                className="bg-card/50 border-border/40 hover:border-border/60 transition-all cursor-pointer group"
                onClick={() => setSelectedProjectId(project.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{project.name}</p>
                        {client && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{client.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                  )}
                  <Badge variant="outline" className={`${status.color} text-xs`}>{status.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
            <DialogDescription>Configure as informações do projeto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={projectForm.clientId} onValueChange={(v) => setProjectForm({ ...projectForm, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} placeholder="Nome do projeto" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="Descrição do projeto..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectDialog(false)}>Cancelar</Button>
            <Button onClick={saveProject} disabled={!projectForm.clientId || !projectForm.name || createProjectMut.isPending || updateProjectMut.isPending}>
              {(createProjectMut.isPending || updateProjectMut.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProject ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
