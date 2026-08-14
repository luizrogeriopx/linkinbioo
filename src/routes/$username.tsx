import { createFileRoute, Link as RouterLink, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles, UserX, Zap } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackToTop } from "@/components/bio/BackToTop";
import { LinkButton } from "@/components/bio/LinkButton";
import { supabase } from "@/integrations/supabase/client";
import { getIcon, SAAS_CONFIG, type Category, type LinkItem, type Profile } from "@/lib/bio";

export const Route = createFileRoute("/$username")({
  head: ({ params }) => {
    const rawUsername = params.username;
    const title = `@${rawUsername} — Link na Bio`;
    const description = `Confira os links, ofertas, redes sociais e conteúdos exclusivos de @${rawUsername}.`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `/${rawUsername}` },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: `/${rawUsername}` }],
    };
  },
  component: UserBioPage,
});

function useUserBioData(username: string) {
  return useQuery({
    queryKey: ["user-bio", username.toLowerCase()],
    queryFn: async () => {
      const cleanUsername = username.trim().toLowerCase();

      // Buscar perfil pelo username
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", cleanUsername)
        .limit(1);

      if (profileError) throw profileError;
      const profile = (profiles?.[0] as Profile | undefined) ?? null;
      if (!profile) return { profile: null, categories: [], links: [] };

      // Buscar categorias e links ativos desse perfil
      const [categoriesRes, linksRes] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", profile.user_id)
          .eq("is_active", true)
          .order("position"),
        supabase
          .from("links")
          .select("*")
          .eq("user_id", profile.user_id)
          .eq("is_active", true)
          .order("position"),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (linksRes.error) throw linksRes.error;

      return {
        profile,
        categories: (categoriesRes.data ?? []) as Category[],
        links: (linksRes.data ?? []) as LinkItem[],
      };
    },
    enabled: Boolean(username),
  });
}

function UserBioPage() {
  const { username } = useParams({ from: "/$username" });
  const { data, isLoading } = useUserBioData(username);
  const [search, setSearch] = useState("");

  const profile = data?.profile ?? null;
  const links = useMemo(() => data?.links ?? [], [data]);
  const categories = data?.categories ?? [];

  const term = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      term
        ? links.filter((l) =>
            `${l.title} ${l.description ?? ""}`.toLowerCase().includes(term),
          )
        : links,
    [links, term],
  );

  const featured = filtered.filter((l) => l.is_featured);
  const favorites = filtered.filter((l) => l.is_favorite && !l.is_featured);

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-24 pt-12">
        <div className="glass h-72 animate-pulse rounded-3xl" />
        <div className="mt-6 space-y-4">
          <div className="glass h-14 animate-pulse rounded-2xl" />
          <div className="glass h-14 animate-pulse rounded-2xl" />
          <div className="glass h-14 animate-pulse rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return <UsernameNotFound username={username} />;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-24 pt-6">
      {/* Header do Perfil */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass flex flex-col items-center rounded-3xl px-6 py-8 text-center"
      >
        <Avatar className="size-24 border-2 border-primary/40 shadow-lg">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} loading="lazy" />
          <AvatarFallback className="text-xl font-semibold">
            {profile.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-2xl font-bold">{profile.display_name}</h1>
        <p className="gradient-text text-sm font-semibold">@{profile.username}</p>
        {profile.bio ? (
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{profile.bio}</p>
        ) : null}
        {Array.isArray(profile.socials) && profile.socials.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {profile.socials.map((social, index) => {
              const Icon = getIcon(social.icon);
              return (
                <a
                  key={`${social.url}-${index}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.icon}
                  className="rounded-xl border border-glass-border p-2.5 text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
        ) : null}
      </motion.header>

      {/* Banner Promocional Opcional */}
      {profile.banner_text ? (
        <a
          href={profile.banner_url ?? "#"}
          target={profile.banner_url ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="mt-4 block rounded-2xl bg-[image:var(--gradient-primary)] px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.01]"
        >
          {profile.banner_text}
        </a>
      ) : null}

      {/* Campo de Busca de Links */}
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar links..."
          aria-label="Buscar links"
          className="glass h-12 rounded-2xl border-glass-border pl-10"
        />
      </div>

      {/* Links em Destaque */}
      {featured.length > 0 ? (
        <section className="mt-6 space-y-3">
          <SectionTitle icon={<Sparkles className="size-4 text-accent" />} label="Em destaque" />
          {featured.map((link) => (
            <LinkButton key={link.id} link={link} highlight />
          ))}
        </section>
      ) : null}

      {/* Links Favoritos */}
      {favorites.length > 0 ? (
        <section className="mt-6 space-y-3">
          <SectionTitle label="⭐ Favoritos" />
          {favorites.map((link) => (
            <LinkButton key={link.id} link={link} />
          ))}
        </section>
      ) : null}

      {/* Categorias em Accordion */}
      <Accordion
        type="multiple"
        defaultValue={term ? categories.map((c) => c.id) : []}
        className="mt-6 space-y-3"
      >
        {categories.map((category) => {
          const items = filtered.filter((l) => l.category_id === category.id);
          if (term && items.length === 0) return null;
          return (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="glass overflow-hidden rounded-2xl border-glass-border px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <span className="flex items-center gap-2 font-semibold">
                  <span aria-hidden>{category.emoji}</span>
                  {category.title}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum link nesta categoria.</p>
                ) : (
                  items.map((link) => <LinkButton key={link.id} link={link} />)
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Links sem categoria */}
      {(() => {
        const uncategorized = filtered.filter((l) => !l.category_id && !l.is_featured && !l.is_favorite);
        if (uncategorized.length === 0) return null;
        return (
          <section className="mt-6 space-y-3">
            <SectionTitle label="Outros links" />
            {uncategorized.map((link) => (
              <LinkButton key={link.id} link={link} />
            ))}
          </section>
        );
      })()}

      {term && filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Nenhum link encontrado para “{search}”.
        </p>
      ) : null}

      {/* Footer com link de conversão para o SaaS */}
      <footer className="mt-12 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} {profile.display_name}</p>
        <RouterLink
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-3 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Zap className="size-3 text-primary" />
          Criado com LinkBio • Crie sua bio por R$ 17,40/mês
        </RouterLink>
      </footer>
      <BackToTop />
    </main>
  );
}

function SectionTitle({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {icon}
      {label}
    </h2>
  );
}

function UsernameNotFound({ username }: { username: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <div className="glass w-full rounded-3xl p-8 shadow-2xl">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserX className="size-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">@{username} está disponível!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhum usuário cadastrou este link na bio ainda. Você pode garantir este username agora mesmo e criar sua página de links profissional.
        </p>
        <div className="mt-6 rounded-2xl border border-glass-border bg-secondary/50 p-4">
          <p className="text-xs text-muted-foreground">Plano Pro Completo</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{SAAS_CONFIG.formattedPrice}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild className="w-full rounded-xl" size="lg">
            <RouterLink to="/auth">
              Garantir @{username} agora
              <ArrowRight className="ml-2 size-4" />
            </RouterLink>
          </Button>
          <Button asChild variant="ghost" className="w-full rounded-xl">
            <RouterLink to="/">Conhecer o LinkBio SaaS</RouterLink>
          </Button>
        </div>
      </div>
    </main>
  );
}
