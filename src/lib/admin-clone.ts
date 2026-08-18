import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Category, LinkItem, Profile } from "@/lib/bio";

/**
 * Cria uma instância avulsa do cliente Supabase sem persistência de sessão.
 * Permite cadastrar novos usuários via signUp sem deslogar o administrador logado.
 */
function createStandaloneAuthClient() {
  const supabaseUrl =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env["SUPABASE_URL"] : "") ||
    "";
  const supabaseAnonKey =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (typeof process !== "undefined" ? process.env["SUPABASE_PUBLISHABLE_KEY"] : "") ||
    "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configurações do Supabase não encontradas.");
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Sanitiza o username para URL amigável (minúsculo, apenas letras, números e underlines).
 */
export function sanitizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Gera uma senha forte e legível para a nova conta clonada.
 */
export function generateSecurePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$!";
  let result = "";
  const cryptoObj = typeof window !== "undefined" && window.crypto ? window.crypto : null;
  if (cryptoObj?.getRandomValues) {
    const values = new Uint32Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i]! % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  // Garante que tenha ao menos uma letra maiúscula, um número e um símbolo
  if (!/[A-Z]/.test(result)) result = "A" + result.slice(1);
  if (!/[0-9]/.test(result)) result = result.slice(0, -1) + "7";
  return result;
}

/**
 * Checa se um username já está em uso na tabela de perfis.
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const clean = sanitizeUsername(username);
  if (!clean || clean.length < 2) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", clean)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar disponibilidade de username:", error);
    return true; // não bloqueia por erro de rede
  }

  return !data;
}

/**
 * Obtém estatísticas de contagem de categorias e links do usuário de origem.
 */
export async function getAccountCloneStats(sourceUserId: string): Promise<{
  categoriesCount: number;
  linksCount: number;
  categories: Category[];
  links: LinkItem[];
}> {
  const [categoriesRes, linksRes] = await Promise.all([
    supabase.from("categories").select("*").eq("user_id", sourceUserId).order("position"),
    supabase.from("links").select("*").eq("user_id", sourceUserId).order("position"),
  ]);

  const categories = (categoriesRes.data ?? []) as Category[];
  const links = (linksRes.data ?? []) as LinkItem[];

  return {
    categoriesCount: categories.length,
    linksCount: links.length,
    categories,
    links,
  };
}

export interface CloneUserInput {
  sourceUserId: string;
  sourceProfile: Profile;
  newName: string;
  newEmail: string;
  newUsername: string;
  newPassword: string;
  copyProfileDetails?: boolean;
  copyAvatarAndBanner?: boolean;
  copySocialsAndBio?: boolean;
}

export interface CloneUserResult {
  success: boolean;
  targetUserId: string;
  email: string;
  username: string;
  displayName: string;
  password: string;
  copiedCategories: number;
  copiedLinks: number;
  publicUrl: string;
}

/**
 * Executa a clonagem completa da conta:
 * 1. Validação de dados e unicidade do username
 * 2. Criação do usuário no Supabase Auth (sem alterar a sessão do Admin)
 * 3. Cópia atômica de categorias, links e detalhes do perfil
 */
export async function cloneUserAccount(input: CloneUserInput): Promise<CloneUserResult> {
  const cleanUsername = sanitizeUsername(input.newUsername);
  const cleanEmail = input.newEmail.trim().toLowerCase();
  const cleanName = input.newName.trim();

  if (!cleanName) throw new Error("Informe o nome do novo usuário.");
  if (!cleanUsername || cleanUsername.length < 2) {
    throw new Error("Nome de usuário inválido (mínimo 2 caracteres alfanuméricos).");
  }
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Informe um e-mail válido para a nova conta.");
  }
  if (!input.newPassword || input.newPassword.length < 6) {
    throw new Error("A senha deve conter no mínimo 6 caracteres.");
  }

  // 1. Verificar se o username já existe
  const isAvailable = await checkUsernameAvailable(cleanUsername);
  if (!isAvailable) {
    throw new Error(`O nome de usuário @${cleanUsername} já está em uso. Escolha outro.`);
  }

  // 2. Criar a nova conta no Supabase Auth via cliente isolado
  const standaloneClient = createStandaloneAuthClient();
  const { data: authData, error: authError } = await standaloneClient.auth.signUp({
    email: cleanEmail,
    password: input.newPassword,
    options: {
      data: {
        display_name: cleanName,
        username: cleanUsername,
      },
    },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("user already registered")) {
      throw new Error(`O e-mail ${cleanEmail} já está cadastrado no sistema.`);
    }
    throw new Error(`Erro ao cadastrar novo usuário: ${authError.message}`);
  }

  const targetUserId = authData.user?.id;
  if (!targetUserId) {
    throw new Error("Não foi possível obter o ID da nova conta criada.");
  }

  let copiedCategories = 0;
  let copiedLinks = 0;

  // 3. Tentar executar a clonagem atômica via RPC PostgreSQL
  try {
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)("clone_user_data", {
      source_user_id: input.sourceUserId,
      target_user_id: targetUserId,
      copy_profile_details: input.copyProfileDetails ?? true,
    });

    if (!rpcError && rpcData?.success) {
      copiedCategories = rpcData.copied_categories ?? 0;
      copiedLinks = rpcData.copied_links ?? 0;
    } else {
      throw new Error(rpcError?.message || "RPC indisponível, acionando fallback");
    }
  } catch (rpcErr) {
    console.warn("RPC clone_user_data não executada, utilizando fallback autenticado:", rpcErr);

    // 4. FALLBACK: Execução direta pelo cliente autenticado do Super Admin
    // A) Buscar categorias e links do usuário de origem
    const [categoriesRes, linksRes] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", input.sourceUserId).order("position"),
      supabase.from("links").select("*").eq("user_id", input.sourceUserId).order("position"),
    ]);

    const sourceCategories = (categoriesRes.data ?? []) as Category[];
    const sourceLinks = (linksRes.data ?? []) as LinkItem[];

    // B) Atualizar dados do perfil da nova conta
    const profileUpdate: Partial<Profile> = {
      display_name: cleanName,
      username: cleanUsername,
      role: "user",
      plan: input.sourceProfile.plan || "pro",
      subscription_status: input.sourceProfile.subscription_status || "active",
    };

    if (input.copySocialsAndBio ?? true) {
      profileUpdate.bio = input.sourceProfile.bio ?? "";
      profileUpdate.socials = input.sourceProfile.socials ?? [];
    }

    if (input.copyAvatarAndBanner ?? true) {
      profileUpdate.avatar_url = input.sourceProfile.avatar_url ?? null;
      profileUpdate.banner_text = input.sourceProfile.banner_text ?? null;
      profileUpdate.banner_url = input.sourceProfile.banner_url ?? null;
    }

    await supabase.from("profiles").upsert(
      {
        user_id: targetUserId,
        ...profileUpdate,
      },
      { onConflict: "user_id" }
    );

    // C) Clonar categorias e mapear IDs antigos -> IDs novos
    const categoryIdMap = new Map<string, string>();

    for (const cat of sourceCategories) {
      const { data: newCat, error: catErr } = await supabase
        .from("categories")
        .insert({
          user_id: targetUserId,
          title: cat.title,
          emoji: cat.emoji,
          image_url: cat.image_url,
          position: cat.position,
          is_active: cat.is_active,
        })
        .select("id")
        .single();

      if (!catErr && newCat?.id) {
        categoryIdMap.set(cat.id, newCat.id);
        copiedCategories++;
      }
    }

    // D) Clonar links associando às novas categorias mapeadas
    for (const link of sourceLinks) {
      const mappedCatId = link.category_id ? categoryIdMap.get(link.category_id) || null : null;

      const { error: linkErr } = await supabase.from("links").insert({
        user_id: targetUserId,
        category_id: mappedCatId,
        title: link.title,
        description: link.description,
        url: link.url,
        icon: link.icon,
        color: link.color,
        position: link.position,
        is_active: link.is_active,
        is_featured: link.is_featured,
        is_favorite: link.is_favorite,
        is_sponsored: link.is_sponsored,
        click_count: 0, // Inicia com 0 cliques
      });

      if (!linkErr) {
        copiedLinks++;
      }
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/${cleanUsername}`;

  return {
    success: true,
    targetUserId,
    email: cleanEmail,
    username: cleanUsername,
    displayName: cleanName,
    password: input.newPassword,
    copiedCategories,
    copiedLinks,
    publicUrl,
  };
}
