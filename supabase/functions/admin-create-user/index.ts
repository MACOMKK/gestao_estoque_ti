import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variaveis SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias.');
    }

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization ausente.');
    }

    const requesterClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: requesterAuth, error: requesterError } = await requesterClient.auth.getUser();
    if (requesterError || !requesterAuth?.user) {
      throw new Error('Usuario autenticado nao encontrado.');
    }

    const requesterId = requesterAuth.user.id;
    const { data: requesterPerfil, error: perfilError } = await serviceClient
      .from('perfis')
      .select('perfil')
      .eq('id', requesterId)
      .maybeSingle();

    if (perfilError) throw perfilError;
    if (requesterPerfil?.perfil !== 'admin') {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem criar acessos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const perfil = body?.perfil === 'admin' ? 'admin' : 'user';
    const colaboradorId = body?.colaborador_id || null;

    if (!email || !password) {
      throw new Error('Campos obrigatorios: email e password.');
    }

    if (password.length < 8) {
      throw new Error('A senha temporaria precisa ter pelo menos 8 caracteres.');
    }

    const { data: existingUsers, error: listError } = await serviceClient.auth.admin.listUsers();
    if (listError) throw listError;

    const existing = existingUsers.users.find((u) => (u.email || '').toLowerCase() === email);
    let userId = existing?.id;

    if (!userId) {
      const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: body?.full_name || '' }
      });
      if (createError) throw createError;
      userId = created.user?.id;
    } else {
      const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true
      });
      if (updateError) throw updateError;
    }

    if (!userId) {
      throw new Error('Nao foi possivel obter o id do usuario criado.');
    }

    const perfilPayload: Record<string, unknown> = {
      id: userId,
      perfil
    };

    if (colaboradorId) {
      perfilPayload.colaborador_id = colaboradorId;
    }

    const { error: upsertError } = await serviceClient
      .from('perfis')
      .upsert(perfilPayload, { onConflict: 'id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
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
