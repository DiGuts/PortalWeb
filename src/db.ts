import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
const DB_KEY = 'tavil_portal_db';

function saveDB(): void {
  if (!db) return;
  const data = db.export();
  let binary = '';
  for (let i = 0; i < data.byteLength; i++) {
    binary += String.fromCharCode(data[i]);
  }
  localStorage.setItem(DB_KEY, btoa(binary));
}

function buildFreshDB(SQL: any): Database {
  const fresh = new SQL.Database();

  fresh.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Treballador/a',
    dept TEXT NOT NULL DEFAULT 'General',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  fresh.run(`CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'General',
    anonymous INTEGER NOT NULL DEFAULT 1, author TEXT NOT NULL DEFAULT 'Anònim',
    votes INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Pendent',
    response TEXT NOT NULL DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
  )`);
  fresh.run(`CREATE TABLE IF NOT EXISTS incidencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '', area TEXT NOT NULL DEFAULT 'General',
    priority TEXT NOT NULL DEFAULT 'Baixa', author TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Oberta', assigned_to TEXT NOT NULL DEFAULT '',
    resolution TEXT NOT NULL DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
  )`);
  fresh.run(`CREATE TABLE IF NOT EXISTS enquestes (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
    questions INTEGER NOT NULL DEFAULT 0, deadline TEXT NOT NULL DEFAULT '',
    creator TEXT NOT NULL DEFAULT '', total INTEGER NOT NULL DEFAULT 140,
    responses INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Disponible',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  fresh.run(`CREATE TABLE IF NOT EXISTS enquesta_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, enquesta_id INTEGER NOT NULL,
    user_email TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(enquesta_id, user_email)
  )`);

  // Seed users
  for (const u of [
    ['Carles Homs',    'carleshoms@tavil.net', 'tavil2026', 'Treballador/a',   'General'],
    ['Marta García',   'm.garcia@tavil.com',   'tavil2026', 'Treballador/a',   'Operacions'],
    ['Jordi Bellmunt', 'j.bellmunt@tavil.com', 'admin2026', 'Administrador/a', 'Direcció'],
  ] as [string,string,string,string,string][]) {
    fresh.run(`INSERT INTO users (name,email,password,role,dept) VALUES (?,?,?,?,?)`, u);
  }

  // Seed suggestions
  for (const s of [
    ["Ampliar l'horari del menjador fins a les 15:30", '', 'Instal·lacions', 0, 'Anònim', 14, 'En revisió', "Estem valorant la proposta amb el servei de càtering. Resposta prevista abans del 31 de març."],
    ['Programa de bicicleta compartida per venir a la planta', '', 'Sostenibilitat', 0, 'Anònim', 23, 'Acceptada', 'Acceptat! Es posarà en marxa al maig amb 10 bicicletes disponibles al pàrquing.'],
    ['Habilitar un espai de descans a la planta 2', '', 'Benestar', 0, 'Anònim', 18, 'En revisió', ''],
    ['Sessions de ioga durant la pausa del migdia', '', 'Benestar', 0, 'Anònim', 9, 'Pendent', ''],
  ] as [string,string,string,number,string,number,string,string][]) {
    fresh.run(`INSERT INTO suggestions (title,description,category,anonymous,author,votes,status,response) VALUES (?,?,?,?,?,?,?,?)`, s);
  }

  // Seed incidencies
  for (const inc of [
    ["Avaria climatització sala de reunions 3", '', 'Instal·lacions', 'Mitjana', 'Carles Homs', 'En gestió', 'David López', ''],
    ["Porta d'emergència bloquejada al magatzem B", '', 'Seguretat', 'Alta', 'Marta García', 'Resolta', 'Pere Soler', "Resolt el 19/03. Es va substituir el mecanisme de tancament. Verificat per Xavier Casals."],
    ['Impressora 2n pis fora de servei', '', 'Equipament', 'Baixa', 'Carles Homs', 'Oberta', 'Raül Ibáñez', ''],
    ["Fuita d'aire comprimit a la secció de muntatge", '', 'Instal·lacions', 'Alta', 'Marta García', 'Resolta', 'David López', "Resolt el 14/03. Reparació d'urgència del connector pneumàtic."],
    ['Senyal Wi-Fi feble al menjador', '', 'Sistemes', 'Baixa', 'Carles Homs', 'En gestió', 'Oriol Prats', ''],
  ] as [string,string,string,string,string,string,string,string][]) {
    fresh.run(`INSERT INTO incidencies (title,description,area,priority,author,status,assigned_to,resolution) VALUES (?,?,?,?,?,?,?,?)`, inc);
  }

  // Seed enquestes
  for (const enq of [
    ['Enquesta de clima laboral Q1 2026', 20, '2026-03-31', 'Laura Martí', 84, 140, 'Disponible'],
    ['Satisfacció amb el servei de menjador', 10, '2026-03-15', 'Elena Pujol', 112, 140, 'Completada'],
    ['Valoració de la formació 2025', 15, '2026-01-31', 'Laura Martí', 98, 140, 'Tancada'],
    ['Enquesta de necessitats formatives 2026', 12, '2026-04-15', 'Elena Pujol', 45, 140, 'Disponible'],
  ] as [string,number,string,string,number,number,string][]) {
    fresh.run(`INSERT INTO enquestes (title,questions,deadline,creator,responses,total,status) VALUES (?,?,?,?,?,?,?)`, enq);
  }

  return fresh;
}

function runSafe(sql: string, params?: any[]): void {
  if (!db) return;
  try { db.run(sql, params); } catch (e) { console.warn('SQL warning:', e); }
}

export async function initDB(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: () => `${process.env.PUBLIC_URL}/sql-wasm.wasm`,
  });

  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    // Step 1: decode binary — only this failure warrants a full reset
    try {
      const binary = atob(saved);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      db = new SQL.Database(bytes);
    } catch (e) {
      console.warn('DB binary unreadable, starting fresh:', e);
      localStorage.removeItem(DB_KEY);
      db = buildFreshDB(SQL);
      saveDB();
      return;
    }

    // Step 2: run migrations individually — never wipes user data
    runSafe(`CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'General',
      anonymous INTEGER NOT NULL DEFAULT 1, author TEXT NOT NULL DEFAULT 'Anònim',
      votes INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Pendent',
      response TEXT NOT NULL DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
    )`);
    runSafe(`CREATE TABLE IF NOT EXISTS incidencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '', area TEXT NOT NULL DEFAULT 'General',
      priority TEXT NOT NULL DEFAULT 'Baixa', author TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Oberta', assigned_to TEXT NOT NULL DEFAULT '',
      resolution TEXT NOT NULL DEFAULT '', created_at TEXT DEFAULT (datetime('now'))
    )`);
    runSafe(`CREATE TABLE IF NOT EXISTS enquestes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
      questions INTEGER NOT NULL DEFAULT 0, deadline TEXT NOT NULL DEFAULT '',
      creator TEXT NOT NULL DEFAULT '', total INTEGER NOT NULL DEFAULT 140,
      responses INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Disponible',
      created_at TEXT DEFAULT (datetime('now'))
    )`);
    runSafe(`CREATE TABLE IF NOT EXISTS enquesta_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, enquesta_id INTEGER NOT NULL,
      user_email TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(enquesta_id, user_email)
    )`);

    // Step 3: seed only if tables are empty (never overwrites existing rows)
    try {
      const incCount = db!.exec(`SELECT COUNT(*) FROM incidencies`);
      if (Number(incCount[0]?.values[0]?.[0] ?? 0) === 0) {
        for (const inc of [
          ["Avaria climatització sala de reunions 3", '', 'Instal·lacions', 'Mitjana', 'Carles Homs', 'En gestió', 'David López', ''],
          ["Porta d'emergència bloquejada al magatzem B", '', 'Seguretat', 'Alta', 'Marta García', 'Resolta', 'Pere Soler', "Resolt el 19/03. Es va substituir el mecanisme de tancament. Verificat per Xavier Casals."],
          ['Impressora 2n pis fora de servei', '', 'Equipament', 'Baixa', 'Carles Homs', 'Oberta', 'Raül Ibáñez', ''],
          ["Fuita d'aire comprimit a la secció de muntatge", '', 'Instal·lacions', 'Alta', 'Marta García', 'Resolta', 'David López', "Resolt el 14/03. Reparació d'urgència del connector pneumàtic."],
          ['Senyal Wi-Fi feble al menjador', '', 'Sistemes', 'Baixa', 'Carles Homs', 'En gestió', 'Oriol Prats', ''],
        ] as [string,string,string,string,string,string,string,string][]) {
          runSafe(`INSERT INTO incidencies (title,description,area,priority,author,status,assigned_to,resolution) VALUES (?,?,?,?,?,?,?,?)`, inc);
        }
      }
      const enqCount = db!.exec(`SELECT COUNT(*) FROM enquestes`);
      if (Number(enqCount[0]?.values[0]?.[0] ?? 0) === 0) {
        for (const enq of [
          ['Enquesta de clima laboral Q1 2026', 20, '2026-03-31', 'Laura Martí', 84, 140, 'Disponible'],
          ['Satisfacció amb el servei de menjador', 10, '2026-03-15', 'Elena Pujol', 112, 140, 'Completada'],
          ['Valoració de la formació 2025', 15, '2026-01-31', 'Laura Martí', 98, 140, 'Tancada'],
          ['Enquesta de necessitats formatives 2026', 12, '2026-04-15', 'Elena Pujol', 45, 140, 'Disponible'],
        ] as [string,number,string,string,number,number,string][]) {
          runSafe(`INSERT INTO enquestes (title,questions,deadline,creator,responses,total,status) VALUES (?,?,?,?,?,?,?)`, enq);
        }
      }
    } catch (e) {
      console.warn('Seed check failed (non-critical):', e);
    }

    saveDB();
  } else {
    db = buildFreshDB(SQL);
    saveDB();
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  dept: string;
}

export function findUser(email: string, password: string): User | null {
  if (!db) return null;
  const res = db.exec(
    `SELECT id, name, email, role, dept FROM users WHERE email = ? AND password = ?`,
    [email, password],
  );
  if (!res.length || !res[0].values.length) return null;
  const [id, name, em, role, dept] = res[0].values[0];
  return { id: id as number, name: name as string, email: em as string, role: role as string, dept: dept as string };
}

export function updateUserName(id: number, name: string): boolean {
  if (!db) return false;
  try {
    db.run(`UPDATE users SET name = ? WHERE id = ?`, [name, id]);
    saveDB();
    return true;
  } catch {
    return false;
  }
}

export function updateUserRole(id: number, role: string): boolean {
  if (!db) return false;
  try {
    db.run(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
    saveDB();
    return true;
  } catch {
    return false;
  }
}

export function createUser(name: string, email: string, password: string): { ok: boolean; error?: string } {
  if (!db) return { ok: false, error: 'BD no inicialitzada.' };
  try {
    db.run(`INSERT INTO users (name, email, password) VALUES (?,?,?)`, [name, email, password]);
    saveDB();
    return { ok: true };
  } catch (e: any) {
    if (String(e).includes('UNIQUE')) return { ok: false, error: 'Aquest correu ja existeix.' };
    return { ok: false, error: 'Error en crear el compte.' };
  }
}

// ── Suggestions ───────────────────────────────────────────────────────────────

export interface Suggestion {
  id: number;
  title: string;
  description: string;
  category: string;
  anonymous: boolean;
  author: string;
  votes: number;
  status: string;
  response: string;
  created_at: string;
}

export function getSuggestions(): Suggestion[] {
  if (!db) return [];
  const res = db.exec(
    `SELECT id, title, description, category, anonymous, author, votes, status, response, created_at
     FROM suggestions ORDER BY votes DESC, id DESC`,
  );
  if (!res.length) return [];
  return res[0].values.map(row => ({
    id:          row[0] as number,
    title:       row[1] as string,
    description: row[2] as string,
    category:    row[3] as string,
    anonymous:   row[4] === 1,
    author:      row[5] as string,
    votes:       row[6] as number,
    status:      row[7] as string,
    response:    row[8] as string,
    created_at:  row[9] as string,
  }));
}

export function addSuggestion(
  title: string,
  description: string,
  category: string,
  anonymous: boolean,
  author: string,
): boolean {
  if (!db) return false;
  try {
    db.run(
      `INSERT INTO suggestions (title, description, category, anonymous, author) VALUES (?,?,?,?,?)`,
      [title, description, category, anonymous ? 1 : 0, anonymous ? 'Anònim' : author],
    );
    saveDB();
    return true;
  } catch {
    return false;
  }
}

export function voteSuggestion(id: number): void {
  if (!db) return;
  db.run(`UPDATE suggestions SET votes = votes + 1 WHERE id = ?`, [id]);
  saveDB();
}

// ── Incidències ───────────────────────────────────────────────────────────────

export interface Incidencia {
  id: number;
  title: string;
  description: string;
  area: string;
  priority: string;
  author: string;
  status: string;
  assigned_to: string;
  resolution: string;
  created_at: string;
}

export function getIncidencies(): Incidencia[] {
  if (!db) return [];
  const res = db.exec(
    `SELECT id, title, description, area, priority, author, status, assigned_to, resolution, created_at
     FROM incidencies ORDER BY id DESC`,
  );
  if (!res.length) return [];
  return res[0].values.map(row => ({
    id:          row[0] as number,
    title:       row[1] as string,
    description: row[2] as string,
    area:        row[3] as string,
    priority:    row[4] as string,
    author:      row[5] as string,
    status:      row[6] as string,
    assigned_to: row[7] as string,
    resolution:  row[8] as string,
    created_at:  row[9] as string,
  }));
}

export function addIncidencia(
  title: string,
  description: string,
  area: string,
  priority: string,
  author: string,
): boolean {
  if (!db) return false;
  try {
    db.run(
      `INSERT INTO incidencies (title, description, area, priority, author) VALUES (?,?,?,?,?)`,
      [title, description, area, priority, author],
    );
    saveDB();
    return true;
  } catch {
    return false;
  }
}

// ── Enquestes ─────────────────────────────────────────────────────────────────

export interface Enquesta {
  id: number;
  title: string;
  questions: number;
  deadline: string;
  creator: string;
  total: number;
  responses: number;
  status: string;
  created_at: string;
  userCompleted?: boolean;
}

export function getEnquestes(userEmail: string): Enquesta[] {
  if (!db) return [];
  const res = db.exec(
    `SELECT e.id, e.title, e.questions, e.deadline, e.creator, e.total, e.responses, e.status, e.created_at,
            CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as user_completed
     FROM enquestes e
     LEFT JOIN enquesta_responses r ON r.enquesta_id = e.id AND r.user_email = ?
     ORDER BY e.id ASC`,
    [userEmail],
  );
  if (!res.length) return [];
  return res[0].values.map(row => ({
    id:            row[0] as number,
    title:         row[1] as string,
    questions:     row[2] as number,
    deadline:      row[3] as string,
    creator:       row[4] as string,
    total:         row[5] as number,
    responses:     row[6] as number,
    status:        row[7] as string,
    created_at:    row[8] as string,
    userCompleted: row[9] === 1,
  }));
}

export function respondreEnquesta(enquestaId: number, userEmail: string): boolean {
  if (!db) return false;
  try {
    db.run(
      `INSERT OR IGNORE INTO enquesta_responses (enquesta_id, user_email) VALUES (?,?)`,
      [enquestaId, userEmail],
    );
    db.run(
      `UPDATE enquestes SET responses = responses + 1 WHERE id = ? AND NOT EXISTS (
        SELECT 1 FROM enquesta_responses WHERE enquesta_id = ? AND user_email = ?
      )`,
      [enquestaId, enquestaId, userEmail],
    );
    saveDB();
    return true;
  } catch {
    return false;
  }
}
