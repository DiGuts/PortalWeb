import React from 'react';
import {
    Activity as ActivityIcon, Building2, GraduationCap, FileText, ChevronRight,
} from 'lucide-react';

export function MesSettingsGroup({ label, children, noCard }: { label: string; children: React.ReactNode; noCard?: boolean }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{
                fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)',
                textTransform: 'uppercase', letterSpacing: '0.14em',
                padding: '0 24px 8px',
            }}>{label}</div>
            {noCard ? (
                <div style={{ margin: '0 16px' }}>{children}</div>
            ) : (
                <div style={{
                    margin: '0 16px', background: 'var(--tavil-card)',
                    border: '1px solid var(--tavil-border)', borderRadius: 14, overflow: 'hidden',
                }}>{children}</div>
            )}
        </div>
    );
}

export function MesTab({
    onNavigate,
    currentUser,
}: {
    onNavigate: (tab: string) => void;
    currentUser: { name: string; role?: string; dept?: string; email?: string } | null;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    onLogout: () => void;
}) {
    const name = currentUser?.name ?? '';
    const ini = name.split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

    const groups: { label: string; items: { id: string; icon: any; label: string }[] }[] = [
        { label: 'General', items: [
            { id: 'Activitats', icon: ActivityIcon, label: 'Connect' },
        ]},
        { label: 'Empresa', items: [
            { id: 'Espai', icon: Building2, label: 'Tavipedia' },
            { id: 'Campus', icon: GraduationCap, label: 'Campus TAVIL' },
        ]},
        { label: 'Personal', items: [
            { id: 'Solicituds', icon: FileText, label: 'Sol·licituds' },
        ]},
    ];

    return (
        <div style={{ margin: '0 -12px', paddingBottom: 96, overflow: 'hidden' }}>
            {/* User card */}
            <div style={{ padding: '0 16px 16px' }}>
                <button
                    onClick={() => onNavigate('Perfil')}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                        borderRadius: 14, padding: 14, cursor: 'pointer', fontFamily: 'inherit',
                        textAlign: 'left',
                    }}
                >
                    <div style={{
                        width: 46, height: 46, borderRadius: 23, flexShrink: 0,
                        background: 'var(--tavil-accent)',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em',
                        fontFamily: 'var(--font-display)',
                        boxShadow: '0 4px 14px -6px rgba(0,0,0,0.18)',
                    }}>{ini}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tavil-text)' }}>
                            {name || 'Usuari'}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--tavil-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {currentUser?.role ?? ''}{currentUser?.dept ? ` · ${currentUser.dept}` : ''}
                        </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                </button>
            </div>

            {/* Settings groups */}
            {groups.map((g, gi) => (
                <MesSettingsGroup key={gi} label={g.label}>
                    {g.items.map((it) => {
                        const ItIcon = it.icon;
                        return (
                            <button
                                key={it.id}
                                onClick={() => onNavigate(it.id)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '14px 16px', background: 'transparent', border: 'none',
                                    borderBottom: '1px solid var(--tavil-border)',
                                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5,
                                    color: 'var(--tavil-text)',
                                }}
                            >
                                <ItIcon size={18} style={{ color: 'var(--tavil-muted)', flexShrink: 0 }} />
                                <span style={{ flex: 1, textAlign: 'left' }}>{it.label}</span>
                                <ChevronRight size={16} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                            </button>
                        );
                    })}
                </MesSettingsGroup>
            ))}
        </div>
    );
}
