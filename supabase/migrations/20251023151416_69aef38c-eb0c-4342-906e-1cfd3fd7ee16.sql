-- Add trigger to recalculate total_pontos and related fields on pontuacao_geral updates
DROP TRIGGER IF EXISTS update_pontuacao_total_v2 ON public.pontuacao_geral;
CREATE TRIGGER update_pontuacao_total_v2
BEFORE INSERT OR UPDATE ON public.pontuacao_geral
FOR EACH ROW EXECUTE FUNCTION public.update_total_pontos_v2();