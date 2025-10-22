-- Adicionar campo de modalidades aos atletas (array de texto para múltiplas inscrições)
ALTER TABLE public.atletas 
ADD COLUMN IF NOT EXISTS modalidades_inscritas text[] DEFAULT '{}';

-- Atualizar comentário da tabela
COMMENT ON COLUMN public.atletas.modalidades_inscritas IS 'Lista de modalidades em que o atleta está inscrito';

-- Criar índice para melhorar consultas de modalidades
CREATE INDEX IF NOT EXISTS idx_atletas_modalidades ON public.atletas USING GIN(modalidades_inscritas);