-- ==============================================================================
-- MIGRAÇÃO: CLONAGEM DE CONTA DE USUÁRIOS NO PAINEL ADMIN COM CATEGORIAS E LINKS
-- ==============================================================================

-- 1. Políticas RLS ampliadas para o Super Admin gerenciar Categorias e Links
DROP POLICY IF EXISTS "categories_super_admin_all" ON public.categories;
CREATE POLICY "categories_super_admin_all" ON public.categories
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "links_super_admin_all" ON public.links;
CREATE POLICY "links_super_admin_all" ON public.links
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_super_admin_write" ON public.profiles;
CREATE POLICY "profiles_super_admin_write" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 2. Função RPC para clonar os dados de uma conta para outra
CREATE OR REPLACE FUNCTION public.clone_user_data(
  source_user_id UUID,
  target_user_id UUID,
  copy_profile_details BOOLEAN DEFAULT TRUE
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _category_map JSONB := '{}'::jsonb;
  _cat RECORD;
  _new_cat_id UUID;
  _link RECORD;
  _copied_categories_count INT := 0;
  _copied_links_count INT := 0;
  _source_profile RECORD;
BEGIN
  -- 1. Verificar permissão de admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem clonar contas.';
  END IF;

  -- 2. Verificar existência do perfil de origem
  SELECT * INTO _source_profile FROM public.profiles WHERE user_id = source_user_id;
  IF _source_profile IS NULL THEN
    RAISE EXCEPTION 'Usuário de origem não encontrado.';
  END IF;

  -- 3. Verificar existência do perfil de destino
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = target_user_id) THEN
    RAISE EXCEPTION 'Usuário de destino não encontrado.';
  END IF;

  -- 4. Copiar detalhes do perfil (bio, avatar, banners, redes sociais)
  IF copy_profile_details THEN
    UPDATE public.profiles
    SET bio = COALESCE(_source_profile.bio, bio),
        avatar_url = COALESCE(_source_profile.avatar_url, avatar_url),
        banner_text = COALESCE(_source_profile.banner_text, banner_text),
        banner_url = COALESCE(_source_profile.banner_url, banner_url),
        socials = COALESCE(_source_profile.socials, '[]'::jsonb),
        plan = COALESCE(_source_profile.plan, 'pro'),
        subscription_status = COALESCE(_source_profile.subscription_status, 'active')
    WHERE user_id = target_user_id;
  END IF;

  -- 5. Copiar categorias e mapear IDs antigos -> IDs novos
  FOR _cat IN
    SELECT * FROM public.categories WHERE user_id = source_user_id ORDER BY position ASC
  LOOP
    INSERT INTO public.categories (
      user_id,
      title,
      emoji,
      image_url,
      position,
      is_active
    ) VALUES (
      target_user_id,
      _cat.title,
      _cat.emoji,
      _cat.image_url,
      _cat.position,
      _cat.is_active
    ) RETURNING id INTO _new_cat_id;

    _category_map := jsonb_set(_category_map, ARRAY[_cat.id::text], to_jsonb(_new_cat_id::text));
    _copied_categories_count := _copied_categories_count + 1;
  END LOOP;

  -- 6. Copiar links associando às novas categorias mapeadas
  FOR _link IN
    SELECT * FROM public.links WHERE user_id = source_user_id ORDER BY position ASC
  LOOP
    _new_cat_id := NULL;
    IF _link.category_id IS NOT NULL AND _category_map ? _link.category_id::text THEN
      _new_cat_id := (_category_map->>_link.category_id::text)::UUID;
    END IF;

    INSERT INTO public.links (
      user_id,
      category_id,
      title,
      description,
      url,
      icon,
      color,
      position,
      is_active,
      is_featured,
      is_favorite,
      is_sponsored,
      click_count
    ) VALUES (
      target_user_id,
      _new_cat_id,
      _link.title,
      _link.description,
      _link.url,
      _link.icon,
      _link.color,
      _link.position,
      _link.is_active,
      _link.is_featured,
      _link.is_favorite,
      _link.is_sponsored,
      0 -- Reseta cliques na conta clonada
    );

    _copied_links_count := _copied_links_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'copied_categories', _copied_categories_count,
    'copied_links', _copied_links_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.clone_user_data(UUID, UUID, BOOLEAN) TO authenticated;
