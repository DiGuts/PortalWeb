// Admin — Users management.
// Layout: toolbar (search + role filter + actions) → table left, detail right.

const { useState: aUS, useMemo: aUM } = React;

// Seed users by extending TAVIL_DATA.directory with role/status/lastLogin.
function buildUsers() {
  const data = window.TAVIL_DATA;
  const roles = ['empleat', 'editor', 'admin', 'empleat', 'empleat', 'editor', 'empleat', 'admin'];
  const statuses = ['active', 'active', 'active', 'inactive', 'active', 'active', 'active', 'active'];
  const lastLogins = ['fa 1 h', 'fa 3 h', 'fa 1 dia', 'fa 12 dies', 'fa 2 h', 'avui', 'fa 4 h', 'fa 1 setmana'];
  return data.directory.map((p, i) => ({
    ...p,
    email: `${p.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@tavil.com`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    lastLogin: lastLogins[i % lastLogins.length],
    visibleInDirectory: i !== 3,
    phone: '+34 937 20 84 0' + (i % 10),
    office: i % 2 === 0 ? 'Seu central' : 'Planta Terrassa',
    joined: '2022',
  }));
}

function AdminUsers() {
  const { theme, accent } = useDApp();
  const [users, setUsers] = aUS(buildUsers());
  const [selectedId, setSelectedId] = aUS(null);
  const [q, setQ] = aUS('');
  const [roleFilter, setRoleFilter] = aUS('all');
  const [statusFilter, setStatusFilter] = aUS('all');

  const filtered = aUM(() => users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (q && !(u.name + u.email + u.role + u.dept).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [users, q, roleFilter, statusFilter]);

  const selected = users.find(u => u.id === selectedId);

  const updateSelected = (patch) => {
    setUsers(prev => prev.map(u => u.id === selectedId ? { ...u, ...patch } : u));
  };

  const counts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    editor: users.filter(u => u.role === 'editor').length,
    empleat: users.filter(u => u.role === 'empleat').length,
  };

  const columns = [
    {
      key: 'name', label: 'Usuari', width: 'minmax(0, 2fr)',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <AAvatar name={u.name} size={30} />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
            <div style={{ fontSize: 11.5, color: theme.textFaint, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'dept', label: 'Departament', width: 'minmax(0, 1fr)',
      render: (u) => <span style={{ color: theme.textMuted, fontSize: 12.5 }}>{u.dept}</span>,
    },
    {
      key: 'role', label: 'Rol', width: '100px',
      render: (u) => <ARolePill role={u.role} />,
    },
    {
      key: 'status', label: 'Estat', width: '110px',
      render: (u) => <AStatusPill status={u.status} />,
    },
    {
      key: 'lastLogin', label: 'Últim accés', width: '110px', align: 'right',
      render: (u) => <span style={{ color: theme.textFaint, fontSize: 12 }}>{u.lastLogin}</span>,
    },
  ];

  return (
    <AdminFont>
      <AdminHeader
        title="Usuaris"
        subtitle="Gestiona els comptes del portal, els rols i l'estat d'activació."
        actions={
          <>
            <ABtn variant="secondary" icon="plus">Importa CSV</ABtn>
            <ABtn variant="primary" icon="plus">Nou usuari</ABtn>
          </>
        }
      />

      {/* Toolbar: search + role + status pills */}
      <AdminToolbar>
        <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nom, correu, departament…" />
        <div style={{ width: 1, height: 22, background: theme.border }} />
        <AdminFilterPills value={roleFilter} onChange={setRoleFilter} options={[
          { id: 'all', label: 'Tots', count: counts.all },
          { id: 'admin', label: 'Admin', count: counts.admin },
          { id: 'editor', label: 'Editor', count: counts.editor },
          { id: 'empleat', label: 'Empleat', count: counts.empleat },
        ]} />
        <div style={{ width: 1, height: 22, background: theme.border }} />
        <AdminFilterPills value={statusFilter} onChange={setStatusFilter} options={[
          { id: 'all', label: 'Tots els estats' },
          { id: 'active', label: 'Actius' },
          { id: 'inactive', label: 'Inactius' },
        ]} />
      </AdminToolbar>

      <AdminTwoPane
        left={
          <AdminTable
            columns={columns}
            rows={filtered}
            selectedId={selectedId}
            onRowClick={setSelectedId}
            emptyMessage="Cap usuari coincideix amb els filtres."
          />
        }
        right={
          selected ? (
            <AdminDetail
              badge="USUARI"
              title={selected.name}
              onClose={() => setSelectedId(null)}
              footer={
                <>
                  <ABtn variant="ghost" onClick={() => setSelectedId(null)}>Tanca</ABtn>
                  <ABtn variant="primary" icon="check">Desa</ABtn>
                </>
              }
            >
              {/* Identity card */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                background: theme.bgAlt, border: `1px solid ${theme.border}`, borderRadius: 8,
              }}>
                <AAvatar name={selected.name} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{selected.role} · {selected.dept}</div>
                  <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 4 }}>Ext. {selected.ext} · {selected.office}</div>
                </div>
              </div>

              <AField label="Nom complet">
                <AInput value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} />
              </AField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AField label="Correu corporatiu">
                  <AInput value={selected.email} onChange={(e) => updateSelected({ email: e.target.value })} icon="mail" />
                </AField>
                <AField label="Extensió">
                  <AInput value={selected.ext} onChange={(e) => updateSelected({ ext: e.target.value })} />
                </AField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AField label="Departament">
                  <ASelect value={selected.dept} onChange={(e) => updateSelected({ dept: e.target.value })}
                    options={['Direcció', 'Persones', 'Comercial', 'Finances', 'IT', 'Producció', 'Sostenibilitat']} />
                </AField>
                <AField label="Oficina">
                  <ASelect value={selected.office} onChange={(e) => updateSelected({ office: e.target.value })}
                    options={['Seu central', 'Planta Terrassa', 'Milà', 'Lió', 'Remot']} />
                </AField>
              </div>

              <AField label="Rol del portal" hint="Determina què pot fer aquest usuari a l'admin.">
                <ASegmented
                  value={selected.role}
                  onChange={(v) => updateSelected({ role: v })}
                  options={[
                    { value: 'empleat', label: 'Empleat' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
              </AField>

              <AField label="Estat del compte">
                <ASegmented
                  value={selected.status}
                  onChange={(v) => updateSelected({ status: v })}
                  options={[
                    { value: 'active', label: 'Actiu', icon: 'check' },
                    { value: 'inactive', label: 'Inactiu', icon: 'close' },
                  ]}
                />
              </AField>

              <AToggle
                value={selected.visibleInDirectory}
                onChange={(v) => updateSelected({ visibleInDirectory: v })}
                label="Visible al directori"
                hint="L'usuari apareix a Qui és qui."
              />

              {/* Account actions */}
              <div style={{
                padding: 12, background: theme.bgAlt,
                border: `1px solid ${theme.border}`, borderRadius: 8,
              }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 600, color: theme.textFaint,
                  textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
                }}>Accions de compte</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <ABtn variant="secondary" size="sm" icon="mail">Reenvia invitació</ABtn>
                  <ABtn variant="secondary" size="sm" icon="settings">Resetejar contrasenya</ABtn>
                  <ABtn variant="danger" size="sm" icon="logout">Elimina usuari</ABtn>
                </div>
              </div>

              {/* Read-only metadata */}
              <div style={{
                fontSize: 11.5, color: theme.textFaint,
                paddingTop: 10, borderTop: `1px solid ${theme.border}`,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
              }}>
                <div>ID: <span style={{ fontFamily: '"JetBrains Mono", monospace', color: theme.textMuted }}>{selected.id.toUpperCase()}</span></div>
                <div>Alta: <span style={{ color: theme.textMuted }}>{selected.joined}</span></div>
                <div>Últim accés: <span style={{ color: theme.textMuted }}>{selected.lastLogin}</span></div>
                <div>Telèfon: <span style={{ color: theme.textMuted }}>{selected.phone}</span></div>
              </div>
            </AdminDetail>
          ) : (
            <AdminDetailEmpty
              icon="users"
              label="Selecciona un usuari"
              hint="Tria una fila de la taula per veure i editar els seus permisos, dades i estat."
            />
          )
        }
      />
    </AdminFont>
  );
}

Object.assign(window, { AdminUsers });
