import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function encodeBase64Url(input: string) {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toBase64Utf8(input: string) {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function encodeMimeHeaderUtf8(input: string) {
  return `=?UTF-8?B?${toBase64Utf8(input)}?=`;
}

async function sendGmail(payload: any) {
  const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
  const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');
  const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
  const GMAIL_SENDER = Deno.env.get('GMAIL_SENDER');

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_SENDER) {
    throw new Error('Variaveis Gmail nao configuradas na Edge Function.');
  }

  const { to, subject, body_text, body_html, filename, pdf_base64 } = payload || {};

  if (!to || !subject || !body_text || !filename || !pdf_base64) {
    throw new Error('Payload incompleto para envio Gmail.');
  }

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });

  const tokenData = await tokenResp.json();
  if (!tokenResp.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Falha ao obter access token Gmail');
  }

  const boundary = 'boundary_macom_termo';
  const altBoundary = 'boundary_macom_alt';
  const rawHtmlBody = body_html || `<pre style="font-family:Arial,Helvetica,sans-serif;white-space:pre-wrap;">${body_text}</pre>`;
  const htmlBody = rawHtmlBody;
  const plainBodyBase64 = toBase64Utf8(body_text);
  const htmlBodyBase64 = toBase64Utf8(htmlBody);

  const rawMessage = [
    `From: ${GMAIL_SENDER}`,
    `To: ${to}`,
    `Subject: ${encodeMimeHeaderUtf8(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    plainBodyBase64,
    '',
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    htmlBodyBase64,
    '',
    `--${altBoundary}--`,
    '',
    `--${boundary}`,
    'Content-Type: application/pdf; name="termo.pdf"',
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    pdf_base64,
    '',
    `--${boundary}--`
  ].join('\r\n');

  const gmailResp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodeBase64Url(rawMessage) })
  });

  const gmailData = await gmailResp.json();
  if (!gmailResp.ok) {
    throw new Error(gmailData?.error?.message || 'Falha ao enviar email pelo Gmail API');
  }

  return gmailData.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurados.');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Number(body?.batch_size || 10), 50);

    const nowIso = new Date().toISOString();

    const { data: jobs, error: selectError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', nowIso)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (selectError) throw selectError;

    const results = [];

    for (const job of jobs || []) {
      const attempt = (job.tentativas || 0) + 1;

      const { error: lockError } = await supabase
        .from('email_queue')
        .update({ status: 'processing', tentativas: attempt, erro: null })
        .eq('id', job.id)
        .eq('status', 'pending');

      if (lockError) {
        results.push({ id: job.id, status: 'skipped', reason: lockError.message });
        continue;
      }

      try {
        const gmailId = await sendGmail(job.payload);

        const { error: sentError } = await supabase
          .from('email_queue')
          .update({ status: 'sent', processed_at: new Date().toISOString(), erro: null })
          .eq('id', job.id);

        if (sentError) throw sentError;

        results.push({ id: job.id, status: 'sent', gmail_id: gmailId });
      } catch (err) {
        const maxTentativas = job.max_tentativas || 5;
        const shouldFail = attempt >= maxTentativas;

        const retryMinutes = Math.min(60, Math.max(1, attempt * 2));
        const nextSchedule = new Date(Date.now() + retryMinutes * 60 * 1000).toISOString();

        const { error: failError } = await supabase
          .from('email_queue')
          .update({
            status: shouldFail ? 'failed' : 'pending',
            erro: err?.message || 'Erro inesperado no envio',
            scheduled_at: shouldFail ? job.scheduled_at : nextSchedule
          })
          .eq('id', job.id);

        if (failError) {
          results.push({ id: job.id, status: 'error', reason: failError.message });
          continue;
        }

        results.push({ id: job.id, status: shouldFail ? 'failed' : 'retry_scheduled', error: err?.message || 'Erro inesperado no envio' });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Erro inesperado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
