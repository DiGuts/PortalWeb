// Departments — canonical values stored in Catalan; display labels translated via deptLabel().
// Sources: PETICIONS/V2_Orgzanigrama_General_2025.pdf (original 20) + treballadors.xlsx 2026-06-02 (sub-depts).

// ── Top-level canonical departments — used for org chart + visual grouping ──
export const DEPT_CANONICAL = [
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
] as const;

// ── Full list — canonical + sub-depts from xlsx, used for filter dropdown ───
export const DEPT_ORDER = [
    // Original canonical (same as DEPT_CANONICAL)
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
    // ── Sub-departments found in treballadors.xlsx (2026-06-02) ──────────────
    'Administració SAT',
    'Almacen y Logística (Admin. Logística)',
    'Almacen y Logística (Compres)',
    'Almacen y Logística (Devolucions)',
    'Almacen y Logística (Logística)',
    'Almacen y Logística (Magatzem)',
    'Almacen y Logística (SAT - Recanvis / Magatzem)',
    'Compres Mecanització',
    'Conductor',
    'Dirección y Administración (Admin. Comercial)',
    'Dirección y Administración (Admin. Compres)',
    'Dirección y Administración (Admin. Depplan)',
    'Dirección y Administración (Admin. Magatzem)',
    'Dirección y Administración (Admin. OTE)',
    'Dirección y Administración (Admin. RRHH)',
    'Dirección y Administración (Admin. SAT)',
    'Dirección y Administración (Administració)',
    'Dirección y Administración (Compres)',
    'Dirección y Administración (Responsable SAP)',
    'DUAL SAT - PMX',
    'Jardiner',
    'Manteniment',
    'Neteja',
    'Oficina Tècnica (OTElèctrica)',
    'Oficina Tècnica (OTMecanització)',
    'Oficina Tècnica (OTMecànica - DUAL 3)',
    'Oficina Tècnica (OTMecànica - DUAL 4)',
    'Oficina Tècnica (OTMecànica - DUAL 5)',
    'Oficina Tècnica (OTMecànica - Envasadores)',
    'Oficina Tècnica (OTMecànica) - CME',
    'Oficina Tècnica (OTMecànica) - Linies',
    'Oficina Tècnica (OTMecànica) - Maxpalet',
    'Oficina Tècnica (OTMecànica) - Maxpalet (MURLINK)',
    'Oficina Tècnica (OTMecànica) - Màquines',
    'Oficina Tècnica (OTMecànica) - Ofertes',
    'Oficina Tècnica (OTMecànica) - Pick & Place',
    'Oficina Tècnica (OTMecànica) - Premuntatges',
    'Oficina Tècnica (OTMecànica) - Simulació',
    'Posta en Marxa (CME)',
    'Posta en Marxa (I+D)',
    'Posta en Marxa (Informàtica Industrial)',
    'Posta en Marxa (Maxpalet)',
    'SAT (Elèctric - SAT)',
    'SAT (Mecànic SAT)',
    'SAT (Posta en Marxa - SAT)',
    'SAT-COMERCIAL',
    'Técnico Comercial (Comercial)',
    'Técnico Eléctrico',
    'Técnico Eléctrico (DUAL ELÈCTRIC 2)',
    'Técnico Eléctrico (Elèctric)',
    'Técnico Eléctrico (Premuntatges Elèctrics)',
    'Técnico SAT',
    'Técnico Soldador (Soldador)',
    'Técnico en mecanización (Mec.Mecanització)',
    'Técnico mecánico (DUAL Mecànic)',
    'Técnico mecánico (Mecànic - Soldador)',
    'Técnico mecánico (Mecànic)',
    'Técnico mecánico (Premuntatges mecànics)',
    'Validació Ofertes - Costos',
];

const DEPT_TRANSLATIONS: Record<string, { ca: string; es: string; en: string }> = {
    // ── Original canonical ────────────────────────────────────────────────────
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
    // ── Sub-departments (xlsx) ────────────────────────────────────────────────
    'Administració SAT':                                     { ca: 'Administració SAT',                               es: 'Administración SAT',                               en: 'SAT Admin' },
    'Almacen y Logística (Admin. Logística)':                { ca: 'Almacen y Logística (Admin. Logística)',           es: 'Almacén y Logística (Admin. Logística)',            en: 'Warehouse & Logistics (Admin)' },
    'Almacen y Logística (Compres)':                         { ca: 'Almacen y Logística (Compres)',                    es: 'Almacén y Logística (Compras)',                     en: 'Warehouse & Logistics (Purchasing)' },
    'Almacen y Logística (Devolucions)':                     { ca: 'Almacen y Logística (Devolucions)',                es: 'Almacén y Logística (Devoluciones)',                en: 'Warehouse & Logistics (Returns)' },
    'Almacen y Logística (Logística)':                       { ca: 'Almacen y Logística (Logística)',                  es: 'Almacén y Logística (Logística)',                  en: 'Warehouse & Logistics (Logistics)' },
    'Almacen y Logística (Magatzem)':                        { ca: 'Almacen y Logística (Magatzem)',                   es: 'Almacén y Logística (Almacén)',                    en: 'Warehouse & Logistics (Warehouse)' },
    'Almacen y Logística (SAT - Recanvis / Magatzem)':       { ca: 'Almacen y Logística (SAT - Recanvis / Magatzem)', es: 'Almacén y Logística (SAT - Repuestos / Almacén)',  en: 'Warehouse & Logistics (SAT Parts)' },
    'Compres Mecanització':                                  { ca: 'Compres Mecanització',                            es: 'Compras Mecanización',                             en: 'Machining Purchasing' },
    'Conductor':                                             { ca: 'Conductor',                                       es: 'Conductor',                                        en: 'Driver' },
    'Dirección y Administración (Admin. Comercial)':         { ca: 'Dirección y Administración (Admin. Comercial)',   es: 'Dirección y Administración (Admin. Comercial)',    en: 'Management (Sales Admin)' },
    'Dirección y Administración (Admin. Compres)':           { ca: 'Dirección y Administración (Admin. Compres)',     es: 'Dirección y Administración (Admin. Compras)',      en: 'Management (Purchasing Admin)' },
    'Dirección y Administración (Admin. Depplan)':           { ca: 'Dirección y Administración (Admin. Depplan)',     es: 'Dirección y Administración (Admin. Depplan)',      en: 'Management (Depplan Admin)' },
    'Dirección y Administración (Admin. Magatzem)':          { ca: 'Dirección y Administración (Admin. Magatzem)',    es: 'Dirección y Administración (Admin. Almacén)',      en: 'Management (Warehouse Admin)' },
    'Dirección y Administración (Admin. OTE)':               { ca: 'Dirección y Administración (Admin. OTE)',         es: 'Dirección y Administración (Admin. OTE)',          en: 'Management (OTE Admin)' },
    'Dirección y Administración (Admin. RRHH)':              { ca: 'Dirección y Administración (Admin. RRHH)',        es: 'Dirección y Administración (Admin. RRHH)',         en: 'Management (HR Admin)' },
    'Dirección y Administración (Admin. SAT)':               { ca: 'Dirección y Administración (Admin. SAT)',         es: 'Dirección y Administración (Admin. SAT)',          en: 'Management (SAT Admin)' },
    'Dirección y Administración (Administració)':            { ca: 'Dirección y Administración (Administració)',      es: 'Dirección y Administración (Administración)',      en: 'Management (Administration)' },
    'Dirección y Administración (Compres)':                  { ca: 'Dirección y Administración (Compres)',            es: 'Dirección y Administración (Compras)',             en: 'Management (Purchasing)' },
    'Dirección y Administración (Responsable SAP)':          { ca: 'Dirección y Administración (Responsable SAP)',    es: 'Dirección y Administración (Responsable SAP)',     en: 'Management (SAP Lead)' },
    'DUAL SAT - PMX':                                        { ca: 'DUAL SAT - PMX',                                  es: 'DUAL SAT - PMX',                                   en: 'DUAL SAT - PMX' },
    'Jardiner':                                              { ca: 'Jardiner',                                        es: 'Jardinero',                                        en: 'Gardener' },
    'Manteniment':                                           { ca: 'Manteniment',                                     es: 'Mantenimiento',                                    en: 'Maintenance' },
    'Neteja':                                                { ca: 'Neteja',                                          es: 'Limpieza',                                         en: 'Cleaning' },
    'Oficina Tècnica (OTElèctrica)':                         { ca: 'Oficina Tècnica (OTElèctrica)',                   es: 'Oficina Técnica (OTEléctrica)',                    en: 'Engineering (Electrical)' },
    'Oficina Tècnica (OTMecanització)':                      { ca: 'Oficina Tècnica (OTMecanització)',                es: 'Oficina Técnica (OTMecanizado)',                   en: 'Engineering (Machining)' },
    'Oficina Tècnica (OTMecànica - DUAL 3)':                 { ca: 'Oficina Tècnica (OTMecànica - DUAL 3)',           es: 'Oficina Técnica (OTMecánica - DUAL 3)',            en: 'Engineering (Mechanical - DUAL 3)' },
    'Oficina Tècnica (OTMecànica - DUAL 4)':                 { ca: 'Oficina Tècnica (OTMecànica - DUAL 4)',           es: 'Oficina Técnica (OTMecánica - DUAL 4)',            en: 'Engineering (Mechanical - DUAL 4)' },
    'Oficina Tècnica (OTMecànica - DUAL 5)':                 { ca: 'Oficina Tècnica (OTMecànica - DUAL 5)',           es: 'Oficina Técnica (OTMecánica - DUAL 5)',            en: 'Engineering (Mechanical - DUAL 5)' },
    'Oficina Tècnica (OTMecànica - Envasadores)':            { ca: 'Oficina Tècnica (OTMecànica - Envasadores)',      es: 'Oficina Técnica (OTMecánica - Envasadoras)',       en: 'Engineering (Mechanical - Fillers)' },
    'Oficina Tècnica (OTMecànica) - CME':                    { ca: 'Oficina Tècnica (OTMecànica) - CME',              es: 'Oficina Técnica (OTMecánica) - CME',               en: 'Engineering (Mechanical) - CME' },
    'Oficina Tècnica (OTMecànica) - Linies':                 { ca: 'Oficina Tècnica (OTMecànica) - Linies',           es: 'Oficina Técnica (OTMecánica) - Líneas',            en: 'Engineering (Mechanical) - Lines' },
    'Oficina Tècnica (OTMecànica) - Maxpalet':               { ca: 'Oficina Tècnica (OTMecànica) - Maxpalet',         es: 'Oficina Técnica (OTMecánica) - Maxpalet',          en: 'Engineering (Mechanical) - Maxpalet' },
    'Oficina Tècnica (OTMecànica) - Maxpalet (MURLINK)':     { ca: 'Oficina Tècnica (OTMecànica) - Maxpalet (MURLINK)', es: 'Oficina Técnica (OTMecánica) - Maxpalet (MURLINK)', en: 'Engineering (Mechanical) - Maxpalet (MURLINK)' },
    'Oficina Tècnica (OTMecànica) - Màquines':               { ca: 'Oficina Tècnica (OTMecànica) - Màquines',         es: 'Oficina Técnica (OTMecánica) - Máquinas',          en: 'Engineering (Mechanical) - Machines' },
    'Oficina Tècnica (OTMecànica) - Ofertes':                { ca: 'Oficina Tècnica (OTMecànica) - Ofertes',          es: 'Oficina Técnica (OTMecánica) - Ofertas',           en: 'Engineering (Mechanical) - Offers' },
    'Oficina Tècnica (OTMecànica) - Pick & Place':           { ca: 'Oficina Tècnica (OTMecànica) - Pick & Place',     es: 'Oficina Técnica (OTMecánica) - Pick & Place',     en: 'Engineering (Mechanical) - Pick & Place' },
    'Oficina Tècnica (OTMecànica) - Premuntatges':           { ca: 'Oficina Tècnica (OTMecànica) - Premuntatges',     es: 'Oficina Técnica (OTMecánica) - Premontajes',       en: 'Engineering (Mechanical) - Pre-assembly' },
    'Oficina Tècnica (OTMecànica) - Simulació':              { ca: 'Oficina Tècnica (OTMecànica) - Simulació',        es: 'Oficina Técnica (OTMecánica) - Simulación',        en: 'Engineering (Mechanical) - Simulation' },
    'Posta en Marxa (CME)':                                  { ca: 'Posta en Marxa (CME)',                            es: 'Puesta en Marcha (CME)',                           en: 'Commissioning (CME)' },
    'Posta en Marxa (I+D)':                                  { ca: 'Posta en Marxa (I+D)',                            es: 'Puesta en Marcha (I+D)',                           en: 'Commissioning (R&D)' },
    'Posta en Marxa (Informàtica Industrial)':               { ca: 'Posta en Marxa (Informàtica Industrial)',         es: 'Puesta en Marcha (Informática Industrial)',        en: 'Commissioning (Industrial IT)' },
    'Posta en Marxa (Maxpalet)':                             { ca: 'Posta en Marxa (Maxpalet)',                       es: 'Puesta en Marcha (Maxpalet)',                      en: 'Commissioning (Maxpalet)' },
    'SAT (Elèctric - SAT)':                                  { ca: 'SAT (Elèctric - SAT)',                            es: 'SAT (Eléctrico - SAT)',                            en: 'SAT (Electrical)' },
    'SAT (Mecànic SAT)':                                     { ca: 'SAT (Mecànic SAT)',                               es: 'SAT (Mecánico SAT)',                               en: 'SAT (Mechanical)' },
    'SAT (Posta en Marxa - SAT)':                            { ca: 'SAT (Posta en Marxa - SAT)',                      es: 'SAT (Puesta en Marcha - SAT)',                     en: 'SAT (Commissioning)' },
    'SAT-COMERCIAL':                                         { ca: 'SAT-COMERCIAL',                                   es: 'SAT-COMERCIAL',                                    en: 'SAT Sales' },
    'Técnico Comercial (Comercial)':                         { ca: 'Técnico Comercial (Comercial)',                   es: 'Técnico Comercial (Comercial)',                    en: 'Sales Engineer' },
    'Técnico Eléctrico':                                     { ca: 'Técnico Eléctrico',                               es: 'Técnico Eléctrico',                                en: 'Electrical Technician' },
    'Técnico Eléctrico (DUAL ELÈCTRIC 2)':                   { ca: 'Técnico Eléctrico (DUAL ELÈCTRIC 2)',             es: 'Técnico Eléctrico (DUAL ELÉCTRICO 2)',             en: 'Electrical Technician (DUAL 2)' },
    'Técnico Eléctrico (Elèctric)':                          { ca: 'Técnico Eléctrico (Elèctric)',                    es: 'Técnico Eléctrico (Eléctrico)',                    en: 'Electrical Technician' },
    'Técnico Eléctrico (Premuntatges Elèctrics)':            { ca: 'Técnico Eléctrico (Premuntatges Elèctrics)',      es: 'Técnico Eléctrico (Premontajes Eléctricos)',       en: 'Electrical Technician (Pre-assembly)' },
    'Técnico SAT':                                           { ca: 'Técnico SAT',                                     es: 'Técnico SAT',                                      en: 'SAT Technician' },
    'Técnico Soldador (Soldador)':                           { ca: 'Técnico Soldador (Soldador)',                     es: 'Técnico Soldador (Soldador)',                      en: 'Welder' },
    'Técnico en mecanización (Mec.Mecanització)':            { ca: 'Técnico en mecanización (Mec.Mecanització)',      es: 'Técnico en mecanización (Mec.Mecanización)',       en: 'Machining Technician' },
    'Técnico mecánico (DUAL Mecànic)':                       { ca: 'Técnico mecánico (DUAL Mecànic)',                 es: 'Técnico mecánico (DUAL Mecánico)',                 en: 'Mechanical Technician (DUAL)' },
    'Técnico mecánico (Mecànic - Soldador)':                 { ca: 'Técnico mecánico (Mecànic - Soldador)',           es: 'Técnico mecánico (Mecánico - Soldador)',           en: 'Mechanical Technician (Welder)' },
    'Técnico mecánico (Mecànic)':                            { ca: 'Técnico mecánico (Mecànic)',                      es: 'Técnico mecánico (Mecánico)',                      en: 'Mechanical Technician' },
    'Técnico mecánico (Premuntatges mecànics)':              { ca: 'Técnico mecánico (Premuntatges mecànics)',        es: 'Técnico mecánico (Premontajes mecánicos)',         en: 'Mechanical Technician (Pre-assembly)' },
    'Validació Ofertes - Costos':                            { ca: 'Validació Ofertes - Costos',                      es: 'Validación Ofertas - Costos',                      en: 'Offer Validation - Costs' },
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
