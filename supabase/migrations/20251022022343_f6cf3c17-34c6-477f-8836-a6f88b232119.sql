-- Ajustar tabela pontuacao_geral para seguir o regulamento completo
ALTER TABLE public.pontuacao_geral
DROP COLUMN IF EXISTS pontos_modalidades,
DROP COLUMN IF EXISTS pontos_solidaria,
DROP COLUMN IF EXISTS pontos_doacao_sangue,
DROP COLUMN IF EXISTS penalidade_wo,
DROP COLUMN IF EXISTS penalidade_disciplinar;

-- Adicionar novos campos conforme regulamento
ALTER TABLE public.pontuacao_geral
ADD COLUMN pontos_esportivos INTEGER DEFAULT 0,
ADD COLUMN pontos_alimentos INTEGER DEFAULT 0,
ADD COLUMN pontos_sangue INTEGER DEFAULT 0,
ADD COLUMN pen_wo_esportivo INTEGER DEFAULT 0,
ADD COLUMN pen_nao_calouro DECIMAL(10,2) DEFAULT 0,
ADD COLUMN pen_nao_plantao INTEGER DEFAULT 0,
ADD COLUMN pen_disciplinar INTEGER DEFAULT 0,
ADD COLUMN cestas_basicas_entregues INTEGER DEFAULT 0,
ADD COLUMN multa_cestas_faltantes DECIMAL(10,2) DEFAULT 0,
ADD COLUMN percentual_doadores_sangue DECIMAL(5,2) DEFAULT 0;

-- Atualizar função de cálculo de total
CREATE OR REPLACE FUNCTION public.calculate_total_pontos_v2(turma_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT 
    COALESCE(pontos_esportivos, 0) + 
    COALESCE(pontos_alimentos, 0) + 
    COALESCE(pontos_sangue, 0) - 
    COALESCE(pen_wo_esportivo, 0) - 
    COALESCE(pen_nao_plantao, 0) - 
    COALESCE(pen_disciplinar, 0)
  INTO total
  FROM public.pontuacao_geral
  WHERE turma_id = turma_uuid;
  
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atualizar trigger de cálculo
DROP TRIGGER IF EXISTS trigger_update_total_pontos ON public.pontuacao_geral;

CREATE OR REPLACE FUNCTION public.update_total_pontos_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular total de pontos conforme regulamento
  NEW.total_pontos := COALESCE(NEW.pontos_esportivos, 0) + 
                      COALESCE(NEW.pontos_alimentos, 0) + 
                      COALESCE(NEW.pontos_sangue, 0) - 
                      COALESCE(NEW.pen_wo_esportivo, 0) - 
                      COALESCE(NEW.pen_nao_plantao, 0) - 
                      COALESCE(NEW.pen_disciplinar, 0);
  
  -- Calcular multa de cestas faltantes (Art. 84º)
  -- Mínimo 3 cestas, se não atingir cobra equivalente
  IF NEW.cestas_basicas_entregues < 3 THEN
    NEW.multa_cestas_faltantes := (3 - NEW.cestas_basicas_entregues) * 150.00; -- R$150 por cesta
  ELSE
    NEW.multa_cestas_faltantes := 0;
  END IF;
  
  -- Aplicar pontos de doação de sangue se atingir 10% (Art. 88º)
  IF NEW.percentual_doadores_sangue >= 10.0 THEN
    NEW.pontos_sangue := 5;
  ELSE
    NEW.pontos_sangue := 0;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_total_pontos_v2
BEFORE INSERT OR UPDATE ON public.pontuacao_geral
FOR EACH ROW
EXECUTE FUNCTION public.update_total_pontos_v2();

-- Criar tabela de log de penalidades para rastreamento
CREATE TABLE IF NOT EXISTS public.penalidades_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  tipo_penalidade TEXT NOT NULL, -- 'wo_esportivo', 'disciplinar', 'nao_plantao', 'nao_calouro'
  valor_pontos INTEGER,
  valor_multa DECIMAL(10,2),
  artigo_regulamento TEXT NOT NULL,
  motivo TEXT NOT NULL,
  aplicado_por UUID REFERENCES auth.users(id),
  data_aplicacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para penalidades_log
ALTER TABLE public.penalidades_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver penalidades"
ON public.penalidades_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin pode criar penalidades"
ON public.penalidades_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Criar índice para performance
CREATE INDEX idx_penalidades_turma ON public.penalidades_log(turma_id, data_aplicacao DESC);

-- Forçar recálculo de todos os registros
UPDATE public.pontuacao_geral
SET pontos_esportivos = pontos_esportivos
WHERE turma_id IN (SELECT id FROM turmas);