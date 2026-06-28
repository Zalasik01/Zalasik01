import { createClient, Client } from '@libsql/client';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../osint.db');

let client: Client;

export function getDb(): Client {
  if (!client) {
    client = createClient({ url: `file:${DB_PATH}` });
  }
  return client;
}

export async function initSchema(): Promise<void> {
  const db = getDb();

  const stmts = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      searches_used INTEGER NOT NULL DEFAULT 0,
      searches_limit INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('person', 'company')),
      name TEXT NOT NULL,
      document TEXT UNIQUE NOT NULL,
      document_type TEXT NOT NULL CHECK(document_type IN ('CPF', 'CNPJ')),
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS person_details (
      entity_id INTEGER PRIMARY KEY REFERENCES entities(id),
      birth_date TEXT, gender TEXT, mother_name TEXT, nationality TEXT, pep INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS company_details (
      entity_id INTEGER PRIMARY KEY REFERENCES entities(id),
      trade_name TEXT, legal_nature TEXT, main_activity TEXT,
      share_capital REAL, foundation_date TEXT, size TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL REFERENCES entities(id),
      street TEXT NOT NULL, number TEXT NOT NULL, complement TEXT,
      neighborhood TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL,
      zip_code TEXT NOT NULL, is_current INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS phones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL REFERENCES entities(id),
      number TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'mobile'
    )`,
    `CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL REFERENCES entities(id),
      address TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS legal_processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id INTEGER NOT NULL REFERENCES entities(id),
      process_number TEXT NOT NULL, court TEXT NOT NULL, subject TEXT NOT NULL,
      status TEXT NOT NULL, last_update TEXT NOT NULL, role TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      query TEXT NOT NULL, query_type TEXT NOT NULL,
      results_count INTEGER NOT NULL DEFAULT 0,
      searched_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      credential_id TEXT UNIQUE NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      device_label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS webauthn_challenges (
      id TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name)`,
    `CREATE INDEX IF NOT EXISTS idx_entities_document ON entities(document)`,
    `CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id)`,
  ];

  for (const sql of stmts) {
    await db.execute(sql);
  }
}
