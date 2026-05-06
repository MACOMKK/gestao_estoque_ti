# Edge Function: process-email-queue

Processa emails pendentes da tabela `email_queue` e envia via Gmail API.

## Variaveis de ambiente (Supabase secrets)

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- GMAIL_CLIENT_ID
- GMAIL_CLIENT_SECRET
- GMAIL_REFRESH_TOKEN
- GMAIL_SENDER

## Deploy

```bash
supabase functions deploy process-email-queue
```

## Execucao manual

```json
{
  "batch_size": 10
}
```

## Agendamento sugerido

Rodar a cada 1 minuto via scheduler para processar `status = pending`.
