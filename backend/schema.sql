-- TAVIL Portal — Database Schema
-- SQLite (dev) / MariaDB-compatible (prod, swap datetime() defaults for NOW())

-- ─── Auth / Users ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    UNIQUE NOT NULL,
  password   TEXT    NOT NULL,          -- bcrypt hash, NEVER plaintext
  role       TEXT    NOT NULL DEFAULT 'Treballador/a',
  dept       TEXT    NOT NULL DEFAULT 'General',
  phone      TEXT    NOT NULL DEFAULT '',
  ext        TEXT    NOT NULL DEFAULT '',
  location   TEXT    NOT NULL DEFAULT '',
  created_at TEXT    DEFAULT (datetime('now'))
);

-- ─── VeuEmpleat ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS suggestions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  category    TEXT    NOT NULL DEFAULT 'General',
  anonymous   INTEGER NOT NULL DEFAULT 1,
  author      TEXT    NOT NULL DEFAULT 'Anònim',
  votes       INTEGER NOT NULL DEFAULT 0,
  status      TEXT    NOT NULL DEFAULT 'Pendent',
  response    TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incidencies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  area        TEXT    NOT NULL DEFAULT 'General',
  priority    TEXT    NOT NULL DEFAULT 'Baixa',
  author      TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'Oberta',
  assigned_to TEXT    NOT NULL DEFAULT '',
  resolution  TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enquestes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  questions  INTEGER NOT NULL DEFAULT 0,
  deadline   TEXT    NOT NULL DEFAULT '',
  creator    TEXT    NOT NULL DEFAULT '',
  total      INTEGER NOT NULL DEFAULT 140,
  responses  INTEGER NOT NULL DEFAULT 0,
  status     TEXT    NOT NULL DEFAULT 'Disponible',
  created_at TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enquesta_responses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  enquesta_id INTEGER NOT NULL REFERENCES enquestes(id),
  user_email  TEXT    NOT NULL,
  created_at  TEXT    DEFAULT (datetime('now')),
  UNIQUE(enquesta_id, user_email)
);

-- ─── Directori ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employees (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL,
  role     TEXT NOT NULL DEFAULT '',
  dept     TEXT NOT NULL DEFAULT '',
  email    TEXT NOT NULL DEFAULT '',
  phone    TEXT NOT NULL DEFAULT '',
  ext      TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL DEFAULT '',
  color    TEXT NOT NULL DEFAULT 'bg-gray-400'
);

-- ─── Activitats ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  category    TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  date        TEXT    NOT NULL DEFAULT '',
  time        TEXT    NOT NULL DEFAULT '',
  location    TEXT    NOT NULL DEFAULT '',
  capacity    INTEGER NOT NULL DEFAULT 0,
  enrolled    INTEGER NOT NULL DEFAULT 0,
  past        INTEGER NOT NULL DEFAULT 0   -- 0=upcoming, 1=past
);

-- ─── Agenda ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agenda_events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  title    TEXT    NOT NULL,
  day      INTEGER NOT NULL,
  month    INTEGER NOT NULL,
  time     TEXT    NOT NULL DEFAULT '',
  location TEXT    NOT NULL DEFAULT '',
  type     TEXT    NOT NULL DEFAULT 'Sessió interna'
);

-- ─── Notices / News ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notices (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  title   TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  link    TEXT NOT NULL DEFAULT '',
  active  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS news (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  category   TEXT NOT NULL DEFAULT '',
  title      TEXT NOT NULL,
  summary    TEXT NOT NULL DEFAULT '',
  content    TEXT NOT NULL DEFAULT '',
  author     TEXT NOT NULL DEFAULT '',
  date       TEXT NOT NULL DEFAULT '',
  image      TEXT NOT NULL DEFAULT '',
  featured   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Campus TAVIL ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  category    TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  hours       TEXT    NOT NULL DEFAULT '',
  mandatory   INTEGER NOT NULL DEFAULT 0,
  cert        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_course_progress (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  status    TEXT    NOT NULL DEFAULT 'Pendent',  -- 'Pendent','En curs','Completat'
  progress  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- ─── Solicituds ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS solicituds (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT    NOT NULL,
  comments   TEXT    NOT NULL DEFAULT '',
  status     TEXT    NOT NULL DEFAULT 'Pendent',
  motive     TEXT    NOT NULL DEFAULT '',
  author     TEXT    NOT NULL DEFAULT '',
  created_at TEXT    DEFAULT (datetime('now'))
);

-- ─── Vacances ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vacances (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  author_name     TEXT    NOT NULL DEFAULT '',
  author_dept     TEXT    NOT NULL DEFAULT '',
  start_date      TEXT    NOT NULL,
  end_date        TEXT    NOT NULL,
  comments        TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'Pendent',
  head_status     TEXT    NOT NULL DEFAULT 'Pendent',
  head_comment    TEXT    NOT NULL DEFAULT '',
  rrhh_status     TEXT    NOT NULL DEFAULT 'Pendent',
  rrhh_comment    TEXT    NOT NULL DEFAULT '',
  created_at      TEXT    DEFAULT (datetime('now'))
);

-- ─── Suggestion votes ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS suggestion_votes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  suggestion_id INTEGER NOT NULL REFERENCES suggestions(id),
  user_id       INTEGER NOT NULL REFERENCES users(id),
  vote_type     TEXT    NOT NULL DEFAULT 'up',
  created_at    TEXT    DEFAULT (datetime('now')),
  UNIQUE(suggestion_id, user_id)
);

-- ─── Notifications ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  title      TEXT    NOT NULL,
  body       TEXT    NOT NULL DEFAULT '',
  tab        TEXT    NOT NULL DEFAULT '',
  `read`     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    DEFAULT (datetime('now'))
);
