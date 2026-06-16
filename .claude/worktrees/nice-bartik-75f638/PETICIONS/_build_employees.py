import openpyxl, sys, re, json
sys.stdout.reconfigure(encoding='utf-8')
wb = openpyxl.load_workbook(r'C:/UNAI/portalWeb/PETICIONS/Treballadors i lloc de treball.xlsx', data_only=True)
ws = wb['Hoja1']

DEPT_MAP = [
    (r'OTMec.nica\b.*Premuntatges',        'Oficina Tecnica Mecanica', 'OT Mecanica - Premuntatges'),
    (r'OTMec.nica\b.*Maxpalet.*MURLINK',   'Oficina Tecnica Mecanica', 'OT Mecanica - Maxpalet (Murlink)'),
    (r'OTMec.nica\b.*Maxpalet',            'Oficina Tecnica Mecanica', 'OT Mecanica - Maxpalet'),
    (r'OTMec.nica\b.*Linies',              'Oficina Tecnica Mecanica', 'OT Mecanica - Linies'),
    (r'OTMec.nica\b.*M.quines',            'Oficina Tecnica Mecanica', 'OT Mecanica - Maquines'),
    (r'OTMec.nica\b.*Pick',                'Oficina Tecnica Mecanica', 'OT Mecanica - Pick & Place'),
    (r'OTMec.nica\b.*Simulaci',            'Oficina Tecnica Mecanica', 'OT Mecanica - Simulacio'),
    (r'OTMec.nica\b.*Ofertes',             'Oficina Tecnica Mecanica', 'OT Mecanica - Ofertes'),
    (r'OTMec.nica\b.*Envasadores',         'Oficina Tecnica Mecanica', 'OT Mecanica - Envasadores'),
    (r'OTMec.nica\b.*DUAL',                'Oficina Tecnica Mecanica', 'OT Mecanica - DUAL'),
    (r'OTMec.nica\b.*CME',                 'CME',                       'OT Mecanica - CME'),
    (r'OTMec.nica\b',                      'Oficina Tecnica Mecanica', 'OT Mecanica'),
    (r'OTMecanitzaci',                     'Mecanitzacio',              'OT Mecanitzacio'),
    (r'OTEl.ctrica',                       'Oficina Tecnica Electrica','OT Electrica'),

    (r'Posta en marxa.*CME',               'CME',                       'Posta en marxa - CME'),
    (r'Posta en marxa.*I\+D',              'I+D',                       'Posta en marxa - I+D'),
    (r'Posta en marxa.*Inform',            'IT Industrial',             'Informatica industrial'),
    (r'Posta en marxa.*Linies',            'Posta en Marxa',            'Posta en marxa - Linies'),
    (r'Posta en marxa.*Maxpalet',          'Posta en Marxa',            'Posta en marxa - Maxpalet'),
    (r'Posta en marxa.*M.quines',          'Posta en Marxa',            'Posta en marxa - Maquines'),
    (r'Posta en marxa.*DUAL',              'Posta en Marxa',            'Posta en marxa - DUAL'),
    (r'Posta en marxa\b',                  'Posta en Marxa',            'Posta en marxa'),

    (r'SAT.*Posta en marxa',               'SAT',                       'SAT - Tecnic'),
    (r'SAT.*Mec.nic',                      'SAT',                       'SAT - Mecanic'),
    (r'SAT.*El.ctric',                     'SAT',                       'SAT - Electric'),
    (r'SAT-COMERCIAL',                     'SAT',                       'SAT - Comercial'),
    (r'Administraci. SAT',                 'SAT',                       'Administracio SAT'),
    (r'SAT - Recanvis',                    'SAT',                       'SAT - Recanvis / Magatzem'),

    (r'Admin\.\s*SAT',                     'SAT',                       'Administracio SAT'),
    (r'Admin\.\s*RRHH',                    'Recursos Humans',           'Administracio RRHH'),
    (r'Admin\.\s*Compres',                 'Compres',                   'Administracio Compres'),
    (r'Admin\.\s*Comercial',               'Comercial',                 'Administracio Comercial'),
    (r'Admin\.\s*Depplan',                 'Comercial',                 'Administracio Depplan'),
    (r'Admin\.\s*Magatzem',                'Magatzem',                  'Administracio Magatzem'),
    (r'Admin\.\s*OTE',                     'Oficina Tecnica Electrica','Administracio OTE'),
    (r'Admin\.\s*Log',                     'Logistica',                 'Administracio Logistica'),
    (r'Responsable SAP',                   'SAP',                       'Responsable SAP'),
    (r'\bSAP\b',                           'SAP',                       'SAP'),
    (r'Inform.tica',                       'Informatica',               'Informatica'),

    (r'Almac.n.*Devolucions',              'Logistica',                 'Devolucions'),
    (r'Almacen.*Compres',                  'Compres',                   'Compres'),
    (r'Almacen.*Log.stica',                'Logistica',                 'Logistica'),
    (r'Almacen.*Magatzem',                 'Magatzem',                  'Magatzem'),

    (r'Compres Mecanitzaci',               'Mecanitzacio',              'Compres Mecanitzacio'),
    (r'\(Compres\)',                       'Compres',                   'Compres'),

    (r'Validaci.*Costos',                  'Costos',                    'Validacio Ofertes - Costos'),
    (r'Qualitat',                          'Qualitat i Seguretat',      'Qualitat i seguretat'),

    (r'T.cnico comercial',                 'Comercial',                 'Tecnic comercial'),
    (r'T.cnico en mecanizaci',             'Mecanitzacio',              'Tecnic mecanitzacio'),

    (r'T.cnico mec.nico.*Premuntatges',    'Posta en Marxa',            'Premuntatges mecanics'),
    (r'T.cnico mec.nico.*DUAL',            'Posta en Marxa',            'Mecanic DUAL'),
    (r'T.cnico mec.nico.*Soldador',        'Posta en Marxa',            'Mecanic - Soldador'),
    (r'T.cnico mec.nico',                  'Posta en Marxa',            'Mecanic'),
    (r'T.cnico Soldador',                  'Posta en Marxa',            'Soldador'),
    (r'T.cnico El.ctrico.*Premuntatges',   'Posta en Marxa',            'Premuntatges electrics'),
    (r'T.cnico El.ctrico.*DUAL',           'Posta en Marxa',            'Electric DUAL'),
    (r'T.cnico El.ctrico',                 'Posta en Marxa',            'Electric'),

    (r'Administraci',                      'Administracio',             'Administracio'),
    (r'Projectes',                         'Projectes',                 'Projectes'),
    (r'Conductor',                         'Logistica',                 'Conductor'),
    (r'Manteniment',                       'Magatzem',                  'Manteniment'),
    (r'Neteja',                            'Administracio',             'Neteja'),
    (r'GALVEZ|WITZKE',                     None,                        None),
]

# Restore Catalan accents in dept and role
ACCENT_FIX = {
    'Oficina Tecnica Mecanica': 'Oficina Tècnica Mecànica',
    'Oficina Tecnica Electrica': 'Oficina Tècnica Elèctrica',
    'Mecanitzacio': 'Mecanització',
    'Logistica': 'Logística',
    'Informatica': 'Informàtica',
    'Administracio': 'Administració',
}
def fix_accents(s):
    if not s: return s
    for k, v in ACCENT_FIX.items():
        s = s.replace(k, v)
    repls = [
        ('Mecanica','Mecànica'),('Electrica','Elèctrica'),
        ('mecanics','mecànics'),('electrics','elèctrics'),
        ('Mecanic','Mecànic'),('Electric','Elèctric'),
        ('Linies','Línies'),('Maquines','Màquines'),
        ('Tecnica','Tècnica'),('Tecnic','Tècnic'),
        ('Simulacio','Simulació'),('Validacio','Validació'),
        ('Administracio','Administració'),
    ]
    for a, b in repls:
        s = s.replace(a, b)
    return s

COLORS = ['bg-red-400','bg-orange-400','bg-amber-400','bg-yellow-400','bg-lime-400','bg-green-400','bg-emerald-400','bg-teal-400','bg-cyan-400','bg-sky-400','bg-blue-400','bg-indigo-400','bg-violet-400','bg-purple-400','bg-fuchsia-400','bg-pink-400','bg-rose-400']

def initials(first, last1):
    a = first[:1] if first else ''
    b = last1[:1] if last1 else ''
    return (a+b).upper() or '?'

def cap_name(s):
    if not s: return ''
    return ' '.join(p.capitalize() for p in s.split())

rows = []
unmapped = []
counts = {}
for r in ws.iter_rows(min_row=4, values_only=True):
    first, last1, last2, puesto = r[3], r[4], r[5], r[6]
    if not (first and last1 and puesto): continue
    if re.search(r'GALVEZ|WITZKE', puesto, re.I): continue
    dept, role = None, None
    for pattern, d, ro in DEPT_MAP:
        if re.search(pattern, puesto, re.I):
            dept, role = d, ro
            break
    if dept is None:
        unmapped.append(puesto)
        continue
    name_parts = [cap_name(first), cap_name(last1)]
    if last2: name_parts.append(cap_name(last2))
    name = ' '.join(name_parts)
    rows.append({
        'name': name,
        'role': fix_accents(role),
        'dept': fix_accents(dept),
        'initials': initials(first, last1),
        'color': COLORS[len(rows) % len(COLORS)],
    })
    counts[dept] = counts.get(dept, 0) + 1

print(f'Total rows: {len(rows)}')
print(f'Unmapped: {len(unmapped)}')
for u in sorted(set(unmapped)): print('  UNMAPPED:', repr(u))
print()
for d, c in sorted(counts.items()):
    print(f'  {c:4d} {d}')

with open(r'C:/UNAI/portalWeb/PETICIONS/_employees.json', 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

# Generate SQL migration
def esc(s):
    return s.replace("'", "''") if s else ''

sql_lines = [
    '-- Seed employees from Treballadors i lloc de treball.xlsx + V2_Orgzanigrama_General_2025.pdf',
    'DELETE FROM employees;',
    'ALTER TABLE employees AUTO_INCREMENT = 1;',
    '',
    "INSERT INTO employees (name, role, dept, email, phone, ext, initials, color) VALUES",
]
vals = []
for r in rows:
    vals.append(f"  ('{esc(r['name'])}', '{esc(r['role'])}', '{esc(r['dept'])}', '', '', '', '{esc(r['initials'])}', '{esc(r['color'])}')")
sql_lines.append(',\n'.join(vals) + ';')

with open(r'C:/UNAI/portalWeb/api/migrations/2026_05_07_seed_employees.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f'\nWrote SQL: api/migrations/2026_05_07_seed_employees.sql ({len(rows)} rows)')
