import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Search, Users, Phone, Mail, LayoutGrid, Network } from 'lucide-react';
import { cn } from '../../lib/cn';
import { resolveImg } from '../../lib/resolveImg';
import { DEPT_ORDER, avatarBg } from '../../lib/depts';
import { useIsMobile } from '../../lib/useIsMobile';
import { tabPrefetch, tabPrefetchAt, isTabCacheFresh } from '../../lib/tabPrefetch';
import { DropdownMultiselect } from '../shared/DropdownMultiselect';
import { Employee, apiGetEmployees } from '../../api';
import { OrganigramaView } from './OrganigramaView';

export function DirectoriTab({ onOpenDrawer }: { onOpenDrawer?: () => void } = {}) {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<Employee[]>(() => tabPrefetch.employees ?? []);
    const [deptFilters, setDeptFilters] = useState<string[]>([]);
    const [dirSearch, setDirSearch] = useState('');
    const [view, setView] = useState<'graella' | 'departaments' | 'organigrama'>('graella');

    useEffect(() => {
        if (isTabCacheFresh('employees')) return;
        apiGetEmployees().then(d => { setEmployees(d); tabPrefetch.employees = d; tabPrefetchAt.employees = Date.now(); }).catch(console.error);
    }, []);

    const filtered = employees
        .filter(e => deptFilters.length === 0 || deptFilters.includes(e.dept))
        .filter(e => !dirSearch || [e.name, e.role, e.email, e.ext].some(f => f.toLowerCase().includes(dirSearch.toLowerCase())));

    const isMobileDir = useIsMobile();
    const grouped = filtered.reduce((acc, e) => {
        if (!acc[e.dept]) acc[e.dept] = [];
        acc[e.dept].push(e);
        return acc;
    }, {} as Record<string, Employee[]>);

    // ── Mobile layout ──────────────────────────────────────────────────────────
    if (isMobileDir) {
        return (
            <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
                {/* Top bar */}
                <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
                    <button onClick={onOpenDrawer} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)' }}>
                        <Menu size={18} />
                    </button>

                </div>
                {/* Header kicker + title */}
                <div style={{ padding: '0 20px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Equip</div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 600, lineHeight: 1, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>{t('nav.directori')}</h1>
                </div>
                {/* Search */}
                <div style={{ padding: '0 20px 14px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
                        <input type="text" value={dirSearch} onChange={e => setDirSearch(e.target.value)} placeholder={t('directory.searchPlaceholder')}
                            style={{ width: '100%', height: 44, borderRadius: 12, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', paddingLeft: 42, paddingRight: 16, fontSize: 14, color: 'var(--tavil-text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        />
                    </div>
                </div>
                {/* Dept filter */}
                <div style={{ padding: '0 16px 18px' }}>
                    <DropdownMultiselect
                        options={DEPT_ORDER}
                        value={deptFilters}
                        onChange={setDeptFilters}
                        placeholder="Tots els departaments"
                    />
                </div>
                {/* People list */}
                <div style={{ padding: '0 16px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--tavil-faint)' }}>
                            <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                            <p style={{ fontSize: 13.5 }}>{t('directory.noResults')}</p>
                        </div>
                    ) : filtered.map((emp, i) => (
                        <div key={i} className="anim-item" style={{
                            '--i': i, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 4px',
                            borderBottom: '1px solid var(--tavil-border)',
                            cursor: 'pointer',
                        } as React.CSSProperties}>
                            {emp.avatar_url ? (
                                <img src={resolveImg(emp.avatar_url)} alt="" className="w-[46px] h-[46px] rounded-full object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: avatarBg(emp.name), color: '#f7f7f2' }}>{emp.initials}</div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tavil-text)', letterSpacing: '-0.005em' }}>{emp.name}</div>
                                <div style={{ fontSize: 12.5, color: 'var(--tavil-muted)', marginTop: 1 }}>{emp.role} · {emp.dept}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                {(emp.phone || emp.ext) && (
                                    <a href={`tel:${emp.phone || emp.ext}`} style={{ width: 34, height: 34, borderRadius: 17, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tavil-muted)', textDecoration: 'none' }}>
                                        <Phone size={15} />
                                    </a>
                                )}
                                {emp.email && (
                                    <a href={`mailto:${emp.email}`} style={{ width: 34, height: 34, borderRadius: 17, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tavil-muted)', textDecoration: 'none' }}>
                                        <Mail size={15} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const viewToggle = (
        <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
            <button onClick={() => setView('graella')} className={cn("flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors", view === 'graella' ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800")}>
                <LayoutGrid size={14} /> {t('directory.grid')}
            </button>
            <button onClick={() => setView('departaments')} className={cn("flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors", view === 'departaments' ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800")}>
                <Users size={14} /> {t('directory.departments')}
            </button>
            <button onClick={() => setView('organigrama')} className={cn("flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors", view === 'organigrama' ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800")}>
                <Network size={14} /> {t('directory.orgchart')}
            </button>
        </div>
    );

    return (
        <div>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-5">{t('directory.subtitle')}</p>
            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" value={dirSearch} onChange={e => setDirSearch(e.target.value)} placeholder="Cercar..." className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm outline-none dark:text-white w-40" />
                    </div>
                    <DropdownMultiselect
                        options={DEPT_ORDER}
                        value={deptFilters}
                        onChange={setDeptFilters}
                        placeholder="Tots els departaments"
                    />
                </div>
                {viewToggle}
            </div>

            <div key={view} className="anim-tab">
            {view === 'organigrama' ? (
                <OrganigramaView employees={employees} search={dirSearch} deptFilters={deptFilters} />
            ) : view === 'graella' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filtered.map((emp, i) => (
                        <div key={i} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 anim-item" style={{ '--i': i } as React.CSSProperties}>
                            <div className="flex items-center gap-3 mb-3">
                                {emp.avatar_url ? (
                                    <img src={resolveImg(emp.avatar_url)} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: avatarBg(emp.name), color: '#f7f7f2' }}>{emp.initials}</div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{emp.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{emp.role}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 px-2 py-0.5 rounded">{emp.dept}</span>
                            <div className="mt-3 space-y-1.5">
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-zinc-400"><Mail size={11} className="flex-shrink-0" /><span className="truncate">{emp.email}</span></div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-zinc-400"><Phone size={11} className="flex-shrink-0" /><span>{emp.phone}</span></div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-zinc-400"><span className="font-medium">Ext.</span><span>{emp.ext}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([dept, members]) => (
                        <div key={dept}>
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={15} className="text-gray-400 dark:text-zinc-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{dept}</h3>
                                <span className="text-xs text-gray-400 font-medium">({members.length})</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {members.map((emp, i) => (
                                    <div key={i} className="hover-lift bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-3 flex items-center gap-3 anim-item" style={{ '--i': i } as React.CSSProperties}>
                                        {emp.avatar_url ? (
                                            <img src={resolveImg(emp.avatar_url)} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: avatarBg(emp.name), color: '#f7f7f2' }}>{emp.initials}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{emp.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{emp.role}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 flex-shrink-0 font-medium whitespace-nowrap">Ext. {emp.ext}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </div>
        </div>
    );
}
