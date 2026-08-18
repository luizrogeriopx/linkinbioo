import { supabase } from "@/integrations/supabase/client";

/**
 * Altera o status de bloqueio de uma conta (bloquear ou desbloquear).
 */
export async function toggleBlockUser(
  targetUserId: string,
  block: boolean
): Promise<{ success: boolean; newStatus: "blocked" | "active" }> {
  if (!targetUserId) throw new Error("ID de usuário inválido.");

  const newStatus = block ? "blocked" : "active";

  try {
    // 1. Tenta executar via RPC com validações de segurança
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      "admin_toggle_block_user",
      {
        target_user_id: targetUserId,
        block_status: block,
      }
    );

    if (!rpcError && rpcData?.success) {
      return { success: true, newStatus: rpcData.status };
    }

    throw new Error(rpcError?.message || "Erro na RPC");
  } catch (err: any) {
    console.warn("RPC admin_toggle_block_user falhou, acionando fallback direto:", err);

    // 2. Fallback: Atualiza a tabela profiles diretamente com o perfil autenticado de admin
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    if (updateError) {
      throw new Error(`Erro ao alterar status da conta: ${updateError.message}`);
    }

    return { success: true, newStatus };
  }
}

/**
 * Exclui integralmente a conta de um usuário (links, categorias, cliques e perfil).
 */
export async function deleteUserAccount(targetUserId: string): Promise<{ success: boolean }> {
  if (!targetUserId) throw new Error("ID de usuário inválido.");

  try {
    // 1. Tenta executar via RPC atômica
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)("admin_delete_user", {
      target_user_id: targetUserId,
    });

    if (!rpcError && rpcData?.success) {
      return { success: true };
    }

    throw new Error(rpcError?.message || "Erro na RPC");
  } catch (err: any) {
    console.warn("RPC admin_delete_user falhou, acionando fallback direto:", err);

    // 2. Fallback: Exclusão em cascata pela chave do administrador
    const [clicksErr, linksErr, catsErr, paysErr] = await Promise.all([
      supabase.from("link_clicks").delete().eq("user_id", targetUserId),
      supabase.from("links").delete().eq("user_id", targetUserId),
      supabase.from("categories").delete().eq("user_id", targetUserId),
      supabase.from("payments").delete().eq("user_id", targetUserId),
    ]);

    if (clicksErr.error) console.warn("Erro ao excluir cliques:", clicksErr.error);
    if (linksErr.error) console.warn("Erro ao excluir links:", linksErr.error);
    if (catsErr.error) console.warn("Erro ao excluir categorias:", catsErr.error);
    if (paysErr.error) console.warn("Erro ao excluir pagamentos:", paysErr.error);

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", targetUserId);

    if (profileError) {
      throw new Error(`Erro ao excluir perfil do usuário: ${profileError.message}`);
    }

    return { success: true };
  }
}
