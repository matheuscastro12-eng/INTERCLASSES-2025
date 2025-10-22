-- Dropar trigger antigo e recriar corretamente
DROP TRIGGER IF EXISTS trigger_update_total_pontos ON public.pontuacao_geral;

-- Recriar função de atualização de pontos
CREATE OR REPLACE FUNCTION public.update_total_pontos()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular o total de pontos
  NEW.total_pontos := COALESCE(NEW.pontos_modalidades, 0) + 
                      COALESCE(NEW.pontos_solidaria, 0) + 
                      COALESCE(NEW.pontos_doacao_sangue, 0) - 
                      COALESCE(NEW.penalidade_wo, 0) - 
                      COALESCE(NEW.penalidade_disciplinar, 0);
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar trigger
CREATE TRIGGER trigger_update_total_pontos
BEFORE INSERT OR UPDATE ON public.pontuacao_geral
FOR EACH ROW
EXECUTE FUNCTION public.update_total_pontos();

-- Forçar atualização de todos os registros existentes
UPDATE public.pontuacao_geral
SET pontos_modalidades = pontos_modalidades
WHERE turma_id IN (
  SELECT id FROM turmas
);