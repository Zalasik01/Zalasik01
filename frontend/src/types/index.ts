export interface User {
  id: number;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  searches_used: number;
  searches_limit: number;
}

export interface Entity {
  id: number;
  type: 'person' | 'company';
  name: string;
  document: string;
  document_type: 'CPF' | 'CNPJ';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  secondary_date?: string;
  trade_name?: string;
}

export interface PersonDetail {
  entity_id: number;
  birth_date: string | null;
  gender: string | null;
  mother_name: string | null;
  nationality: string | null;
  pep: number;
}

export interface CompanyDetail {
  entity_id: number;
  trade_name: string | null;
  legal_nature: string | null;
  main_activity: string | null;
  share_capital: number | null;
  foundation_date: string | null;
  size: string | null;
}

export interface Address {
  id: number;
  entity_id: number;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_current: number;
}

export interface Phone {
  id: number;
  entity_id: number;
  number: string;
  type: 'mobile' | 'landline';
}

export interface EmailRecord {
  id: number;
  entity_id: number;
  address: string;
}

export interface LegalProcess {
  id: number;
  entity_id: number;
  process_number: string;
  court: string;
  subject: string;
  status: string;
  last_update: string;
  role: string;
}

export interface SearchHistory {
  id: number;
  user_id: number;
  query: string;
  query_type: string;
  results_count: number;
  searched_at: string;
}

export interface EntityDetail {
  entity: Entity;
  detail: PersonDetail | CompanyDetail | null;
  addresses: Address[];
  phones: Phone[];
  emails: EmailRecord[];
  processes: LegalProcess[];
}

export interface SearchMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
