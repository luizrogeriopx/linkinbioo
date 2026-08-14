import React from "react";
import * as Icons from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";

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
  role?: "admin" | "user";
  plan?: "pro" | "free";
  subscription_status?: "active" | "trialing" | "canceled" | "past_due";
  trial_ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const SAAS_CONFIG = {
  name: "LinkBio SaaS",
  brandName: "LinkBioPro",
  monthlyPrice: 17.40,
  formattedPrice: "R$ 17,40",
  adminUsername: "luizrogeriopaixao",
  trialDays: 7,
  guaranteeDays: 7,
};

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}


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

export const WhatsAppIcon: LucideIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ color = "currentColor", size = 24, className, strokeWidth = 2, ...props }, ref) =>
    React.createElement(
      "svg",
      {
        ref,
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
        ...props,
      },
      React.createElement("path", {
        d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
      }),
      React.createElement("path", {
        d: "M9.5 9a.5.5 0 0 0-.5.5c0 2 2 4 4 4a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5l-1.2.3a1 1 0 0 1-.8-.2l-.6-.6a1 1 0 0 1-.2-.8l.3-1.2A.5.5 0 0 0 10.5 8h-1z",
      }),
    ),
) as unknown as LucideIcon;
(WhatsAppIcon as React.FC).displayName = "WhatsAppIcon";

const iconRecord = Icons as unknown as Record<string, LucideIcon>;

export function getIcon(name?: string | null): LucideIcon {
  if (!name) return Icons.Link;
  const key = name.trim();
  const lower = key.toLowerCase();
  if (lower === "whatsapp" || lower === "whats" || lower === "zap") {
    return WhatsAppIcon as unknown as LucideIcon;
  }
  if (lower === "telegram") {
    return Icons.Send;
  }
  if (lower === "tiktok") {
    return Icons.Music;
  }
  return iconRecord[key] ?? iconRecord[key.charAt(0).toUpperCase() + key.slice(1)] ?? Icons.Link;
}

export const SOCIAL_OPTIONS = [
  { value: "WhatsApp", label: "WhatsApp", placeholder: "https://wa.me/5511999999999 ou número" },
  { value: "Instagram", label: "Instagram", placeholder: "https://instagram.com/seuusuario" },
  { value: "Youtube", label: "YouTube", placeholder: "https://youtube.com/@seucanal" },
  { value: "TikTok", label: "TikTok", placeholder: "https://tiktok.com/@seuusuario" },
  { value: "Telegram", label: "Telegram", placeholder: "https://t.me/seuusuario" },
  { value: "Twitter", label: "Twitter / X", placeholder: "https://twitter.com/seuusuario" },
  { value: "Facebook", label: "Facebook", placeholder: "https://facebook.com/seuperfil" },
  { value: "Linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/seuperfil" },
  { value: "Mail", label: "E-mail", placeholder: "mailto:seu@email.com" },
  { value: "Globe", label: "Site / Outro", placeholder: "https://seusite.com" },
];

export const ICON_OPTIONS = [
  "WhatsApp",
  "Instagram",
  "Youtube",
  "TikTok",
  "Telegram",
  "Twitter",
  "Facebook",
  "Linkedin",
  "MessageCircle",
  "Mail",
  "Globe",
  "Link",
  "Flame",
  "ShoppingBag",
  "Wallet",
  "GraduationCap",
  "Bot",
  "Gift",
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

  const digitsOnly = trimmed.replace(/\D/g, "");
  if ((trimmed.startsWith("wa.me/") || trimmed.startsWith("api.whatsapp.com/")) && !trimmed.startsWith("http")) {
    return `https://${trimmed}`;
  }
  if (/^(\+?55\d{10,11}|\d{10,11})$/.test(trimmed) || (digitsOnly.length >= 10 && digitsOnly.length <= 13 && !trimmed.includes(".") && !trimmed.includes("/"))) {
    return `https://wa.me/${digitsOnly}`;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
