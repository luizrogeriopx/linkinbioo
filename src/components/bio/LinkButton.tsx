import { motion } from "framer-motion";
import { ArrowUpRight, Copy, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getIcon, normalizeUrl, type LinkItem } from "@/lib/bio";
import { cn } from "@/lib/utils";

export function LinkButton({ link, highlight }: { link: LinkItem; highlight?: boolean }) {
  const Icon = getIcon(link.icon);
  const href = normalizeUrl(link.url);

  const handleClick = () => {
    void supabase.rpc("register_click", { _link_id: link.id });
  };

  const copy = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(href);
    toast.success("Link copiado!");
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "glass group relative flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-colors hover:border-primary/40",
        highlight && "glow border-primary/40",
      )}
      style={
        link.color
          ? { boxShadow: `0 0 0 1px ${link.color}55, 0 18px 40px -26px ${link.color}` }
          : {}
      }
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
        style={link.color ? { backgroundColor: `${link.color}22`, color: link.color } : {}}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-foreground">{link.title}</span>
          {link.is_favorite ? <Star className="size-3.5 shrink-0 fill-current text-accent" /> : null}
          {link.is_sponsored ? (
            <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              Patrocinado
            </span>
          ) : null}
        </span>
        {link.description ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {link.description}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar link ${link.title}`}
        className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:block"
      >
        <Copy className="size-4" />
      </button>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </motion.a>
  );
}
