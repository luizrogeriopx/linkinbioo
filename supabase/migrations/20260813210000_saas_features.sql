-- ==============================================================================
-- MIGRAÇÃO SAAS LINKBIO: MULTI-TENANT, PLANO R$ 17,40/MÊS E SUPER ADMIN
-- ==============================================================================

-- 1. Adicionar colunas de suporte a SaaS na tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'pro',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '7 days');

-- 2. Garantir índice único para usernames (sem diferenciação de maiúsculas/minúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username));

-- 3. Atualizar o usuário principal/administrador inicial
UPDATE public.profiles 
SET role = 'admin', 
    username = 'luizrogeriopaixao'
WHERE username = 'usuario' OR is_primary = true;

-- 4. Função auxiliar para verificar se o usuário autenticado é admin do sistema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR username = 'luizrogeriopaixao')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 5. Atualizar políticas para permitir que o Super Admin visualize todos os dados da plataforma
DROP POLICY IF EXISTS "profiles_super_admin_select" ON public.profiles;
CREATE POLICY "profiles_super_admin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "links_super_admin_select" ON public.links;
CREATE POLICY "links_super_admin_select" ON public.links
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "clicks_super_admin_select" ON public.link_clicks;
CREATE POLICY "clicks_super_admin_select" ON public.link_clicks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- 6. Atualizar a trigger de criação de novos usuários com suporte aos campos SaaS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _base_username TEXT;
  _final_username TEXT;
  _count INT := 0;
BEGIN
  _base_username := LOWER(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  -- Remover caracteres inválidos para URL
  _base_username := regexp_replace(_base_username, '[^a-z0-9_]', '', 'g');
  IF _base_username = '' THEN _base_username := 'usuario'; END IF;

  _final_username := _base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = _final_username) LOOP
    _count := _count + 1;
    _final_username := _base_username || _count::text;
  END LOOP;

  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    username, 
    role, 
    plan, 
    subscription_status
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 
    _final_username,
    CASE WHEN _final_username = 'luizrogeriopaixao' THEN 'admin' ELSE 'user' END,
    'pro',
    'active'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END; 
$$;
