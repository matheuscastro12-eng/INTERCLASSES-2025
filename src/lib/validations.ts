import { z } from "zod";

// Validation schema for athlete registration
export const atletaSchema = z.object({
  nome_completo: z
    .string()
    .trim()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  turma_id: z.string().uuid("Selecione uma turma válida"),
  genero: z.enum(["M", "F"], { errorMap: () => ({ message: "Selecione um gênero válido" }) }),
  modalidades_inscritas: z
    .array(z.string())
    .min(1, "Selecione ao menos uma modalidade"),
  prioridade_esporte: z.string().optional(),
});

// Validation schema for match score registration
export const partidaSchema = z.object({
  turma_a_id: z.string().uuid("Selecione a turma A"),
  turma_b_id: z.string().uuid("Selecione a turma B"),
  placar_a: z
    .number()
    .int("Placar deve ser um número inteiro")
    .min(0, "Placar não pode ser negativo")
    .max(999, "Placar muito alto"),
  placar_b: z
    .number()
    .int("Placar deve ser um número inteiro")
    .min(0, "Placar não pode ser negativo")
    .max(999, "Placar muito alto"),
  modalidade: z.string().min(1, "Selecione uma modalidade"),
  genero_modalidade: z.enum(["M", "F", "Misto"], { 
    errorMap: () => ({ message: "Selecione um gênero válido" }) 
  }),
  fase: z.string().min(1, "Selecione uma fase"),
  data_hora: z.string().min(1, "Selecione uma data"),
  detalhes_sumula: z
    .string()
    .max(1000, "Detalhes da súmula devem ter no máximo 1000 caracteres")
    .optional(),
});

// Validation schema for penalties
export const penalidadeSchema = z.object({
  turma_id: z.string().uuid("Selecione uma turma válida"),
  tipo_penalidade: z.string().min(1, "Selecione um tipo de penalidade"),
  valor_pontos: z
    .number()
    .int("Pontos devem ser um número inteiro")
    .min(0, "Pontos não podem ser negativos")
    .max(1000, "Valor de pontos muito alto")
    .optional(),
  valor_multa: z
    .number()
    .min(0, "Multa não pode ser negativa")
    .max(100000, "Valor de multa muito alto")
    .optional(),
  artigo_regulamento: z
    .string()
    .trim()
    .min(1, "Artigo do regulamento é obrigatório")
    .max(50, "Artigo deve ter no máximo 50 caracteres"),
  motivo: z
    .string()
    .trim()
    .min(10, "Motivo deve ter no mínimo 10 caracteres")
    .max(500, "Motivo deve ter no máximo 500 caracteres"),
});

// Validation schema for food challenge
export const provaAlimentosSchema = z.object({
  kg_alimentos: z
    .number()
    .min(0, "Quantidade de alimentos não pode ser negativa")
    .max(100000, "Quantidade muito alta"),
  cestas_basicas_entregues: z
    .number()
    .int("Número de cestas deve ser inteiro")
    .min(0, "Cestas não podem ser negativas")
    .max(1000, "Número de cestas muito alto"),
});

// Validation schema for solidarity challenge
export const provaSolidariaSchema = z.object({
  turma_id: z.string().uuid("Selecione uma turma válida"),
  kg_alimentos: z
    .number()
    .min(0, "Quantidade de alimentos não pode ser negativa")
    .max(100000, "Quantidade muito alta"),
  percentual_doadores_sangue: z
    .number()
    .min(0, "Percentual não pode ser negativo")
    .max(100, "Percentual não pode ser maior que 100%"),
});

export type AtletaFormData = z.infer<typeof atletaSchema>;
export type PartidaFormData = z.infer<typeof partidaSchema>;
export type PenalidadeFormData = z.infer<typeof penalidadeSchema>;
export type ProvaAlimentosFormData = z.infer<typeof provaAlimentosSchema>;
export type ProvaSolidariaFormData = z.infer<typeof provaSolidariaSchema>;
