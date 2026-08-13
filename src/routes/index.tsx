import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
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
import { getIcon, type Category, type LinkItem, type Profile } from "@/lib/bio";

const title = "Link na Bio — todos os meus links em um só lugar";
const description =
  "Página de links profissional com ofertas, cursos, ferramentas de IA e redes sociais organizados por categorias.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Link na Bio",
          description,
        }),
      },
    ],
  }),
  component: BioPage,
});

function useBioData() {
  return useQuery({
    queryKey: ["bio-public"],
    queryFn: async () => {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1);
      if (profileError) throw profileError;
      const profile = (profiles?.[0] as Profile | undefined) ?? null;
      if (!profile) return { profile: null, categories: [], links: [] };

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
  });
}

function BioPage() {
  const { data, isLoading } = useBioData();
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-24 pt-6">
      {isLoading ? (
        <div className="glass h-64 animate-pulse rounded-3xl" />
      ) : !profile ? (
        <EmptyState />
      ) : (
        <>
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

          {profile.banner_text ? (
            <a
              href={profile.banner_url ?? "#"}
              target={profile.banner_url ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="mt-4 block rounded-2xl bg-[image:var(--gradient-primary)] px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              {profile.banner_text}
            </a>
          ) : null}

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

          {featured.length > 0 ? (
            <section className="mt-6 space-y-3">
              <SectionTitle icon={<Sparkles className="size-4 text-accent" />} label="Em destaque" />
              {featured.map((link) => (
                <LinkButton key={link.id} link={link} highlight />
              ))}
            </section>
          ) : null}

          {favorites.length > 0 ? (
            <section className="mt-6 space-y-3">
              <SectionTitle label="⭐ Favoritos" />
              {favorites.map((link) => (
                <LinkButton key={link.id} link={link} />
              ))}
            </section>
          ) : null}

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

          {term && filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Nenhum link encontrado para “{search}”.
            </p>
          ) : null}
        </>
      )}

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {profile?.display_name ?? "Link na Bio"}
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

function EmptyState() {
  return (
    <div className="glass mt-10 rounded-3xl px-6 py-12 text-center">
      <h1 className="text-2xl font-bold">Sua página de links está pronta</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Entre na área administrativa para criar seu perfil, categorias e links.
      </p>
      <Button asChild className="mt-6 rounded-xl">
        <RouterLink to="/auth">Acessar painel</RouterLink>
      </Button>
    </div>
  );
}
