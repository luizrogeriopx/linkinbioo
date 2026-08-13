import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_text: string | null;
  banner_url: string | null;
  socials: SocialLink[];
  is_primary: boolean;
};

export type SocialLink = { icon: string; url: string };

export type Category = {
  id: string;
  user_id: string;
  title: string;
  emoji: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
};

export type LinkItem = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  color: string | null;
  position: number;
  is_active: boolean;
  is_featured: boolean;
  is_favorite: boolean;
  is_sponsored: boolean;
  click_count: number;
};

const iconRecord = Icons as unknown as Record<string, LucideIcon>;

export function getIcon(name?: string | null): LucideIcon {
  if (!name) return Icons.Link;
  const key = name.trim();
  return iconRecord[key] ?? iconRecord[key.charAt(0).toUpperCase() + key.slice(1)] ?? Icons.Link;
}

export const ICON_OPTIONS = [
  "Link",
  "Flame",
  "ShoppingBag",
  "Wallet",
  "GraduationCap",
  "Bot",
  "Gift",
  "Instagram",
  "Youtube",
  "Twitter",
  "Facebook",
  "Linkedin",
  "MessageCircle",
  "Send",
  "Globe",
  "Video",
  "Star",
  "Zap",
  "TrendingUp",
  "BookOpen",
];

export const CATEGORY_PRESETS = [
  { emoji: "🔥", title: "Ofertas" },
  { emoji: "💰", title: "Renda Extra" },
  { emoji: "📚", title: "Cursos" },
  { emoji: "🤖", title: "Inteligência Artificial" },
  { emoji: "🎁", title: "Ferramentas" },
  { emoji: "📱", title: "Redes Sociais" },
  { emoji: "🎥", title: "Vídeos" },
  { emoji: "🌐", title: "Sites Úteis" },
];

export function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
