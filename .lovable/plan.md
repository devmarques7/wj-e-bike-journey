
## Diagnóstico

Consultei `auth.users` e confirmei:

- `admin@wjvision.com` existe (id `74dd22ea-39d7-4cf1-bbd2-930708277f55`)
- `email_confirmed_at` está `NULL` → Supabase rejeita o login com `400 email_not_confirmed`
- `last_sign_in_at` está `NULL` → de fato nunca logou

O log de Auth confirma: `"error":"400: Email not confirmed"` no `POST /token`.

Não é problema de senha nem de código — é configuração de confirmação de e-mail do Supabase Auth + um seed que já existe sem confirmar.

## Correções a aplicar

### 1. Confirmar manualmente os e-mails dos usuários já criados (migration SQL)

Atualizar `auth.users` setando `email_confirmed_at = now()` apenas para os e-mails seed do projeto:

- `admin@wjvision.com`
- `staff@wjvision.com`
- `light@wjvision.com`
- `plus@wjvision.com`
- `black@wjvision.com`

(somente onde `email_confirmed_at IS NULL`, para não sobrescrever quem já confirmou).

Isso desbloqueia o login imediatamente para o admin e demais contas demo reais.

### 2. Desativar "Confirm email" no Supabase Auth (recomendado neste projeto)

Como esta aplicação é uma demo/portal interno e o fluxo de cadastro não envia/valida e-mail, a forma definitiva é desligar a obrigatoriedade de confirmação:

- Supabase Dashboard → Authentication → Providers → Email → desmarcar **Confirm email** → Save.

Vou deixar o link direto no final da resposta para o usuário fazer em 1 clique. Sem isso, qualquer novo signup futuro vai cair no mesmo erro.

### 3. Melhorar mensagem de erro em `src/pages/Auth.tsx`

Hoje o catch genérico mostra "Invalid email or password", o que esconde o motivo real (`email_not_confirmed`, `invalid_credentials`, etc.). Vou:

- Ler `error.message` / `error.code` do retorno do `signInWithPassword`
- Exibir mensagens específicas via toast:
  - `email_not_confirmed` → "Confirme seu e-mail antes de entrar."
  - `invalid_credentials` → "E-mail ou senha inválidos."
  - outros → mensagem genérica + `error.message`

Isso vai evitar esse tipo de debugging às cegas no futuro.

### 4. (opcional, só se confirmar) Garantir profile + role para o admin

Se após confirmar o e-mail o login funcionar mas o usuário não for reconhecido como admin, é porque o trigger `handle_new_user` só roda em INSERT em `auth.users`. O admin foi criado em 19:05, o trigger atribui role `admin` por e-mail, então deve estar ok — mas vou verificar `profiles` e `user_roles` para esse `user_id` na execução e, se faltar, inserir via migration:

- `profiles` (user_id, full_name, email)
- `user_roles` (user_id, 'admin')

## Resumo técnico das mudanças

- **Migration SQL**: `UPDATE auth.users SET email_confirmed_at = now() WHERE email IN (...) AND email_confirmed_at IS NULL;` + INSERTs condicionais em `profiles` / `user_roles` se faltarem.
- **Código**: ajuste de tratamento de erro em `src/pages/Auth.tsx`.
- **Ação manual do usuário**: desligar "Confirm email" no painel Supabase (link fornecido).

Após isso, o login com `admin@wjvision.com` + a senha cadastrada (a usada no signup, ex.: `123123` segundo o request) deve funcionar e redirecionar para `/dashboard/admin`.
