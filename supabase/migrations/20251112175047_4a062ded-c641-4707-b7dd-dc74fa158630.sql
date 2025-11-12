-- Corrigir search_path da função update_chaves_updated_at
CREATE OR REPLACE FUNCTION public.update_chaves_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;