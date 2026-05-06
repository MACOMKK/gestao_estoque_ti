# Edge Function: admin-create-user

Cria ou atualiza usuario no Supabase Auth e vincula perfil de acesso na tabela `perfis`.

## Requisitos

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Deploy

```bash
supabase functions deploy admin-create-user
```

## Payload

```json
{
  "email": "usuario@empresa.com",
  "password": "SenhaTemporaria123",
  "perfil": "user",
  "colaborador_id": "uuid-opcional"
}
```

Somente usuario autenticado com `perfis.perfil = 'admin'` pode usar.
