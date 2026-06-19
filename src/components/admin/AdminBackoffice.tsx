import React, { useState, useMemo, useEffect, useRef, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Check, Mail, MapPin, Clock, Users, Calendar, Newspaper,
  GraduationCap, Activity as ActivityIcon, ArrowRight, Settings,
  LogOut, Image as ImageIcon, Globe, FileText, Bell, UserCheck, UserX, LayoutGrid, Search, ExternalLink,
} from 'lucide-react';
import {
  User, Activity, AgendaEvent, NewsArticle, Course, Quiz, Notice,
  apiAdminListUsers, apiAdminUpdateUser, apiAdminCreateUser, apiAdminDeleteUser,
  apiGetNews, apiCreateNews, apiUpdateNews, apiDeleteNews,
  apiGetActivities, apiCreateActivity, apiUpdateActivity, apiDeleteActivity,
  apiGetAgendaEvents, apiCreateAgendaEvent, apiUpdateAgendaEvent, apiDeleteAgendaEvent,
  apiGetAllNotices, apiCreateNotice, apiUpdateNotice, apiDeleteNotice,
  apiGetCourses, apiGetQuizzes, apiGetQuiz, apiUpdateQuiz, apiCreateExternalCourse, apiUpdateExternalCourse, apiDeleteExternalCourse, apiDeleteQuiz, apiSetQuizMandatory, apiUploadImage,
  apiSetUserActive,
  ExternalCoursePayload, API_BASE,
  Certificate, apiGetCertificates, apiReviewCertificate, openCertificateFile,
  FormationUserProgress, apiGetCourseUsers, apiGetQuizUsers,
  ActivityEnrollment, apiGetActivityEnrollments,
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
import { tabPrefetch, tabPrefetchAt } from '../../lib/tabPrefetch';
import { DatePicker } from '../shared/AgendaPickers';
import { ImageGalleryPicker } from './ImageGalleryPicker';
import { CreateUserModal } from './CreateUserModal';
import { CreateNewsModal } from './CreateNewsModal';
import { CreateActivityModal } from './CreateActivityModal';
import { CreateAgendaModal } from './CreateAgendaModal';
import { CreateNoticeModal } from './CreateNoticeModal';
import { CreateExternalCourseModal } from './CreateExternalCourseModal';
import { CreateFormacioModal } from './CreateFormacioModal';
import { DeptSearch } from './DeptSearch';
import { useConfirm } from '../ConfirmDialog';
import { ImageCropModal } from '../shared/ImageCropModal';

// Primitives + tokens imported from ./primitives. Modules below compose them.

// ── Toast helper (replaces browser alert() in all admin sub-modules) ─────────

type AdminToastState = { msg: string; kind: 'error' | 'ok' } | null;

function useAdminToast(): [AdminToastState, (msg: string) => void, (msg: string) => void] {
  const [toast, setToast] = useState<AdminToastState>(null);
  const showErr = (msg: string) => { setToast({ msg, kind: 'error' }); setTimeout(() => setToast(null), 4000); };
  const showOk  = (msg: string) => { setToast({ msg, kind: 'ok'    }); setTimeout(() => setToast(null), 2500); };
  return [toast, showErr, showOk];
}

function AdminToast({ toast }: { toast: AdminToastState }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, padding: '10px 20px', borderRadius: 10,
      background: toast.kind === 'error' ? '#dc2626' : '#16a34a',
      color: '#fff', fontSize: 13, fontWeight: 500,
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      animation: 'tavil-slide-up 280ms var(--ease-spring-soft) both',
      pointerEvents: 'none',
    }}>
      {toast.msg}
    </div>
  );
}

// ── Module: AdminDashboard ──────────────────────────────────────────────────

// Per-role visibility for admin modules. Keep aligned with sidebar gating in App.tsx.
function modulesForRole(role?: string, roles?: string[]): Set<string> {
  const all = new Set([role ?? '', ...(roles ?? [])]);
  const hr = (...r: string[]) => r.some(x => all.has(x));
  if (hr('Administrador', 'Administrador/a'))
    return new Set(['admin-users', 'admin-news', 'admin-avisos', 'admin-activities', 'admin-campus', 'admin-agenda']);
  if (hr('Recursos humans'))
    return new Set(['admin-news', 'admin-avisos', 'admin-activities', 'admin-campus', 'admin-agenda']);
  if (hr('SolicitudsVacances', 'SolicitudsDissabtes'))
    return new Set(); // Solicituds approvers work from the main SolicitudsTab, not the backoffice
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
  const { t } = useTranslation();
  const firstName = currentUser?.name?.split(' ')[0] ?? 'admin';
  const allowed = modulesForRole(currentUser?.role, currentUser?.roles);

  // Hero defaults to "Nova notícia"; falls back to first allowed module if Notícies not permitted.
  const heroCandidates = [
    { id: 'new-news',      label: t('adminDash.actions.news.label'),     sub: t('adminDash.actions.news.heroSub'),     icon: Newspaper,     target: 'admin-news' },
    { id: 'new-formation', label: t('adminDash.actions.formation.label'),    sub: t('adminDash.actions.formation.heroSub'),                  icon: GraduationCap, target: 'admin-campus' },
    { id: 'new-activity',  label: t('adminDash.actions.activity.label'),   sub: t('adminDash.actions.activity.heroSub'),         icon: ActivityIcon,  target: 'admin-activities' },
    { id: 'new-agenda',    label: t('adminDash.actions.agenda.label'), sub: t('adminDash.actions.agenda.heroSub'),                                       icon: Calendar,      target: 'admin-agenda' },
  ];
  const heroAction = heroCandidates.find(h => allowed.has(h.target)) ?? heroCandidates[0];

  const allQuickActions = [
    { id: 'new-user',     label: t('adminDash.actions.user.label'),      sub: t('adminDash.actions.user.sub'), icon: Users,          target: 'admin-users' },
    { id: 'new-news',     label: t('adminDash.actions.news.label'),    sub: t('adminDash.actions.news.sub'),     icon: Newspaper,      target: 'admin-news' },
    { id: 'new-notice',   label: t('adminDash.actions.notice.label'),        sub: t('adminDash.actions.notice.sub'),         icon: Bell,           target: 'admin-avisos' },
    { id: 'new-activity', label: t('adminDash.actions.activity.label'),  sub: t('adminDash.actions.activity.sub'), icon: ActivityIcon,   target: 'admin-activities' },
    { id: 'new-formation',label: t('adminDash.actions.formation.label'),   sub: t('adminDash.actions.formation.sub'),       icon: GraduationCap,  target: 'admin-campus' },
    { id: 'new-agenda',   label: t('adminDash.actions.agenda.label'),sub: t('adminDash.actions.agenda.sub'),      icon: Calendar,       target: 'admin-agenda' },
  ];
  const quickActions = allQuickActions.filter(a => a.target !== heroAction.target && allowed.has(a.target)).slice(0, 4);
  const HeroIcon = heroAction.icon;

  const allModules = [
    { id: 'admin-users',      label: t('adminDash.modules.users.label'),    icon: Users,         n: counts.users,      sub: t('adminDash.modules.users.sub') },
    { id: 'admin-news',       label: t('adminDash.modules.news.label'),   icon: Newspaper,     n: counts.news,       sub: t('adminDash.modules.news.sub') },
    { id: 'admin-avisos',     label: t('adminDash.modules.avisos.label'),     icon: Bell,          n: counts.avisos,     sub: t('adminDash.modules.avisos.sub') },
    { id: 'admin-activities', label: t('adminDash.modules.connect.label'), icon: ActivityIcon,  n: counts.activities, sub: t('adminDash.modules.connect.sub') },
    { id: 'admin-campus',     label: t('adminDash.modules.formations.label'), icon: GraduationCap, n: counts.formations, sub: t('adminDash.modules.formations.sub') },
    { id: 'admin-agenda',     label: t('adminDash.modules.agenda.label'),     icon: Calendar,      n: counts.agenda,     sub: t('adminDash.modules.agenda.sub') },
  ];
  const modules = allModules.filter(m => allowed.has(m.id));

  const labelStyle: CSSProperties = {
    fontSize: 10.5, fontWeight: 600, color: T.accent,
    textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
  };

  if (allowed.size === 0) {
    return (
      <>
        <AdminHeader
          kicker={t('adminDash.greeting', { name: firstName })}
          title={t('adminDash.solicitudsTitle')}
          subtitle={t('adminDash.solicitudsSubtitle')}
        />
        <div style={{
          border: `1px dashed ${T.border}`, borderRadius: 12,
          padding: '60px 30px', textAlign: 'center',
          fontFamily: F_BODY, color: T.textFaint,
        }}>
          <FileText size={28} style={{ marginBottom: 12, color: T.textMuted }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>{t('adminDash.solicitudsAccess')}</div>
          <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 360, marginInline: 'auto', lineHeight: 1.5 }}>
            {t('adminDash.solicitudsAccessHint')}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        kicker={t('adminDash.greeting', { name: firstName })}
        title={t('adminDash.title')}
        subtitle={t('adminDash.subtitle')}
      />

      <div style={labelStyle}>{t('adminDash.quickActions')}</div>
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
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 18px 36px -16px color-mix(in srgb, var(--tavil-accent) 55%, transparent)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'rgba(255,255,255,0.18)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><HeroIcon size={26} /></div>
          <div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 32, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.01em' }}>{heroAction.label}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8, maxWidth: 380, lineHeight: 1.4 }}>{heroAction.sub}</div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
          }}>{t('adminDash.createArticle')} <ArrowRight size={16} /></div>
        </button>

        {/* 4 small bento cards */}
        {quickActions.map(a => {
          const Icon = a.icon;
          return (
            <button key={a.id} onClick={() => onNavigate(a.target, 'new')} style={{
              padding: 18, background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 12, textAlign: 'left', cursor: 'pointer',
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

      <div style={labelStyle}>{t('adminDash.modulesLabel')}</div>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden',
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
const OFFICE_OPTIONS = ['Alemanya', 'Austràlia', 'Canadà', 'Dinamarca', 'França', 'Holanda', 'Itàlia', 'Lituània', 'Mèxic', 'Polònia', 'Rússia', 'UK', 'USA', 'Sant Jaume de llierca'];
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

function AdminUsers({ users, setUsers, refresh, currentUser, onImpersonate, intent, onConsumeIntent }: {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  refresh: () => void;
  currentUser: User | null;
  onImpersonate?: (id: number, name: string) => void;
  intent?: 'new' | null;
  onConsumeIntent?: () => void;
}) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor' | 'empleat'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [draft, setDraft] = useState<Partial<User>>({});
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();
  const [adminToast, showErr] = useAdminToast();

  const selected = users.find(u => u.id === selectedId) || null;

  useEffect(() => {
    setDraft(selected ? {
      ...selected,
      roles: selected.roles?.length ? selected.roles : ['Treballador/a'],
    } : {});
    setNewPass('');
  }, [selectedId, selected?.id]);

  const filtered = useMemo(() => users.filter(u => {
    const pill = mapServerRoleToPill(u.role, u.roles);
    if (roleFilter !== 'all' && pill !== roleFilter) return false;
    if (statusFilter === 'active' && (u.active === 0 || u.must_change_password)) return false;
    if (statusFilter === 'inactive' && u.active !== 0) return false;
    if (statusFilter === 'pending' && !u.must_change_password) return false;
    if (q && !(u.name + u.email + u.role + u.dept).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [users, q, roleFilter, statusFilter]);

  const counts = {
    all: users.length,
    admin: users.filter(u => mapServerRoleToPill(u.role, u.roles) === 'admin').length,
    editor: users.filter(u => mapServerRoleToPill(u.role, u.roles) === 'editor').length,
    empleat: users.filter(u => mapServerRoleToPill(u.role, u.roles) === 'empleat').length,
    inactive: users.filter(u => u.active === 0).length,
    pending: users.filter(u => u.active !== 0 && u.must_change_password).length,
  };

  const update = (patch: Partial<User>) => setDraft(prev => ({ ...prev, ...patch }));

  const save = async () => {
    if (!selected) return;
    if (newPass && newPass.length < 8) { showErr('La nova contrasenya ha de tenir mínim 8 caràcters.'); return; }
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
      showErr(e?.message ?? 'Error desant');
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
      showErr(e?.message ?? 'Error');
    }
  };

  const toggleActive = async () => {
    if (!selected) return;
    const newActive = selected.active === 0 ? 1 : 0;
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, active: newActive } : u));
    try {
      await apiSetUserActive(selected.id, newActive === 1);
    } catch (e: any) {
      // Rollback
      setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, active: selected.active } : u));
      showErr(e?.message ?? 'Error canviant l\'estat d\'accés');
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
    { key: 'status', label: 'Estat', width: '110px', render: (u) => <AStatusPill status={u.active === 0 ? 'inactive' : u.must_change_password ? 'pending' : 'active'} /> },
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
          { id: 'inactive', label: 'Inactius', count: counts.inactive },
          { id: 'pending', label: 'Pendents', count: counts.pending },
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
                <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 4 }}>Codi {selected.ext || '—'} · {selected.location || '—'}</div>
              </div>
            </div>

            <AField label="Nom complet"><AInput value={draft.name ?? ''} onChange={(e) => update({ name: e.target.value })} /></AField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Correu corporatiu"><AInput value={draft.email ?? ''} onChange={(e) => update({ email: e.target.value })} icon={Mail} /></AField>
              <AField label="Codi treballador"><AInput value={draft.ext ?? ''} onChange={(e) => update({ ext: e.target.value })} /></AField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AField label="Departament">
                <>
                  <input
                    list="admin-dept-list"
                    value={draft.dept ?? ''}
                    onChange={(e) => update({ dept: e.target.value })}
                    placeholder={t('directory.searchDept')}
                    style={{
                      width: '100%', height: 44, padding: '0 14px',
                      background: T.card, color: T.text,
                      border: `1.5px solid ${T.border}`, borderRadius: 8,
                      fontFamily: F_BODY, fontSize: 14.5, outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 140ms',
                    }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.accent; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = T.border; }}
                  />
                  <datalist id="admin-dept-list">
                    {DEPT_OPTIONS.map(d => <option key={d} value={d} />)}
                  </datalist>
                </>
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
                {selected.active === 0 ? (
                  <ABtn variant="secondary" size="sm" icon={UserCheck} onClick={toggleActive}>Activa l'accés</ABtn>
                ) : (
                  <ABtn variant="ghost" size="sm" icon={UserX} onClick={toggleActive}>Desactiva l'accés</ABtn>
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
      <AdminToast toast={adminToast} />
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
  const [activeDraft, setActiveDraft] = useState(1);
  const [langDraft, setLangDraft] = useState<LangDraft>(emptyLangDraft());
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();
  const [adminToast, showErr] = useAdminToast();

  const selected = news.find(n => n.id === selectedId) || null;

  useEffect(() => {
    setCoverDraft(selected?.image ?? '');
    setCategory(selected?.category ?? '');
    setDate(selected?.date ?? '');
    setFeaturedDraft(selected?.featured ?? 0);
    setActiveDraft(selected ? (selected.active !== 0 ? 1 : 0) : 1);
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
    activeDraft !== (selected.active !== 0 ? 1 : 0) ||
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
      active: activeDraft,
      translations,
    };
  };

  const saveMetadata = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiUpdateNews(selected.id, buildPayload());
      refresh();
    } catch (e: any) { showErr(e?.message ?? 'Error desant'); }
    finally { setSaving(false); }
  };

  const saveCover = async (url: string) => {
    if (!selected) return;
    try {
      await apiUpdateNews(selected.id, buildPayload({ image: url }));
      setCoverDraft(url);
      refresh();
    } catch (e: any) { showErr(e?.message ?? 'Error desant portada'); }
  };
  const newsStatus = (n: NewsArticle) => !n.active ? 'draft' : n.featured ? 'featured' : 'activa';
  const filtered = useMemo(() => news.filter(n => {
    if (statusFilter !== 'all' && newsStatus(n) !== statusFilter) return false;
    if (q && !(n.title + n.category).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [news, q, statusFilter]);

  const counts = {
    all: news.length,
    featured: news.filter(n => n.active && n.featured).length,
    activa: news.filter(n => n.active && !n.featured).length,
    draft: news.filter(n => !n.active).length,
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
    catch (e: any) { showErr(e?.message ?? 'Error'); }
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
    { key: 'status', label: 'Estat', width: '110px', render: (n) => <AStatusPill status={newsStatus(n)} /> },
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
          { id: 'activa', label: 'Activa', count: counts.activa },
          { id: 'featured', label: 'Destacada', count: counts.featured },
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
                maxLength={250}
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
                <DatePicker value={date.slice(0, 10)} onChange={setDate} />
              </AField>
            </div>
            <AToggle
              value={!!activeDraft}
              onChange={v => setActiveDraft(v ? 1 : 0)}
              label="Activa"
              hint="Si està activada, l'article és visible a la pàgina de notícies."
            />
            <AToggle
              value={!!featuredDraft}
              onChange={v => setFeaturedDraft(v ? 1 : 0)}
              label="Destacada"
              hint="Si està activada, apareix al carrusel de portada. Requereix que l'article estigui actiu."
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
      <AdminToast toast={adminToast} />
    </>
  );
}

// ── Sub-component: AdminActivityEnrollments ─────────────────────────────────

const ACT_CAT_COLORS: Record<string, { bar: string; bg: string }> = {
  'Esport':   { bar: '#16a34a', bg: 'rgba(34,197,94,0.10)' },
  'Cultura':  { bar: '#7c3aed', bg: 'rgba(139,92,246,0.10)' },
  'Social':   { bar: '#2563eb', bg: 'rgba(59,130,246,0.10)' },
  'RSC':      { bar: '#d97706', bg: 'rgba(245,158,11,0.10)' },
  'Benestar': { bar: '#0f766e', bg: 'rgba(20,184,166,0.10)' },
};

function AdminActivityEnrollments({ activities }: { activities: Activity[] }) {
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<ActivityEnrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() =>
    activities.filter(a => !q || a.title.toLowerCase().includes(q.toLowerCase()) || a.category.toLowerCase().includes(q.toLowerCase())),
    [activities, q]
  );

  const selected = activities.find(a => a.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId) return;
    setEnrollments([]);
    setLoading(true);
    apiGetActivityEnrollments(selectedId)
      .then(rows => setEnrollments(rows.filter(e => e.status === 'confirmed')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <AdminTwoPane
      ratio="1fr 1fr"
      left={
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, background: T.bgAlt }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Cerca activitats…"
                style={{ width: '100%', height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, paddingLeft: 32, paddingRight: 12, fontSize: 13, color: T.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          </div>
          {/* Activity cards */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: T.textFaint }}>Cap activitat.</div>
            )}
            {filtered.map((a, i) => {
              const enr = a.enrolled || 0;
              const cap = a.capacity || 0;
              const pct = cap > 0 ? Math.min((enr / cap) * 100, 100) : 0;
              const cat = ACT_CAT_COLORS[a.category] ?? { bar: T.accent, bg: 'rgba(191,33,30,0.08)' };
              const isActive = a.id === selectedId;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id === selectedId ? null : a.id)}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = T.bgAlt; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', padding: 0,
                    borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'stretch',
                    background: isActive ? T.accentLight : 'transparent',
                    transition: 'background 120ms',
                  }}
                >
                  {/* Category color strip */}
                  <div style={{ width: 4, flexShrink: 0, background: cat.bar, opacity: isActive ? 1 : 0.35, transition: 'opacity 120ms' }} />
                  <div style={{ flex: 1, padding: '13px 14px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: isActive ? T.accent : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 120ms' }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
                          {a.date}{a.category ? ` · ${a.category}` : ''}{a.location ? ` · ${a.location}` : ''}
                        </div>
                      </div>
                      <span style={{
                        flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: enr > 0 ? 'rgba(34,197,94,0.12)' : T.bgAlt,
                        color: enr > 0 ? '#15803d' : T.textMuted,
                        border: `1px solid ${enr > 0 ? 'rgba(34,197,94,0.25)' : T.border}`,
                        marginTop: 1,
                      }}>
                        {enr}{cap > 0 ? `/${cap}` : ' inscrits'}
                      </span>
                    </div>
                    {cap > 0 && (
                      <div style={{ marginTop: 9, height: 3, borderRadius: 2, background: T.border, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#f59e0b' : cat.bar, borderRadius: 2, transition: 'width 400ms ease' }} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      }
      right={selected ? (
        <AdminDetail
          badge="INSCRIPCIONS"
          title={selected.title}
          onClose={() => setSelectedId(null)}
        >
          {/* Stat summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: T.bgAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: F_DISPLAY, color: T.text, lineHeight: 1 }}>{enrollments.length}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>inscrits</div>
            </div>
            {selected.capacity > 0 && (
              <>
                <div style={{ width: 1, height: 36, background: T.border }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted, marginBottom: 5 }}>
                    <span>Aforament</span>
                    <span style={{ fontWeight: 600, color: T.text }}>{selected.enrolled}/{selected.capacity}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: T.accent, width: `${Math.min((selected.enrolled / selected.capacity) * 100, 100)}%`, borderRadius: 3, transition: 'width 400ms ease' }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: T.textFaint, marginTop: 4 }}>
                    {Math.max(0, selected.capacity - selected.enrolled)} places lliures
                  </div>
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: T.textMuted, padding: '20px 0', textAlign: 'center' }}>Carregant…</div>
          ) : enrollments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0', gap: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} style={{ color: T.textFaint }} />
              </div>
              <span style={{ fontSize: 13, color: T.textMuted }}>Ningú inscrit encara.</span>
            </div>
          ) : (
            <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {enrollments.map((e, i) => {
                const initials = e.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('');
                return (
                  <div key={e.enrollment_id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                    borderBottom: i < enrollments.length - 1 ? `1px solid ${T.border}` : 'none',
                    background: T.card,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                      background: T.accentLight, color: T.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                      <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.dept}{e.dept && e.email ? ' · ' : ''}<span style={{ color: T.textFaint }}>{e.email}</span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, fontSize: 11, color: T.textFaint }}>
                      {new Date(e.enrolled_at).toLocaleDateString('ca-ES')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminDetail>
      ) : (
        <AdminDetailEmpty icon={Users} label="Selecciona una activitat" hint="Tria una activitat per veure les inscripcions." />
      )}
    />
  );
}

// ── Module: AdminActivities ─────────────────────────────────────────────────

function AdminActivities({ activities, refresh, intent, onConsumeIntent }: { activities: Activity[]; refresh: () => void; intent?: 'new' | null; onConsumeIntent?: () => void }) {
  const [actTab, setActTab] = useState<'activitats' | 'inscripcions'>('activitats');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draft, setDraft] = useState<Partial<Activity>>({});
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();
  const [adminToast, showErr] = useAdminToast();
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imgCropFile, setImgCropFile] = useState<File | null>(null);

  const selected = activities.find(a => a.id === selectedId) || null;
  useEffect(() => {
    setDraft(selected ? {
      title: selected.title, description: selected.description, date: selected.date,
      time: selected.time, location: selected.location, category: selected.category,
      capacity: selected.capacity, link: selected.link ?? '', image: selected.image ?? '',
      image_crop: selected.image_crop ?? '',
    } : {});
    setImgCropFile(null);
  }, [selected?.id]);

  const dirty = !!selected && (
    draft.title !== selected.title ||
    draft.description !== selected.description ||
    draft.date !== selected.date ||
    draft.time !== selected.time ||
    draft.location !== selected.location ||
    draft.category !== selected.category ||
    draft.capacity !== selected.capacity ||
    (draft.link ?? '') !== (selected.link ?? '') ||
    (draft.image ?? '') !== (selected.image ?? '') ||
    (draft.image_crop ?? '') !== (selected.image_crop ?? '')
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
        category: draft.category ?? selected.category,
        capacity: draft.capacity ?? selected.capacity,
        link: (draft.link !== undefined ? draft.link : selected.link) ?? '',
        image: draft.image !== undefined ? draft.image : (selected.image ?? ''),
        image_crop: draft.image_crop !== undefined ? draft.image_crop : (selected.image_crop ?? ''),
      });
      refresh();
    } catch (e: any) { showErr(e?.message ?? 'Error desant'); }
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
    catch (e: any) { showErr(e?.message ?? 'Error'); }
  };

  const columns: Column<Activity>[] = [
    {
      key: 'title', label: 'Activitat', width: 'minmax(0, 2.5fr)',
      render: (a) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 44, height: 32, borderRadius: 5, flexShrink: 0,
            background: T.bgAlt, color: T.textMuted,
            border: `1px solid ${T.border}`,
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
              <div style={{ height: '100%', width: pct + '%', background: pct >= 100 ? 'var(--status-warn-fg)' : T.accent }} />
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
      <div style={{ display: 'flex', gap: 8, padding: '0 0 16px' }}>
        <ABtn variant={actTab === 'activitats' ? 'primary' : 'ghost'} onClick={() => { setActTab('activitats'); setSelectedId(null); }}>Connect</ABtn>
        <ABtn variant={actTab === 'inscripcions' ? 'primary' : 'ghost'} onClick={() => { setActTab('inscripcions'); setSelectedId(null); }}>Inscripcions</ABtn>
      </div>

      {actTab === 'activitats' && (
        <>
          <AdminHeader
            title="Connect"
            subtitle="Esdeveniments interns amb inscripció: cultura, esport, formació, jornades."
            actions={<ABtn variant="primary" icon={Plus} onClick={newActivity}>Nova activitat</ABtn>}
          />
          <AdminToolbar>
            <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca activitats, categoria, lloc…" />
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
                <AField label="Imatge de portada">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setImgCropFile(f); setCropSrc(URL.createObjectURL(f));
                      if (imgInputRef.current) imgInputRef.current.value = '';
                    }} />
                    {(draft.image ?? selected?.image) ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={resolveUploadUrl(draft.image ?? selected?.image ?? '')}
                          alt=""
                          style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', borderRadius: 8, display: 'block' }}
                        />
                        <button onClick={() => imgInputRef.current?.click()} style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.58)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Canviar</button>
                        <button onClick={async () => { const r = await fetch(resolveUploadUrl(draft.image ?? selected?.image ?? '')); const b = await r.blob(); setImgCropFile(null); setCropSrc(URL.createObjectURL(b)); }} style={{ position: 'absolute', bottom: 6, left: 80, background: 'rgba(0,0,0,0.58)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Enquadrar</button>
                        <button onClick={() => setDraft(d => ({ ...d, image: '', image_crop: '' }))} style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.58)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Treure</button>
                      </div>
                    ) : (
                      <button onClick={() => imgInputRef.current?.click()} disabled={imgUploading} style={{ padding: '14px 0', width: '100%', border: `1.5px dashed ${T.border}`, borderRadius: 8, background: 'transparent', color: T.textFaint, fontSize: 12, cursor: imgUploading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                        {imgUploading ? 'Pujant…' : '+ Afegir imatge de portada'}
                      </button>
                    )}
                  </div>
                </AField>
                <AField label="Títol"><AInput value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /></AField>
                <AField label="Descripció"><ATextarea rows={4} maxLength={400} value={draft.description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /></AField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <AField label="Data"><DatePicker value={(draft.date ?? '').slice(0, 10)} onChange={(v) => setDraft(d => ({ ...d, date: v }))} /></AField>
                  <AField label="Hora"><AInput type="time" value={draft.time ?? ''} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} icon={Clock} /></AField>
                </div>
                <AField label="Categoria"><AInput value={draft.category ?? ''} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} /></AField>
                <AField label="Ubicació"><AInput value={draft.location ?? ''} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} icon={MapPin} /></AField>
                <AField label="Aforament">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button" onClick={() => setDraft(d => ({ ...d, capacity: d.capacity === 0 ? 20 : 0 }))} title={(draft.capacity ?? 0) === 0 ? 'Il·limitat' : 'Limitat'} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 8, border: '1.5px solid', borderColor: (draft.capacity ?? 0) === 0 ? 'var(--tavil-accent)' : 'var(--tavil-border)', background: (draft.capacity ?? 0) === 0 ? 'var(--tavil-accent-light)' : 'var(--tavil-card)', color: (draft.capacity ?? 0) === 0 ? 'var(--tavil-accent)' : 'var(--tavil-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 140ms', fontSize: 18 }}>∞</button>
                    {(draft.capacity ?? 0) !== 0
                      ? <AInput type="number" value={draft.capacity ?? 0} onChange={e => setDraft(d => ({ ...d, capacity: +e.target.value }))} />
                      : <span style={{ fontSize: 13, color: 'var(--tavil-accent)', fontWeight: 500 }}>Il·limitat</span>}
                  </div>
                </AField>
                <AField label="Enllaç extern" optional><AInput value={draft.link ?? ''} onChange={e => setDraft(d => ({ ...d, link: e.target.value }))} placeholder="https://…" /></AField>
                {draft.link && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: T.bgAlt, border: `1px solid ${T.border}` }}>
                    <ExternalLink size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: T.textMuted }}>Inscripcions gestionades per una entitat externa</span>
                  </div>
                )}
              </AdminDetail>
            ) : (
              <AdminDetailEmpty icon={ActivityIcon} label="Selecciona una activitat" hint="Tria una fila per gestionar dates, aforament i inscripció." />
            )}
          />
        </>
      )}

      {actTab === 'inscripcions' && (
        <>
          <AdminHeader
            title="Inscripcions"
            subtitle="Persones inscrites a les activitats Connect."
          />
          <AdminActivityEnrollments activities={activities} />
        </>
      )}

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          initialCrop={imgCropFile ? undefined : (() => { try { const j = draft.image_crop ?? selected?.image_crop; return j ? JSON.parse(j) : undefined; } catch { return undefined; } })()}
          onConfirm={async params => {
            setCropSrc(null);
            if (imgCropFile) {
              setImgUploading(true);
              try {
                const url = await apiUploadImage(imgCropFile);
                setDraft(d => ({ ...d, image: url, image_crop: JSON.stringify(params) }));
              } catch (e: any) { showErr(e?.message ?? 'Error pujant imatge'); }
              finally { setImgUploading(false); setImgCropFile(null); }
            } else {
              setDraft(d => ({ ...d, image_crop: JSON.stringify(params) }));
            }
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}
      <CreateActivityModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreatedActivity} />
      {confirmNode}
      <AdminToast toast={adminToast} />
    </>
  );
}

// ── Module: AdminCertificats ─────────────────────────────────────────────────

function AdminCertificats() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [adminToast, showErr] = useAdminToast();

  useEffect(() => {
    setLoading(true);
    apiGetCertificates()
      .then(setCerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async (id: number, action: 'approve' | 'reject') => {
    setReviewing(id);
    try {
      await apiReviewCertificate(id, action);
      setCerts(prev => prev.map(c =>
        c.id === id ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c
      ));
    } catch (e: any) {
      showErr(e?.message ?? 'Error');
    } finally {
      setReviewing(null);
    }
  };

  const handleViewFile = async (id: number) => {
    try { await openCertificateFile(id); }
    catch (e: any) { showErr(e?.message ?? 'Error obrint el fitxer'); }
  };

  const filtered = statusFilter === 'all' ? certs : certs.filter(c => c.status === statusFilter);
  const counts = {
    pending:  certs.filter(c => c.status === 'pending').length,
    approved: certs.filter(c => c.status === 'approved').length,
    rejected: certs.filter(c => c.status === 'rejected').length,
  };

  const columns: Column<Certificate>[] = [
    {
      key: 'user_name' as any, label: 'Usuari', width: 'minmax(0,1.5fr)',
      render: r => (
        <span style={{ fontWeight: 600 }}>
          {r.user_name}
          <span style={{ fontWeight: 400, color: T.textMuted, marginLeft: 6, fontSize: 11 }}>{r.user_dept}</span>
        </span>
      ),
    },
    { key: 'course_title' as any, label: 'Curs',  width: 'minmax(0,2fr)', render: r => r.course_title },
    { key: 'uploaded_at' as any,  label: 'Pujat', width: '110px',         render: r => new Date(r.uploaded_at).toLocaleDateString('ca-ES') },
    { key: 'status' as any,       label: 'Estat', width: '120px',         render: r => <AStatusPill status={r.status} /> },
    {
      key: 'actions' as any, label: '', width: '180px',
      render: r => (
        <div style={{ display: 'flex', gap: 6 }}>
          <ABtn size="sm" variant="ghost" onClick={() => handleViewFile(r.id)}>Veure</ABtn>
          {r.status === 'pending' && <>
            <ABtn size="sm" variant="primary"   disabled={reviewing === r.id} onClick={() => handleReview(r.id, 'approve')}>✓</ABtn>
            <ABtn size="sm" variant="secondary" disabled={reviewing === r.id} onClick={() => handleReview(r.id, 'reject')}>✗</ABtn>
          </>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminToolbar>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => {
            const label = s === 'all' ? 'Tots' : s === 'pending' ? 'Pendents' : s === 'approved' ? 'Aprovats' : 'Rebutjats';
            const count = s !== 'all' ? counts[s] : undefined;
            return (
              <ABtn key={s} size="sm" variant={statusFilter === s ? 'primary' : 'ghost'} onClick={() => setStatusFilter(s)}>
                {label}{count !== undefined && count > 0 && <span style={{ marginLeft: 5, opacity: 0.7 }}>{count}</span>}
              </ABtn>
            );
          })}
        </div>
      </AdminToolbar>
      {loading
        ? <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontFamily: F_BODY }}>Carregant certificats…</div>
        : <AdminTable columns={columns} rows={filtered} emptyMessage="Cap certificat amb aquests filtres." />
      }
      <AdminToast toast={adminToast} />
    </div>
  );
}

// ── Module: AdminSeguiment (formation tracking) ──────────────────────────────

interface SeguimentRow {
  id: string; // composite key used as AdminTable id
  kind: 'quiz' | 'external';
  refId: number;
  title: string;
  category: string;
  mandatory: number;
  is_presential?: boolean;
}

function AdminSeguiment({ quizzes, externals }: { quizzes: Quiz[]; externals: Course[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [users, setUsers] = useState<FormationUserProgress[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('Tots');
  const [search, setSearch] = useState('');

  const rows: SeguimentRow[] = useMemo(() => [
    ...externals.map(c => ({
      id: `ext-${c.id}`,
      kind: 'external' as const,
      refId: c.id,
      title: c.title,
      category: c.category,
      mandatory: c.mandatory,
    })),
    ...quizzes.map(q => ({
      id: `quiz-${q.id}`,
      kind: 'quiz' as const,
      refId: q.id,
      title: q.title,
      category: q.category,
      mandatory: q.mandatory ?? 0,
      is_presential: q.is_presential === 1,
    })),
  ], [externals, quizzes]);

  const selected = rows.find(r => r.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId || !selected) return;
    setUsersLoading(true);
    setUsers([]);
    setStatusFilter('Tots');
    const req = selected.kind === 'external'
      ? apiGetCourseUsers(selected.refId)
      : apiGetQuizUsers(selected.refId);
    req.then(setUsers).catch(console.error).finally(() => setUsersLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const filteredRows = useMemo(() => rows.filter(r =>
    !search ||
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.category ?? '').toLowerCase().includes(search.toLowerCase())
  ), [rows, search]);

  const counts = useMemo(() => ({
    Completat:    users.filter(u => u.status === 'Completat').length,
    'En curs':    users.filter(u => u.status === 'En curs').length,
    Pendent:      users.filter(u => u.status === 'Pendent').length,
    'No aprovat': users.filter(u => u.status === 'No aprovat').length,
  }), [users]);

  const filteredUsers: (FormationUserProgress & { id: number })[] = useMemo(() =>
    (statusFilter === 'Tots' ? users : users.filter(u => u.status === statusFilter))
      .map(u => ({ ...u })),
  [users, statusFilter]);

  const STATUS_PILL_KEY: Record<string, string> = {
    Completat:    'completat',
    'En curs':    'en-curs',
    Pendent:      'pendent-f',
    'No aprovat': 'no-aprovat',
  };

  const STATUS_FILTER_COLOR: Record<string, string> = {
    Completat:    'var(--status-ok-fg)',
    'En curs':    'var(--status-warn-fg)',
    Pendent:      T.textMuted,
    'No aprovat': 'var(--color-danger)',
  };

  const leftColumns: Column<SeguimentRow>[] = [
    {
      key: 'title' as any,
      label: 'Formació',
      width: 'minmax(0,1fr)',
      render: r => (
        <span style={{ fontWeight: 600 }}>
          {r.title}
          {r.mandatory ? (
            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', borderRadius: 4, padding: '1px 5px' }}>
              Oblig.
            </span>
          ) : null}
          {r.is_presential ? (
            <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: '#065f46', background: '#d1fae5', borderRadius: 4, padding: '1px 5px' }}>
              Presencial
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'kind' as any,
      label: 'Tipus',
      width: '90px',
      render: r => (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: r.kind === 'external' ? '#c7d2fe' : '#fed7aa',
          color:      r.kind === 'external' ? '#3730a3' : '#9a3412',
        }}>
          {r.kind === 'external' ? 'Externa' : 'Interna'}
        </span>
      ),
    },
  ];

  const rightColumns: Column<FormationUserProgress & { id: number }>[] = [
    {
      key: 'name' as any,
      label: 'Usuari',
      width: 'minmax(0,1.5fr)',
      render: r => (
        <span style={{ fontWeight: 600 }}>
          {r.name}
          <span style={{ fontWeight: 400, color: T.textMuted, marginLeft: 6, fontSize: 11 }}>{r.dept}</span>
        </span>
      ),
    },
    {
      key: 'status' as any,
      label: 'Estat',
      width: '130px',
      render: r => <AStatusPill status={STATUS_PILL_KEY[r.status] ?? 'pendent-f'} />,
    },
    {
      key: 'detail' as any,
      label: '',
      width: '70px',
      render: r => {
        if (r.progress != null && r.progress > 0 && r.status !== 'Completat') {
          return <span style={{ fontSize: 11, color: T.textMuted }}>{r.progress}%</span>;
        }
        if (r.score_pct != null && r.status !== 'Pendent') {
          return <span style={{ fontSize: 11, color: T.textMuted }}>{r.score_pct}%</span>;
        }
        return null;
      },
    },
  ];

  return (
    <AdminTwoPane
      left={
        <>
          <AdminToolbar>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cercar formació…"
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 6,
                border: `1px solid ${T.border}`, fontFamily: F_BODY, fontSize: 13,
                background: T.bg, color: T.text, outline: 'none',
              }}
            />
          </AdminToolbar>
          <AdminTable
            columns={leftColumns}
            rows={filteredRows}
            selectedId={selectedId}
            onRowClick={id => setSelectedId(id as string)}
            emptyMessage="Cap formació."
          />
        </>
      }
      right={
        !selected ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: T.textFaint, fontFamily: F_BODY, fontSize: 13,
            textAlign: 'center', padding: '0 24px',
          }}>
            Selecciona una formació per veure el seguiment d'usuaris
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: F_BODY, fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 10 }}>
                {selected.title}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['Tots', 'Completat', 'En curs', 'Pendent', 'No aprovat'] as const).map(s => {
                  const count = s === 'Tots' ? users.length : counts[s as keyof typeof counts];
                  if (s !== 'Tots' && count === 0) return null;
                  const isActive = statusFilter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      style={{
                        padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                        fontFamily: F_BODY, fontSize: 12, fontWeight: 600,
                        background: isActive
                          ? (s === 'Tots' ? T.text : STATUS_FILTER_COLOR[s])
                          : T.bgAlt,
                        color: isActive ? (s === 'Tots' ? T.bg : 'white') : T.textMuted,
                        transition: 'background 150ms, color 150ms',
                      }}
                    >
                      {s} <span style={{ opacity: 0.7 }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {usersLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: T.textMuted, fontFamily: F_BODY }}>
                  Carregant…
                </div>
              ) : (
                <AdminTable
                  columns={rightColumns}
                  rows={filteredUsers}
                  emptyMessage="Cap usuari amb aquest filtre."
                />
              )}
            </div>
          </div>
        )
      }
    />
  );
}

// ── Module: AdminCampus (Formacions) ────────────────────────────────────────

type FormationRow =
  | { kind: 'quiz'; id: number; refId: number; title: string; category: string; hours: string; mandatory: number; is_external: 0; is_presential: number; modality: string; image: string; description: string; questions: number; time_limit: number; passing_score: number; active: number; start_at: string | null; end_at: string | null }
  | { kind: 'external'; id: number; refId: number; title: string; category: string; hours: string; mandatory: number; cert: number; is_external: 1; url: string; description: string; departments: string; target_users: number[]; start_at: string | null; end_at: string | null };

function AdminCampus({ quizzes, externals, refresh, intent, onConsumeIntent }: { quizzes: Quiz[]; externals: Course[]; refresh: () => void; intent?: 'new' | null; onConsumeIntent?: () => void }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'quiz' | 'external' | 'presencial'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [draft, setDraft] = useState<Partial<ExternalCoursePayload & { title: string; description: string; category: string; active: number; start_at: string | null; end_at: string | null; time_limit: number; passing_score: number; target_departments: string[] }>>({});
  const [quizMandatoryOverride, setQuizMandatoryOverride] = useState<Record<number, number>>({});
  const [fullQuiz, setFullQuiz] = useState<Quiz | null>(null);
  const [saving, setSaving] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const { confirm, confirmNode } = useConfirm();
  const [campusTab, setCampusTab] = useState<'formacions' | 'certificats' | 'seguiment'>('formacions');
  const [adminToast, showErr] = useAdminToast();

  const rows: FormationRow[] = useMemo(() => {
    const qz: FormationRow[] = quizzes.map(z => ({
      kind: 'quiz', id: z.id, refId: z.id,
      title: z.title, category: z.category, hours: '',
      mandatory: quizMandatoryOverride[z.id] ?? z.mandatory ?? 0, is_external: 0, is_presential: z.is_presential ?? 0, modality: z.modality ?? '', image: z.image, description: z.description,
      questions: z.question_count ?? z.questions?.length ?? 0,
      time_limit: z.time_limit, passing_score: z.passing_score,
      active: z.active, start_at: z.start_at, end_at: z.end_at,
    }));
    const ex: FormationRow[] = externals.map(c => ({
      kind: 'external', id: c.id, refId: c.id,
      title: c.title, category: c.category, hours: c.hours,
      mandatory: c.mandatory, cert: c.cert ?? 0, is_external: 1, url: c.url, description: c.description,
      departments: c.departments, target_users: c.target_users || [],
      start_at: c.start_at, end_at: c.end_at,
    }));
    return [...qz, ...ex];
  }, [quizzes, externals, quizMandatoryOverride]);

  const rowKey = (r: FormationRow) => `${r.kind}-${r.id}`;
  const selected = rows.find(r => rowKey(r) === selectedKey) || null;
  const counts = {
    all: rows.length,
    active: rows.filter(r => r.kind === 'external' || r.active).length,
    inactive: rows.filter(r => r.kind === 'quiz' && !r.active).length,
    quiz: rows.filter(r => r.kind === 'quiz' && !(r as any).is_presential).length,
    external: rows.filter(r => r.kind === 'external').length,
    presencial: rows.filter(r => r.kind === 'quiz' && (r as any).is_presential).length,
  };
  const filtered = useMemo(() => rows.filter(r => {
    if (typeFilter === 'quiz' && !(r.kind === 'quiz' && !(r as any).is_presential)) return false;
    if (typeFilter === 'external' && r.kind !== 'external') return false;
    if (typeFilter === 'presencial' && !(r.kind === 'quiz' && (r as any).is_presential)) return false;
    if (activeFilter === 'active' && r.kind === 'quiz' && !r.active) return false;
    if (activeFilter === 'inactive' && !(r.kind === 'quiz' && !r.active)) return false;
    if (q && !(r.title + (r.category ?? '') + (r.description ?? '')).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, q, typeFilter, activeFilter]);

  useEffect(() => {
    setFullQuiz(null);
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
        cert: selected.cert ?? 0,
        departments: depts,
        target_users: selected.target_users || [],
        start_at: selected.start_at,
        end_at: selected.end_at,
      });
    } else if (selected && selected.kind === 'quiz') {
      setDraft({
        title: selected.title,
        description: selected.description,
        category: selected.category,
        mandatory: selected.mandatory,
        active: selected.active,
        start_at: selected.start_at,
        end_at: selected.end_at,
        time_limit: selected.time_limit,
        passing_score: selected.passing_score,
        target_departments: [],
      });
      // Fetch full quiz for questions (needed for PUT)
      apiGetQuiz(selected.refId).then(full => {
        setFullQuiz(full);
        setDraft(d => ({ ...d, target_departments: full.target_departments ?? [] }));
      }).catch(console.error);
    } else {
      setDraft({});
    }
  }, [selectedKey]);

  const openExtendedEditor = (quizId?: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('edit', quizId ? String(quizId) : 'new');
    window.open(url.toString(), '_blank');
  };

  const openNewsStyleEditor = (kind: 'quiz' | 'external', refId: number) => {
    const u = new URL(window.location.href);
    const param = kind === 'quiz' ? `q-${refId}` : String(refId);
    u.searchParams.set('course', param);
    u.searchParams.set('cedit', '1');
    window.open(u.toString(), '_blank');
  };

  const [createFormOpen, setCreateFormOpen] = useState(false);
  const newFormacio = () => setCreateFormOpen(true);
  const onCreatedFormacio = (kind: 'quiz' | 'external', id: number, isPresential: boolean) => {
    setCreateFormOpen(false);
    refresh();
    setSelectedKey(kind === 'quiz' ? `quiz-${id}` : `external-${id}`);
    if (kind === 'external' || isPresential) {
      openNewsStyleEditor(kind, id);
    } else {
      openExtendedEditor(id);
    }
  };

  useEffect(() => {
    if (intent === 'new') {
      onConsumeIntent?.();
      newFormacio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const remove = async () => {
    if (!selected) return;
    const ok = await confirm(`Vols eliminar la formació "${selected.title}"? Aquesta acció no es pot desfer.`);
    if (!ok) return;
    try {
      if (selected.kind === 'external') {
        await apiDeleteExternalCourse(selected.refId);
      } else {
        await apiDeleteQuiz(selected.refId);
      }
      setSelectedKey(null);
      refresh();
    } catch (e: any) { showErr(e?.message ?? 'Error'); }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      if (selected.kind === 'external') {
        await apiUpdateExternalCourse(selected.refId, {
          title: draft.title ?? '',
          description: draft.description ?? '',
          url: draft.url ?? '',
          category: draft.category ?? '',
          hours: draft.hours ?? '',
          mandatory: draft.mandatory ?? 0,
          cert: (draft as any).cert ?? 0,
          departments: draft.departments ?? [],
          target_users: draft.target_users ?? [],
          start_at: draft.start_at ?? null,
          end_at: draft.end_at ?? null,
          image: (draft as any).image !== undefined ? ((draft as any).image ?? '') : ((selected as any).image ?? ''),
        });
      } else if (selected.kind === 'quiz' && fullQuiz) {
        await apiUpdateQuiz(selected.refId, {
          title: draft.title ?? selected.title,
          description: draft.description ?? selected.description ?? '',
          image: (draft as any).image !== undefined ? ((draft as any).image ?? '') : (fullQuiz.image ?? ''),
          category: draft.category ?? selected.category,
          time_limit: (draft as any).time_limit ?? selected.time_limit ?? 0,
          passing_score: (draft as any).passing_score ?? selected.passing_score ?? 70,
          mandatory: draft.mandatory ?? selected.mandatory ?? 0,
          active: (draft as any).active ?? selected.active ?? 1,
          start_at: (draft as any).start_at ?? null,
          end_at: (draft as any).end_at ?? null,
          target_departments: (draft as any).target_departments ?? fullQuiz.target_departments ?? [],
          target_users: fullQuiz.target_users ?? [],
          is_presential: (draft as any).is_presential !== undefined ? ((draft as any).is_presential ? 1 : 0) : fullQuiz.is_presential,
          modality: (draft as any).modality !== undefined ? (draft as any).modality : (fullQuiz?.modality ?? ''),
          location: fullQuiz.location,
          questions: (fullQuiz.questions ?? []) as any,
        });
      }
      refresh();
    } catch (e: any) { showErr(e?.message ?? 'Error'); }
    finally { setSaving(false); }
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
    { key: 'hours', label: 'Hores/Preguntes', width: '100px', align: 'right', render: (r) => <span style={{ color: T.textMuted, fontSize: 12, fontFeatureSettings: '"tnum"' }}>{r.kind === 'quiz' ? `${r.questions} q` : (r.hours || '—')}</span> },
    { key: 'type', label: 'Tipus', width: '95px', render: (r) => {
      const modalityLabel = r.kind === 'quiz'
        ? (r.modality === 'presencial' ? 'Presencial' : r.modality === 'online' ? 'Online' : r.modality === 'hibrida' ? 'Híbrida' : 'Interna')
        : 'Externa';
      return <span style={{ color: T.textMuted, fontSize: 12 }}>{modalityLabel}</span>;
    }},
    { key: 'active', label: 'Estat', width: '95px', render: (r) => r.kind === 'external' ? <AStatusPill status="active" /> : <AStatusPill status={r.active ? 'active' : 'inactive'} /> },
  ];

  return (
    <>
      {confirmNode}
      <div style={{ display: 'flex', gap: 8, padding: '0 0 16px' }}>
        <ABtn variant={campusTab === 'formacions' ? 'primary' : 'ghost'} onClick={() => setCampusTab('formacions')}>Formacions</ABtn>
        <ABtn variant={campusTab === 'certificats' ? 'primary' : 'ghost'} onClick={() => setCampusTab('certificats')}>Certificats</ABtn>
        <ABtn variant={campusTab === 'seguiment' ? 'primary' : 'ghost'} onClick={() => setCampusTab('seguiment')}>Seguiment</ABtn>
      </div>
      {campusTab === 'certificats' && <AdminCertificats />}
      {campusTab === 'seguiment' && <AdminSeguiment quizzes={quizzes} externals={externals} />}
      {campusTab === 'formacions' && (
        <>
          <AdminHeader
            title="Formacions"
            subtitle="Catàleg del Campus TAVIL: cursos, itineraris i sessions presencials."
            actions={
              <>
                <ABtn variant="primary" icon={Plus} onClick={newFormacio}>Nova formació</ABtn>
              </>
            }
          />
          <AdminToolbar>
            <AdminSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca cursos, instructor, categoria…" />
            <div style={{ width: 1, height: 22, background: T.border }} />
            <AdminFilterPills value={typeFilter} onChange={(id) => setTypeFilter(id as any)} options={[
              { id: 'all', label: 'Tots', count: counts.all },
              { id: 'quiz', label: 'Interna', count: counts.quiz },
              { id: 'external', label: 'Externa', count: counts.external },
              { id: 'presencial', label: 'Presencial', count: counts.presencial },
            ]} />
            <div style={{ width: 1, height: 22, background: T.border }} />
            <AdminFilterPills value={activeFilter} onChange={(id) => setActiveFilter(id as any)} options={[
              { id: 'all', label: 'Tots', count: counts.all },
              { id: 'active', label: 'Actius', count: counts.active },
              { id: 'inactive', label: 'Inactius', count: counts.inactive },
            ]} />
          </AdminToolbar>
          <AdminTwoPane
            left={<AdminTable columns={columns} rows={tableRows} selectedId={selectedKey} onRowClick={(id) => setSelectedKey(id as string)} emptyMessage="Cap formació." />}
            right={selected ? (
              <AdminDetail
                badge={selected.kind === 'quiz' ? 'FORMACIÓ · INTERNA' : 'FORMACIÓ · EXTERNA'}
                title={selected.title}
                onClose={() => setSelectedKey(null)}
                footer={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {selected.kind === 'quiz' && <ABtn variant="secondary" size="sm" icon={FileText} onClick={() => openExtendedEditor(selected.refId)}>Editor extens</ABtn>}
                      <ABtn variant="secondary" size="sm" icon={LayoutGrid} onClick={() => openNewsStyleEditor(selected.kind as 'quiz' | 'external', selected.refId)}>Editor notícia</ABtn>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <ABtn variant="danger" size="sm" onClick={remove}>Elimina</ABtn>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <ABtn variant="ghost" onClick={() => setSelectedKey(null)}>Tanca</ABtn>
                        <ABtn variant="primary" icon={Check} onClick={save} disabled={saving}>{saving ? 'Desant…' : 'Desa'}</ABtn>
                      </div>
                    </div>
                  </div>
                }
              >
                {selected.kind === 'external' ? (
                  <>
                    <AField label="Imatge portada">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          setImgUploading(true);
                          try { const url = await apiUploadImage(f); setDraft(d => ({ ...d, image: url } as any)); }
                          catch { /* ignore */ }
                          finally { setImgUploading(false); if (imgInputRef.current) imgInputRef.current.value = ''; }
                        }} />
                        {((draft as any).image !== undefined ? (draft as any).image : (selected as any).image) ? (
                          <div style={{ position: 'relative' }}>
                            <img src={resolveUploadUrl((draft as any).image ?? (selected as any).image ?? '')} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                            <button onClick={() => setDraft(d => ({ ...d, image: '' } as any))} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Treure</button>
                          </div>
                        ) : (
                          <button onClick={() => imgInputRef.current?.click()} disabled={imgUploading} style={{ padding: '10px 0', width: '100%', border: '1.5px dashed var(--admin-border, #e5e7eb)', borderRadius: 8, background: 'transparent', color: '#9ca3af', fontSize: 12, cursor: imgUploading ? 'wait' : 'pointer' }}>
                            {imgUploading ? 'Pujant…' : 'Pujar imatge'}
                          </button>
                        )}
                      </div>
                    </AField>
                    <AField label="Títol"><AInput value={draft.title ?? ''} onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))} /></AField>
                    <AField label="Descripció"><ATextarea rows={4} maxLength={400} value={draft.description ?? ''} onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))} /></AField>
                    <AField label="Hores"><AInput value={draft.hours ?? ''} onChange={(e) => setDraft(d => ({ ...d, hours: e.target.value }))} placeholder="6" /></AField>
                    <AField label="URL extern">
                      <AInput value={draft.url ?? ''} onChange={(e) => setDraft(d => ({ ...d, url: e.target.value }))} placeholder="https://…" />
                    </AField>
                    <AToggle
                      value={!!draft.mandatory}
                      onChange={(v) => setDraft(d => ({ ...d, mandatory: v ? 1 : 0 }))}
                      label="Obligatori"
                      hint="Tots els destinataris l'han de completar."
                    />
                    <AToggle
                      value={!!((draft as any).cert)}
                      onChange={(v) => setDraft(d => ({ ...d, cert: v ? 1 : 0 } as any))}
                      label="Requereix certificat"
                      hint="L'usuari haurà de pujar un certificat per validar la finalització."
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <AField label="Inici">
                        <DatePicker value={draft.start_at?.slice(0, 10) ?? ''} onChange={(v) => setDraft(d => ({ ...d, start_at: v || null }))} />
                      </AField>
                      <AField label="Final">
                        <DatePicker value={draft.end_at?.slice(0, 10) ?? ''} onChange={(v) => setDraft(d => ({ ...d, end_at: v || null }))} />
                      </AField>
                    </div>
                    <AField label="Departaments destinataris" hint="Si no en selecciones cap, és visible per a tothom.">
                      <DeptSearch
                        value={draft.departments ?? []}
                        onChange={(v) => setDraft(d => ({ ...d, departments: v }))}
                      />
                    </AField>
                  </>
                ) : (
                  <>
                    <AField label="Imatge portada">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          setImgUploading(true);
                          try { const url = await apiUploadImage(f); setDraft(d => ({ ...d, image: url } as any)); }
                          catch { /* ignore */ }
                          finally { setImgUploading(false); if (imgInputRef.current) imgInputRef.current.value = ''; }
                        }} />
                        {((draft as any).image !== undefined ? (draft as any).image : fullQuiz?.image) ? (
                          <div style={{ position: 'relative' }}>
                            <img src={resolveUploadUrl((draft as any).image ?? fullQuiz?.image ?? '')} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                            <button onClick={() => setDraft(d => ({ ...d, image: '' } as any))} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Treure</button>
                          </div>
                        ) : (
                          <button onClick={() => imgInputRef.current?.click()} disabled={imgUploading} style={{ padding: '10px 0', width: '100%', border: '1.5px dashed var(--admin-border, #e5e7eb)', borderRadius: 8, background: 'transparent', color: '#9ca3af', fontSize: 12, cursor: imgUploading ? 'wait' : 'pointer' }}>
                            {imgUploading ? 'Pujant…' : 'Pujar imatge'}
                          </button>
                        )}
                      </div>
                    </AField>
                    <AField label="Títol">
                      <AInput value={(draft as any).title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
                    </AField>
                    <AField label="Descripció">
                      <ATextarea rows={3} maxLength={400} value={(draft as any).description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
                    </AField>
                    <AField label="Nota mínima (%)">
                      <AInput type="number" value={(draft as any).passing_score ?? selected.passing_score ?? 70} onChange={e => setDraft(d => ({ ...d, passing_score: +e.target.value }))} />
                    </AField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <AField label="Temps límit (min)" hint="0 = sense límit">
                        <AInput type="number" value={(draft as any).time_limit ?? selected.time_limit ?? 0} onChange={e => setDraft(d => ({ ...d, time_limit: +e.target.value }))} />
                      </AField>
                      <AField label="Preguntes" hint="Edita des de l'editor extens">
                        <AInput value={String(selected.questions)} disabled />
                      </AField>
                    </div>
                    <AToggle
                      value={!!draft.mandatory}
                      onChange={(v) => setDraft(d => ({ ...d, mandatory: v ? 1 : 0 }))}
                      label="Obligatori"
                      hint="Tots els destinataris l'han de completar."
                    />
                    <AToggle
                      value={(draft as any).active !== undefined ? !!(draft as any).active : !!selected.active}
                      onChange={(v) => setDraft(d => ({ ...d, active: v ? 1 : 0 }))}
                      label="Publicat"
                      hint="Si no és publicat, no es mostra als usuaris."
                    />
                    <AField label="Modalitat">
                      <ASegmented
                        value={(draft as any).modality !== undefined ? (draft as any).modality : (fullQuiz?.modality ?? '')}
                        onChange={(v) => setDraft(d => ({ ...d, modality: v, is_presential: v === 'presencial' ? 1 : 0 }))}
                        options={[
                          { value: '', label: 'Cap' },
                          { value: 'presencial', label: 'Presencial' },
                          { value: 'online', label: 'Online' },
                          { value: 'hibrida', label: 'Híbrida' },
                        ]}
                      />
                    </AField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <AField label="Inici">
                        <DatePicker value={(draft as any).start_at} onChange={(v) => setDraft(d => ({ ...d, start_at: v || null }))} />
                      </AField>
                      <AField label="Final">
                        <DatePicker value={(draft as any).end_at} onChange={(v) => setDraft(d => ({ ...d, end_at: v || null }))} />
                      </AField>
                    </div>
                    <AField label="Departaments destinataris" hint="Si no en selecciones cap, és visible per a tothom.">
                      <DeptSearch
                        value={(draft as any).target_departments ?? []}
                        onChange={(v) => setDraft(d => ({ ...d, target_departments: v }))}
                      />
                    </AField>
                    <div style={{ fontSize: 12, color: T.textMuted, paddingTop: 4, borderTop: `1px solid ${T.border}` }}>
                      Per editar preguntes, multimèdia i lògica de la prova, usa l'editor extens.
                    </div>
                  </>
                )}
              </AdminDetail>
            ) : (
              <AdminDetailEmpty icon={GraduationCap} label="Selecciona una formació" hint="Tria una fila per editar el contingut, instructor i calendari." />
            )}
          />
          <CreateFormacioModal open={createFormOpen} onClose={() => setCreateFormOpen(false)} onCreated={onCreatedFormacio} />
        </>
      )}
      <AdminToast toast={adminToast} />
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
  const [adminToast, showErr] = useAdminToast();

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
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    const tStart = (draft.time ?? selected.time ?? '').trim();
    const tEnd = (draft.time_end ?? '').trim();
    if (!timeRe.test(tStart)) { showErr("Hora d'inici no vàlida (HH:MM)."); return; }
    if (tEnd && !timeRe.test(tEnd)) { showErr('Hora final no vàlida (HH:MM).'); return; }
    setSaving(true);
    try {
      await apiUpdateAgendaEvent(selected.id, {
        title: draft.title ?? selected.title,
        day: draft.day ?? selected.day,
        month: draft.month ?? selected.month,
        year: (draft as any).year ?? selected.year ?? new Date().getFullYear(),
        time: draft.time ?? selected.time,
        time_end: (draft.time_end ?? '').trim() || undefined,
        location: draft.location ?? selected.location,
        type: draft.type ?? selected.type,
        target_departments: draft.target_departments ?? selected.target_departments ?? [],
      });
      refresh();
    } catch (e: any) { showErr(e?.message ?? 'Error desant'); }
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
    catch (e: any) { showErr(e?.message ?? 'Error'); }
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
                options={['Sessió interna', 'Fira', 'Festiu', 'Activitat empresa']} />
            </AField>
            <AField label="Departaments destinataris" hint="Si no en selecciones cap, l'esdeveniment és visible per a tothom.">
              <DeptSearch
                value={draft.target_departments ?? []}
                onChange={(v) => setDraft(d => ({ ...d, target_departments: v }))}
              />
            </AField>
          </AdminDetail>
        ) : (
          <AdminDetailEmpty icon={Calendar} label="Selecciona un esdeveniment" hint="Tria una fila per editar dates, ubicació i audiència." />
        )}
      />
      <CreateAgendaModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreatedEvent} />
      {confirmNode}
      <AdminToast toast={adminToast} />
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
  const [adminToast, showErr] = useAdminToast();

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
    } catch (e: any) { showErr(e?.message ?? 'Error desant'); }
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
    catch (e: any) { showErr(e?.message ?? 'Error'); }
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
            background: n.kind === 'danger' ? 'var(--status-danger-fg)' : n.kind === 'neutral' ? T.textFaint : 'var(--status-warn-fg)',
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
            <AField label="Contingut"><ATextarea rows={3} maxLength={300} value={draft.content ?? ''} onChange={(e) => setDraft(d => ({ ...d, content: e.target.value }))} /></AField>
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
      <AdminToast toast={adminToast} />
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
      tabPrefetch.news = n; tabPrefetchAt.news = Date.now();
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
      {!loading && view === 'users'       && <AdminUsers      users={users} setUsers={setUsers}    refresh={refresh} currentUser={currentUser} onImpersonate={onImpersonate} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'news'        && <AdminNews       news={news}       refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'activities'  && <AdminActivities activities={activities} refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'campus'      && <AdminCampus     quizzes={quizzes} externals={externals} refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'agenda'      && <AdminAgenda     events={agenda}   refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
      {!loading && view === 'avisos'      && <AdminAvisos     notices={notices} refresh={refresh} intent={intent} onConsumeIntent={onConsumeIntent} />}
    </AdminFont>
  );
}
