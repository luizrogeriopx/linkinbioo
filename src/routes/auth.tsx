import { createFileRoute, Link as RouterLink, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, ShieldCheck, Sparkles } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/admin" });
    });
  }, [navigate]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        toast.error("E-mail ou senha incorretos. Se ainda não tem cadastro, use a aba 'Criar conta'.");
      } else if (error.message.toLowerCase().includes("email not confirmed")) {
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

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const cleanUsername = (username || email.split("@")[0] || "usuario")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    const { error } = await supabase.auth.signUp({
      email,
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
    toast.success("Conta criada com sucesso! Redirecionando...");
    void navigate({ to: "/admin" });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/admin" });
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

        <Tabs defaultValue="signin" className="mt-6">
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

        <Button variant="secondary" className="w-full rounded-xl" onClick={google}>
          Continuar com Google
        </Button>
      </div>

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

