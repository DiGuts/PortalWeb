// Departments — sourced from PETICIONS/V2_Orgzanigrama_General_2025 (4).pdf (org chart).
// Canonical values stored in Catalan; display labels translated via deptLabel().
export const DEPT_ORDER = [
    'Administració',
    'CME',
    'Comercial',
    'Compres',
    'Costos',
    'Direcció General',
    'I+D',
    'Informàtica',
    'IT Industrial',
    'Logística',
    'Magatzem',
    'Mecanització',
    'Oficina Tècnica Elèctrica',
    'Oficina Tècnica Mecànica',
    'Posta en Marxa',
    'Projectes',
    'Qualitat i Seguretat',
    'Recursos Humans',
    'SAP',
    'SAT',
];

const DEPT_TRANSLATIONS: Record<string, { ca: string; es: string; en: string }> = {
    'Administració':            { ca: 'Administració',             es: 'Administración',           en: 'Administration' },
    'CME':                      { ca: 'CME',                       es: 'CME',                      en: 'CME' },
    'Comercial':                { ca: 'Comercial',                 es: 'Comercial',                en: 'Sales' },
    'Compres':                  { ca: 'Compres',                   es: 'Compras',                  en: 'Purchasing' },
    'Costos':                   { ca: 'Costos',                    es: 'Costes',                   en: 'Costs' },
    'Direcció General':         { ca: 'Direcció General',          es: 'Dirección General',        en: 'General Management' },
    'I+D':                      { ca: 'I+D',                       es: 'I+D',                      en: 'R&D' },
    'Informàtica':              { ca: 'Informàtica',               es: 'Informática',              en: 'IT' },
    'IT Industrial':            { ca: 'IT Industrial',             es: 'IT Industrial',            en: 'Industrial IT' },
    'Logística':                { ca: 'Logística',                 es: 'Logística',                en: 'Logistics' },
    'Magatzem':                 { ca: 'Magatzem',                  es: 'Almacén',                  en: 'Warehouse' },
    'Mecanització':             { ca: 'Mecanització',              es: 'Mecanizado',               en: 'Machining' },
    'Oficina Tècnica Elèctrica':{ ca: 'Oficina Tècnica Elèctrica', es: 'Oficina Técnica Eléctrica', en: 'Electrical Engineering' },
    'Oficina Tècnica Mecànica': { ca: 'Oficina Tècnica Mecànica',  es: 'Oficina Técnica Mecánica', en: 'Mechanical Engineering' },
    'Posta en Marxa':           { ca: 'Posta en Marxa',            es: 'Puesta en Marcha',         en: 'Commissioning' },
    'Projectes':                { ca: 'Projectes',                 es: 'Proyectos',                en: 'Projects' },
    'Qualitat i Seguretat':     { ca: 'Qualitat i Seguretat',      es: 'Calidad y Seguridad',      en: 'Quality & Safety' },
    'Recursos Humans':          { ca: 'Recursos Humans',           es: 'Recursos Humanos',         en: 'Human Resources' },
    'SAP':                      { ca: 'SAP',                       es: 'SAP',                      en: 'SAP' },
    'SAT':                      { ca: 'SAT',                       es: 'SAT',                      en: 'After-sales' },
};

export function deptLabel(dept: string, lang: string): string {
    const entry = DEPT_TRANSLATIONS[dept];
    if (!entry) return dept;
    const key = (lang || 'ca').slice(0, 2).toLowerCase() as 'ca' | 'es' | 'en';
    return entry[key] ?? entry.ca ?? dept;
}

// Avatar palette — 12 OKLCH tones, all L≈0.40 for ≥4.5:1 contrast on white text.
// Warm earthy biased; no pure rainbow. Assigned by name hash so same person = same color.
const AVATAR_PALETTE = [
    'oklch(0.40 0.14 22)',   // terracotta
    'oklch(0.40 0.13 55)',   // burnt umber
    'oklch(0.40 0.12 118)',  // forest green
    'oklch(0.40 0.12 158)',  // pine
    'oklch(0.40 0.13 198)',  // teal
    'oklch(0.40 0.15 238)',  // steel blue
    'oklch(0.40 0.15 265)',  // indigo
    'oklch(0.40 0.14 295)',  // violet
    'oklch(0.40 0.12 325)',  // plum
    'oklch(0.40 0.13 345)',  // crimson
    'oklch(0.40 0.11 140)',  // sage green
    'oklch(0.40 0.13 215)',  // slate blue
];

export function avatarBg(name: string): string {
    let h = 5381;
    for (let i = 0; i < name.length; i++) h = ((h << 5) + h) ^ name.charCodeAt(i);
    return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}
