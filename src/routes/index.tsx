import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Battery,
  Check,
  ChevronDown,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Lock,
  QrCode,
  Search,
  ShieldCheck,
  Signal,
  Smartphone,
  Sparkles,
  Star,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SAAS_CONFIG } from "@/lib/bio";

const title = "LinkBio SaaS — Crie sua Página de Links Profissional";
const description =
  "A plataforma de Link na Bio mais moderna para afiliados, criadores e negócios. Categorias expansíveis, analytics em tempo real e visual premium por apenas R$ 17,40/mês.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [activeTab, setActiveTab] = useState<"afiliados" | "criadores" | "empresas">("afiliados");

  return (
    <div className="flex min-h-screen flex-col selection:bg-primary selection:text-primary-foreground">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-glass-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <RouterLink to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
              <Zap className="size-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              LinkBio<span className="text-primary">.pro</span>
            </span>
          </RouterLink>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#recursos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Recursos
            </a>
            <a href="#demonstracao" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Demonstração
            </a>
            <a href="#precos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Planos
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>

            <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <RouterLink to="/auth">Entrar</RouterLink>
            </Button>
            <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
              <RouterLink to="/auth">
                Começar 7 Dias Grátis
                <ArrowRight className="ml-1.5 size-4" />
              </RouterLink>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 lg:pb-32 lg:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Texto Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 text-center lg:col-span-7 lg:text-left"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                7 Dias Grátis • Todas as Funções Liberadas
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Transforme seguidores em clientes com a bio mais{" "}
                <span className="gradient-text">elegante e lucrativa</span>.
              </h1>

              <p className="text-base text-muted-foreground sm:text-lg">
                Organize centenas de ofertas de afiliado, cursos, redes sociais e produtos digitais em categorias expansíveis com design Glassmorphism e alta conversão.
              </p>

              {/* Botões CTA */}
              <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center lg:justify-start">
                <Button size="lg" asChild className="h-13 rounded-2xl px-7 text-base font-semibold shadow-xl shadow-primary/25">
                  <RouterLink to="/auth">
                    Começar 7 Dias Grátis
                    <ArrowRight className="ml-2 size-5" />
                  </RouterLink>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-13 rounded-2xl border-glass-border bg-glass px-6 text-base font-semibold">
                  <RouterLink to="/$username" params={{ username: "luizrogeriopaixao" }}>
                    <ExternalLink className="mr-2 size-4" />
                    Ver Exemplo Real (@luizrogeriopaixao)
                  </RouterLink>
                </Button>
              </div>

              {/* Garantias */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-muted-foreground lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-400" /> 7 dias de garantia
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="size-4 text-amber-400" /> Ativação imediata
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="size-4 text-primary" /> Cancele quando quiser
                </span>
              </div>
            </motion.div>

            {/* Mockup Interativo Samsung Galaxy S8 (Proporção 360x740) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center lg:col-span-5"
            >
              <div className="relative mx-auto w-[285px] rounded-[42px] border-[7px] border-zinc-800 bg-[#090b10] p-1.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(59,130,246,0.15)] ring-1 ring-white/20">
                {/* Botões Laterais Samsung (Volume, Bixby, Power) */}
                <div className="absolute -left-[9px] top-24 h-12 w-[3px] rounded-l-sm bg-zinc-600 dark:bg-zinc-500" />
                <div className="absolute -left-[9px] top-40 h-7 w-[3px] rounded-l-sm bg-zinc-600 dark:bg-zinc-500" />
                <div className="absolute -right-[9px] top-28 h-10 w-[3px] rounded-r-sm bg-zinc-600 dark:bg-zinc-500" />

                {/* Tela Infinity Display com Proporção 360x740 */}
                <div className="relative flex aspect-[360/740] w-full flex-col justify-between overflow-hidden rounded-[32px] bg-background/95 p-3 pt-1.5 ring-1 ring-white/10">
                  {/* Top Bezel / Sensores do Galaxy S8 */}
                  <div>
                    <div className="flex items-center justify-center gap-2 pb-1.5 pt-0.5">
                      <div className="size-1 rounded-full bg-blue-500/60" />
                      <div className="size-1.5 rounded-full bg-zinc-800 ring-1 ring-zinc-700/60" />
                      <div className="h-1 w-9 rounded-full bg-zinc-700" />
                      <div className="size-1.5 rounded-full bg-zinc-800 ring-1 ring-zinc-700/60" />
                    </div>

                    {/* Barra de Status */}
                    <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-foreground/80">
                      <span>12:45</span>
                      <div className="flex items-center gap-1">
                        <Signal className="size-2.5" />
                        <Wifi className="size-2.5" />
                        <span className="text-[9px] font-bold">85%</span>
                        <Battery className="size-3" />
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo da Bio no Celular */}
                  <div className="my-auto space-y-2.5 rounded-[26px] bg-card/60 p-3 backdrop-blur-md">
                    <div className="flex flex-col items-center text-center">
                      <div className="size-14 rounded-full border-2 border-primary bg-primary/20 p-0.5 shadow-md">
                        <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent text-xs font-bold text-white">
                          LR
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs font-bold">Luiz Rogério</p>
                      <p className="text-[10px] font-medium text-primary">@luizrogeriopaixao</p>
                      <p className="mt-0.5 text-[9.5px] leading-tight text-muted-foreground">
                        Especialista em Negócios Digitais & IA
                      </p>
                    </div>

                    {/* Banner no preview */}
                    <div className="rounded-xl bg-gradient-to-r from-primary to-accent p-1.5 text-center text-[9px] font-semibold text-white shadow-sm">
                      🚀 Cupom 50% OFF em Cursos de IA
                    </div>

                    {/* Links do preview */}
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between rounded-xl border border-glass-border bg-glass p-2 font-medium text-foreground transition-all hover:bg-secondary">
                        <span className="flex items-center gap-1.5 truncate">
                          <Flame className="size-3 text-amber-500 shrink-0" /> 🔥 Top Ofertas da Semana
                        </span>
                        <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-glass-border bg-glass p-2 font-medium text-foreground transition-all hover:bg-secondary">
                        <span className="flex items-center gap-1.5 truncate">
                          <Layers className="size-3 text-sky-400 shrink-0" /> 🤖 Ferramentas de IA
                        </span>
                        <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-2 font-semibold text-primary">
                        <span className="flex items-center gap-1.5 truncate">
                          <Star className="size-3 fill-primary text-primary shrink-0" /> ⭐ VIP no WhatsApp
                        </span>
                        <ArrowRight className="size-3 shrink-0" />
                      </div>
                    </div>

                    <div className="pt-1 text-center text-[8.5px] text-muted-foreground">
                      linkbio.pro/luizrogeriopaixao
                    </div>
                  </div>

                  {/* Barra de Navegação Inferior Samsung Galaxy (Recentes, Home, Voltar) */}
                  <div className="flex items-center justify-around px-8 pt-1 text-muted-foreground/60">
                    <div className="flex h-3 w-3 flex-col justify-between py-0.5">
                      <div className="h-[1.5px] w-full rounded bg-current" />
                      <div className="h-[1.5px] w-full rounded bg-current" />
                      <div className="h-[1.5px] w-full rounded bg-current" />
                    </div>
                    <div className="size-3 rounded-[3px] border-[1.5px] border-current" />
                    <ChevronDown className="size-3.5 rotate-90" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Social Proof / Metrics */}
      <section className="border-y border-glass-border bg-card/30 py-10 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center sm:px-6 md:grid-cols-4">
          <div>
            <p className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">+50.000</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Links Gerados</p>
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold text-primary sm:text-4xl">+2.4M</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Cliques Rastreados</p>
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">99.9%</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Disponibilidade</p>
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold text-accent sm:text-4xl">&lt; 0.3s</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Carregamento</p>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="recursos" className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-6xl space-y-16">
          <div className="text-center">
            <Badge variant="outline" className="border-primary/40 text-primary">Tudo que você precisa</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Projetado para quem precisa de <span className="gradient-text">alta conversão</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Chega de páginas de links bagunçadas. Entregue uma experiência que encanta seus seguidores e multiplica suas vendas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Layers className="size-6 text-primary" />}
              title="Categorias em Acordeom"
              description="Organize dezenas de links em grupos expansíveis como Ofertas, Cursos, Redes Sociais e Ferramentas sem poluir a tela."
            />
            <FeatureCard
              icon={<BarChart3 className="size-6 text-accent" />}
              title="Analytics e Contador de Cliques"
              description="Acompanhe em tempo real quais links geram mais cliques e descubra o que sua audiência realmente procura."
            />
            <FeatureCard
              icon={<Sparkles className="size-6 text-amber-400" />}
              title="Design Glassmorphism Premium"
              description="Visual moderno com efeitos de vidro, modo escuro nativo e transições fluidas que passam máxima credibilidade."
            />
            <FeatureCard
              icon={<QrCode className="size-6 text-emerald-400" />}
              title="QR Code Instantâneo"
              description="Compartilhe sua página em apresentações, cartões de visita, stories e materiais impressos com um QR Code em alta definição."
            />
            <FeatureCard
              icon={<Search className="size-6 text-sky-400" />}
              title="Busca Rápida de Links"
              description="Seus seguidores digitam e encontram o produto ou cupom desejado em milissegundos na sua página."
            />
            <FeatureCard
              icon={<Globe className="size-6 text-purple-400" />}
              title="Username Próprio e SEO"
              description="Tenha sua URL exclusiva e otimização para motores de busca e cartões sociais (Open Graph para WhatsApp e Twitter)."
            />
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="precos" className="relative px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center">
            <Badge variant="outline" className="border-primary/40 text-primary">Planos Simples e Transparentes</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Escolha como quer começar sua <span className="gradient-text">bio de alta conversão</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Experimente grátis por 7 dias com todas as funções ou garanta seu acesso Pro definitivo.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
            {/* PLANO 1: 7 DIAS GRÁTIS */}
            <div className="relative flex flex-col justify-between rounded-3xl border border-glass-border bg-card/70 p-8 shadow-xl backdrop-blur-md transition-all hover:border-primary/40">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-border bg-secondary px-4 py-1 text-xs font-bold uppercase tracking-wider text-foreground shadow-sm">
                🎉 Teste Sem Compromisso
              </div>

              <div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">7 Dias Grátis</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Todas as funções 100% liberadas</p>

                  <div className="mt-6 flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-muted-foreground">R$</span>
                    <span className="font-display text-5xl font-extrabold text-foreground">0</span>
                    <span className="text-sm font-medium text-muted-foreground">/7 dias</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-emerald-400">Sem cobrança imediata</p>
                </div>

                {/* Lista de Vantagens */}
                <div className="mt-8 space-y-3">
                  {[
                    "Todas as funções 100% liberadas",
                    "Página de Bio exclusiva com seu @username",
                    "Links e Categorias expansíveis ilimitados",
                    "Estatísticas e contador de cliques em tempo real",
                    "Efeito Glassmorphism e Tema Escuro",
                    "Links em Destaque, VIP e Patrocinados",
                    "QR Code exclusivo para download e impressão",
                    "Cancele quando quiser em 1 clique",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Check className="size-3 font-bold" />
                      </div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Button asChild size="lg" variant="outline" className="h-13 w-full rounded-2xl border-primary/40 text-base font-bold shadow-md hover:bg-primary hover:text-primary-foreground">
                  <RouterLink to="/auth">
                    Começar 7 Dias Grátis
                    <ArrowRight className="ml-2 size-5" />
                  </RouterLink>
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  ⚡ Ativação imediata • Teste sem riscos
                </p>
              </div>
            </div>

            {/* PLANO 2: PRO ILIMITADO */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-primary/60 bg-card p-8 shadow-2xl shadow-primary/15 transition-all">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                💎 Mais Popular • Acesso Total
              </div>

              <div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">Plano Pro Ilimitado</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Tudo incluso para você vender todos os dias</p>

                  <div className="mt-6 flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-muted-foreground">R$</span>
                    <span className="font-display text-5xl font-extrabold text-foreground">17,40</span>
                    <span className="text-sm font-medium text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-emerald-400">Equivale a menos de R$ 0,58 por dia</p>
                </div>

                {/* Lista de Vantagens */}
                <div className="mt-8 space-y-3">
                  {[
                    "Todas as funções liberadas para sempre",
                    "Página de Bio exclusiva com seu @username",
                    "Links e Categorias expansíveis ilimitados",
                    "Estatísticas completas e contador de cliques",
                    "Efeito Glassmorphism e Tema Escuro",
                    "Links em Destaque, Favoritos e Patrocinados",
                    "Upload de Foto de Perfil e Banner de Aviso",
                    "QR Code exclusivo para download e impressão",
                    "Suporte prioritário e atualizações contínuas",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                        <Check className="size-3 font-bold" />
                      </div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Button asChild size="lg" className="h-13 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/30">
                  <RouterLink to="/auth">
                    Assinar Agora por {SAAS_CONFIG.formattedPrice}/mês
                    <ArrowRight className="ml-2 size-5" />
                  </RouterLink>
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  🔒 Pagamento 100% seguro • Garantia incondicional de 7 dias
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-3xl space-y-12">
          <div className="text-center">
            <Badge variant="outline" className="border-primary/40 text-primary">Dúvidas Frequentes</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Perguntas e Respostas</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tudo o que você precisa saber sobre o LinkBio SaaS</p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="item-1" className="rounded-2xl border border-glass-border bg-card/60 px-5">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Como funciona o teste grátis de 7 dias?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Você cria sua conta em segundos e tem acesso a 100% de todas as ferramentas e recursos da plataforma por 7 dias sem custo inicial. Se gostar, pode continuar no plano de {SAAS_CONFIG.formattedPrice}/mês.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="rounded-2xl border border-glass-border bg-card/60 px-5">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Posso escolher meu próprio @username?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Sim! Você pode escolher qualquer nome de usuário disponível (exemplo: linkbio.pro/seunome). Recomendamos garantir o seu o quanto antes para não ser reservado por outro usuário.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="rounded-2xl border border-glass-border bg-card/60 px-5">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Posso divulgar links de afiliado (Hotmart, Kiwify, Shopee, Amazon)?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Com certeza! A plataforma foi desenhada especialmente para afiliados e criadores que precisam organizar múltiplos produtos e ofertas de forma limpa e com rastreamento de cliques.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="rounded-2xl border border-glass-border bg-card/60 px-5">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Como funciona o cancelamento?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Você pode cancelar sua assinatura a qualquer momento com apenas 1 clique direto no painel, sem taxas de cancelamento ou burocracia.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-accent p-8 text-center text-primary-foreground shadow-2xl sm:p-14">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Pronto para profissionalizar sua bio hoje?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
            Crie sua conta agora mesmo com 7 dias grátis e todas as funções liberadas para começar a gerar mais cliques e conversões.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="h-13 rounded-2xl px-8 text-base font-bold shadow-xl">
              <RouterLink to="/auth">
                Começar 7 Dias Grátis Agora
                <ArrowRight className="ml-2 size-5" />
              </RouterLink>
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-glass-border bg-background py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <span className="font-semibold text-foreground">LinkBioPro</span>
          </div>
          <p>© 2026 • Feito Com LinkBioPro</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass rounded-3xl border-glass-border p-6 transition-transform hover:-translate-y-1">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">{icon}</div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
