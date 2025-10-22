-- Deletar usuário admin antigo e recriar do zero
DO $$
DECLARE
  old_admin_id UUID;
BEGIN
  -- Buscar e deletar usuário antigo
  SELECT id INTO old_admin_id FROM auth.users WHERE email = 'aaaec2025@warroom.local';
  
  IF old_admin_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = old_admin_id;
    DELETE FROM auth.users WHERE id = old_admin_id;
  END IF;
  
  -- Criar novo usuário admin com senha correta
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'aaaec2025@warroom.local',
    crypt('admin', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"aaaec2025"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Aguardar trigger criar o profile
  PERFORM pg_sleep(0.1);
  
  -- Atualizar profile para admin
  UPDATE public.profiles 
  SET is_admin = true, username = 'aaaec2025'
  WHERE username = 'aaaec2025';
  
END $$;