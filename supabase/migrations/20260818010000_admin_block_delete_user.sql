-- ==============================================================================
-- MIGRAÇÃO: BLOQUEIO E EXCLUSÃO DE CONTAS PELO SUPER ADMIN
-- ==============================================================================

-- 1. Políticas RLS ampliadas para exclusão e atualização pelo Super Admin
DROP POLICY IF EXISTS "clicks_super_admin_all" ON public.link_clicks;
CREATE POLICY "clicks_super_admin_all" ON public.link_clicks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "payments_super_admin_all" ON public.payments;
CREATE POLICY "payments_super_admin_all" ON public.payments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 2. Função RPC para Bloquear / Desbloquear Conta de Usuário
CREATE OR REPLACE FUNCTION public.admin_toggle_block_user(
  target_user_id UUID,
  block_status BOOLEAN
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 1. Validar permissão de Super Admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar o status de bloqueio.';
  END IF;

  -- 2. Não permitir que o admin bloqueie a si próprio ou a conta principal
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode bloquear a sua própria conta de administrador.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = target_user_id AND (username = 'luizrogeriopaixao' OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Não é permitido bloquear uma conta com privilégio de administrador.';
  END IF;

  -- 3. Atualizar status da conta
  UPDATE public.profiles
  SET subscription_status = CASE WHEN block_status THEN 'blocked' ELSE 'active' END,
      updated_at = now()
  WHERE user_id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', CASE WHEN block_status THEN 'blocked' ELSE 'active' END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_toggle_block_user(UUID, BOOLEAN) TO authenticated;

-- 3. Função RPC para Excluir Integralmente uma Conta de Usuário
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  target_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 1. Validar permissão de Super Admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem excluir contas.';
  END IF;

  -- 2. Não permitir excluir a si próprio ou contas de admin
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode excluir a sua própria conta de administrador.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = target_user_id AND (username = 'luizrogeriopaixao' OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Não é permitido excluir uma conta com privilégio de administrador.';
  END IF;

  -- 3. Deletar registros dependentes do usuário
  DELETE FROM public.link_clicks WHERE user_id = target_user_id;
  DELETE FROM public.links WHERE user_id = target_user_id;
  DELETE FROM public.categories WHERE user_id = target_user_id;
  DELETE FROM public.payments WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;

  -- 4. Tentar remover o registro em auth.users se tiver permissões de sistema
  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Mantém execução mesmo se auth.users exigir chave de service_role externa
  END;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_user_id', target_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
