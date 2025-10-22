-- Ensure every class has a pontuacao_geral row
INSERT INTO public.pontuacao_geral (turma_id)
SELECT t.id
FROM public.turmas t
LEFT JOIN public.pontuacao_geral p ON p.turma_id = t.id
WHERE p.turma_id IS NULL;

-- Reset all scoring-related fields
UPDATE public.pontuacao_geral
SET pontos_esportivos = 0,
    pontos_alimentos = 0,
    pontos_sangue = 0,
    pen_wo_esportivo = 0,
    pen_nao_plantao = 0,
    pen_disciplinar = 0,
    pen_nao_calouro = 0,
    kg_alimentos = 0,
    percentual_doadores_sangue = 0,
    cestas_basicas_entregues = 0,
    multa_cestas_faltantes = 0,
    total_pontos = 0,
    updated_at = now();

-- Delete all registered matches
DELETE FROM public.partidas;