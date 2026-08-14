import { createFileRoute, Link as RouterLink, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_PRESETS,
  ICON_OPTIONS,
  SAAS_CONFIG,
  formatBRL,
  getIcon,
  normalizeUrl,
  type Category,
  type LinkItem,
  type Profile,
} from "@/lib/bio";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel — Link na Bio" },
      { name: "description", content: "Gerencie categorias, links e estatísticas da sua bio." },
      { property: "og:title", content: "Painel — Link na Bio" },
      { property: "og:description", content: "Gerencie categorias, links e estatísticas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-data"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user!.id;
      const [profileRes, categoriesRes, linksRes, clicksRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("categories").select("*").eq("user_id", userId).order("position"),
        supabase.from("links").select("*").eq("user_id", userId).order("position"),
        supabase
          .from("link_clicks")
          .select("link_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);
      return {
        userId,
        profile: (profileRes.data as Profile | null) ?? null,
        categories: (categoriesRes.data ?? []) as Category[],
        links: (linksRes.data ?? []) as LinkItem[],
        clicks: (clicksRes.data ?? []) as { link_id: string; created_at: string }[],
      };
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-data"] });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    void navigate({ to: "/auth" });
  };

  if (isLoading || !data) {
    return <div className="mx-auto mt-24 h-40 w-full max-w-4xl animate-pulse rounded-3xl bg-muted" />;
  }

  const profile = data.profile;
  const username = profile?.username || "usuario";
  const userBioPath = `/${username}`;
  const isAdmin = profile?.role === "admin" || profile?.username === SAAS_CONFIG.adminUsername;

  const copyPublicUrl = () => {
    const fullUrl = `${window.location.origin}${userBioPath}`;
    void navigator.clipboard.writeText(fullUrl);
    toast.success(`Link copiado: ${fullUrl}`);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Painel</h1>
            {isAdmin ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white">
                👑 Super Admin
              </Badge>
            ) : (
              <Badge variant="secondary" className="border border-primary/30 text-primary">
                Plano Pro ({SAAS_CONFIG.formattedPrice}/mês)
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gerencie sua bio exclusiva em{" "}
            <span className="font-mono font-medium text-foreground">{userBioPath}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={copyPublicUrl}>
            <Copy className="mr-1.5 size-3.5" />
            Copiar meu link
          </Button>
          <Button variant="secondary" size="sm" asChild className="rounded-xl" aria-label="Ver minha página pública">
            <RouterLink to={userBioPath} target="_blank">
              <ExternalLink className="mr-1.5 size-3.5" />
              Ver minha bio
            </RouterLink>
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="links">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-6" : "grid-cols-5"}`}>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          {isAdmin ? <TabsTrigger value="superadmin">👑 Super Admin</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="links" className="pt-4">
          <LinksTab
            userId={data.userId}
            links={data.links}
            categories={data.categories}
            search={search}
            setSearch={setSearch}
            refresh={refresh}
          />
        </TabsContent>

        <TabsContent value="categories" className="pt-4">
          <CategoriesTab userId={data.userId} categories={data.categories} refresh={refresh} />
        </TabsContent>

        <TabsContent value="stats" className="pt-4">
          <StatsPanel links={data.links} categories={data.categories} clicks={data.clicks} />
        </TabsContent>

        <TabsContent value="profile" className="pt-4">
          <ProfileTab userId={data.userId} profile={data.profile} refresh={refresh} />
        </TabsContent>

        <TabsContent value="subscription" className="pt-4">
          <SubscriptionTab profile={data.profile} />
        </TabsContent>

        {isAdmin ? (
          <TabsContent value="superadmin" className="pt-4">
            <SuperAdminTab />
          </TabsContent>
        ) : null}
      </Tabs>
    </main>
  );
}

/* ---------------- Categorias ---------------- */

function CategoriesTab({
  userId,
  categories,
  refresh,
}: {
  userId: string;
  categories: Category[];
  refresh: () => void;
}) {
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const save = async () => {
    if (!editing?.title) return;
    const payload = {
      user_id: userId,
      title: editing.title,
      emoji: editing.emoji ?? "",
      position: editing.position ?? categories.length,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Categoria salva");
    setEditing(null);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Categoria excluída");
    refresh();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = categories[index + direction];
    const current = categories[index];
    if (!target || !current) return;
    await Promise.all([
      supabase.from("categories").update({ position: target.position }).eq("id", current.id),
      supabase.from("categories").update({ position: current.position }).eq("id", target.id),
    ]);
    refresh();
  };

  const createPresets = async () => {
    const rows = CATEGORY_PRESETS.map((preset, index) => ({
      user_id: userId,
      title: preset.title,
      emoji: preset.emoji,
      position: categories.length + index,
    }));
    const { error } = await supabase.from("categories").insert(rows);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Categorias padrão criadas");
    refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setEditing({ emoji: "🔥", title: "" })} className="rounded-xl">
          <Plus className="mr-2 size-4" /> Nova categoria
        </Button>
        {categories.length === 0 ? (
          <Button variant="secondary" className="rounded-xl" onClick={createPresets}>
            Criar categorias sugeridas
          </Button>
        ) : null}
      </div>

      {categories.map((category, index) => (
        <Card key={category.id} className="glass border-glass-border">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="text-xl" aria-hidden>
              {category.emoji}
            </span>
            <span className="flex-1 font-semibold">{category.title}</span>
            <Switch
              checked={category.is_active}
              aria-label="Ativar categoria"
              onCheckedChange={async (checked) => {
                await supabase.from("categories").update({ is_active: checked }).eq("id", category.id);
                refresh();
              }}
            />
            <IconBtn label="Subir" onClick={() => move(index, -1)}>
              <ArrowUp className="size-4" />
            </IconBtn>
            <IconBtn label="Descer" onClick={() => move(index, 1)}>
              <ArrowDown className="size-4" />
            </IconBtn>
            <IconBtn label="Editar" onClick={() => setEditing(category)}>
              <Pencil className="size-4" />
            </IconBtn>
            <IconBtn label="Excluir" onClick={() => remove(category.id)}>
              <Trash2 className="size-4 text-destructive" />
            </IconBtn>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-emoji">Emoji</Label>
              <Input
                id="cat-emoji"
                value={editing?.emoji ?? ""}
                onChange={(e) => setEditing({ ...editing, emoji: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-title">Título</Label>
              <Input
                id="cat-title"
                value={editing?.title ?? ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} className="rounded-xl">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Links ---------------- */

function LinksTab({
  userId,
  links,
  categories,
  search,
  setSearch,
  refresh,
}: {
  userId: string;
  links: LinkItem[];
  categories: Category[];
  search: string;
  setSearch: (value: string) => void;
  refresh: () => void;
}) {
  const [editing, setEditing] = useState<Partial<LinkItem> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return links;
    return links.filter((l) => `${l.title} ${l.url} ${l.description ?? ""}`.toLowerCase().includes(term));
  }, [links, search]);

  const save = async () => {
    if (!editing?.title || !editing.url) {
      toast.error("Informe título e URL");
      return;
    }
    const payload = {
      user_id: userId,
      category_id: editing.category_id ?? null,
      title: editing.title,
      description: editing.description ?? "",
      url: normalizeUrl(editing.url),
      icon: editing.icon ?? "Link",
      color: editing.color ?? null,
      position: editing.position ?? links.length,
      is_active: editing.is_active ?? true,
      is_featured: editing.is_featured ?? false,
      is_favorite: editing.is_favorite ?? false,
      is_sponsored: editing.is_sponsored ?? false,
    };
    const { error } = editing.id
      ? await supabase.from("links").update(payload).eq("id", editing.id)
      : await supabase.from("links").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link salvo");
    setEditing(null);
    refresh();
  };

  const duplicate = async (link: LinkItem) => {
    const { id, created_at, updated_at, click_count, ...rest } = link as LinkItem & {
      created_at?: string;
      updated_at?: string;
    };
    void id;
    void created_at;
    void updated_at;
    void click_count;
    const { error } = await supabase
      .from("links")
      .insert({ ...rest, title: `${link.title} (cópia)`, position: links.length });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link duplicado");
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link excluído");
    refresh();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const current = filtered[index];
    const target = filtered[index + direction];
    if (!current || !target) return;
    await Promise.all([
      supabase.from("links").update({ position: target.position }).eq("id", current.id),
      supabase.from("links").update({ position: current.position }).eq("id", target.id),
    ]);
    refresh();
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ categories, links }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `backup-links-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { links?: Partial<LinkItem>[] };
      const rows = (parsed.links ?? []).map((link, index) => ({
        user_id: userId,
        category_id: link.category_id ?? null,
        title: link.title ?? "Sem título",
        description: link.description ?? "",
        url: normalizeUrl(link.url ?? "#"),
        icon: link.icon ?? "Link",
        color: link.color ?? null,
        position: links.length + index,
        is_active: link.is_active ?? true,
      }));
      if (rows.length === 0) throw new Error("Arquivo sem links");
      const { error } = await supabase.from("links").insert(rows);
      if (error) throw error;
      toast.success(`${rows.length} links importados`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Arquivo inválido");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button className="rounded-xl" onClick={() => setEditing({ icon: "Link", is_active: true })}>
          <Plus className="mr-2 size-4" /> Novo link
        </Button>
        <Button variant="secondary" className="rounded-xl" onClick={exportJson}>
          <Download className="mr-2 size-4" /> Exportar
        </Button>
        <Button variant="secondary" className="rounded-xl" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 size-4" /> Importar
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importJson(file);
            event.target.value = "";
          }}
        />
        <div className="relative ml-auto min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar links..."
            aria-label="Pesquisar links"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.map((link, index) => {
        const Icon = getIcon(link.icon);
        const category = categories.find((c) => c.id === link.category_id);
        return (
          <Card key={link.id} className="glass border-glass-border">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{link.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {category ? `${category.emoji} ${category.title} · ` : ""}
                  {link.click_count} cliques
                </p>
              </div>
              <Switch
                checked={link.is_active}
                aria-label="Ativar link"
                onCheckedChange={async (checked) => {
                  await supabase.from("links").update({ is_active: checked }).eq("id", link.id);
                  refresh();
                }}
              />
              <IconBtn label="Subir" onClick={() => move(index, -1)}>
                <ArrowUp className="size-4" />
              </IconBtn>
              <IconBtn label="Descer" onClick={() => move(index, 1)}>
                <ArrowDown className="size-4" />
              </IconBtn>
              <IconBtn label="Duplicar" onClick={() => duplicate(link)}>
                <Copy className="size-4" />
              </IconBtn>
              <IconBtn label="Editar" onClick={() => setEditing(link)}>
                <Pencil className="size-4" />
              </IconBtn>
              <IconBtn label="Excluir" onClick={() => remove(link.id)}>
                <Trash2 className="size-4 text-destructive" />
              </IconBtn>
            </CardContent>
          </Card>
        );
      })}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum link encontrado.</p>
      ) : null}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="glass max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar link" : "Novo link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Título" id="link-title">
              <Input
                id="link-title"
                value={editing?.title ?? ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </Field>
            <Field label="URL" id="link-url">
              <Input
                id="link-url"
                value={editing?.url ?? ""}
                placeholder="https://"
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
              />
            </Field>
            <Field label="Descrição (opcional)" id="link-desc">
              <Textarea
                id="link-desc"
                rows={2}
                value={editing?.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria" id="link-cat">
                <Select
                  value={editing?.category_id ?? "none"}
                  onValueChange={(value) =>
                    setEditing({ ...editing, category_id: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger id="link-cat">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.emoji} {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ícone" id="link-icon">
                <Select
                  value={editing?.icon ?? "Link"}
                  onValueChange={(value) => setEditing({ ...editing, icon: value })}
                >
                  <SelectTrigger id="link-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Cor personalizada (opcional)" id="link-color">
              <Input
                id="link-color"
                type="color"
                className="h-10 w-20 p-1"
                value={editing?.color ?? "#4f7cff"}
                onChange={(e) => setEditing({ ...editing, color: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <ToggleRow
                label="Destaque no topo"
                checked={editing?.is_featured ?? false}
                onChange={(value) => setEditing({ ...editing, is_featured: value })}
              />
              <ToggleRow
                label="Favorito"
                checked={editing?.is_favorite ?? false}
                onChange={(value) => setEditing({ ...editing, is_favorite: value })}
              />
              <ToggleRow
                label="Patrocinado"
                checked={editing?.is_sponsored ?? false}
                onChange={(value) => setEditing({ ...editing, is_sponsored: value })}
              />
              <ToggleRow
                label="Ativo"
                checked={editing?.is_active ?? true}
                onChange={(value) => setEditing({ ...editing, is_active: value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="rounded-xl" onClick={save}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Perfil ---------------- */

async function processAndUploadAvatar(file: File, userId: string): Promise<string> {
  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Falha ao compactar imagem."));
          },
          "image/webp",
          0.85,
        );
      };
      img.onerror = () => reject(new Error("Falha ao abrir imagem selecionada."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });

  try {
    const filePath = `${userId}/avatar-${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, compressedBlob, {
        contentType: "image/webp",
        upsert: true,
      });

    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  } catch {
    // Graceful fallback to data URL if storage is not provisioned
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Falha ao processar dados da imagem."));
      }
    };
    reader.onerror = () => reject(new Error("Falha ao converter imagem."));
    reader.readAsDataURL(compressedBlob);
  });
}

function ProfileTab({
  userId,
  profile,
  refresh,
}: {
  userId: string;
  profile: Profile | null;
  refresh: () => void;
}) {
  const [form, setForm] = useState<Partial<Profile>>(
    profile ?? { display_name: "", username: "", bio: "", socials: [] },
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    setUploading(true);
    try {
      const url = await processAndUploadAvatar(file, userId);
      setForm((prev) => ({ ...prev, avatar_url: url }));
      toast.success("Foto carregada com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao processar imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatar_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Foto removida. Salve o perfil para confirmar.");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId,
        display_name: form.display_name || "Meu Perfil",
        username: form.username || "usuario",
        bio: form.bio ?? "",
        avatar_url: form.avatar_url ?? null,
        banner_text: form.banner_text ?? null,
        banner_url: form.banner_url ?? null,
        socials: form.socials ?? [],
      };
      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const socials = form.socials ?? [];

  return (
    <Card className="glass border-glass-border">
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <Label>Foto de perfil</Label>
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-glass-border bg-card/40 p-4">
            <Avatar className="size-20 border-2 border-primary/40 shadow-md">
              <AvatarImage src={form.avatar_url ?? undefined} alt={form.display_name ?? "Avatar"} />
              <AvatarFallback className="text-lg font-semibold">
                {(form.display_name || "Perfil").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-xl"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      {form.avatar_url ? "Alterar foto" : "Carregar foto"}
                    </>
                  )}
                </Button>
                {form.avatar_url ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive hover:bg-destructive/10"
                    disabled={uploading}
                    onClick={handleRemoveAvatar}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Remover
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos recomendados: PNG, JPG ou WEBP (máx. 5MB).
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" id="p-name">
            <Input
              id="p-name"
              value={form.display_name ?? ""}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </Field>
          <Field label="@usuário" id="p-user">
            <Input
              id="p-user"
              value={form.username ?? ""}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Descrição" id="p-bio">
          <Textarea
            id="p-bio"
            rows={3}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Banner promocional (texto)" id="p-banner">
            <Input
              id="p-banner"
              value={form.banner_text ?? ""}
              onChange={(e) => setForm({ ...form, banner_text: e.target.value })}
            />
          </Field>
          <Field label="Banner (link)" id="p-banner-url">
            <Input
              id="p-banner-url"
              placeholder="https://..."
              value={form.banner_url ?? ""}
              onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
            />
          </Field>
        </div>

        <div className="space-y-2">
          <Label>Redes sociais</Label>
          {socials.map((social, index) => (
            <div key={index} className="flex gap-2">
              <Select
                value={social.icon}
                onValueChange={(value) => {
                  const next = [...socials];
                  next[index] = { ...social, icon: value };
                  setForm({ ...form, socials: next });
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      {icon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={social.url}
                placeholder="https://instagram.com/..."
                onChange={(e) => {
                  const next = [...socials];
                  next[index] = { ...social, url: normalizeUrl(e.target.value) };
                  setForm({ ...form, socials: next });
                }}
              />
              <IconBtn
                label="Remover rede"
                onClick={() =>
                  setForm({ ...form, socials: socials.filter((_, i) => i !== index) })
                }
              >
                <Trash2 className="size-4 text-destructive" />
              </IconBtn>
            </div>
          ))}
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() =>
              setForm({ ...form, socials: [...socials, { icon: "Instagram", url: "" }] })
            }
          >
            <Plus className="mr-2 size-4" /> Adicionar rede
          </Button>
        </div>

        <Button className="rounded-xl" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          Salvar perfil
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- UI helpers ---------------- */

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-glass-border px-3 py-2 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon" aria-label={label} onClick={onClick}>
      {children}
    </Button>
  );
}

/* ---------------- Aba de Assinatura ---------------- */

function SubscriptionTab({ profile }: { profile: Profile | null }) {
  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-bold">Minha Assinatura</CardTitle>
              <p className="text-xs text-muted-foreground">Gerencie os detalhes do seu plano LinkBio SaaS.</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              ● Assinatura Ativa
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-glass-border bg-card/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano Atual</p>
                <h3 className="mt-1 text-2xl font-bold">Plano Pro Ilimitado</h3>
                <p className="text-sm text-primary font-medium">{SAAS_CONFIG.formattedPrice} / mês</p>
              </div>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => toast.info("Sua assinatura está ativa e regularizada.")}
              >
                <CreditCard className="mr-2 size-4" />
                Gerenciar Pagamento
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Benefícios inclusos no seu plano:</h4>
            <div className="grid gap-2.5 sm:grid-cols-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400" /> Links e Categorias ilimitados
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400" /> Username exclusivo (/{profile?.username ?? "seunome"})
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400" /> Rastreamento e histórico de cliques
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400" /> Banners e Links patrocinados
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400" /> Design Glassmorphism e Tema Escuro
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-400" /> Suporte prioritário
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Aba de Super Admin ---------------- */

function SuperAdminTab() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: adminStats, isLoading } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: async () => {
      const [profilesRes, linksRes, clicksRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("links").select("id, user_id, is_active"),
        supabase.from("link_clicks").select("id, user_id"),
      ]);

      const profiles = (profilesRes.data ?? []) as Profile[];
      const links = linksRes.data ?? [];
      const clicks = clicksRes.data ?? [];

      const totalUsers = profiles.length;
      const totalLinks = links.length;
      const totalClicks = clicks.length;
      const estimatedMRR = totalUsers * SAAS_CONFIG.monthlyPrice;

      return {
        profiles,
        totalUsers,
        totalLinks,
        totalClicks,
        estimatedMRR,
      };
    },
  });

  if (isLoading || !adminStats) {
    return <div className="h-48 w-full animate-pulse rounded-3xl bg-muted" />;
  }

  const filteredUsers = adminStats.profiles.filter((p) =>
    `${p.display_name} ${p.username}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Globais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass border-glass-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Total de Usuários</span>
              <Users className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{adminStats.totalUsers}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Cadastros no sistema</p>
          </CardContent>
        </Card>

        <Card className="glass border-glass-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Links Cadastrados</span>
              <Sparkles className="size-4 text-accent" />
            </div>
            <p className="mt-2 text-2xl font-bold">{adminStats.totalLinks}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Em toda a plataforma</p>
          </CardContent>
        </Card>

        <Card className="glass border-glass-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Cliques Globais</span>
              <TrendingUp className="size-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold">{adminStats.totalClicks}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Rastreados em todos os links</p>
          </CardContent>
        </Card>

        <Card className="glass border-glass-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">MRR Estimado</span>
              <DollarSign className="size-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {formatBRL(adminStats.estimatedMRR)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Base: {SAAS_CONFIG.formattedPrice}/usuário</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista e Gerenciamento de Usuários */}
      <Card className="glass border-glass-border">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold">Usuários do SaaS ({filteredUsers.length})</CardTitle>
              <p className="text-xs text-muted-foreground">Acompanhe todos os clientes e links da plataforma.</p>
            </div>
            <div className="w-full max-w-xs">
              <Input
                placeholder="Buscar usuário ou @username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="divide-y divide-glass-border overflow-hidden rounded-2xl border border-glass-border">
            {filteredUsers.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">Nenhum usuário encontrado.</p>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 hover:bg-card/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border border-primary/30">
                      <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name} />
                      <AvatarFallback className="text-xs font-semibold">
                        {user.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        {user.display_name}
                        {user.role === "admin" || user.username === SAAS_CONFIG.adminUsername ? (
                          <Badge className="bg-amber-500/20 text-amber-300 text-[10px] py-0 px-1.5">Admin</Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[11px] border-emerald-500/30 text-emerald-400">
                      {user.plan?.toUpperCase() ?? "PRO"} • {SAAS_CONFIG.formattedPrice}/mês
                    </Badge>
                    <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
                      <RouterLink to={`/${user.username}`} target="_blank">
                        <ExternalLink className="mr-1 size-3.5" />
                        Ver Bio
                      </RouterLink>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

