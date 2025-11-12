-- Tornar data_hora opcional na tabela partidas
ALTER TABLE public.partidas 
ALTER COLUMN data_hora DROP NOT NULL;