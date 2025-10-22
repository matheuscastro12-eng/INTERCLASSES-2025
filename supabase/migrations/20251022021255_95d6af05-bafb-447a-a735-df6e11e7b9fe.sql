-- Corrigir email do usuário admin para usar o formato correto
UPDATE auth.users
SET email = 'aaaec2025@warroom.local'
WHERE email = 'e0e19b64-f0f1-4484-bfb9-8488164ff610@warroom.local';