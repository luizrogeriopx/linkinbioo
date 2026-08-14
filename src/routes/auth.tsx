import { createFileRoute, Link as RouterLink, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Mail, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SAAS_CONFIG } from "@/lib/bio";

const title = "Entrar ou Assinar — LinkBio SaaS";
const description = "Acesse o painel do LinkBio ou crie sua conta no plano Pro por R$ 17,40/mês.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    // 1. Escuta mudanças na autenticação em tempo real (ex: retorno do Google OAuth)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        void navigate({ to: "/admin" });
      }
    });

    // 2. Checa se já há sessão ativa
    void supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        void navigate({ to: "/admin" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        toast.error(
          "E-mail ou senha incorretos. Se você acabou de se cadastrar, confirme se ativou o e-mail ou se digitou a senha correta.",
          {
            action: {
              label: "Reenviar link",
              onClick: () => {
                setRegisteredEmail(email.trim());
                setConfirmModalOpen(true);
              },
            },
            duration: 8000,
          }
        );
      } else if (msg.includes("email not confirmed")) {
        setRegisteredEmail(email.trim());
        setConfirmModalOpen(true);
        toast.error("Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Bem-vindo de volta!");
    void navigate({ to: "/admin" });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Informe seu e-mail.");
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/admin`,
    });
    setResetLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link de redefinição enviado para seu e-mail!");
    setResetOpen(false);
  };

  const handleResendConfirmation = async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim();
    if (!cleanEmail) {
      toast.error("Informe seu e-mail para o reenvio.");
      return;
    }
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
    setResendLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Link de confirmação reenviado para ${cleanEmail}! Verifique caixa de entrada e spam.`);
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const cleanUsername = (username || email.split("@")[0] || "usuario")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: {
          display_name: displayName.trim() || "Meu Perfil",
          username: cleanUsername,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Se o e-mail já existe na base de autenticação
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      toast.info("Este e-mail já está cadastrado. Acesse a aba 'Entrar' ou use a recuperação de senha.");
      setActiveTab("signin");
      return;
    }

    // Se a confirmação de e-mail estiver desativada no Supabase e a sessão for gerada imediatamente
    if (data.session) {
      toast.success("Conta criada com sucesso! Redirecionando para o painel...");
      void navigate({ to: "/admin" });
      return;
    }

    // Se o Supabase exige confirmação por e-mail (comportamento padrão seguro)
    setRegisteredEmail(email.trim());
    setConfirmModalOpen(true);
  };

  const google = async () => {
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectUrl = `${origin}/admin`;

      // 1. Tenta autenticação direta pelo Supabase
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        // 2. Fallback para Lovable Cloud Auth caso o projeto use o proxy Lovable
        try {
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: redirectUrl,
          });
          if (result.error) {
            throw result.error;
          }
          if (!result.redirected) {
            void navigate({ to: "/admin" });
          }
          return;
        } catch {
          const msg = error.message?.toLowerCase() || "";
          if (msg.includes("provider is not enabled") || msg.includes("disabled") || msg.includes("unsupported provider")) {
            toast.error(
              "O provedor Google precisa estar habilitado no painel Supabase (Auth > Providers > Google). Use e-mail e senha enquanto isso.",
              { duration: 8000 }
            );
          } else {
            toast.error(error.message || "Não foi possível conectar com o Google.");
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao iniciar autenticação com o Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 w-full max-w-md">
        <RouterLink to="/" className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1.5 size-3.5" />
          Voltar para a página inicial
        </RouterLink>
      </div>

      <div className="glass w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Painel {SAAS_CONFIG.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua página de links de alta conversão.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          {/* TAB ENTRAR */}
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">E-mail</Label>
                <Input
                  id="signin-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Senha</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetOpen(true);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <Input
                  id="signin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <span>Não confirmou o e-mail?</span>
                <button
                  type="button"
                  onClick={() => {
                    setRegisteredEmail(email);
                    setConfirmModalOpen(true);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Reenviar link
                </button>
              </div>

              <Button type="submit" className="w-full rounded-xl" size="lg" disabled={loading}>
                {loading ? "Entrando..." : "Entrar no Painel"}
              </Button>
            </form>
          </TabsContent>

          {/* TAB CRIAR CONTA */}
          <TabsContent value="signup">
            <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-xs">
              <div className="flex items-center justify-between font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5" /> 7 Dias Grátis — Todas as Funções
                </span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  R$ 0 Hoje
                </span>
              </div>
              <div className="mt-2 space-y-1 text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-400" /> Todas as funções 100% liberadas por 7 dias
                </p>
                <p className="flex items-center gap-1.5">
                  <Check className="size-3 text-emerald-400" /> Links e categorias ilimitados
                </p>
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3 text-emerald-400" /> Sem compromisso — continue por {SAAS_CONFIG.formattedPrice}/mês se gostar
                </p>
              </div>
            </div>

            <form onSubmit={signUp} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Seu Nome ou Marca</Label>
                <Input
                  id="signup-name"
                  type="text"
                  required
                  placeholder="Ex: Luiz Rogério"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-username">Username desejado para sua URL</Label>
                <div className="flex items-center rounded-xl border border-glass-border bg-secondary/50 px-3">
                  <span className="text-xs text-muted-foreground">/</span>
                  <input
                    id="signup-username"
                    type="text"
                    required
                    placeholder="seunome"
                    className="w-full bg-transparent py-2 pl-1 text-sm outline-none placeholder:text-muted-foreground"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha (mínimo 6 caracteres)</Label>
                <Input
                  id="signup-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full rounded-xl" size="lg" disabled={loading}>
                {loading ? "Criando conta..." : "Criar Conta — 7 Dias Grátis"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="secondary"
          className="w-full rounded-xl"
          onClick={google}
          disabled={loading}
        >
          <svg className="mr-2 size-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continuar com Google
        </Button>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE E-MAIL APÓS CADASTRO */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Mail className="size-6" />
            </div>
            <DialogTitle className="text-xl">Confirme seu E-mail</DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground/90">
              Enviamos um link de ativação para:
              <br />
              <strong className="font-mono text-primary">{registeredEmail || email || "seu e-mail"}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-muted-foreground">
            <p>
              1. Acesse sua caixa de entrada (ou pasta de <em>Spam / Lixo Eletrônico</em>).
            </p>
            <p>
              2. Clique no link de confirmação para ativar sua conta e acessar seu painel automaticamente.
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              className="w-full rounded-xl"
              variant="default"
              onClick={() => {
                setConfirmModalOpen(false);
                setActiveTab("signin");
              }}
            >
              Já confirmei / Ir para o Login
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              disabled={resendLoading}
              onClick={() => handleResendConfirmation(registeredEmail || email)}
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="mr-2 size-3.5 animate-spin" />
                  Reenviando...
                </>
              ) : (
                "Reenviar link de confirmação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE RECUPERAÇÃO DE SENHA */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              Digite seu e-mail cadastrado para receber as instruções de redefinição de senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                required
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setResetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}


