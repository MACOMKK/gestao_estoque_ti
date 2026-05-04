import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const assertSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local');
  }
};

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const ENTITY_CONFIG = {
  Unit: {
    table: 'unidades',
    fieldMap: {
      id: 'id',
      name: 'nome',
      city: 'cidade',
      address: 'endereco',
      phone: 'telefone',
      manager: 'responsavel',
      status: 'status',
      created_date: 'criado_em',
      updated_date: 'atualizado_em'
    }
  },
  Employee: {
    table: 'colaboradores',
    fieldMap: {
      id: 'id',
      full_name: 'nome_completo',
      cpf: 'cpf',
      email: 'email',
      phone: 'telefone',
      department: 'departamento',
      role: 'cargo',
      unit_id: 'unidade_id',
      unit_name: 'unidade_nome',
      admission_date: 'data_admissao',
      status: 'status',
      termo_assinado: 'termo_assinado',
      termo_assinado_em: 'termo_assinado_em',
      created_date: 'criado_em',
      updated_date: 'atualizado_em'
    }
  },
  Asset: {
    table: 'ativos',
    fieldMap: {
      id: 'id',
      tag: 'patrimonio',
      name: 'nome',
      category: 'categoria',
      brand: 'marca',
      model: 'modelo',
      serial_number: 'numero_serie',
      status: 'status',
      condition: 'estado',
      unit_id: 'unidade_id',
      unit_name: 'unidade_nome',
      purchase_date: 'data_compra',
      purchase_value: 'valor_compra',
      location: 'localizacao',
      assigned_to: 'atribuido_para',
      assigned_to_email: 'atribuido_para_email',
      assigned_to_cpf: 'atribuido_para_cpf',
      assigned_to_department: 'atribuido_para_departamento',
      assignment_date: 'data_atribuicao',
      notes: 'observacoes',
      image_url: 'url_imagem',
      created_date: 'criado_em',
      updated_date: 'atualizado_em'
    }
  },
  Info: {
    table: 'informacoes',
    fieldMap: {
      id: 'id',
      type: 'tipo',
      title: 'titulo',
      value: 'valor',
      description: 'descricao',
      contact_name: 'contato_nome',
      contact_email: 'contato_email',
      contact_phone: 'contato_telefone',
      unit_name: 'unidade_nome',
      unit_id: 'unidade_id',
      assigned_to: 'atribuido_para',
      assigned_to_id: 'atribuido_para_id',
      assigned_to_department: 'atribuido_para_departamento',
      created_date: 'criado_em',
      updated_date: 'atualizado_em'
    }
  },
  KnowledgeBase: {
    table: 'base_conhecimento',
    fieldMap: {
      id: 'id',
      title: 'titulo',
      category: 'categoria',
      type: 'tipo',
      url: 'url',
      description: 'descricao',
      created_date: 'criado_em',
      updated_date: 'atualizado_em'
    }
  }
};

const invertMap = (obj) =>
  Object.entries(obj).reduce((acc, [k, v]) => {
    acc[v] = k;
    return acc;
  }, {});

const mapToDb = (payload, fieldMap) => {
  const nullableDateColumns = new Set([
    'data_admissao',
    'termo_assinado_em',
    'data_compra',
    'data_atribuicao'
  ]);

  const out = {};
  Object.entries(payload || {}).forEach(([key, value]) => {
    const dbKey = fieldMap[key] || key;
    if (value === '' && nullableDateColumns.has(dbKey)) {
      out[dbKey] = null;
    } else {
      out[dbKey] = value;
    }
  });
  return out;
};

const mapFromDb = (row, reverseFieldMap) => {
  const out = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const appKey = reverseFieldMap[key] || key;
    out[appKey] = value;
  });
  return out;
};

const parseSort = (sort) => {
  if (!sort) return { column: 'criado_em', ascending: false };
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return { field, ascending: !desc };
};

const withTimeout = async (promise, ms = 15000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Tempo de resposta excedido no Supabase. Verifique internet, Auth anonimo e politicas RLS.'));
    }, ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const run = async (promise) => {
  assertSupabaseConfigured();
  const { data, error } = await withTimeout(promise);
  if (error) throw error;
  return data;
};

const createEntityApi = (entityName) => {
  const cfg = ENTITY_CONFIG[entityName];
  const reverseFieldMap = invertMap(cfg.fieldMap);

  return {
    async list(sort) {
      assertSupabaseConfigured();
      const parsed = parseSort(sort);
      const dbSortColumn = cfg.fieldMap[parsed.field] || parsed.field;
      const rows = await run(
        supabase.from(cfg.table).select('*').order(dbSortColumn, { ascending: parsed.ascending })
      );
      return (rows || []).map((row) => mapFromDb(row, reverseFieldMap));
    },

    async filter(filters = {}) {
      assertSupabaseConfigured();
      let query = supabase.from(cfg.table).select('*');
      const dbFilters = mapToDb(filters, cfg.fieldMap);
      Object.entries(dbFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const rows = await run(query);
      return (rows || []).map((row) => mapFromDb(row, reverseFieldMap));
    },

    async create(payload) {
      assertSupabaseConfigured();
      const row = await run(
        supabase.from(cfg.table).insert(mapToDb(payload, cfg.fieldMap)).select('*').single()
      );
      return mapFromDb(row, reverseFieldMap);
    },

    async update(id, payload) {
      assertSupabaseConfigured();
      const row = await run(
        supabase.from(cfg.table).update(mapToDb(payload, cfg.fieldMap)).eq('id', id).select('*').single()
      );
      return mapFromDb(row, reverseFieldMap);
    },

    async delete(id) {
      assertSupabaseConfigured();
      await run(supabase.from(cfg.table).delete().eq('id', id));
      return { success: true };
    }
  };
};

const uploadFile = async (file) => {
  assertSupabaseConfigured();
  const ext = file.name?.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return { file_url: data.publicUrl };
};

export const base44 = {
  auth: {
    async me() {
      assertSupabaseConfigured();
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      const user = data?.user;
      if (!user) {
        const err = new Error('Usuario nao autenticado no Supabase');
        err.status = 401;
        throw err;
      }
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Usuario',
        role: 'admin'
      };
    },
    async login(email, password) {
      assertSupabaseConfigured();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return true;
    },
    async logout() {
      assertSupabaseConfigured();
      await supabase.auth.signOut();
    },
    async getAccessToken() {
      assertSupabaseConfigured();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data?.session?.access_token || '';
    },
    redirectToLogin() {
      window.location.href = '/login';
    }
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        return uploadFile(file);
      }
    },
    Functions: {
      async invoke(name, body) {
        assertSupabaseConfigured();
        const token = await base44.auth.getAccessToken();
        const resp = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body || {})
        });

        const payload = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(payload?.error || `Falha ao chamar function ${name}`);
        }
        return payload;
      }
    }
  },
  entities: {
    Unit: createEntityApi('Unit'),
    Employee: createEntityApi('Employee'),
    Asset: createEntityApi('Asset'),
    Info: createEntityApi('Info'),
    KnowledgeBase: createEntityApi('KnowledgeBase')
  }
};
