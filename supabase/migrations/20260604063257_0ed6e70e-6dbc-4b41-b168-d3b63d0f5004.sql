ALTER TABLE public.service_types
ADD COLUMN IF NOT EXISTS reward_points integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.service_types.reward_points IS 'Pontos de recompensa creditados na carteira (vault) do cliente quando o serviço é concluído.';