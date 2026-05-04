const DB_KEY = 'gestao_estoque_local_db_v1';

const COLLECTIONS = {
  Unit: 'units',
  Employee: 'employees',
  Asset: 'assets',
  Info: 'infos',
  KnowledgeBase: 'knowledge_base'
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

const clone = (data) => JSON.parse(JSON.stringify(data));

const makeSeedData = () => {
  const now = new Date().toISOString();

  const unitMatrizId = createId();
  const unitFilialId = createId();

  const empAnaId = createId();
  const empCarlosId = createId();
  const empJoaoId = createId();

  return {
    units: [
      {
        id: unitMatrizId,
        name: 'Matriz Fortaleza',
        city: 'Fortaleza',
        address: 'Av. Santos Dumont, 1000',
        phone: '(85) 3000-1000',
        manager: 'Ana Souza',
        status: 'ativa',
        created_date: now,
        updated_date: now
      },
      {
        id: unitFilialId,
        name: 'Filial Juazeiro',
        city: 'Juazeiro do Norte',
        address: 'Rua Padre Cicero, 250',
        phone: '(88) 3000-2000',
        manager: 'Carlos Lima',
        status: 'ativa',
        created_date: now,
        updated_date: now
      }
    ],
    employees: [
      {
        id: empAnaId,
        full_name: 'Ana Souza',
        cpf: '111.111.111-11',
        email: 'ana.souza@empresa.local',
        phone: '(85) 99999-1111',
        department: 'TI',
        role: 'Coordenadora de TI',
        unit_id: unitMatrizId,
        unit_name: 'Matriz Fortaleza',
        admission_date: '2024-01-10',
        status: 'ativo',
        termo_assinado: true,
        termo_assinado_em: '2024-01-12',
        created_date: now,
        updated_date: now
      },
      {
        id: empCarlosId,
        full_name: 'Carlos Lima',
        cpf: '222.222.222-22',
        email: 'carlos.lima@empresa.local',
        phone: '(88) 99999-2222',
        department: 'Operações',
        role: 'Supervisor',
        unit_id: unitFilialId,
        unit_name: 'Filial Juazeiro',
        admission_date: '2023-08-05',
        status: 'ativo',
        termo_assinado: false,
        termo_assinado_em: '',
        created_date: now,
        updated_date: now
      },
      {
        id: empJoaoId,
        full_name: 'João Martins',
        cpf: '333.333.333-33',
        email: 'joao.martins@empresa.local',
        phone: '(85) 99999-3333',
        department: 'Financeiro',
        role: 'Analista Financeiro',
        unit_id: unitMatrizId,
        unit_name: 'Matriz Fortaleza',
        admission_date: '2022-03-14',
        status: 'ativo',
        termo_assinado: true,
        termo_assinado_em: '2022-03-15',
        created_date: now,
        updated_date: now
      }
    ],
    assets: [
      {
        id: createId(),
        tag: 'MAC-NTB-001',
        name: 'Notebook Dell Latitude 5420',
        category: 'notebook',
        brand: 'Dell',
        model: 'Latitude 5420',
        serial_number: 'SN-NTB-001',
        status: 'em_uso',
        condition: 'bom',
        unit_id: unitMatrizId,
        unit_name: 'Matriz Fortaleza',
        purchase_date: '2024-02-01',
        purchase_value: 5200,
        location: 'Sala TI',
        assigned_to: 'Ana Souza',
        assigned_to_email: 'ana.souza@empresa.local',
        assigned_to_cpf: '111.111.111-11',
        assigned_to_department: 'TI',
        assignment_date: '2024-02-05',
        notes: 'Equipamento principal da coordenação.',
        image_url: '',
        created_date: now,
        updated_date: now
      },
      {
        id: createId(),
        tag: 'MAC-MON-014',
        name: 'Monitor LG 24"',
        category: 'monitor',
        brand: 'LG',
        model: '24MK430H',
        serial_number: 'SN-MON-014',
        status: 'disponivel',
        condition: 'novo',
        unit_id: unitMatrizId,
        unit_name: 'Matriz Fortaleza',
        purchase_date: '2025-01-20',
        purchase_value: 890,
        location: 'Estoque TI',
        assigned_to: '',
        assigned_to_email: '',
        assigned_to_cpf: '',
        assigned_to_department: '',
        assignment_date: '',
        notes: '',
        image_url: '',
        created_date: now,
        updated_date: now
      },
      {
        id: createId(),
        tag: 'MAC-RTR-003',
        name: 'Roteador Mikrotik RB4011',
        category: 'roteador',
        brand: 'Mikrotik',
        model: 'RB4011',
        serial_number: 'SN-RTR-003',
        status: 'manutencao',
        condition: 'regular',
        unit_id: unitFilialId,
        unit_name: 'Filial Juazeiro',
        purchase_date: '2021-11-10',
        purchase_value: 2400,
        location: 'CPD Filial',
        assigned_to: '',
        assigned_to_email: '',
        assigned_to_cpf: '',
        assigned_to_department: '',
        assignment_date: '',
        notes: 'Apresentando instabilidade no link WAN.',
        image_url: '',
        created_date: now,
        updated_date: now
      }
    ],
    infos: [
      {
        id: createId(),
        type: 'sistema',
        title: 'ERP Corporativo',
        value: 'https://erp.empresa.local',
        description: 'Acesso ao sistema interno de gestão.',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        unit_name: 'Matriz Fortaleza',
        unit_id: unitMatrizId,
        assigned_to: '',
        assigned_to_id: '',
        assigned_to_department: '',
        created_date: now,
        updated_date: now
      },
      {
        id: createId(),
        type: 'fornecedor',
        title: 'Provedor de Internet X',
        value: 'CNPJ 00.000.000/0001-00',
        description: 'Fornecedor de link dedicado para matriz e filial.',
        contact_name: 'Marina Alves',
        contact_email: 'marina@provedorx.com.br',
        contact_phone: '(85) 4000-0000',
        unit_name: 'Matriz Fortaleza',
        unit_id: unitMatrizId,
        assigned_to: '',
        assigned_to_id: '',
        assigned_to_department: '',
        created_date: now,
        updated_date: now
      },
      {
        id: createId(),
        type: 'chip_corporativo',
        title: 'Linha Comercial 01',
        value: '(85) 98888-1001',
        description: 'Plano corporativo 20GB.',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        unit_name: 'Filial Juazeiro',
        unit_id: unitFilialId,
        assigned_to: 'Carlos Lima',
        assigned_to_id: empCarlosId,
        assigned_to_department: 'Operações',
        created_date: now,
        updated_date: now
      }
    ],
    knowledge_base: [
      {
        id: createId(),
        title: 'Política de Senhas',
        category: 'TI',
        type: 'link',
        url: 'https://intranet.empresa.local/politica-senhas',
        description: 'Diretrizes de criação e rotação de senhas.',
        created_date: now,
        updated_date: now
      },
      {
        id: createId(),
        title: 'Manual de Onboarding',
        category: 'RH',
        type: 'link',
        url: 'https://intranet.empresa.local/onboarding',
        description: 'Passo a passo para integração de novos colaboradores.',
        created_date: now,
        updated_date: now
      }
    ]
  };
};

const loadDb = () => {
  const empty = {
    units: [],
    employees: [],
    assets: [],
    infos: [],
    knowledge_base: []
  };
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const seeded = makeSeedData();
      saveDb(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    const merged = { ...empty, ...parsed };
    const hasData = Object.values(merged).some((items) => Array.isArray(items) && items.length > 0);
    if (!hasData) {
      const seeded = makeSeedData();
      saveDb(seeded);
      return seeded;
    }
    return merged;
  } catch {
    const seeded = makeSeedData();
    saveDb(seeded);
    return seeded;
  }
};

const saveDb = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const sortItems = (items, sort) => {
  if (!sort) return items;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av > bv) return desc ? -1 : 1;
    return desc ? 1 : -1;
  });
};

const createEntityApi = (entityName) => {
  const collection = COLLECTIONS[entityName];

  return {
    async list(sort) {
      const db = loadDb();
      const items = db[collection] || [];
      return clone(sortItems(items, sort));
    },

    async filter(filters = {}) {
      const db = loadDb();
      const items = (db[collection] || []).filter((item) =>
        Object.entries(filters).every(([key, value]) => item[key] === value)
      );
      return clone(items);
    },

    async create(payload) {
      const db = loadDb();
      const now = new Date().toISOString();
      const item = {
        id: createId(),
        ...payload,
        created_date: now,
        updated_date: now
      };
      db[collection] = [...(db[collection] || []), item];
      saveDb(db);
      return clone(item);
    },

    async update(id, payload) {
      const db = loadDb();
      let updated = null;
      db[collection] = (db[collection] || []).map((item) => {
        if (item.id !== id) return item;
        updated = {
          ...item,
          ...payload,
          updated_date: new Date().toISOString()
        };
        return updated;
      });
      saveDb(db);
      if (!updated) throw new Error(`Registro não encontrado: ${entityName} ${id}`);
      return clone(updated);
    },

    async delete(id) {
      const db = loadDb();
      db[collection] = (db[collection] || []).filter((item) => item.id !== id);
      saveDb(db);
      return { success: true };
    }
  };
};

const localUser = {
  id: 'local-user-admin',
  email: 'admin@local.test',
  full_name: 'Administrador Local',
  role: 'admin'
};

export const base44 = {
  auth: {
    async me() {
      return clone(localUser);
    },
    logout() {
      return null;
    },
    redirectToLogin() {
      return null;
    }
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        return { file_url: URL.createObjectURL(file) };
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
