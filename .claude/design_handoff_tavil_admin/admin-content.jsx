// Admin — Content management modules: News, Activities, Formations, Agenda.
// All share the same scaffolding: table left + detail panel right, with module-specific fields.

const { useState: aCS, useMemo: aCM } = React;

// ─────────── Shared scaffolding for content modules ───────────
//
// `useContentModule` returns the state machinery the four modules need.
function useContentModule(initial) {
  const [items, setItems] = aCS(initial);
  const [selectedId, setSelectedId] = aCS(null);
  const [q, setQ] = aCS('');
  const [statusFilter, setStatusFilter] = aCS('all');
  const [editorLang, setEditorLang] = aCS('ca');

  const selected = items.find(it => it.id === selectedId);
  const update = (patch) => {
    setItems(prev => prev.map(it => it.id === selectedId ? { ...it, ...patch } : it));
  };

  const filterBySearch = (it, fields) =>
    !q || fields.some(f => String(it[f] || '').toLowerCase().includes(q.toLowerCase()));

  const filterByStatus = (it) => statusFilter === 'all' || it.status === statusFilter;

  const counts = {
    all: items.length,
    published: items.filter(i => i.status === 'published').length,
    draft: items.filter(i => i.status === 'draft').length,
    scheduled: items.filter(i => i.status === 'scheduled').length,
    archived: items.filter(i => i.status === 'archived').length,
  };

  return {
    items, setItems, selected, selectedId, setSelectedId,
    q, setQ, statusFilter, setStatusFilter, editorLang, setEditorLang,
    update, filterBySearch, filterByStatus, counts,
  };
}

const AUDIENCES = [
  { value: 'all', label: 'Tothom' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'finances', label: 'Finances' },
  { value: 'persones', label: 'Persones' },
  { value: 'it', label: 'IT' },
  { value: 'produccio', label: 'Producció' },
  { value: 'sostenibilitat', label: 'Sostenibilitat' },
  { value: 'seu-central', label: 'Seu central' },
  { value: 'planta-terrassa', label: 'Planta Terrassa' },
  { value: 'mila', label: 'Milà' },
  { value: 'lio', label: 'Lió' },
];

// Renders the status filter pills used by every content module.
function ContentStatusPills({ value, onChange, counts }) {
  return (
    <AdminFilterPills value={value} onChange={onChange} options={[
      { id: 'all', label: 'Tots', count: counts.all },
      { id: 'published', label: 'Publicats', count: counts.published },
      { id: 'draft', label: 'Esborrany', count: counts.draft },
      { id: 'scheduled', label: 'Programats', count: counts.scheduled },
      { id: 'archived', label: 'Arxivats', count: counts.archived },
    ]} />
  );
}

// Reusable bottom blocks for the detail pane — language tabs, audience, schedule, image.
function ContentDetailCommon({ item, update, editorLang, setEditorLang, imageRatio = '16/9' }) {
  const { theme } = useDApp();
  return (
    <>
      <ALangTabs value={editorLang} onChange={setEditorLang} />

      {/* Translation status indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 11.5, color: theme.textFaint,
      }}>
        <DIcon name="globe" size={13} />
        <span>Editant la versió <strong style={{ color: theme.text, textTransform: 'uppercase' }}>{editorLang}</strong>. Les altres versions s'editen canviant de pestanya.</span>
      </div>
    </>
  );
}

function ContentSchedule({ item, update }) {
  const { theme } = useDApp();
  return (
    <AField label="Publicació" hint="Si està programat, s'enviarà a tots els canals a l'hora indicada.">
      <ASegmented
        value={item.status === 'published' ? 'published' : item.status === 'scheduled' ? 'scheduled' : item.status === 'archived' ? 'archived' : 'draft'}
        onChange={(v) => update({ status: v })}
        options={[
          { value: 'draft', label: 'Esborrany' },
          { value: 'scheduled', label: 'Programat' },
          { value: 'published', label: 'Publicat' },
          { value: 'archived', label: 'Arxivat' },
        ]}
      />
      {item.status === 'scheduled' && (
        <div style={{ marginTop: 8 }}>
          <AInput
            type="datetime-local"
            value={item.scheduledFor || ''}
            onChange={(e) => update({ scheduledFor: e.target.value })}
          />
        </div>
      )}
    </AField>
  );
}

function ContentAudience({ item, update }) {
  return (
    <AField label="Audiència" hint="Segments que rebran aquesta peça. Si tens dubtes, deixa-ho a 'Tothom'.">
      <AChipMulti
        value={item.audience || ['all']}
        onChange={(v) => update({ audience: v.length ? v : ['all'] })}
        options={AUDIENCES}
      />
    </AField>
  );
}

// ─────────── News ───────────
function buildNews() {
  const cats = ['Empresa', 'Persones', 'Esdeveniments', 'Sostenibilitat'];
  const statuses = ['published', 'published', 'draft', 'scheduled', 'archived'];
  return window.TAVIL_DATA.news.map((n, i) => ({
    id: n.id, title: n.title, summary: n.summary || '',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    category: cats[i % cats.length],
    status: statuses[i % statuses.length],
    scheduledFor: i % 5 === 3 ? '2026-04-30T09:00' : '',
    audience: i % 3 === 0 ? ['all'] : ['comercial', 'persones'],
    languages: ['ca', 'es', 'en'],
    author: 'Comunicació interna',
    updatedAt: `fa ${i + 1} dies`,
  }));
}

function AdminNews() {
  const { theme } = useDApp();
  const m = useContentModule(buildNews());

  const filtered = aCM(() => m.items.filter(it =>
    m.filterByStatus(it) && m.filterBySearch(it, ['title', 'category', 'author'])
  ), [m.items, m.q, m.statusFilter]);

  const columns = [
    {
      key: 'title', label: 'Article', width: 'minmax(0, 2.5fr)',
      render: (n) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 44, height: 32, borderRadius: 5, flexShrink: 0,
            background: theme.bgAlt, border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: theme.textFaint,
          }}><DIcon name="news" size={14} /></div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
            <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.author}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Categoria', width: '120px', render: (n) => <span style={{ color: theme.textMuted, fontSize: 12 }}>{n.category}</span> },
    { key: 'languages', label: 'Idiomes', width: '90px', render: (n) => <span style={{ fontFamily: '"JetBrains Mono", monospace', color: theme.textMuted, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{n.languages.join(' · ')}</span> },
    { key: 'status', label: 'Estat', width: '110px', render: (n) => <AStatusPill status={n.status} /> },
    { key: 'updatedAt', label: 'Actualitzat', width: '110px', align: 'right', render: (n) => <span style={{ color: theme.textFaint, fontSize: 12 }}>{n.updatedAt}</span> },
  ];

  return (
    <AdminFont>
      <AdminHeader
        title="Notícies"
        subtitle="Crea, programa i publica articles dirigits a tot el portal o a audiències segmentades."
        actions={<ABtn variant="primary" icon="plus">Nou article</ABtn>}
      />
      <AdminToolbar>
        <AdminSearch value={m.q} onChange={(e) => m.setQ(e.target.value)} placeholder="Cerca articles, autors, categoria…" />
        <div style={{ width: 1, height: 22, background: theme.border }} />
        <ContentStatusPills value={m.statusFilter} onChange={m.setStatusFilter} counts={m.counts} />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={filtered} selectedId={m.selectedId} onRowClick={m.setSelectedId} emptyMessage="Cap article amb aquests filtres." />}
        right={
          m.selected ? (
            <AdminDetail
              badge="ARTICLE" title={m.selected.title}
              onClose={() => m.setSelectedId(null)}
              footer={<><ABtn variant="ghost" onClick={() => m.setSelectedId(null)}>Tanca</ABtn><ABtn variant="primary" icon="check">Desa</ABtn></>}
            >
              <ContentDetailCommon item={m.selected} update={m.update} editorLang={m.editorLang} setEditorLang={m.setEditorLang} />
              <AField label="Portada">
                <AImageDrop ratio="16/9" label="Arrossega la portada" hint="Recomanat 1600×900 · JPG / PNG" />
              </AField>
              <AField label="Títol">
                <AInput value={m.selected.title} onChange={(e) => m.update({ title: e.target.value })} />
              </AField>
              <AField label="Resum">
                <ATextarea rows={2} value={m.selected.summary} onChange={(e) => m.update({ summary: e.target.value })} />
              </AField>
              <AField label="Cos de l'article">
                <ATextarea rows={6} value={m.selected.body} onChange={(e) => m.update({ body: e.target.value })} />
              </AField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AField label="Categoria">
                  <ASelect value={m.selected.category} onChange={(e) => m.update({ category: e.target.value })}
                    options={['Empresa', 'Persones', 'Esdeveniments', 'Sostenibilitat']} />
                </AField>
                <AField label="Autor">
                  <AInput value={m.selected.author} onChange={(e) => m.update({ author: e.target.value })} />
                </AField>
              </div>
              <ContentSchedule item={m.selected} update={m.update} />
              <ContentAudience item={m.selected} update={m.update} />
            </AdminDetail>
          ) : <AdminDetailEmpty icon="news" label="Selecciona un article" hint="Tria una fila per editar el contingut, la imatge i la programació." />
        }
      />
    </AdminFont>
  );
}

// ─────────── Activities ───────────
function buildActivities() {
  return window.TAVIL_DATA.activities.map((a, i) => ({
    id: a.id, title: a.title, tag: a.tag, date: a.date, where: a.where,
    description: 'Descripció breu de l\'activitat. Inclou què faràs, qui ho dinamitza i què cal portar.',
    capacity: a.capacity, enrolled: a.enrolled,
    status: a.status === 'full' ? 'published' : i % 4 === 1 ? 'draft' : i % 4 === 2 ? 'scheduled' : 'published',
    scheduledFor: i % 4 === 2 ? '2026-05-10T18:00' : '',
    audience: ['all'],
    languages: ['ca', 'es'],
    updatedAt: `fa ${i + 1} dies`,
  }));
}

function AdminActivities() {
  const { theme, accent } = useDApp();
  const m = useContentModule(buildActivities());

  const filtered = aCM(() => m.items.filter(it =>
    m.filterByStatus(it) && m.filterBySearch(it, ['title', 'tag', 'where'])
  ), [m.items, m.q, m.statusFilter]);

  const columns = [
    {
      key: 'title', label: 'Activitat', width: 'minmax(0, 2.5fr)',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 44, height: 32, borderRadius: 5, flexShrink: 0,
            background: accent.primaryLight, color: accent.primaryDark,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><DIcon name="activity" size={14} /></div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
            <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 2 }}>{a.where}</div>
          </div>
        </div>
      ),
    },
    { key: 'tag', label: 'Categoria', width: '110px', render: (a) => <span style={{ color: theme.textMuted, fontSize: 12 }}>{a.tag}</span> },
    { key: 'date', label: 'Data', width: '140px', render: (a) => <span style={{ color: theme.textMuted, fontSize: 12.5, fontFeatureSettings: '"tnum"' }}>{a.date}</span> },
    {
      key: 'capacity', label: 'Aforament', width: '110px',
      render: (a) => {
        const pct = Math.round((a.enrolled / a.capacity) * 100);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: theme.bgAlt, overflow: 'hidden', minWidth: 40 }}>
              <div style={{ height: '100%', width: pct + '%', background: pct >= 100 ? '#b6833a' : accent.primary }} />
            </div>
            <span style={{ fontSize: 11, color: theme.textFaint, fontFeatureSettings: '"tnum"' }}>{a.enrolled}/{a.capacity}</span>
          </div>
        );
      },
    },
    { key: 'status', label: 'Estat', width: '110px', render: (a) => <AStatusPill status={a.status} /> },
  ];

  return (
    <AdminFont>
      <AdminHeader
        title="Activitats"
        subtitle="Esdeveniments interns amb inscripció: cultura, esport, formació, jornades."
        actions={<ABtn variant="primary" icon="plus">Nova activitat</ABtn>}
      />
      <AdminToolbar>
        <AdminSearch value={m.q} onChange={(e) => m.setQ(e.target.value)} placeholder="Cerca activitats, categoria, lloc…" />
        <div style={{ width: 1, height: 22, background: theme.border }} />
        <ContentStatusPills value={m.statusFilter} onChange={m.setStatusFilter} counts={m.counts} />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={filtered} selectedId={m.selectedId} onRowClick={m.setSelectedId} emptyMessage="Cap activitat amb aquests filtres." />}
        right={
          m.selected ? (
            <AdminDetail
              badge="ACTIVITAT" title={m.selected.title}
              onClose={() => m.setSelectedId(null)}
              footer={<><ABtn variant="ghost" onClick={() => m.setSelectedId(null)}>Tanca</ABtn><ABtn variant="primary" icon="check">Desa</ABtn></>}
            >
              <ContentDetailCommon item={m.selected} update={m.update} editorLang={m.editorLang} setEditorLang={m.setEditorLang} />
              <AField label="Imatge de portada">
                <AImageDrop ratio="16/9" label="Arrossega una imatge" hint="Recomanat 1600×900 · JPG / PNG" />
              </AField>
              <AField label="Títol">
                <AInput value={m.selected.title} onChange={(e) => m.update({ title: e.target.value })} />
              </AField>
              <AField label="Descripció">
                <ATextarea rows={4} value={m.selected.description} onChange={(e) => m.update({ description: e.target.value })} />
              </AField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AField label="Data i hora">
                  <AInput value={m.selected.date} onChange={(e) => m.update({ date: e.target.value })} icon="clock" placeholder="23 abr · 13:30" />
                </AField>
                <AField label="Categoria">
                  <ASelect value={m.selected.tag} onChange={(e) => m.update({ tag: e.target.value })}
                    options={['Benestar', 'Cultura', 'Esport', 'Solidari', 'Familiar']} />
                </AField>
              </div>
              <AField label="Ubicació">
                <AInput value={m.selected.where} onChange={(e) => m.update({ where: e.target.value })} icon="mapPin" />
              </AField>
              <AField label="Aforament">
                <AInput type="number" value={m.selected.capacity} onChange={(e) => m.update({ capacity: +e.target.value })} />
              </AField>
              <ContentSchedule item={m.selected} update={m.update} />
              <ContentAudience item={m.selected} update={m.update} />
            </AdminDetail>
          ) : <AdminDetailEmpty icon="activity" label="Selecciona una activitat" hint="Tria una fila per gestionar dates, aforament i inscripció." />
        }
      />
    </AdminFont>
  );
}

// ─────────── Formations (Campus) ───────────
function buildFormations() {
  const statuses = ['published', 'published', 'draft', 'scheduled', 'archived'];
  return window.TAVIL_DATA.courses.map((c, i) => ({
    id: c.id, title: c.title, instructor: c.instructor, duration: c.duration,
    level: c.level, category: c.category, lessons: c.lessons, rating: c.rating,
    description: 'Curs intern del Campus TAVIL. Inclou material, sessions presencials i avaluació.',
    status: statuses[i % statuses.length], scheduledFor: i % 5 === 3 ? '2026-05-04T09:00' : '',
    audience: ['all'],
    languages: ['ca', 'es', 'en'],
  }));
}

function AdminCampus() {
  const { theme, accent } = useDApp();
  const m = useContentModule(buildFormations());

  const filtered = aCM(() => m.items.filter(it =>
    m.filterByStatus(it) && m.filterBySearch(it, ['title', 'instructor', 'category'])
  ), [m.items, m.q, m.statusFilter]);

  const columns = [
    {
      key: 'title', label: 'Formació', width: 'minmax(0, 2.5fr)',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 44, height: 32, borderRadius: 5, flexShrink: 0,
            background: theme.bgAlt, color: theme.textMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${theme.border}`,
          }}><DIcon name="campus" size={14} /></div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
            <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 2 }}>{c.instructor}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Categoria', width: '120px', render: (c) => <span style={{ color: theme.textMuted, fontSize: 12 }}>{c.category}</span> },
    { key: 'level', label: 'Nivell', width: '90px', render: (c) => <span style={{ color: theme.textMuted, fontSize: 12 }}>{c.level}</span> },
    { key: 'duration', label: 'Durada', width: '70px', align: 'right', render: (c) => <span style={{ color: theme.textMuted, fontSize: 12, fontFeatureSettings: '"tnum"' }}>{c.duration}</span> },
    { key: 'lessons', label: 'Sessions', width: '70px', align: 'right', render: (c) => <span style={{ color: theme.textFaint, fontSize: 12, fontFeatureSettings: '"tnum"' }}>{c.lessons}</span> },
    { key: 'status', label: 'Estat', width: '110px', render: (c) => <AStatusPill status={c.status} /> },
  ];

  return (
    <AdminFont>
      <AdminHeader
        title="Formacions"
        subtitle="Catàleg del Campus TAVIL: cursos, itineraris i sessions presencials."
        actions={<ABtn variant="primary" icon="plus">Nova formació</ABtn>}
      />
      <AdminToolbar>
        <AdminSearch value={m.q} onChange={(e) => m.setQ(e.target.value)} placeholder="Cerca cursos, instructor, categoria…" />
        <div style={{ width: 1, height: 22, background: theme.border }} />
        <ContentStatusPills value={m.statusFilter} onChange={m.setStatusFilter} counts={m.counts} />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={filtered} selectedId={m.selectedId} onRowClick={m.setSelectedId} emptyMessage="Cap formació amb aquests filtres." />}
        right={
          m.selected ? (
            <AdminDetail
              badge="FORMACIÓ" title={m.selected.title}
              onClose={() => m.setSelectedId(null)}
              footer={<><ABtn variant="ghost" onClick={() => m.setSelectedId(null)}>Tanca</ABtn><ABtn variant="primary" icon="check">Desa</ABtn></>}
            >
              <ContentDetailCommon item={m.selected} update={m.update} editorLang={m.editorLang} setEditorLang={m.setEditorLang} />
              <AField label="Portada del curs">
                <AImageDrop ratio="16/9" label="Arrossega la portada" hint="Recomanat 1600×900" />
              </AField>
              <AField label="Títol">
                <AInput value={m.selected.title} onChange={(e) => m.update({ title: e.target.value })} />
              </AField>
              <AField label="Descripció">
                <ATextarea rows={4} value={m.selected.description} onChange={(e) => m.update({ description: e.target.value })} />
              </AField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AField label="Instructor">
                  <AInput value={m.selected.instructor} onChange={(e) => m.update({ instructor: e.target.value })} icon="profile" />
                </AField>
                <AField label="Categoria">
                  <ASelect value={m.selected.category} onChange={(e) => m.update({ category: e.target.value })}
                    options={['Comercial', 'Finances', 'Persones', 'Producció', 'Sostenibilitat']} />
                </AField>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <AField label="Durada">
                  <AInput value={m.selected.duration} onChange={(e) => m.update({ duration: e.target.value })} placeholder="6 h" />
                </AField>
                <AField label="Sessions">
                  <AInput type="number" value={m.selected.lessons} onChange={(e) => m.update({ lessons: +e.target.value })} />
                </AField>
                <AField label="Nivell">
                  <ASelect value={m.selected.level} onChange={(e) => m.update({ level: e.target.value })}
                    options={['Bàsic', 'Intermedi', 'Avançat']} />
                </AField>
              </div>
              <ContentSchedule item={m.selected} update={m.update} />
              <ContentAudience item={m.selected} update={m.update} />
            </AdminDetail>
          ) : <AdminDetailEmpty icon="campus" label="Selecciona una formació" hint="Tria una fila per editar el contingut, instructor i calendari." />
        }
      />
    </AdminFont>
  );
}

// ─────────── Agenda (admin) ───────────
function buildAgenda() {
  const colors = { accent: 'accent', olive: 'olive', carbon: 'carbon' };
  const statuses = ['published', 'scheduled', 'published', 'draft', 'published'];
  return window.TAVIL_DATA.agenda.map((a, i) => ({
    id: a.id, title: a.title, time: a.time, day: a.day, where: a.where,
    attendees: a.attendees, color: a.color,
    description: 'Esdeveniment corporatiu. Edita els detalls per actualitzar l\'agenda dels assistents.',
    status: statuses[i % statuses.length], scheduledFor: '',
    audience: ['all'],
    languages: ['ca'],
    organizer: 'Direcció',
    recurrence: 'none',
  }));
}

function AdminAgenda() {
  const { theme, accent } = useDApp();
  const m = useContentModule(buildAgenda());

  const filtered = aCM(() => m.items.filter(it =>
    m.filterByStatus(it) && m.filterBySearch(it, ['title', 'where', 'organizer'])
  ), [m.items, m.q, m.statusFilter]);

  const colorMap = { accent: accent.primary, olive: theme.olive || '#7a8a6b', carbon: theme.text };

  const columns = [
    {
      key: 'title', label: 'Esdeveniment', width: 'minmax(0, 2fr)',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 4, height: 32, borderRadius: 2, flexShrink: 0,
            background: colorMap[a.color] || accent.primary,
          }} />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
            <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 2 }}>{a.where}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'day', label: 'Dia · Hora', width: '180px',
      render: (a) => <span style={{ color: theme.textMuted, fontSize: 12.5, fontFeatureSettings: '"tnum"' }}>{a.day} abr · {a.time}</span>,
    },
    { key: 'attendees', label: 'Assist.', width: '70px', align: 'right', render: (a) => <span style={{ color: theme.textMuted, fontSize: 12, fontFeatureSettings: '"tnum"' }}>{a.attendees}</span> },
    { key: 'organizer', label: 'Organitzador', width: '120px', render: (a) => <span style={{ color: theme.textMuted, fontSize: 12 }}>{a.organizer}</span> },
    { key: 'status', label: 'Estat', width: '110px', render: (a) => <AStatusPill status={a.status} /> },
  ];

  return (
    <AdminFont>
      <AdminHeader
        title="Agenda"
        subtitle="Esdeveniments corporatius, reunions destacades i jornades obertes."
        actions={<ABtn variant="primary" icon="plus">Nou esdeveniment</ABtn>}
      />
      <AdminToolbar>
        <AdminSearch value={m.q} onChange={(e) => m.setQ(e.target.value)} placeholder="Cerca esdeveniments, lloc, organitzador…" />
        <div style={{ width: 1, height: 22, background: theme.border }} />
        <ContentStatusPills value={m.statusFilter} onChange={m.setStatusFilter} counts={m.counts} />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={filtered} selectedId={m.selectedId} onRowClick={m.setSelectedId} emptyMessage="Cap esdeveniment amb aquests filtres." />}
        right={
          m.selected ? (
            <AdminDetail
              badge="ESDEVENIMENT" title={m.selected.title}
              onClose={() => m.setSelectedId(null)}
              footer={<><ABtn variant="ghost" onClick={() => m.setSelectedId(null)}>Tanca</ABtn><ABtn variant="primary" icon="check">Desa</ABtn></>}
            >
              <ContentDetailCommon item={m.selected} update={m.update} editorLang={m.editorLang} setEditorLang={m.setEditorLang} />
              <AField label="Títol">
                <AInput value={m.selected.title} onChange={(e) => m.update({ title: e.target.value })} />
              </AField>
              <AField label="Descripció">
                <ATextarea rows={3} value={m.selected.description} onChange={(e) => m.update({ description: e.target.value })} />
              </AField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AField label="Data">
                  <AInput type="date" value={`2026-04-${String(m.selected.day).padStart(2, '0')}`} onChange={() => {}} />
                </AField>
                <AField label="Hora">
                  <AInput value={m.selected.time} onChange={(e) => m.update({ time: e.target.value })} icon="clock" />
                </AField>
              </div>
              <AField label="Ubicació">
                <AInput value={m.selected.where} onChange={(e) => m.update({ where: e.target.value })} icon="mapPin" />
              </AField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <AField label="Organitzador">
                  <AInput value={m.selected.organizer} onChange={(e) => m.update({ organizer: e.target.value })} />
                </AField>
                <AField label="Codi de color">
                  <ASegmented value={m.selected.color} onChange={(v) => m.update({ color: v })} dense
                    options={[
                      { value: 'accent', label: 'Marca' },
                      { value: 'olive', label: 'Cultura' },
                      { value: 'carbon', label: 'Neutre' },
                    ]} />
                </AField>
              </div>
              <AField label="Recurrència">
                <ASelect value={m.selected.recurrence} onChange={(e) => m.update({ recurrence: e.target.value })}
                  options={[
                    { value: 'none', label: 'Sense repetició' },
                    { value: 'daily', label: 'Cada dia' },
                    { value: 'weekly', label: 'Setmanal' },
                    { value: 'monthly', label: 'Mensual' },
                  ]} />
              </AField>
              <ContentSchedule item={m.selected} update={m.update} />
              <ContentAudience item={m.selected} update={m.update} />
            </AdminDetail>
          ) : <AdminDetailEmpty icon="calendar" label="Selecciona un esdeveniment" hint="Tria una fila per editar dates, ubicació i audiència." />
        }
      />
    </AdminFont>
  );
}

Object.assign(window, { AdminNews, AdminActivities, AdminCampus, AdminAgenda });
