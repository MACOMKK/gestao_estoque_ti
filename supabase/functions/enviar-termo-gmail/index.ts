import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID');
    const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET');
    const GMAIL_REFRESH_TOKEN = Deno.env.get('GMAIL_REFRESH_TOKEN');
    const GMAIL_SENDER = Deno.env.get('GMAIL_SENDER');

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_SENDER) {
      throw new Error('Variaveis Gmail nao configuradas na Edge Function.');
    }

    const { to, subject, body_text, body_html, filename, pdf_base64 } = await req.json();

    if (!to || !subject || !body_text || !filename || !pdf_base64) {
      throw new Error('Payload incompleto. Campos obrigatorios: to, subject, body_text, filename, pdf_base64');
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

    return new Response(JSON.stringify({ success: true, id: gmailData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Erro inesperado' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});


