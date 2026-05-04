# Edge Function: enviar-termo-gmail

## Variaveis de ambiente (Supabase secrets)

- GMAIL_CLIENT_ID
- GMAIL_CLIENT_SECRET
- GMAIL_REFRESH_TOKEN
- GMAIL_SENDER

## Deploy

```bash
supabase functions deploy enviar-termo-gmail
```

## Exemplo de chamada

```json
{
  "to": "colaborador@empresa.com",
  "subject": "Termo de Responsabilidade - Nome",
  "body_text": "Segue em anexo seu termo.",
  "filename": "Termo_Nome_2026-05-04.pdf",
  "pdf_base64": "JVBERi0xLjQKJ..."
}
```
