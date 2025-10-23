-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only admins can modify roles (temporary - will be updated after has_role function)
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing admins from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Add 'user' role for all existing users who aren't admins
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM public.profiles
WHERE is_admin = false OR is_admin IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policies to use has_role function instead of profiles.is_admin

-- Drop old policies and create new ones for atletas
DROP POLICY IF EXISTS "Apenas admin pode modificar atletas" ON public.atletas;
CREATE POLICY "Apenas admin pode modificar atletas"
ON public.atletas
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old policies and create new ones for partidas
DROP POLICY IF EXISTS "Apenas admin pode modificar partidas" ON public.partidas;
CREATE POLICY "Apenas admin pode modificar partidas"
ON public.partidas
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old policies and create new ones for pontuacao_geral
DROP POLICY IF EXISTS "Apenas admin pode modificar pontuação" ON public.pontuacao_geral;
CREATE POLICY "Apenas admin pode modificar pontuação"
ON public.pontuacao_geral
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old policies and create new ones for penalidades_log
DROP POLICY IF EXISTS "Admin pode criar penalidades" ON public.penalidades_log;
DROP POLICY IF EXISTS "Admin pode ver penalidades" ON public.penalidades_log;

CREATE POLICY "Admin pode criar penalidades"
ON public.penalidades_log
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode ver penalidades"
ON public.penalidades_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old policies and create new ones for pontuacao_solidaria_logs
DROP POLICY IF EXISTS "Apenas admin pode criar logs" ON public.pontuacao_solidaria_logs;
DROP POLICY IF EXISTS "Apenas admin pode ver logs" ON public.pontuacao_solidaria_logs;

CREATE POLICY "Apenas admin pode criar logs"
ON public.pontuacao_solidaria_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin pode ver logs"
ON public.pontuacao_solidaria_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old policies and create new ones for turmas
DROP POLICY IF EXISTS "Apenas admin pode modificar turmas" ON public.turmas;
CREATE POLICY "Apenas admin pode modificar turmas"
ON public.turmas
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update the aplicar_wo function to use has_role for authorization
CREATE OR REPLACE FUNCTION public.aplicar_wo(turma_uuid UUID, partida_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller has admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  UPDATE public.pontuacao_geral
  SET pen_wo_esportivo = pen_wo_esportivo + 5
  WHERE turma_id = turma_uuid;
  
  UPDATE public.partidas
  SET wo_aplicado = true, turma_wo_id = turma_uuid, status = 'finalizada'
  WHERE id = partida_uuid;
END;
$$;

-- Update handle_new_user trigger to add user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, username, is_admin)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'username',
    false
  );
  
  -- Insert default 'user' role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;