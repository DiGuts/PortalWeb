// Departments — sourced from PETICIONS/V2_Orgzanigrama_General_2025 (4).pdf (org chart).
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
