import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Link as LinkIcon,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  cloneUserAccount,
  generateSecurePassword,
  getAccountCloneStats,
  sanitizeUsername,
  type CloneUserResult,
} from "@/lib/admin-clone";
import type { Profile } from "@/lib/bio";

interface CloneUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceUser?: Profile | null;
  allUsers?: Profile[];
  onSuccess?: (result: CloneUserResult) => void;
}

export function CloneUserModal({
  open,
  onOpenChange,
  sourceUser,
  allUsers = [],
  onSuccess,
}: CloneUserModalProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [currentSource, setCurrentSource] = useState<Profile | null>(null);

  // Stats do usuário de origem
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState<{ categoriesCount: number; linksCount: number }>({
    categoriesCount: 0,
    linksCount: 0,
  });

  // Campos do formulário
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Opções de personalização
  const [copyAvatarAndBanner, setCopyAvatarAndBanner] = useState(true);
  const [copySocialsAndBio, setCopySocialsAndBio] = useState(true);

  // Estados de execução e resultado
  const [cloning, setCloning] = useState(false);
  const [cloneResult, setCloneResult] = useState<CloneUserResult | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Inicializa a seleção de usuário
  useEffect(() => {
    if (open) {
      setCloneResult(null);
      setCopiedCreds(false);

      const target = sourceUser || (allUsers.length > 0 ? allUsers[0] : null);
      if (target) {
        setSelectedSourceId(target.user_id);
        setCurrentSource(target);
        setNewName(`${target.display_name} (Cópia)`);
        setNewUsername(`${sanitizeUsername(target.username)}_clone`);
        setNewEmail("");
        setNewPassword(generateSecurePassword(10));
      }
    }
  }, [open, sourceUser, allUsers]);

  // Carrega contagens de links e categorias do usuário selecionado
  useEffect(() => {
    if (!selectedSourceId) return;
    const found = allUsers.find((u) => u.user_id === selectedSourceId) || sourceUser;
    if (found) setCurrentSource(found);

    let isMounted = true;
    setLoadingStats(true);
    getAccountCloneStats(selectedSourceId)
      .then((res) => {
        if (isMounted) {
          setStats({
            categoriesCount: res.categoriesCount,
            linksCount: res.linksCount,
          });
        }
      })
      .catch((err) => console.error("Erro ao carregar estatísticas do usuário:", err))
      .finally(() => {
        if (isMounted) setLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSourceId, allUsers, sourceUser]);

  const handleGeneratePassword = () => {
    const pwd = generateSecurePassword(12);
    setNewPassword(pwd);
    toast.success("Nova senha segura gerada!");
  };

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSource) {
      toast.error("Selecione um usuário de origem.");
      return;
    }

    const cleanUser = sanitizeUsername(newUsername);
    if (!cleanUser) {
      toast.error("Informe um nome de usuário válido.");
      return;
    }

    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Informe um e-mail válido para a nova conta.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setCloning(true);
    try {
      const result = await cloneUserAccount({
        sourceUserId: currentSource.user_id,
        sourceProfile: currentSource,
        newName: newName.trim() || "Novo Perfil",
        newUsername: cleanUser,
        newEmail: newEmail.trim(),
        newPassword: newPassword,
        copyProfileDetails: true,
        copyAvatarAndBanner,
        copySocialsAndBio,
      });

      setCloneResult(result);
      toast.success(`Conta @${result.username} clonada com sucesso!`);
      if (onSuccess) onSuccess(result);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao clonar conta de usuário.");
    } finally {
      setCloning(false);
    }
  };

  const copyFullCredentials = () => {
    if (!cloneResult) return;
    const text = [
      `🔐 Dados de Acesso da Nova Conta (${cloneResult.displayName})`,
      `🌐 Link da Bio: ${cloneResult.publicUrl}`,
      `👤 Usuário: @${cloneResult.username}`,
      `📧 E-mail: ${cloneResult.email}`,
      `🔑 Senha: ${cloneResult.password}`,
      ``,
      `✨ Conta clonada com ${cloneResult.copiedCategories} categorias e ${cloneResult.copiedLinks} links prontos para uso.`,
    ].join("\n");

    void navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    toast.success("Credenciais copiadas para a área de transferência!");
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !cloning && onOpenChange(val)}>
      <DialogContent className="glass max-h-[92vh] max-w-xl overflow-y-auto border-glass-border p-6 sm:p-7">
        {cloneResult ? (
          /* ================= TELA DE SUCESSO ================= */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <DialogHeader className="text-center sm:text-left">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 sm:mx-0">
                <Sparkles className="size-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-emerald-400">
                Conta Clonada com Sucesso!
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                A nova conta foi criada com todas as categorias e links duplicados.
              </DialogDescription>
            </DialogHeader>

            {/* Resumo da nova conta */}
            <div className="space-y-3 rounded-2xl border border-glass-border bg-card/60 p-4 sm:p-5 text-sm">
              <div className="flex items-center justify-between border-b border-glass-border pb-3">
                <span className="text-xs text-muted-foreground">Nome de Exibição</span>
                <span className="font-semibold text-foreground">{cloneResult.displayName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-glass-border pb-3">
                <span className="text-xs text-muted-foreground">Nome de Usuário</span>
                <span className="font-mono font-semibold text-primary">@{cloneResult.username}</span>
              </div>
              <div className="flex items-center justify-between border-b border-glass-border pb-3">
                <span className="text-xs text-muted-foreground">E-mail de Login</span>
                <span className="font-mono font-medium text-foreground">{cloneResult.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-glass-border pb-3">
                <span className="text-xs text-muted-foreground">Senha Definida</span>
                <span className="font-mono font-bold text-amber-400">{cloneResult.password}</span>
              </div>
              <div className="flex items-center justify-between border-b border-glass-border pb-3">
                <span className="text-xs text-muted-foreground">Links & Categorias</span>
                <span className="text-xs font-semibold text-emerald-400">
                  {cloneResult.copiedCategories} categorias • {cloneResult.copiedLinks} links
                </span>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">Link da Bio Pública:</span>
                <a
                  href={cloneResult.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-xs text-primary hover:underline break-all"
                >
                  {cloneResult.publicUrl}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="w-full rounded-xl sm:flex-1 text-xs"
                onClick={copyFullCredentials}
              >
                {copiedCreds ? (
                  <>
                    <Check className="mr-1.5 size-4 text-emerald-400" /> Credenciais Copiadas!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-4" /> Copiar Todas as Credenciais
                  </>
                )}
              </Button>
              <Button
                className="w-full rounded-xl sm:flex-1 text-xs"
                onClick={() => onOpenChange(false)}
              >
                <UserCheck className="mr-1.5 size-4" /> Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ================= FORMULÁRIO DE CLONAGEM ================= */
          <form onSubmit={handleClone} className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <Copy className="size-5" />
                <DialogTitle className="text-xl font-bold text-foreground">
                  Clonar Conta de Usuário
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Duplique integralmente os links, categorias e configurações de um usuário para uma
                nova conta independente.
              </DialogDescription>
            </DialogHeader>

            {/* 1. SELEÇÃO / PREVIEW DO USUÁRIO DE ORIGEM */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Usuário de Origem (Modelo a ser clonado)
              </Label>
              {allUsers.length > 1 && !sourceUser ? (
                <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Selecione o usuário para clonar" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-5">
                            <AvatarImage src={u.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[9px]">
                              {u.display_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{u.display_name}</span>
                          <span className="text-muted-foreground text-xs font-mono">(@{u.username})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {currentSource ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glass-border bg-card/40 p-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border border-primary/30">
                      <AvatarImage src={currentSource.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs font-semibold">
                        {currentSource.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{currentSource.display_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">@{currentSource.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {loadingStats ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Badge variant="secondary" className="gap-1 text-[11px] font-medium border-primary/20">
                          <Layers className="size-3 text-primary" /> {stats.categoriesCount} categorias
                        </Badge>
                        <Badge variant="secondary" className="gap-1 text-[11px] font-medium border-primary/20">
                          <LinkIcon className="size-3 text-primary" /> {stats.linksCount} links
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* 2. DADOS DA NOVA CONTA */}
            <div className="space-y-3.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Novos Dados da Conta Clonada
              </Label>

              {/* Nome de Exibição */}
              <div className="space-y-1.5">
                <Label htmlFor="clone-name" className="text-xs font-medium">
                  Nome Completo / Exibição da Nova Conta *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="clone-name"
                    required
                    placeholder="Ex: Minha Loja, Dr. Carlos Silva"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="pl-9 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Nome de Usuário / Slug */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clone-username" className="text-xs font-medium">
                    Nome de Usuário (@username) *
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    link/{sanitizeUsername(newUsername || "usuario")}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground">
                    @
                  </span>
                  <Input
                    id="clone-username"
                    required
                    placeholder="novousuario"
                    value={newUsername}
                    onChange={(e) => setNewUsername(sanitizeUsername(e.target.value))}
                    className="pl-8 rounded-xl font-mono text-sm"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Apenas letras minúsculas, números e underlines. Será o link exclusivo da bio.
                </p>
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="clone-email" className="text-xs font-medium">
                  E-mail da Nova Conta (Login) *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="clone-email"
                    type="email"
                    required
                    placeholder="cliente@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-9 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clone-password" className="text-xs font-medium">
                    Senha Inicial de Acesso *
                  </Label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="size-3" /> Gerar senha forte
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="clone-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-10 rounded-xl font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. OPÇÕES DE CLONAGEM ADICIONAIS */}
            <div className="space-y-2.5 rounded-2xl border border-glass-border bg-card/30 p-3.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                3. Configurações de Cópia
              </Label>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium">Copiar Foto de Perfil e Banners</p>
                  <p className="text-[11px] text-muted-foreground">
                    Mantém a mesma foto de avatar e banners de topo
                  </p>
                </div>
                <Switch
                  checked={copyAvatarAndBanner}
                  onCheckedChange={setCopyAvatarAndBanner}
                  aria-label="Copiar foto e banners"
                />
              </div>
              <div className="flex items-center justify-between py-1 border-t border-glass-border">
                <div>
                  <p className="text-xs font-medium">Copiar Biografia e Redes Sociais</p>
                  <p className="text-[11px] text-muted-foreground">
                    Duplica texto da bio e botões de redes sociais (WhatsApp, Insta, etc.)
                  </p>
                </div>
                <Switch
                  checked={copySocialsAndBio}
                  onCheckedChange={setCopySocialsAndBio}
                  aria-label="Copiar bio e redes sociais"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl text-xs"
                onClick={() => onOpenChange(false)}
                disabled={cloning}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs bg-gradient-to-r from-primary to-accent font-semibold shadow-md shadow-primary/20"
                disabled={cloning}
              >
                {cloning ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Clonando Conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 size-4" /> Criar Conta Clonada
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
