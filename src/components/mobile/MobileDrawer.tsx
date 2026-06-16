import {
    Home, Newspaper, Calendar, Activity as ActivityIcon,
    Building2, Users, GraduationCap, FileText, UserCircle, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveImg } from '../../lib/resolveImg';

export function MobileDrawer({
    open,
    onClose,
    onNavigate,
    currentUser,
    isDarkMode,
    activeTab,
}: {
    open: boolean;
    onClose: () => void;
    onNavigate: (tab: string) => void;
    currentUser: { id?: number; name: string; role?: string; email?: string; avatar_url?: string | null } | null;
    isDarkMode: boolean;
    activeTab: string;
}) {
    const { t } = useTranslation();
    const avatarUrl = currentUser?.avatar_url ?? null;
    const groups = [
        {
            label: t('nav.general'),
            items: [
                { id: 'Inici', icon: Home, label: t('nav.inici') },
                { id: 'Notícies', icon: Newspaper, label: t('nav.noticies') },
                { id: 'Agenda', icon: Calendar, label: t('nav.agenda') },
                { id: 'Activitats', icon: ActivityIcon, label: t('nav.activitats') },
            ],
        },
        {
            label: t('nav.empresa'),
            items: [
                { id: 'Espai', icon: Building2, label: t('nav.espai') },
                { id: 'Directori', icon: Users, label: t('nav.directori') },
                { id: 'Campus', icon: GraduationCap, label: t('nav.campus') },
            ],
        },
        {
            label: t('nav.personal'),
            items: [
                { id: 'Solicituds', icon: FileText, label: t('nav.solicituds') },
                { id: 'Perfil', icon: UserCircle, label: t('nav.perfil') },
            ],
        },
    ];

    const initials = currentUser?.name
        ? currentUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    return (
        <div className={isDarkMode ? 'dark' : ''} style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: open ? 'auto' : 'none' }}>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(20,22,20,0.5)',
                    opacity: open ? 1 : 0,
                    transition: 'opacity 260ms',
                }}
            />
            {/* Panel */}
            <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: '78%', maxWidth: 320,
                background: 'var(--tavil-bg)',
                transform: open ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 340ms cubic-bezier(.23,1,.32,1)',
                display: 'flex', flexDirection: 'column',
                borderRight: '1px solid var(--tavil-border)',
                overflowY: 'auto',
            }}>
                {/* Header */}
                <div style={{ padding: '52px 20px 20px', borderBottom: '1px solid var(--tavil-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--tavil-text)' }}>
                            {isDarkMode ? (
                                <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogoDark.png`} alt="TAVIL" style={{ height: 22, display: 'block' }} />
                            ) : (
                                <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogo.png`} alt="TAVIL" style={{ height: 22, display: 'block' }} />
                            )}
                        </div>
                        <button onClick={onClose} style={{
                            width: 36, height: 36, borderRadius: 18,
                            background: 'transparent', border: '1px solid var(--tavil-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--tavil-text)',
                        }}>
                            <X size={16} />
                        </button>
                    </div>
                    {currentUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {avatarUrl ? (
                                <img src={resolveImg(avatarUrl)} alt="" loading="lazy" style={{ width: 42, height: 42, borderRadius: 21, objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                                <div style={{
                                    width: 42, height: 42, borderRadius: 21,
                                    background: 'var(--tavil-accent)', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, fontWeight: 600, flexShrink: 0,
                                }}>{initials}</div>
                            )}
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)' }}>{currentUser.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--tavil-muted)' }}>{currentUser.role ?? currentUser.email}</div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Nav groups */}
                <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
                    {groups.map((g, gi) => (
                        <div key={gi} style={{ marginBottom: 18 }}>
                            <div style={{
                                fontSize: 10, fontWeight: 600, color: 'var(--tavil-faint)',
                                textTransform: 'uppercase', letterSpacing: '0.14em',
                                padding: '4px 12px 8px',
                            }}>{g.label}</div>
                            {g.items.map(it => {
                                const Icon = it.icon;
                                const isActive = activeTab === it.id;
                                return (
                                    <button
                                        key={it.id}
                                        onClick={() => { onNavigate(it.id); onClose(); }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '11px 12px',
                                            background: isActive ? 'var(--tavil-accent-light, #f9eceb)' : 'transparent',
                                            border: 'none', borderRadius: 10,
                                            color: isActive ? 'var(--tavil-accent)' : 'var(--tavil-text)',
                                            cursor: 'pointer', fontSize: 14.5, textAlign: 'left',
                                        }}
                                    >
                                        <Icon size={19} strokeWidth={isActive ? 2 : 1.6} />
                                        {it.label}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
