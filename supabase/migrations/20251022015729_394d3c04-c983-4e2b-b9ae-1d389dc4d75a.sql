-- Criar enum para gênero
CREATE TYPE public.genero_tipo AS ENUM ('Masculino', 'Feminino', 'Outro');

-- Criar enum para status de modalidade
CREATE TYPE public.status_modalidade AS ENUM ('agendada', 'em_andamento', 'finalizada', 'cancelada');

-- Tabela de turmas com dados iniciais
CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_turma TEXT NOT NULL UNIQUE,
  graduacao INTEGER NOT NULL,
  internato BOOLEAN NOT NULL DEFAULT false,
  calouro BOOLEAN NOT NULL DEFAULT false,
  sexto_ano BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de atletas
CREATE TABLE public.atletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  genero public.genero_tipo NOT NULL,
  prioridade_esporte TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de partidas
CREATE TABLE public.partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidade TEXT NOT NULL,
  genero_modalidade public.genero_tipo NOT NULL,
  fase TEXT NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  turma_a_id UUID NOT NULL REFERENCES public.turmas(id),
  turma_b_id UUID NOT NULL REFERENCES public.turmas(id),
  placar_a INTEGER,
  placar_b INTEGER,
  vencedor_id UUID REFERENCES public.turmas(id),
  wo_aplicado BOOLEAN DEFAULT false,
  turma_wo_id UUID REFERENCES public.turmas(id),
  detalhes_sumula TEXT,
  status public.status_modalidade DEFAULT 'agendada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de pontuação geral
CREATE TABLE public.pontuacao_geral (
  turma_id UUID PRIMARY KEY REFERENCES public.turmas(id) ON DELETE CASCADE,
  pontos_modalidades INTEGER DEFAULT 0,
  pontos_solidaria INTEGER DEFAULT 0,
  pontos_doacao_sangue INTEGER DEFAULT 0,
  kg_alimentos DECIMAL(10,2) DEFAULT 0,
  penalidade_wo INTEGER DEFAULT 0,
  penalidade_disciplinar INTEGER DEFAULT 0,
  total_pontos INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de logs da prova solidária (para rollback)
CREATE TABLE public.pontuacao_solidaria_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  valor_anterior JSONB,
  valor_novo JSONB NOT NULL,
  data_alteracao TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_admin_id UUID REFERENCES auth.users(id),
  motivo_alteracao TEXT NOT NULL
);

-- Tabela de perfis (para vincular com auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir as 12 turmas iniciais
INSERT INTO public.turmas (nome_turma, graduacao, internato, calouro, sexto_ano) VALUES
('54', 54, true, false, true),
('55', 55, true, false, true),
('56', 56, true, false, false),
('57', 57, true, false, false),
('58', 58, false, false, false),
('59', 59, false, false, false),
('60', 60, false, false, false),
('61', 61, false, false, false),
('62', 62, false, false, false),
('63', 63, false, false, false),
('64', 64, false, true, false),
('65', 65, false, true, false);

-- Inicializar pontuação geral para todas as turmas
INSERT INTO public.pontuacao_geral (turma_id)
SELECT id FROM public.turmas;

-- Função para calcular total de pontos
CREATE OR REPLACE FUNCTION public.calculate_total_pontos(turma_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT 
    pontos_modalidades + 
    pontos_solidaria + 
    pontos_doacao_sangue - 
    penalidade_wo - 
    penalidade_disciplinar
  INTO total
  FROM public.pontuacao_geral
  WHERE turma_id = turma_uuid;
  
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar total_pontos automaticamente
CREATE OR REPLACE FUNCTION public.update_total_pontos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_pontos := public.calculate_total_pontos(NEW.turma_id);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_total_pontos
BEFORE INSERT OR UPDATE ON public.pontuacao_geral
FOR EACH ROW
EXECUTE FUNCTION public.update_total_pontos();

-- Função para aplicar WO (multa de 5 pontos)
CREATE OR REPLACE FUNCTION public.aplicar_wo(turma_uuid UUID, partida_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.pontuacao_geral
  SET penalidade_wo = penalidade_wo + 5
  WHERE turma_id = turma_uuid;
  
  UPDATE public.partidas
  SET wo_aplicado = true, turma_wo_id = turma_uuid, status = 'finalizada'
  WHERE id = partida_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, is_admin)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'username',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontuacao_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontuacao_solidaria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Turmas (público pode ver, só admin pode editar)
CREATE POLICY "Todos podem ver turmas"
ON public.turmas FOR SELECT
USING (true);

CREATE POLICY "Apenas admin pode modificar turmas"
ON public.turmas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- RLS Policies - Atletas (público pode ver, só admin pode editar)
CREATE POLICY "Todos podem ver atletas"
ON public.atletas FOR SELECT
USING (true);

CREATE POLICY "Apenas admin pode modificar atletas"
ON public.atletas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- RLS Policies - Partidas (público pode ver, só admin pode editar)
CREATE POLICY "Todos podem ver partidas"
ON public.partidas FOR SELECT
USING (true);

CREATE POLICY "Apenas admin pode modificar partidas"
ON public.partidas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- RLS Policies - Pontuação (público pode ver, só admin pode editar)
CREATE POLICY "Todos podem ver pontuação"
ON public.pontuacao_geral FOR SELECT
USING (true);

CREATE POLICY "Apenas admin pode modificar pontuação"
ON public.pontuacao_geral FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- RLS Policies - Logs (só admin pode ver e criar)
CREATE POLICY "Apenas admin pode ver logs"
ON public.pontuacao_solidaria_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Apenas admin pode criar logs"
ON public.pontuacao_solidaria_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- RLS Policies - Profiles
CREATE POLICY "Usuários podem ver próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Criar índices para performance
CREATE INDEX idx_atletas_turma ON public.atletas(turma_id);
CREATE INDEX idx_atletas_genero ON public.atletas(genero);
CREATE INDEX idx_partidas_turmas ON public.partidas(turma_a_id, turma_b_id);
CREATE INDEX idx_partidas_data ON public.partidas(data_hora DESC);
CREATE INDEX idx_partidas_modalidade ON public.partidas(modalidade, genero_modalidade);
CREATE INDEX idx_pontuacao_total ON public.pontuacao_geral(total_pontos DESC);
CREATE INDEX idx_logs_turma ON public.pontuacao_solidaria_logs(turma_id, data_alteracao DESC);