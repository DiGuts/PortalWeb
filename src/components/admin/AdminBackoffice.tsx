import React, { useState, useMemo, useEffect, CSSProperties } from 'react';
import {
  Plus, Check, Mail, MapPin, Clock, Users, Calendar, Newspaper,
  GraduationCap, Activity as ActivityIcon, ArrowRight, Settings,
  LogOut, Image as ImageIcon, Globe, FileText, Bell,
} from 'lucide-react';
import {
  User, Activity, AgendaEvent, NewsArticle, Course, Quiz, Notice,
  apiAdminListUsers, apiAdminUpdateUser, apiAdminCreateUser, apiAdminDeleteUser,
  apiGetNews, apiCreateNews, apiUpdateNews, apiDeleteNews,
  apiGetActivities, apiCreateActivity, apiUpdateActivity, apiDeleteActivity,
  apiGetAgendaEvents, apiCreateAgendaEvent, apiUpdateAgendaEvent, apiDeleteAgendaEvent,
  apiGetAllNotices, apiCreateNotice, apiUpdateNotice, apiDeleteNotice,
  apiGetCourses, apiGetQuizzes, apiCreateExternalCourse, apiUpdateExternalCourse, apiDeleteExternalCourse,
  ExternalCoursePayload, API_BASE,
} from '../../api';
import {
  T, F_DISPLAY, F_BODY, F_MONO, resolveUploadUrl,
  AdminFont, AdminHeader, AdminToolbar, AdminSearch, AdminFilterPills,
  ABtn, AStatusPill, ARolePill,
  AdminTable, AdminTwoPane, AdminDetail, AdminDetailEmpty,
  AField, AInput, ATextarea, ASelect, ASegmented, AToggle, AChipMulti, ALangTabs, AImageDrop, AAvatar,
  Column,
} from './primitives';
import { DEPT_ORDER } from '../../lib/depts';
import { ImageGalleryPicker } from './ImageGalleryPicker';
import { CreateUserModal } from './CreateUserModal';
import { CreateNewsModal } from './CreateNewsModal';
import { CreateActivityModal } from './CreateActivityModal';
import { CreateAgendaModal } from './CreateAgendaModal';
import { CreateNoticeModal } from './CreateNoticeModal';
import { CreateExternalCourseModal } from './CreateExternalCourseModal';
import { useConfirm } from '../ConfirmDialog';

// Primitives + tokens imported from ./primitives. Modules below compose them.


// ── Module: AdminDashboard ──────────────────────────────────────────────────

// Per-role visibility for admin modules. Keep aligned with sidebar gating in App.tsx.
function modulesForRole(role?: string, roles?: string[]): Set<string> {
  const all = new Set([role ?? '', ...(roles ?? [])]);
  const hr = (...r: string[]) => r.some(x => all.has(x));
  if (hr('Administrador', 'Administrador/a'))
    return new Set(['admin-users', 'admin-news', 'admin-avisos', 'admin-activities', 'admin-campus', 'admin-agenda']);
  if (hr('Recursos humans', 'SolicitudsVacances', 'SolicitudsDissabtes'))
    return new Set(['admin-news', 'admin-avisos', 'admin-activities', 'admin-campus', 'admin-agenda']);
  if (hr('Comunicacions', 'Comunicació'))
    return new Set(['admin-news', 'admin-avisos', 'admin-activities', 'admin-agenda']);
  if (hr('Formacions'))
    return new Set(['admin-campus', 'admin-agenda']); // no admin-activities per Formacions
  return new Set();
}

function AdminDashboard({ currentUser, onNavigate, counts }: {
  currentUser: User | null;
  onNavigate: (tab: string, intent?: 'new') => void;
  counts: { users: number; news: number; activities: number; formations: number; agenda: number; avisos: number };
}) {
  const firstName = currentUser?.name?.split(' ')[0] ?? 'admin';
  const allowed = modulesForRole(currentUser?.role, currentUser?.roles);

  // Hero defaults to "Nova notícia"; falls back to first allowed module if Notícies not permitted.
  const heroCandidates = [
    { id: 'new-news',      label: 'Nova notícia',     sub: 'Publica o programa un article. Editor extens, audiència segmentada, multilingüe.', icon: Newspaper,     target: 'admin-news' },
    { id: 'new-formation', label: 'Nova formació',    sub: 'Curs o itinerari del Campus TAVIL: extens, presencial o intern.',                  icon: GraduationCap, target: 'admin-campus' },
    { id: 'new-activity',  label: 'Nova activitat',   sub: "Esdeveniment intern amb inscripció: cultura, esport, formació, jornades.",         icon: ActivityIcon,  target: 'admin-activities' },
    { id: 'new-agenda',    label: 'Nou esdeveniment', sub: 'Reunió, jornada o esdeveniment corporatiu.',                                       icon: Calendar,      target: 'admin-agenda' },
  ];
  const heroAction = heroCandidates.find(h => allowed.has(h.target)) ?? heroCandidates[0];

  const allQuickActions = [
    { id: 'new-user',     label: 'Nou usuari',      sub: "Crea un compte i envia-li l'accés", icon: Users,          target: 'admin-users' },
    { id: 'new-news',     label: 'Nova notícia',    sub: 'Publica o programa un article',     icon: Newspaper,      target: 'admin-news' },
    { id: 'new-notice',   label: 'Nou avís',        sub: 'Banner destacat al portal',         icon: Bell,           target: 'admin-avisos' },
    { id: 'new-activity', label: 'Nova activitat',  sub: 'Esdeveniment intern amb inscripció', icon: ActivityIcon,   target: 'admin-activities' },
    { id: 'new-formation',label: 'Nova formació',   sub: 'Curs o itinerari del Campus',       icon: GraduationCap,  target: 'admin-campus' },
    { id: 'new-agenda',   label: 'Nou esdeveniment',sub: 'Reunió o jornada corporativa',      icon: Calendar,       target: 'admin-agenda' },
  ];
  const quickActions = allQuickActions.filter(a => a.target !== heroAction.target && allowed.has(a.target)).slice(0, 4);
  const HeroIcon = heroAction.icon;

  const allModules = [
    { id: 'admin-users',      label: 'Usuaris',    icon: Users,         n: counts.users,      sub: 'comptes' },
    { id: 'admin-news',       label: 'Notícies',   icon: Newspaper,     n: counts.news,       sub: 'articles' },
    { id: 'admin-avisos',     label: 'Avisos',     icon: Bell,          n: counts.avisos,     sub: 'banners' },
    { id: 'admin-activities', label: 'Activitats', icon: ActivityIcon,  n: counts.activities, sub: 'activitats' },
    { id: 'admin-campus',     label: 'Formacions', icon: GraduationCap, n: counts.formations, sub: 'cursos' },
    { id: 'admin-agenda',     label: 'Agenda',     icon: Calendar,      n: counts.agenda,     sub: 'esdeveniments' },
  ];
  const modules = allModules.filter(m => allowed.has(m.id));

  const labelStyle: CSSProperties = {
    fontSize: 10.5, fontWeight: 600, color: T.textFaint,
    textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
  };

  return (
    <>
      <AdminHeader
        kicker={`Bon dia, ${firstName}`}
        title="Tauler d'administració"
        subtitle="Accés ràpid a les tasques més freqüents. Selecciona un mòdul per a una vista detallada."
      />

      <div style={labelStyle}>Accions ràpides</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12, marginBottom: 36,
      }} className="admin-bento">
        {/* Hero: Nova notícia (span 2 cols × 2 rows) */}
        <button onClick={() => onNavigate(heroAction.target, 'new')} style={{
          gridColumn: 'span 2', gridRow: 'span 2',
          padding: 24, background: T.accent, color: '#fff',
          border: `1px solid ${T.accent}`, borderRadius: 12,
          textAlign: 'left', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontFamily: F_BODY, minHeight: 220,
          transition: 'transform 160ms ease-out, box-shadow 160ms ease-out',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 18px 36px -16px rgba(191,33,30,0.55)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'rgba(255,255,255,0.18)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><HeroIcon size={26} /></div>
          <div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 32, fontWeight: 500, lineHeight: 1.05, letterSpacing: '-0.01em' }}>{heroAction.label}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8, maxWidth: 380, lineHeight: 1.4 }}>{heroAction.sub}</div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
          }}>Crear article <ArrowRight size={16} /></div>
        </button>

        {/* 4 small bento cards */}
        {quickActions.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.id} onClick={() => onNavigate(a.target, 'new')} style={{
              padding: 18, background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 104, gap: 12,
              fontFamily: F_BODY, color: T.text,
              transition: 'border-color 140ms, background 140ms, transform 140ms',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = T.bgAlt; (e.currentTarget as HTMLButtonElement).style.borderColor = T.accent + '55'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = T.card; (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: T.accentLight, color: T.accentDark,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon size={17} /></div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: F_DISPLAY, fontSize: 18, fontWeight: 500, lineHeight: 1.1 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3, lineHeight: 1.3 }}>{a.sub}</div>
                </div>
                <ArrowRight size={15} style={{ color: T.textFaint, flexShrink: 0, marginBottom: 2 }} />
              </div>
            </button>
          );
        })}
      </div>

      <div style={labelStyle}>Mòduls</div>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden',
      }}>
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => onNavigate(m.id)} style={{
              width: '100%', display: 'grid', gridTemplateColumns: '38px 1fr auto auto',
              alignItems: 'center', gap: 14, padding: '14px 18px',
              border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: i < modules.length - 1 ? `1px solid ${T.border}` : 'none',
              fontFamily: F_BODY, color: T.text, textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = T.bgAlt}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: T.bgAlt, color: T.textMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon size={18} /></div>
              <div style={{ fontFamily: F_DISPLAY, fontSize: 20, fontWeight: 500 }}>{m.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: F_DISPLAY, fontSize: 22, fontWeight: 500, fontFeatureSettings: '"tnum"' }}>{m.n}</span>
                <span style={{ fontSize: 11.5, color: T.textFaint }}>{m.sub}</span>
              </div>
              <ArrowRight size={15} style={{ color: T.textFaint }} />
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Module: AdminUsers ──────────────────────────────────────────────────────

const DEPT_OPTIONS = DEPT_ORDER;
const OFFICE_OPTIONS = ['Alemanya', 'Canadà', 'Dinamarca', 'França', 'Itàlia', 'Mèxic', 'Polònia', 'Rússia', 'UK', 'USA', 'Holanda', 'Sant Jaume de llierca'];
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Treballador/a',       label: 'Treballador/a' },
  { value: 'Cap de departament',  label: 'Cap de departament' },
  { value: 'Administrador',       label: 'Administrador' },
  { value: 'Formacions',          label: 'Formacions' },
  { value: 'Comunicacions',       label: 'Comunicacions' },
  { value: 'SolicitudsDissabtes', label: 'Sol·licituds dissabtes' },
  { value: 'SolicitudsVacances',  label: 'Sol·licituds vacances (RRHH)' },
];

function mapServerRoleToPill(role: string, roles?: string[]): 'admin' | 'editor' | 'empleat' {
  const all = [...(roles ?? []), role];
  if (all.some(r => ['Administrador', 'Administrador/a'].includes(r))) return 'admin';
  if (all.some(r => ['Formacions', 'Comunicacions', 'Comunicació', 'SolicitudsDissabtes', 'SolicitudsVacances', 'Recursos humans'].includes(r))) return 'editor';
  return 'empleat';
}

function AdminUsers({ users, refresh, currentUser, onImpersonate, intent, onConsumeIntent }: {
  users: User[];
  refresh: () => void;
  currentUser: User | null;
  onImpersonate?: (id: number, name: string) => void;
  intent?: 'new' | null;
  onConsumeIntent?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor' | 'empleat'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [draft, setDraft] = useState<Partial<User>>({});
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  const selected = users.find(u => u.id === selectedId) || null;

  useEffect(() => {
    setDraft(selected ? { ...selected } : {});
    setNewPass('');
  }, [selectedId, selected?.id]);

  const filtered = useMemo(() => users.filter(u => {
    const pill = mapServerRoleToPill(u.role, u.roles);
    if (roleFilter !== 'all' && pill !== roleFilter) return false;
    const status = u.must_change_password ? 'pending' : 'active';
    if (statusFilter === 'active' && status !== 'active') return false;
    if (statusFilter === 'inactive' && status === 'active') return false;
    if (q && !(u.name + u.email + u.role + u.dept).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [users, q, roleFilter, statusFilter]);

  const counts = {
    all: users.length,
    admin: users.filter(u => mapServerRoleToPill(u.role, u.roles) === 'admin').length,
    editor: users.filter(u => mapServerRoleToPill(u.role, u.roles) === 'editor').length,
    empleat: users.filter(u => mapServerRoleToPill(u.role, u.roles) === 'empleat').length,
  };

  const update = (patch: Partial<User>) => setDraft(prev => ({ ...prev, ...patch }));

  const save = async () => {
    if (!selected) return;
    if (newPass && newPass.length < 8) { alert('La nova contrasenya ha de tenir mínim 8 caràcters.'); return; }
    setSaving(true);
    try {
      await apiAdminUpdateUser(selected.id, {
        name: draft.name, email: draft.email,
        roles: draft.roles ?? [],
        dept: draft.dept,
        phone: draft.phone, ext: draft.ext, location: draft.location,
        ...(newPass ? { new_password: newPass } : {}),
      });
      setNewPass('');
      refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Error desant');
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async () => {
    if (!selected) return;
    const ok = await confirm(`Vols eliminar l'usuari "${selected.name}"? Aquesta acció no es pot desfer.`);
    if (!ok) return;
    try {
      await apiAdminDeleteUser(selected.id);
      setSelectedId(null);
      refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Error');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name', label: 'Usuari', width: 'minmax(0, 2fr)',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <AAvatar name={u.name} size={30} src={u.avatar_url} />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
            <div style={{ fontSize: 11.5, color: T.textFaint, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'dept', label: 'Departament', width: 'minmax(0, 1fr)', render: (u) => <span style={{ color: T.textMuted, fontSize: 12.5 }}>{u.dept || '—'}</span> },
    { key: 'role', label: 'Rol', width: '100px', render: (u) => <ARolePill role={mapServerRoleToPill(u.role, u.roles)} /> },
    { key: 'status', label: 'Estat', width: '110px', render: (u) => <AStatusPill status={u.must_change_password ? 'pending' : 'active'} /> },
    { key: 'lastLogin', label: 'Últim accés', width: '110px', align: 'right', render: () => <span style={{ color: T.textFaint, fontSize: 12 }}>—</span> },
    ...(onImpersonate && currentUser?.is_demo_admin === 1 ? [{
      key: 'actions', label: '', width: '56px', align: 'right' as const,
      render: (u: User) => u.id !== currentUser?.id ? (
        <button
          onClick={(e) => { e.stopPropagation(); onImpersonate(u.id, u.name); }}
          title={`Impersonar ${u.name}`}
          aria-label={`Impersonar ${u.name}`}
          style={{
            width: 40, height: 40, borderRadius: 8, padding: 0,
            background: 'transparent', border: `1px solid ${T.border}`,
            color: T.textMuted, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 140ms',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = T.accentLight; (e.currentTarget as HTMLButtonElement).style.color = T.accentDark; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = T.textMuted; }}
        ><Users size={16} /></button>
      ) : null,
    }] : []),
  ];

  const [createOpen, setCreateOpen] = useState(false);
  const newUser = () => setCreateOpen(true);
  const onCreated = (created: User) => {
    setCreateOpen(false);
    refresh();
    setSelectedId(created.id);
  };

  useEffect(() => {
    if (intent === 'new') {
      setCreateOpen(true);
      onConsumeIntent?.();
    }
  }, [intent, onConsumeIntent]);

  return (
    <>
      <AdminHeader
        title="Usuaris"
        subtitle="Gestiona els comptes del portal, els rols i l'estat d'activació."
        actions={<ABtn variant="primary" icon={Plus} onClick={newUser}>Nou usuari</ABtn>}
      />

      <AdminToolbar>
        <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per nom, correu, departament…" />
        <div style={{ width: 1, height: 22, background: T.border }} />
        <AdminFilterPills value={roleFilter} onChange={(id) => setRoleFilter(id as any)} options={[
          { id: 'all', label: 'Tots', count: counts.all },
          { id: 'admin', label: 'Admin', count: counts.admin },
          { id: 'editor', label: 'Editor', count: counts.editor },
          { id: 'empleat', label: 'Empleat', count: counts.empleat },
        ]} />
        <div style={{ width: 1, height: 22, background: T.border }} />
        <AdminFilterPills value={statusFilter} onChange={(id) => setStatusFilter(id as any)} options={[
          { id: 'all', label: 'Tots els estats' },
          { id: 'active', label: 'Actius' },
          { id: 'inactive', label: 'Pendents' },
        ]} />
      </AdminToolbar>

      <AdminTwoPane
        left={
          filtered.length === 0 && users.length > 0 && (q || roleFilter !== 'all' || statusFilter !== 'all') ? (
            <div style={{
              background: T.card, border: `1px dashed ${T.border}`, borderRadius: 10,
              padding: '60px 30px', textAlign: 'center', fontFamily: F_BODY,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 24, margin: '0 auto 16px',
                background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.textMuted,
              }}><Users size={22} /></div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>Cap usuari coincideix amb els filtres</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 18, maxWidth: 320, marginInline: 'auto', lineHeight: 1.5 }}>
                Prova amb un altre terme de cerca o esborra els filtres per veure tots els {users.length} comptes.
              </div>
              <ABtn variant="secondary" size="sm" onClick={() => { setQ(''); setRoleFilter('all'); setStatusFilter('all'); }}>Esborra filtres</ABtn>
            </div>
          ) : (
            <AdminTable columns={columns} rows={filtered} selectedId={selectedId} onRowClick={(id) => setSelectedId(id as number)} emptyMessage="Encara no hi ha cap usuari. Crea el primer." />
          )
        }
        right={selected ? (
          <AdminDetail
            badge="USUARI" title={selected.name}
            onClose={() => setSelectedId(null)}
            footer={
              <>
                <ABtn variant="ghost" onClick={() => setSelectedId(null)}>Tanca</ABtn>
                <ABtn variant="primary" icon={Check} onClick={save} disabled={saving}>{saving ? 'Desant…' : 'Desa'}</ABtn>
              </>
            }
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 14,
              background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 8,
            }}>
              <AAvatar name={selected.name} size={48} src={selected.avatar_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{selected.role} · {selected.dept}</div>
                <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 4 }}>Ext. {selected.ext || '—'} · {selected.location || '—'}</div>
              </div>
            </div>

            <AField label="Nom complet"><AInput value={draft.name ?? ''} onChange={(e) => update({ name: e.target.value })} /></AField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Correu corporatiu"><AInput value={draft.email ?? ''} onChange={(e) => update({ email: e.target.value })} icon={Mail} /></AField>
              <AField label="Extensió"><AInput value={draft.ext ?? ''} onChange={(e) => update({ ext: e.target.value })} /></AField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Departament">
                <ASelect value={draft.dept ?? ''} onChange={(e) => update({ dept: e.target.value })} options={DEPT_OPTIONS} />
              </AField>
              <AField label="Oficina">
                <ASelect value={draft.location ?? ''} onChange={(e) => update({ location: e.target.value })} options={OFFICE_OPTIONS} />
              </AField>
            </div>

            <AField label="Rols del portal" hint="Multiassignable. Cap de departament = aprova vacances del seu dept.">
              <AChipMulti
                value={draft.roles ?? []}
                onChange={(v) => update({ roles: v })}
                options={ROLE_OPTIONS}
              />
            </AField>

            <AField label="Nova contrasenya" hint="Deixa buit per no canviar-la. Mínim 8 caràcters. L'usuari l'haurà de canviar al primer accés.">
              <AInput value={newPass} onChange={(e) => setNewPass(e.target.value)} type="text" placeholder="Deixa buit per no canviar" autoComplete="new-password" />
            </AField>

            <div style={{
              padding: 12, background: T.bgAlt,
              border: `1px solid ${T.border}`, borderRadius: 8,
            }}>
              <div style={{
                fontSize: 10.5, fontWeight: 600, color: T.textFaint,
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
              }}>Accions de compte</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {onImpersonate && currentUser?.is_demo_admin === 1 && selected.id !== currentUser.id && (
                  <ABtn variant="secondary" size="sm" icon={Users} onClick={() => onImpersonate(selected.id, selected.name)}>Impersonar usuari</ABtn>
                )}
                <ABtn variant="danger" size="sm" icon={LogOut} onClick={removeUser}>Elimina usuari</ABtn>
              </div>
            </div>

            <div style={{
              fontSize: 11.5, color: T.textFaint,
              paddingTop: 10, borderTop: `1px solid ${T.border}`,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
            }}>
              <div>ID: <span style={{ fontFamily: F_MONO, color: T.textMuted }}>USR-{String(selected.id).padStart(4, '0')}</span></div>
              <div>Telèfon: <span style={{ color: T.textMuted }}>{selected.phone || '—'}</span></div>
            </div>
          </AdminDetail>
        ) : (
          <AdminDetailEmpty icon={Users} label="Selecciona un usuari" hint="Tria una fila de la taula per veure i editar els seus permisos, dades i estat." />
        )}
      />
      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreated} />
      {confirmNode}
    </>
  );
}

// ── Module: AdminNews ───────────────────────────────────────────────────────

type LangDraft = Record<'ca' | 'es' | 'en', { title: string; summary: string }>;
const emptyLangDraft = (): LangDraft => ({ ca: { title: '', summary: '' }, es: { title: '', summary: '' }, en: { title: '', summary: '' } });

function AdminNews({ news, refresh, intent, onConsumeIntent }: { news: NewsArticle[]; refresh: () => void; intent?: 'new' | null; onConsumeIntent?: () => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editorLang, setEditorLang] = useState<'ca' | 'es' | 'en'>('ca');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [coverDraft, setCoverDraft] = useState<string>('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [featuredDraft, setFeaturedDraft] = useState(0);
  const [langDraft, setLangDraft] = useState<LangDraft>(emptyLangDraft());
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  const selected = news.find(n => n.id === selectedId) || null;

  useEffect(() => {
    setCoverDraft(selected?.image ?? '');
    setCategory(selected?.category ?? '');
    setDate(selected?.date ?? '');
    setFeaturedDraft(selected?.featured ?? 0);
    if (selected) {
      const t = selected.translations || {};
      setLangDraft({
        ca: { title: selected.title ?? '', summary: selected.summary ?? '' },
        es: { title: t.es?.title ?? '', summary: t.es?.summary ?? '' },
        en: { title: t.en?.title ?? '', summary: t.en?.summary ?? '' },
      });
    } else {
      setLangDraft(emptyLangDraft());
    }
  }, [selected?.id]);

  const dirty = !!selected && (
    langDraft.ca.title !== (selected.title ?? '') ||
    langDraft.ca.summary !== (selected.summary ?? '') ||
    langDraft.es.title !== (selected.translations?.es?.title ?? '') ||
    langDraft.es.summary !== (selected.translations?.es?.summary ?? '') ||
    langDraft.en.title !== (selected.translations?.en?.title ?? '') ||
    langDraft.en.summary !== (selected.translations?.en?.summary ?? '') ||
    category !== selected.category ||
    date !== selected.date ||
    featuredDraft !== selected.featured ||
    coverDraft !== (selected.image ?? '')
  );

  const buildPayload = (overrides: Partial<{ image: string }> = {}) => {
    if (!selected) throw new Error('No article selected');
    const translations: { es?: { title?: string; summary?: string }; en?: { title?: string; summary?: string } } = {};
    if (langDraft.es.title || langDraft.es.summary) translations.es = { title: langDraft.es.title, summary: langDraft.es.summary };
    if (langDraft.en.title || langDraft.en.summary) translations.en = { title: langDraft.en.title, summary: langDraft.en.summary };
    return {
      category,
      title:    langDraft.ca.title,
      summary:  langDraft.ca.summary,
      content:  selected.content ?? '',
      date,
      image:    overrides.image ?? coverDraft,
      featured: featuredDraft,
      translations,
    };
  };

  const saveMetadata = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiUpdateNews(selected.id, buildPayload());
      refresh();
    } catch (e: any) { alert(e?.message ?? 'Error desant'); }
    finally { setSaving(false); }
  };

  const saveCover = async (url: string) => {
    if (!selected) return;
    try {
      await apiUpdateNews(selected.id, buildPayload({ image: url }));
      setCoverDraft(url);
      refresh();
    } catch (e: any) { alert(e?.message ?? 'Error desant portada'); }
  };
  const filtered = useMemo(() => news.filter(n => {
    if (statusFilter !== 'all') {
      const s = n.featured ? 'published' : 'draft';
      if (s !== statusFilter) return false;
    }
    if (q && !(n.title + n.category).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [news, q, statusFilter]);

  const counts = {
    all: news.length,
    published: news.filter(n => n.featured).length,
    draft: news.filter(n => !n.featured).length,
    scheduled: 0,
    archived: 0,
  };

  const openExtendedEditor = (id: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('article', String(id));
    window.open(url.toString(), '_blank');
  };

  const [createOpen, setCreateOpen] = useState(false);
  const newArticle = () => setCreateOpen(true);
  const onCreatedArticle = (created: NewsArticle) => {
    setCreateOpen(false);
    refresh();
    setSelectedId(created.id);
    openExtendedEditor(created.id);
  };

  useEffect(() => {
    if (intent === 'new') {
      onConsumeIntent?.();
      setCreateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const remove = async () => {
    if (!selected) return;
    const ok = await confirm(`Vols eliminar l'article "${selected.title}"? Aquesta acció no es pot desfer.`);
    if (!ok) return;
    try { await apiDeleteNews(selected.id); setSelectedId(null); refresh(); }
    catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const columns: Column<NewsArticle>[] = [
    {
      key: 'title', label: 'Article', width: 'minmax(0, 2.5fr)',
      render: (n) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 44, height: 32, borderRadius: 5, flexShrink: 0,
            background: n.image ? `url(${n.image.startsWith('/uploads/') ? API_BASE + n.image : n.image}) center/cover` : T.bgAlt,
            border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.textFaint,
          }}>{!n.image && <Newspaper size={14} />}</div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.author || '—'}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Categoria', width: '140px', render: (n) => <span style={{ color: T.textMuted, fontSize: 12 }}>{n.category}</span> },
    { key: 'date', label: 'Data', width: '100px', render: (n) => <span style={{ color: T.textMuted, fontSize: 12, fontFeatureSettings: '"tnum"' }}>{n.date}</span> },
    { key: 'status', label: 'Estat', width: '110px', render: (n) => <AStatusPill status={n.featured ? 'published' : 'draft'} /> },
  ];

  return (
    <>
      <AdminHeader
        title="Notícies"
        subtitle="Crea, programa i publica articles dirigits a tot el portal o a audiències segmentades."
        actions={<ABtn variant="primary" icon={Plus} onClick={newArticle}>Nou article</ABtn>}
      />
      <AdminToolbar>
        <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca articles, autors, categoria…" />
        <div style={{ width: 1, height: 22, background: T.border }} />
        <AdminFilterPills value={statusFilter} onChange={setStatusFilter} options={[
          { id: 'all', label: 'Tots', count: counts.all },
          { id: 'published', label: 'Publicats', count: counts.published },
          { id: 'draft', label: 'Esborrany', count: counts.draft },
        ]} />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={filtered} selectedId={selectedId} onRowClick={(id) => setSelectedId(id as number)} emptyMessage="Cap article amb aquests filtres." />}
        right={selected ? (
          <AdminDetail
            badge="ARTICLE" title={selected.title}
            onClose={() => setSelectedId(null)}
            footer={
              <>
                <ABtn variant="danger" size="sm" onClick={remove}>Elimina</ABtn>
                <ABtn variant="ghost" onClick={() => setSelectedId(null)}>Tanca</ABtn>
                <ABtn variant="secondary" icon={FileText} onClick={() => openExtendedEditor(selected.id)}>Obre l'editor</ABtn>
                <ABtn variant="primary" icon={Check} onClick={saveMetadata} disabled={!dirty || saving}>{saving ? 'Desant…' : 'Desa'}</ABtn>
              </>
            }
          >
            <ALangTabs value={editorLang} onChange={setEditorLang} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11.5, color: T.textFaint,
            }}>
              <Globe size={13} />
              <span>Editant la versió <strong style={{ color: T.text, textTransform: 'uppercase' }}>{editorLang}</strong>.</span>
            </div>
            <AField label="Portada">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {coverDraft ? (
                  <div style={{
                    aspectRatio: '16/9', width: '100%',
                    backgroundImage: `url(${resolveUploadUrl(coverDraft)})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    borderRadius: 8, border: `1px solid ${T.border}`,
                  }} />
                ) : (
                  <div style={{
                    aspectRatio: '16/9', width: '100%',
                    background: T.bgAlt, border: `1px dashed ${T.border}`, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.textFaint, fontSize: 12,
                  }}>Sense portada</div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <ABtn variant="secondary" size="sm" icon={ImageIcon} onClick={() => setGalleryOpen(true)}>Triar de la galeria</ABtn>
                  {coverDraft && <ABtn variant="ghost" size="sm" onClick={() => saveCover('')}>Treure portada</ABtn>}
                </div>
              </div>
            </AField>
            <AField label={`Títol (${editorLang.toUpperCase()})`}>
              <AInput
                value={langDraft[editorLang].title}
                onChange={e => setLangDraft(d => ({ ...d, [editorLang]: { ...d[editorLang], title: e.target.value } }))}
                placeholder={editorLang !== 'ca' && langDraft.ca.title ? langDraft.ca.title : ''}
              />
            </AField>
            <AField label={`Resum (${editorLang.toUpperCase()})`} hint={editorLang !== 'ca' ? 'Si es deixa buit, es mostrarà la versió CA.' : undefined}>
              <ATextarea
                rows={2}
                value={langDraft[editorLang].summary}
                onChange={e => setLangDraft(d => ({ ...d, [editorLang]: { ...d[editorLang], summary: e.target.value } }))}
                placeholder={editorLang !== 'ca' && langDraft.ca.summary ? langDraft.ca.summary : ''}
              />
            </AField>
            <AField label="Cos de l'article" hint="El cos s'edita amb l'editor de Notícia extensa.">
              <ABtn variant="secondary" icon={FileText} onClick={() => openExtendedEditor(selected.id)}>Obre l'editor extens</ABtn>
            </AField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Categoria">
                <ASelect value={category} onChange={e => setCategory(e.target.value)}
                  options={['Comunicats interns', 'Notícies corporatives', 'Recursos humans', 'Esdeveniments', 'Innovació', 'Seguretat']} />
              </AField>
              <AField label="Data">
                <AInput type="date" value={date.slice(0, 10)} onChange={e => setDate(e.target.value)} />
              </AField>
            </div>
            <AToggle
              value={!!featuredDraft}
              onChange={v => setFeaturedDraft(v ? 1 : 0)}
              label="Destacada (publicada al portal)"
              hint="Quan està activa, apareix al feed d'Inici i a Notícies."
            />
          </AdminDetail>
        ) : (
          <AdminDetailEmpty icon={Newspaper} label="Selecciona un article" hint="Tria una fila per editar el contingut, la imatge i la programació." />
        )}
      />
      <ImageGalleryPicker
        open={galleryOpen}
        selected={coverDraft}
        onPick={(url) => { saveCover(url); setGalleryOpen(false); }}
        onClose={() => setGalleryOpen(false)}
        allowManage
      />
      <CreateNewsModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreatedArticle} />
      {confirmNode}
    </>
  );
}

// ── Module: AdminActivities ─────────────────────────────────────────────────

function AdminActivities({ activities, refresh, intent, onConsumeIntent }: { activities: Activity[]; refresh: () => void; intent?: 'new' | null; onConsumeIntent?: () => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draft, setDraft] = useState<Partial<Activity>>({});
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  const selected = activities.find(a => a.id === selectedId) || null;
  useEffect(() => {
    setDraft(selected ? {
      title: selected.title, description: selected.description, date: selected.date,
      time: selected.time, location: selected.location, category: selected.category,
      capacity: selected.capacity,
    } : {});
  }, [selected?.id]);

  const dirty = !!selected && (
    draft.title !== selected.title ||
    draft.description !== selected.description ||
    draft.date !== selected.date ||
    draft.time !== selected.time ||
    draft.location !== selected.location ||
    draft.category !== selected.category ||
    draft.capacity !== selected.capacity
  );

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiUpdateActivity(selected.id, {
        title: draft.title ?? selected.title,
        description: draft.description ?? selected.description ?? '',
        date: draft.date ?? selected.date,
        time: draft.time ?? selected.time,
        location: draft.location ?? selected.location,
        capacity: draft.capacity ?? selected.capacity,
      } as any);
      refresh();
    } catch (e: any) { alert(e?.message ?? 'Error desant'); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => activities.filter(a => {
    if (q && !(a.title + a.category + a.location).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [activities, q]);

  const counts = { all: activities.length };

  const [createOpen, setCreateOpen] = useState(false);
  const newActivity = () => setCreateOpen(true);
  const onCreatedActivity = (created: Activity) => {
    setCreateOpen(false);
    refresh();
    setSelectedId(created.id);
  };

  useEffect(() => {
    if (intent === 'new') {
      onConsumeIntent?.();
      setCreateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const remove = async () => {
    if (!selected) return;
    const ok = await confirm(`Vols eliminar l'activitat "${selected.title}"? Aquesta acció no es pot desfer.`);
    if (!ok) return;
    try { await apiDeleteActivity(selected.id); setSelectedId(null); refresh(); }
    catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const columns: Column<Activity>[] = [
    {
      key: 'title', label: 'Activitat', width: 'minmax(0, 2.5fr)',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 44, height: 32, borderRadius: 5, flexShrink: 0,
            background: T.accentLight, color: T.accentDark,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ActivityIcon size={14} /></div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 2 }}>{a.location}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Categoria', width: '120px', render: (a) => <span style={{ color: T.textMuted, fontSize: 12 }}>{a.category || '—'}</span> },
    { key: 'date', label: 'Data', width: '140px', render: (a) => <span style={{ color: T.textMuted, fontSize: 12.5, fontFeatureSettings: '"tnum"' }}>{a.date} · {a.time}</span> },
    {
      key: 'capacity', label: 'Aforament', width: '110px',
      render: (a) => {
        const cap = a.capacity || 0;
        const enr = a.enrolled || 0;
        const pct = cap ? Math.round((enr / cap) * 100) : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.bgAlt, overflow: 'hidden', minWidth: 40 }}>
              <div style={{ height: '100%', width: pct + '%', background: pct >= 100 ? '#b6833a' : T.accent }} />
            </div>
            <span style={{ fontSize: 11, color: T.textFaint, fontFeatureSettings: '"tnum"' }}>{enr}/{cap}</span>
          </div>
        );
      },
    },
    { key: 'status', label: 'Estat', width: '110px', render: (a) => {
      const enr = a.enrolled || 0; const cap = a.capacity || 0;
      const s = cap > 0 && enr >= cap ? 'full' : 'published';
      return <AStatusPill status={s} />;
    } },
  ];

  return (
    <>
      <AdminHeader
        title="Activitats"
        subtitle="Esdeveniments interns amb inscripció: cultura, esport, formació, jornades."
        actions={<ABtn variant="primary" icon={Plus} onClick={newActivity}>Nova activitat</ABtn>}
      />
      <AdminToolbar>
        <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca activitats, categoria, lloc…" />
        <div style={{ width: 1, height: 22, background: T.border }} />
        <AdminFilterPills value={statusFilter} onChange={setStatusFilter} options={[
          { id: 'all', label: 'Tots', count: counts.all },
        ]} />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={filtered} selectedId={selectedId} onRowClick={(id) => setSelectedId(id as number)} emptyMessage="Cap activitat." />}
        right={selected ? (
          <AdminDetail
            badge="ACTIVITAT" title={selected.title}
            onClose={() => setSelectedId(null)}
            footer={
              <>
                <ABtn variant="danger" size="sm" onClick={remove}>Elimina</ABtn>
                <ABtn variant="ghost" onClick={() => setSelectedId(null)}>Tanca</ABtn>
                <ABtn variant="primary" icon={Check} onClick={save} disabled={!dirty || saving}>{saving ? 'Desant…' : 'Desa'}</ABtn>
              </>
            }
          >
            <AField label="Títol"><AInput value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></AField>
            <AField label="Descripció"><ATextarea rows={4} value={draft.description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></AField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Data"><AInput type="date" value={(draft.date ?? '').slice(0, 10)} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} /></AField>
              <AField label="Hora"><AInput type="time" value={draft.time ?? ''} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} icon={Clock} /></AField>
            </div>
            <AField label="Categoria"><AInput value={draft.category ?? ''} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} /></AField>
            <AField label="Ubicació"><AInput value={draft.location ?? ''} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} icon={MapPin} /></AField>
            <AField label="Aforament"><AInput type="number" value={draft.capacity ?? 0} onChange={e => setDraft(d => ({ ...d, capacity: +e.target.value }))} /></AField>
          </AdminDetail>
        ) : (
          <AdminDetailEmpty icon={ActivityIcon} label="Selecciona una activitat" hint="Tria una fila per gestionar dates, aforament i inscripció." />
        )}
      />
      <CreateActivityModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreatedActivity} />
      {confirmNode}
    </>
  );
}

// ── Module: AdminCampus (Formacions) ────────────────────────────────────────

type FormationRow =
  | { kind: 'quiz'; id: number; refId: number; title: string; category: string; hours: string; mandatory: number; is_external: 0; image: string; description: string; questions: number; time_limit: number; passing_score: number; active: number; start_at: string | null; end_at: string | null }
  | { kind: 'external'; id: number; refId: number; title: string; category: string; hours: string; mandatory: number; is_external: 1; url: string; description: string; departments: string; target_users: number[]; start_at: string | null; end_at: string | null };

function AdminCampus({ quizzes, externals, refresh, intent, onConsumeIntent }: { quizzes: Quiz[]; externals: Course[]; refresh: () => void; intent?: 'new' | null; onConsumeIntent?: () => void }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState<Partial<ExternalCoursePayload>>({});
  const { confirm, confirmNode } = useConfirm();

  const rows: FormationRow[] = useMemo(() => {
    const qz: FormationRow[] = quizzes.map(z => ({
      kind: 'quiz', id: z.id, refId: z.id,
      title: z.title, category: z.category, hours: '',
      mandatory: 0, is_external: 0, image: z.image, description: z.description,
      questions: z.question_count ?? z.questions?.length ?? 0,
      time_limit: z.time_limit, passing_score: z.passing_score,
      active: z.active, start_at: z.start_at, end_at: z.end_at,
    }));
    const ex: FormationRow[] = externals.map(c => ({
      kind: 'external', id: c.id, refId: c.id,
      title: c.title, category: c.category, hours: c.hours,
      mandatory: c.mandatory, is_external: 1, url: c.url, description: c.description,
      departments: c.departments, target_users: c.target_users || [],
      start_at: c.start_at, end_at: c.end_at,
    }));
    return [...qz, ...ex];
  }, [quizzes, externals]);

  const rowKey = (r: FormationRow) => `${r.kind}-${r.id}`;
  const selected = rows.find(r => rowKey(r) === selectedKey) || null;
  const filtered = useMemo(() => rows.filter(r => {
    if (q && !(r.title + (r.category ?? '') + (r.description ?? '')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, q]);

  useEffect(() => {
    if (selected && selected.kind === 'external') {
      let depts: string[] = [];
      try { depts = JSON.parse(selected.departments || '[]'); } catch {}
      setDraft({
        title: selected.title,
        description: selected.description,
        url: selected.url,
        category: selected.category,
        hours: selected.hours,
        mandatory: selected.mandatory,
        departments: depts,
        target_users: selected.target_users || [],
        start_at: selected.start_at,
        end_at: selected.end_at,
      });
    } else {
      setDraft({});
    }
  }, [selectedKey]);

  const openExtendedEditor = (quizId?: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('edit', quizId ? String(quizId) : 'new');
    window.open(url.toString(), '_blank');
  };

  const newInternal = () => openExtendedEditor();
  const [createExtOpen, setCreateExtOpen] = useState(false);
  const newExternal = () => setCreateExtOpen(true);
  const onCreatedExternal = (created: { id: number }) => {
    setCreateExtOpen(false);
    refresh();
    setSelectedKey(`external-${created.id}`);
  };

  useEffect(() => {
    if (intent === 'new') {
      onConsumeIntent?.();
      newInternal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const remove = async () => {
    if (!selected) return;
    if (selected.kind !== 'external') {
      await confirm({
        title: 'Formació interna',
        message: "Per eliminar una formació interna, obre l'editor extens.",
        confirmLabel: 'Entesos',
        cancelLabel: 'Tanca',
        destructive: false,
      });
      return;
    }
    const ok = await confirm(`Vols eliminar la formació "${selected.title}"? Aquesta acció no es pot desfer.`);
    if (!ok) return;
    try { await apiDeleteExternalCourse(selected.refId); setSelectedKey(null); refresh(); }
    catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const save = async () => {
    if (!selected || selected.kind !== 'external') {
      alert('Edició de formacions internes pendent.');
      return;
    }
    try {
      await apiUpdateExternalCourse(selected.refId, {
        title: draft.title ?? '',
        description: draft.description ?? '',
        url: draft.url ?? '',
        category: draft.category ?? '',
        hours: draft.hours ?? '',
        mandatory: draft.mandatory ?? 0,
        departments: draft.departments ?? [],
        target_users: draft.target_users ?? [],
        start_at: draft.start_at,
        end_at: draft.end_at,
      });
      refresh();
    } catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const tableRows = filtered.map(r => ({ ...r, id: rowKey(r) as any }));

  const columns: Column<typeof tableRows[number]>[] = [
    {
      key: 'title', label: 'Formació', width: 'minmax(0, 2.5fr)',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 44, height: 32, borderRadius: 5, flexShrink: 0,
            background: T.bgAlt, color: T.textMuted,
            border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><GraduationCap size={14} /></div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description?.slice(0, 60) || '—'}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Categoria', width: '120px', render: (r) => <span style={{ color: T.textMuted, fontSize: 12 }}>{r.category || '—'}</span> },
    { key: 'hours', label: 'Hores/Preguntes', width: '110px', align: 'right', render: (r) => <span style={{ color: T.textMuted, fontSize: 12, fontFeatureSettings: '"tnum"' }}>{r.kind === 'quiz' ? `${r.questions} q` : (r.hours || '—')}</span> },
    { key: 'mandatory', label: 'Obligatori', width: '90px', render: (r) => r.kind === 'external' && r.mandatory ? <AStatusPill status="active" /> : <span style={{ color: T.textFaint, fontSize: 12 }}>—</span> },
    { key: 'type', label: 'Tipus', width: '90px', render: (r) => <span style={{ color: T.textMuted, fontSize: 12 }}>{r.kind === 'quiz' ? 'Interna' : 'Externa'}</span> },
  ];

  return (
    <>
      <AdminHeader
        title="Formacions"
        subtitle="Catàleg del Campus TAVIL: cursos, itineraris i sessions presencials."
        actions={
          <>
            <ABtn variant="secondary" icon={Plus} onClick={newExternal}>Externa</ABtn>
            <ABtn variant="primary" icon={Plus} onClick={newInternal}>Nova formació</ABtn>
          </>
        }
      />
      <AdminToolbar>
        <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca cursos, instructor, categoria…" />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={tableRows} selectedId={selectedKey} onRowClick={(id) => setSelectedKey(id as string)} emptyMessage="Cap formació." />}
        right={selected ? (
          <AdminDetail
            badge={selected.kind === 'quiz' ? 'FORMACIÓ · INTERNA' : 'FORMACIÓ · EXTERNA'}
            title={selected.title}
            onClose={() => setSelectedKey(null)}
            footer={
              <>
                {selected.kind === 'external' && <ABtn variant="danger" size="sm" onClick={remove}>Elimina</ABtn>}
                <ABtn variant="ghost" onClick={() => setSelectedKey(null)}>Tanca</ABtn>
                {selected.kind === 'external'
                  ? <ABtn variant="primary" icon={Check} onClick={save}>Desa</ABtn>
                  : <ABtn variant="primary" icon={FileText} onClick={() => openExtendedEditor(selected.refId)}>Obre l'editor</ABtn>}
              </>
            }
          >
            {selected.kind === 'external' ? (
              <>
                <AField label="Títol"><AInput value={draft.title ?? ''} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} /></AField>
                <AField label="Descripció"><ATextarea rows={4} value={draft.description ?? ''} onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))} /></AField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <AField label="Categoria">
                    <ASelect value={draft.category ?? ''} onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
                      options={['Comercial', 'Finances', 'Persones', 'Producció', 'Sostenibilitat']} />
                  </AField>
                  <AField label="Hores"><AInput value={draft.hours ?? ''} onChange={(e) => setDraft(d => ({ ...d, hours: e.target.value }))} placeholder="6" /></AField>
                </div>
                <AField label="URL extern">
                  <AInput value={draft.url ?? ''} onChange={(e) => setDraft(d => ({ ...d, url: e.target.value }))} placeholder="https://…" />
                </AField>
                <AToggle
                  value={!!draft.mandatory}
                  onChange={(v) => setDraft(d => ({ ...d, mandatory: v ? 1 : 0 }))}
                  label="Obligatori"
                  hint="Tots els destinataris l'han de completar."
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <AField label="Inici">
                    <AInput type="date" value={draft.start_at?.slice(0, 10) ?? ''} onChange={(e) => setDraft(d => ({ ...d, start_at: e.target.value || null }))} />
                  </AField>
                  <AField label="Final">
                    <AInput type="date" value={draft.end_at?.slice(0, 10) ?? ''} onChange={(e) => setDraft(d => ({ ...d, end_at: e.target.value || null }))} />
                  </AField>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  padding: 14, background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 8,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ fontSize: 13.5, color: T.text }}>{selected.description || <em style={{ color: T.textFaint }}>Sense descripció.</em>}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, fontSize: 11.5 }}>
                    <div><div style={{ color: T.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Categoria</div><div style={{ color: T.textMuted }}>{selected.category || '—'}</div></div>
                    <div><div style={{ color: T.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Preguntes</div><div style={{ color: T.textMuted, fontFeatureSettings: '"tnum"' }}>{selected.questions}</div></div>
                    <div><div style={{ color: T.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Aprovat</div><div style={{ color: T.textMuted, fontFeatureSettings: '"tnum"' }}>{selected.passing_score}%</div></div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.textMuted }}>
                  Les formacions internes s'editen amb l'editor extens (preguntes, multimèdia, audiència). Prem "Obre l'editor" per modificar-la.
                </div>
              </>
            )}
          </AdminDetail>
        ) : (
          <AdminDetailEmpty icon={GraduationCap} label="Selecciona una formació" hint="Tria una fila per editar el contingut, instructor i calendari." />
        )}
      />
      <CreateExternalCourseModal open={createExtOpen} onClose={() => setCreateExtOpen(false)} onCreated={onCreatedExternal} />
      {confirmNode}
    </>
  );
}

// ── Module: AdminAgenda ─────────────────────────────────────────────────────

function AdminAgenda({ events, refresh, intent, onConsumeIntent }: { events: AgendaEvent[]; refresh: () => void; intent?: 'new' | null; onConsumeIntent?: () => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState<Partial<AgendaEvent>>({});
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  const selected = events.find(e => e.id === selectedId) || null;
  useEffect(() => {
    setDraft(selected ? {
      title: selected.title, day: selected.day, month: selected.month,
      time: selected.time, time_end: selected.time_end ?? '',
      location: selected.location, type: selected.type,
      target_departments: selected.target_departments ?? [],
    } : {});
  }, [selected?.id]);

  const dirty = !!selected && (
    draft.title !== selected.title ||
    draft.day !== selected.day ||
    draft.month !== selected.month ||
    draft.time !== selected.time ||
    (draft.time_end ?? '') !== (selected.time_end ?? '') ||
    draft.location !== selected.location ||
    draft.type !== selected.type ||
    JSON.stringify((draft.target_departments ?? []).slice().sort()) !== JSON.stringify((selected.target_departments ?? []).slice().sort())
  );

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiUpdateAgendaEvent(selected.id, {
        title: draft.title ?? selected.title,
        day: draft.day ?? selected.day,
        month: draft.month ?? selected.month,
        time: draft.time ?? selected.time,
        time_end: (draft.time_end ?? '').trim() || undefined,
        location: draft.location ?? selected.location,
        type: draft.type ?? selected.type,
        target_departments: draft.target_departments ?? selected.target_departments ?? [],
      });
      refresh();
    } catch (e: any) { alert(e?.message ?? 'Error desant'); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => events.filter(e => {
    if (q && !(e.title + e.location + e.type).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [events, q]);

  const counts = { all: events.length };

  const [createOpen, setCreateOpen] = useState(false);
  const newEvent = () => setCreateOpen(true);
  const onCreatedEvent = (created: AgendaEvent) => {
    setCreateOpen(false);
    refresh();
    setSelectedId(created.id);
  };

  useEffect(() => {
    if (intent === 'new') {
      onConsumeIntent?.();
      setCreateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const remove = async () => {
    if (!selected) return;
    const ok = await confirm(`Vols eliminar l'esdeveniment "${selected.title}"? Aquesta acció no es pot desfer.`);
    if (!ok) return;
    try { await apiDeleteAgendaEvent(selected.id); setSelectedId(null); refresh(); }
    catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const columns: Column<AgendaEvent>[] = [
    {
      key: 'title', label: 'Esdeveniment', width: 'minmax(0, 2fr)',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ width: 4, height: 32, borderRadius: 2, flexShrink: 0, background: T.accent }} />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 2 }}>{a.location || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'day', label: 'Dia · Hora', width: '180px',
      render: (a) => <span style={{ color: T.textMuted, fontSize: 12.5, fontFeatureSettings: '"tnum"' }}>
        {String(a.day).padStart(2, '0')}/{String(a.month).padStart(2, '0')} · {a.time}{a.time_end ? `–${a.time_end}` : ''}
      </span>,
    },
    { key: 'type', label: 'Tipus', width: '140px', render: (a) => <span style={{ color: T.textMuted, fontSize: 12 }}>{a.type}</span> },
    { key: 'status', label: 'Estat', width: '110px', render: () => <AStatusPill status="published" /> },
  ];

  return (
    <>
      <AdminHeader
        title="Agenda"
        subtitle="Esdeveniments corporatius, reunions destacades i jornades obertes."
        actions={<ABtn variant="primary" icon={Plus} onClick={newEvent}>Nou esdeveniment</ABtn>}
      />
      <AdminToolbar>
        <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca esdeveniments, lloc, tipus…" />
        <div style={{ width: 1, height: 22, background: T.border }} />
        <AdminFilterPills value="all" onChange={() => {}} options={[
          { id: 'all', label: 'Tots', count: counts.all },
        ]} />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={filtered} selectedId={selectedId} onRowClick={(id) => setSelectedId(id as number)} emptyMessage="Cap esdeveniment." />}
        right={selected ? (
          <AdminDetail
            badge="ESDEVENIMENT" title={selected.title}
            onClose={() => setSelectedId(null)}
            footer={
              <>
                <ABtn variant="danger" size="sm" onClick={remove}>Elimina</ABtn>
                <ABtn variant="ghost" onClick={() => setSelectedId(null)}>Tanca</ABtn>
                <ABtn variant="primary" icon={Check} onClick={save} disabled={!dirty || saving}>{saving ? 'Desant…' : 'Desa'}</ABtn>
              </>
            }
          >
            <AField label="Títol"><AInput value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></AField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Dia"><AInput type="number" value={draft.day ?? 0} onChange={e => setDraft(d => ({ ...d, day: +e.target.value }))} /></AField>
              <AField label="Mes"><AInput type="number" value={draft.month ?? 0} onChange={e => setDraft(d => ({ ...d, month: +e.target.value }))} /></AField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Hora inici"><AInput type="time" value={draft.time ?? ''} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} /></AField>
              <AField label="Hora final"><AInput type="time" value={draft.time_end ?? ''} onChange={e => setDraft(d => ({ ...d, time_end: e.target.value }))} /></AField>
            </div>
            <AField label="Ubicació"><AInput value={draft.location ?? ''} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} icon={MapPin} /></AField>
            <AField label="Tipus">
              <ASelect value={draft.type ?? ''} onChange={e => setDraft(d => ({ ...d, type: e.target.value }))}
                options={['Sessió interna', 'Visita comercial', 'Fira', 'Festiu', 'Activitat empresa']} />
            </AField>
            <AField label="Departaments destinataris" hint="Si no en selecciones cap, l'esdeveniment és visible per a tothom.">
              <AChipMulti
                value={draft.target_departments ?? []}
                onChange={(v) => setDraft(d => ({ ...d, target_departments: v }))}
                options={DEPT_OPTIONS.map(d => ({ value: d, label: d }))}
              />
            </AField>
          </AdminDetail>
        ) : (
          <AdminDetailEmpty icon={Calendar} label="Selecciona un esdeveniment" hint="Tria una fila per editar dates, ubicació i audiència." />
        )}
      />
      <CreateAgendaModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreatedEvent} />
      {confirmNode}
    </>
  );
}

// ── Module: AdminAvisos ─────────────────────────────────────────────────────

const NOTICE_KIND_OPTIONS = ['warning', 'danger', 'neutral'];

function AdminAvisos({ notices, refresh, intent, onConsumeIntent }: { notices: Notice[]; refresh: () => void; intent?: 'new' | null; onConsumeIntent?: () => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draft, setDraft] = useState<Partial<Notice>>({});
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  const selected = notices.find(n => n.id === selectedId) || null;
  useEffect(() => {
    setDraft(selected ? { ...selected } : {});
  }, [selected?.id]);

  const dirty = !!selected && (
    draft.title !== selected.title ||
    draft.content !== selected.content ||
    draft.link !== selected.link ||
    draft.link_text !== selected.link_text ||
    draft.active !== selected.active ||
    draft.kind !== selected.kind
  );

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiUpdateNotice(selected.id, {
        title: draft.title ?? '', content: draft.content ?? '',
        link: draft.link ?? '', link_text: draft.link_text ?? '',
        active: draft.active ?? 1, kind: (draft.kind ?? 'warning') as string,
      });
      refresh();
    } catch (e: any) { alert(e?.message ?? 'Error desant'); }
    finally { setSaving(false); }
  };

  const [createOpen, setCreateOpen] = useState(false);
  const newNotice = () => setCreateOpen(true);
  const onCreatedNotice = (created: Notice) => {
    setCreateOpen(false);
    refresh();
    setSelectedId(created.id);
  };

  useEffect(() => {
    if (intent === 'new') {
      onConsumeIntent?.();
      setCreateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const remove = async () => {
    if (!selected) return;
    const ok = await confirm(`Vols eliminar l'avís "${selected.title}"? Aquesta acció no es pot desfer.`);
    if (!ok) return;
    try { await apiDeleteNotice(selected.id); setSelectedId(null); refresh(); }
    catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const filtered = useMemo(() => notices.filter(n => {
    if (statusFilter === 'active' && !n.active) return false;
    if (statusFilter === 'inactive' && n.active) return false;
    if (q && !(n.title + n.content + (n.kind || '')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [notices, q, statusFilter]);

  const counts = {
    all: notices.length,
    active: notices.filter(n => n.active).length,
    inactive: notices.filter(n => !n.active).length,
  };

  const columns: Column<Notice>[] = [
    {
      key: 'title', label: 'Avís', width: 'minmax(0, 2.5fr)',
      render: (n) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 4, height: 32, borderRadius: 2, flexShrink: 0,
            background: n.kind === 'danger' ? '#c43d3d' : n.kind === 'neutral' ? T.textFaint : '#b6833a',
          }} />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.content || '—'}</div>
          </div>
        </div>
      ),
    },
    { key: 'kind', label: 'Tipus', width: '110px', render: (n) => <span style={{ color: T.textMuted, fontSize: 12, textTransform: 'capitalize' }}>{n.kind}</span> },
    { key: 'active', label: 'Estat', width: '110px', render: (n) => <AStatusPill status={n.active ? 'active' : 'inactive'} /> },
  ];

  return (
    <>
      <AdminHeader
        title="Avisos"
        subtitle="Banners destacats al portal: comunicats urgents, manteniments, novetats."
        actions={<ABtn variant="primary" icon={Plus} onClick={newNotice}>Nou avís</ABtn>}
      />
      <AdminToolbar>
        <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca avisos…" />
        <div style={{ width: 1, height: 22, background: T.border }} />
        <AdminFilterPills value={statusFilter} onChange={setStatusFilter} options={[
          { id: 'all', label: 'Tots', count: counts.all },
          { id: 'active', label: 'Actius', count: counts.active },
          { id: 'inactive', label: 'Inactius', count: counts.inactive },
        ]} />
      </AdminToolbar>
      <AdminTwoPane
        left={<AdminTable columns={columns} rows={filtered} selectedId={selectedId} onRowClick={(id) => setSelectedId(id as number)} emptyMessage="Cap avís." />}
        right={selected ? (
          <AdminDetail
            badge="AVÍS" title={selected.title}
            onClose={() => setSelectedId(null)}
            footer={
              <>
                <ABtn variant="danger" size="sm" onClick={remove}>Elimina</ABtn>
                <ABtn variant="ghost" onClick={() => setSelectedId(null)}>Tanca</ABtn>
                <ABtn variant="primary" icon={Check} onClick={save} disabled={!dirty || saving}>{saving ? 'Desant…' : 'Desa'}</ABtn>
              </>
            }
          >
            <AField label="Títol"><AInput value={draft.title ?? ''} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} /></AField>
            <AField label="Contingut"><ATextarea rows={3} value={draft.content ?? ''} onChange={(e) => setDraft(d => ({ ...d, content: e.target.value }))} /></AField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Enllaç (opcional)"><AInput value={draft.link ?? ''} onChange={(e) => setDraft(d => ({ ...d, link: e.target.value }))} placeholder="https://…" /></AField>
              <AField label="Text de l'enllaç"><AInput value={draft.link_text ?? ''} onChange={(e) => setDraft(d => ({ ...d, link_text: e.target.value }))} placeholder="Llegir més" /></AField>
            </div>
            <AField label="Tipus" hint="Determina el color del banner al portal.">
              <ASelect value={draft.kind ?? 'warning'} onChange={(e) => setDraft(d => ({ ...d, kind: e.target.value as Notice['kind'] }))} options={NOTICE_KIND_OPTIONS} />
            </AField>
            <AToggle
              value={!!draft.active}
              onChange={(v) => setDraft(d => ({ ...d, active: v ? 1 : 0 }))}
              label="Actiu (visible al portal)"
              hint="Quan està desactivat, l'avís queda arxivat però no es mostra."
            />
          </AdminDetail>
        ) : (
          <AdminDetailEmpty icon={Bell} label="Selecciona un avís" hint="Tria una fila per editar el contingut o desactivar-lo." />
        )}
      />
      <CreateNoticeModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreatedNotice} />
      {confirmNode}
    </>
  );
}

// ── Top-level switcher ──────────────────────────────────────────────────────

export type AdminView = 'dashboard' | 'users' | 'news' | 'activities' | 'campus' | 'agenda' | 'avisos';
export type AdminIntent = 'new' | null;

export function AdminBackoffice({ view, currentUser, onNavigate, onImpersonate, intent, onConsumeIntent }: {
  view: AdminView;
  currentUser: User | null;
  onNavigate: (tab: string, intent?: 'new') => void;
  onImpersonate?: (id: number, name: string) => void;
  intent?: AdminIntent;
  onConsumeIntent?: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [agenda, setAgenda] = useState<AgendaEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      apiAdminListUsers().catch(() => [] as User[]),
      apiGetNews().catch(() => [] as NewsArticle[]),
      apiGetActivities().catch(() => [] as Activity[]),
      apiGetAgendaEvents().catch(() => [] as AgendaEvent[]),
      apiGetCourses().catch(() => [] as Course[]),
      apiGetQuizzes().catch(() => [] as Quiz[]),
      apiGetAllNotices().catch(() => [] as Notice[]),
    ]).then(([u, n, a, ag, c, qz, no]) => {
      setUsers(u); setNews(n); setActivities(a); setAgenda(ag); setCourses(c); setQuizzes(qz); setNotices(no);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const refresh = () => loadAll();

  const externals = courses.filter(c => c.is_external);
  const counts = {
    users: users.length,
    news: news.length,
    activities: activities.length,
    formations: quizzes.length + externals.length,
    agenda: agenda.length,
    avisos: notices.length,
  };

  return (
    <AdminFont>
      {loading && view !== 'dashboard' && (
        <div style={{ padding: 60, textAlign: 'center', color: T.textFaint, fontSize: 13 }}>Carregant…</div>
      )}
      {!loading && view === 'dashboard'   && <AdminDashboard  currentUser={currentUser} onNavigate={onNavigate} counts={counts} />}
      {!loading && view === 'users'       && <AdminUsers      users={users}     refresh={refresh} currentUser={currentUser} onImpersonate={onImpersonate} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'news'        && <AdminNews       news={news}       refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'activities'  && <AdminActivities activities={activities} refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'campus'      && <AdminCampus     quizzes={quizzes} externals={externals} refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'agenda'      && <AdminAgenda     events={agenda}   refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'avisos'      && <AdminAvisos     notices={notices} refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
    </AdminFont>
  );
}
