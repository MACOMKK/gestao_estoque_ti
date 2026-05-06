# Gestao de Estoque TI (Supabase)

## Rodar local
1. `npm install`
2. Criar `.env.local`:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
3. `npm run dev`

## Arquitetura (resumo)
- `auth.users`: identidade e login/senha.
- `public.perfis`: autorização da conta (`perfil = admin|user`) e vínculo opcional com colaborador (`colaborador_id`).
- `public.colaboradores`: dados de negócio (RH/ativos).
- `public.colaboradores_com_acesso` (VIEW): expõe `perfil_acesso` por colaborador para a tela de Colaboradores.

## Regras de acesso atuais
- Apenas `perfil = admin` pode acessar o painel.
- Usuário `user` não entra no sistema.
- Escrita (create/update/delete/functions) é bloqueada no client para não-admin.

## Fila de e-mail
- Tabela: `public.email_queue`
- Worker: `supabase/functions/process-email-queue`
- Disparo:
  - imediato no envio de termo
  - cron de backup a cada 1 minuto

## Funções Supabase
- `process-email-queue`: processa fila de e-mail.
- `admin-create-user`: cria/atualiza usuário de acesso e perfil.
