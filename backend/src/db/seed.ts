import { getDb, initSchema } from './database';

const ENTITIES = [
  {
    type: 'person', name: 'Ana Paula Ferreira', document: '123.456.789-09',
    document_type: 'CPF', status: 'active',
    detail: { birth_date: '1985-03-14', gender: 'F', mother_name: 'Maria Ferreira', nationality: 'Brasileira', pep: 0 },
    addresses: [{ street: 'Rua das Flores', number: '241', complement: 'Apto 32', neighborhood: 'Jardim Europa', city: 'Sao Paulo', state: 'SP', zip_code: '01452-001' }],
    phones: [{ number: '(11) 98765-4321', type: 'mobile' }],
    emails: [{ address: 'ana.ferreira@email.com' }],
    processes: [{ process_number: '0001234-55.2022.8.26.0100', court: 'TJSP - 5a Vara Civel', subject: 'Acao de Cobranca', status: 'Em andamento', last_update: '2024-01-15', role: 'Reu' }]
  },
  {
    type: 'person', name: 'Carlos Eduardo Souza', document: '987.654.321-00',
    document_type: 'CPF', status: 'active',
    detail: { birth_date: '1978-07-22', gender: 'M', mother_name: 'Joana Souza', nationality: 'Brasileira', pep: 1 },
    addresses: [{ street: 'Av. Paulista', number: '1578', complement: 'Cj 801', neighborhood: 'Bela Vista', city: 'Sao Paulo', state: 'SP', zip_code: '01310-200' }],
    phones: [{ number: '(11) 3456-7890', type: 'landline' }, { number: '(11) 91234-5678', type: 'mobile' }],
    emails: [{ address: 'carlos.souza@empresa.com.br' }],
    processes: [
      { process_number: '0009876-11.2021.4.03.6100', court: 'TRF3 - 1a Vara Federal', subject: 'Improbidade Administrativa', status: 'Suspenso', last_update: '2023-11-20', role: 'Reu' },
      { process_number: '0002345-66.2023.8.26.0100', court: 'TJSP - 12a Vara Civel', subject: 'Acao de Indenizacao', status: 'Em andamento', last_update: '2024-02-10', role: 'Autor' }
    ]
  },
  {
    type: 'person', name: 'Beatriz Lima Santos', document: '456.789.123-87',
    document_type: 'CPF', status: 'active',
    detail: { birth_date: '1992-11-05', gender: 'F', mother_name: 'Regina Santos', nationality: 'Brasileira', pep: 0 },
    addresses: [{ street: 'Rua Augusta', number: '890', complement: null, neighborhood: 'Consolacao', city: 'Sao Paulo', state: 'SP', zip_code: '01304-000' }],
    phones: [{ number: '(11) 97654-3210', type: 'mobile' }],
    emails: [{ address: 'beatriz.lima@gmail.com' }],
    processes: []
  },
  {
    type: 'company', name: 'Tech Solutions Ltda', document: '12.345.678/0001-90',
    document_type: 'CNPJ', status: 'active',
    detail: { trade_name: 'TechSol', legal_nature: 'Sociedade Limitada', main_activity: '6202-3/00 - Desenvolvimento de programas de computador', share_capital: 500000.00, foundation_date: '2015-06-10', size: 'Media Empresa' },
    addresses: [{ street: 'Rua Funchal', number: '411', complement: '15 andar', neighborhood: 'Vila Olimpia', city: 'Sao Paulo', state: 'SP', zip_code: '04551-060' }],
    phones: [{ number: '(11) 3456-7800', type: 'landline' }],
    emails: [{ address: 'contato@techsolutions.com.br' }],
    processes: [{ process_number: '0003456-77.2023.8.26.0100', court: 'TJSP - 3a Vara Trabalhista', subject: 'Reclamacao Trabalhista', status: 'Em andamento', last_update: '2024-03-01', role: 'Reu' }]
  },
  {
    type: 'company', name: 'Comercial Ribeiro & Associados S.A.', document: '98.765.432/0001-10',
    document_type: 'CNPJ', status: 'inactive',
    detail: { trade_name: 'Ribeiro Comercial', legal_nature: 'Sociedade Anonima', main_activity: '4711-3/02 - Comercio varejista de mercadorias em geral', share_capital: 1200000.00, foundation_date: '2001-03-15', size: 'Grande Empresa' },
    addresses: [{ street: 'Av. Brasil', number: '3400', complement: null, neighborhood: 'Centro', city: 'Rio de Janeiro', state: 'RJ', zip_code: '20031-000' }],
    phones: [{ number: '(21) 2222-3333', type: 'landline' }],
    emails: [{ address: 'sac@ribeirocomercial.com.br' }],
    processes: [
      { process_number: '0007654-99.2020.8.19.0001', court: 'TJRJ - 8a Vara Civel', subject: 'Falencia', status: 'Arquivado', last_update: '2022-08-30', role: 'Requerido' },
      { process_number: '0001111-22.2021.8.19.0001', court: 'TJRJ - 2a Vara Fiscal', subject: 'Execucao Fiscal', status: 'Em andamento', last_update: '2024-01-05', role: 'Executado' }
    ]
  },
  {
    type: 'person', name: 'Rodrigo Alves Mendonca', document: '321.654.987-55',
    document_type: 'CPF', status: 'active',
    detail: { birth_date: '1969-09-30', gender: 'M', mother_name: 'Aparecida Mendonca', nationality: 'Brasileira', pep: 0 },
    addresses: [{ street: 'Rua Voluntarios da Patria', number: '220', complement: 'Bl B Apto 12', neighborhood: 'Botafogo', city: 'Rio de Janeiro', state: 'RJ', zip_code: '22270-010' }],
    phones: [{ number: '(21) 98888-7777', type: 'mobile' }],
    emails: [{ address: 'rodrigo.mendonca@outlook.com' }],
    processes: []
  },
  {
    type: 'company', name: 'Construtora Horizonte Azul Eireli', document: '55.444.333/0001-22',
    document_type: 'CNPJ', status: 'suspended',
    detail: { trade_name: 'Horizonte Azul', legal_nature: 'EIRELI', main_activity: '4120-4/00 - Construcao de edificios', share_capital: 250000.00, foundation_date: '2010-01-20', size: 'Pequena Empresa' },
    addresses: [{ street: 'Rua XV de Novembro', number: '900', complement: null, neighborhood: 'Centro', city: 'Curitiba', state: 'PR', zip_code: '80020-310' }],
    phones: [{ number: '(41) 3300-1122', type: 'landline' }],
    emails: [{ address: 'contato@horizonteazul.eng.br' }],
    processes: [
      { process_number: '0005432-11.2022.8.16.0001', court: 'TJPR - 1a Vara Civel', subject: 'Acao de Cobranca', status: 'Em andamento', last_update: '2023-12-10', role: 'Reu' },
      { process_number: '0006543-00.2023.8.16.0001', court: 'TJPR - Vara do Trabalho', subject: 'Reclamacao Trabalhista', status: 'Acordo', last_update: '2024-02-28', role: 'Reu' }
    ]
  },
  {
    type: 'person', name: 'Fernanda Costa Oliveira', document: '654.321.098-76',
    document_type: 'CPF', status: 'active',
    detail: { birth_date: '1990-05-17', gender: 'F', mother_name: 'Lucia Oliveira', nationality: 'Brasileira', pep: 0 },
    addresses: [{ street: 'Av. Boa Viagem', number: '1200', complement: 'Apto 601', neighborhood: 'Boa Viagem', city: 'Recife', state: 'PE', zip_code: '51011-000' }],
    phones: [{ number: '(81) 99876-5432', type: 'mobile' }],
    emails: [{ address: 'fernanda.costa@advogada.com' }],
    processes: [{ process_number: '0008765-44.2023.8.17.0001', court: 'TJPE - 4a Vara Civel', subject: 'Divorcio', status: 'Concluido', last_update: '2023-09-15', role: 'Autor' }]
  }
];

async function seed(): Promise<void> {
  const db = getDb();
  await initSchema();

  for (const e of ENTITIES) {
    const existing = await db.execute({ sql: 'SELECT id FROM entities WHERE document = ?', args: [e.document] });
    if (existing.rows.length > 0) continue;

    const r = await db.execute({
      sql: 'INSERT INTO entities (type, name, document, document_type, status) VALUES (?, ?, ?, ?, ?)',
      args: [e.type, e.name, e.document, e.document_type, e.status]
    });
    const entityId = Number(r.lastInsertRowid);

    if (e.type === 'person') {
      const d = e.detail as any;
      await db.execute({
        sql: 'INSERT INTO person_details (entity_id, birth_date, gender, mother_name, nationality, pep) VALUES (?, ?, ?, ?, ?, ?)',
        args: [entityId, d.birth_date, d.gender, d.mother_name, d.nationality, d.pep]
      });
    } else {
      const d = e.detail as any;
      await db.execute({
        sql: 'INSERT INTO company_details (entity_id, trade_name, legal_nature, main_activity, share_capital, foundation_date, size) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [entityId, d.trade_name, d.legal_nature, d.main_activity, d.share_capital, d.foundation_date, d.size]
      });
    }

    for (const a of e.addresses) {
      await db.execute({
        sql: 'INSERT INTO addresses (entity_id, street, number, complement, neighborhood, city, state, zip_code, is_current) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
        args: [entityId, a.street, a.number, a.complement ?? null, a.neighborhood, a.city, a.state, a.zip_code]
      });
    }
    for (const p of e.phones) {
      await db.execute({ sql: 'INSERT INTO phones (entity_id, number, type) VALUES (?, ?, ?)', args: [entityId, p.number, p.type] });
    }
    for (const em of e.emails) {
      await db.execute({ sql: 'INSERT INTO emails (entity_id, address) VALUES (?, ?)', args: [entityId, em.address] });
    }
    for (const pr of e.processes) {
      await db.execute({
        sql: 'INSERT INTO legal_processes (entity_id, process_number, court, subject, status, last_update, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [entityId, pr.process_number, pr.court, pr.subject, pr.status, pr.last_update, pr.role]
      });
    }
  }

  console.log('Seed completed.');
}

seed().catch(console.error);
