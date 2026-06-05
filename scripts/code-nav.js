#!/usr/bin/env node
/**
 * code-nav.js — auto-jump to source when you switch tabs in the dev app.
 *
 * Usage:  npm run code-nav
 * Then open http://localhost:3000 and switch tabs — VS Code jumps to the code.
 */
const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 9999;

// Tab name → file:line  (regenerate with: node scripts/code-nav.js --regen)
const MAPPING = {
  // ── Main tabs (App.tsx inline) ──────────────────────────────────────────
  'Inici':           'src/App.tsx:99',
  'Notícies':        'src/App.tsx:1091',
  'Activitats':      'src/App.tsx:1485',
  'Espai':           'src/App.tsx:2212',
  'Veu':             'src/App.tsx:2578',
  'Solicituds':      'src/App.tsx:3617',
  'Perfil':          'src/App.tsx:4708',
  'Empresa':         'src/App.tsx:7757',
  'Backoffice':      'src/App.tsx:6897',
  'Notificacions':   'src/App.tsx:10993',

  // ── Tabs in their own files ─────────────────────────────────────────────
  'Agenda':          'src/components/tabs/AgendaTab.tsx:1',
  'Directori':       'src/components/tabs/DirectoriTab.tsx:1',
  'Campus':          'src/components/tabs/CampusTavilTab.tsx:1',
  'Més':             'src/components/mobile/MesTab.tsx:1',

  // ── Admin backoffice views ──────────────────────────────────────────────
  'admin-dashboard':   'src/components/admin/AdminBackoffice.tsx:1',
  'admin-users':       'src/components/admin/AdminBackoffice.tsx:1',
  'admin-news':        'src/components/admin/AdminBackoffice.tsx:1',
  'admin-activities':  'src/components/admin/AdminBackoffice.tsx:1',
  'admin-campus':      'src/components/admin/AdminBackoffice.tsx:1',
  'admin-agenda':      'src/components/admin/AdminBackoffice.tsx:1',
  'admin-avisos':      'src/components/admin/AdminBackoffice.tsx:1',
};

// --regen flag: grep for current line numbers and print updated MAPPING
if (process.argv.includes('--regen')) {
  const { execSync } = require('child_process');
  const checks = {
    'Inici':        'function InicialTab',
    'Notícies':     'function NoticiesTab',
    'Activitats':   'function ActivitatsTab',
    'Espai':        'function EspaiCorporatiuTab',
    'Veu':          'function VeuEmpleatTab',
    'Solicituds':   'function SolicitudsTab',
    'Perfil':       'function PerfilTab',
    'Empresa':      'function EmpresaLandingTab',
    'Backoffice':   'function BackofficeTab',
  };
  console.log('// Auto-regen — paste into MAPPING above:');
  for (const [tab, fn] of Object.entries(checks)) {
    try {
      const out = execSync(`grep -n "${fn}" src/App.tsx`, { cwd: ROOT }).toString().trim();
      const line = out.split(':')[0];
      console.log(`  '${tab}': 'src/App.tsx:${line}',`);
    } catch {}
  }
  process.exit(0);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method !== 'POST')    { res.writeHead(405); res.end(); return; }

  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const { tab } = JSON.parse(body);
      const target = MAPPING[tab];
      if (target) {
        const [file, line = '1'] = target.split(':');
        const abs = path.join(ROOT, file);
        const cmd = `code -g "${abs}:${line}"`;
        process.stdout.write(`\r\x1b[K[nav] ${tab.padEnd(20)} → ${target}`);
        exec(cmd);
      } else {
        process.stdout.write(`\r\x1b[K[nav] unknown: "${tab}"`);
      }
    } catch (e) {
      console.error('\n[nav] parse error:', e.message);
    }
    res.writeHead(200);
    res.end('ok');
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n[code-nav] ready on http://127.0.0.1:${PORT}`);
  console.log('[code-nav] switch tabs in http://localhost:3000 → VS Code jumps\n');
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`[code-nav] port ${PORT} in use — kill it first`);
  else console.error('[code-nav]', e);
});
