-- Criar tabela para armazenar as chaves de torneio
CREATE TABLE IF NOT EXISTS public.chaves_torneio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidade TEXT NOT NULL,
  genero_modalidade genero_tipo NOT NULL,
  formato TEXT NOT NULL CHECK (formato IN ('eliminatoria_simples', 'grupos_eliminatoria', 'todos_contra_todos')),
  numero_times INTEGER NOT NULL,
  estrutura_chave JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativo', 'finalizado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chaves_torneio ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Todos podem ver chaves ativas
CREATE POLICY "Todos podem ver chaves ativas"
ON public.chaves_torneio
FOR SELECT
USING (status IN ('ativo', 'finalizado'));

-- Apenas admin pode criar/modificar chaves
CREATE POLICY "Apenas admin pode criar chaves"
ON public.chaves_torneio
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admin pode atualizar chaves"
ON public.chaves_torneio
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admin pode deletar chaves"
ON public.chaves_torneio
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_chaves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chaves_torneio_updated_at
BEFORE UPDATE ON public.chaves_torneio
FOR EACH ROW
EXECUTE FUNCTION public.update_chaves_updated_at();