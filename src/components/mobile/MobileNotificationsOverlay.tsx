import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
    Newspaper, CheckCircle, Calendar, MessageSquare, Bell, ChevronLeft,
} from 'lucide-react';
import { Notification } from '../../api';
import { timeAgo } from '../../lib/timeAgo';

export function MobileNotificationsOverlay({ notifications, onClose, onMarkRead, onMarkAllRead, isDarkMode }: {
    notifications: Notification[];
    onClose: () => void;
    onMarkRead: (id: number) => void;
    onMarkAllRead: () => void;
    isDarkMode: boolean;
}) {
    const { t } = useTranslation();
    const unread = notifications.filter(n => !n.read).length;
    const isRecent = (iso: string) => (Date.now() - new Date(iso).getTime()) < 86400_000;
    const today = notifications.filter(n => isRecent(n.created_at));
    const before = notifications.filter(n => !today.includes(n));

    const iconForType = (tab: string) => {
        if (tab === 'Notícies') return <Newspaper size={16} />;
        if (tab === 'Solicituds') return <CheckCircle size={16} />;
        if (tab === 'Agenda') return <Calendar size={16} />;
        if (tab === 'Veu') return <MessageSquare size={16} />;
        return <Bell size={16} />;
    };

    const Section = ({ label, items }: { label: string; items: Notification[] }) => items.length === 0 ? null : (
        <>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '14px 20px 6px' }}>{label}</div>
            <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, margin: '0 16px', overflow: 'hidden' }}>
                {items.map((n, i) => (
                    <button
                        key={n.id}
                        onClick={() => onMarkRead(n.id)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '14px 16px', background: !n.read ? '#fbe4e330' : 'transparent',
                            border: 'none', borderBottom: i < items.length - 1 ? '1px solid var(--tavil-border)' : 'none',
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                            background: !n.read ? 'var(--tavil-accent)' : 'var(--tavil-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: !n.read ? '#fff' : 'var(--tavil-muted)',
                        }}>
                            {iconForType(n.tab)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                                <div style={{ fontSize: 14, fontWeight: !n.read ? 600 : 500, color: 'var(--tavil-text)', lineHeight: 1.3 }}>{n.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--tavil-faint)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{timeAgo(n.created_at, t)}</div>
                            </div>
                            {n.body && <div style={{ fontSize: 12.5, color: 'var(--tavil-muted)', lineHeight: 1.35 }}>{n.body}</div>}
                            {n.tab && <div style={{ fontSize: 11, color: 'var(--tavil-faint)', marginTop: 3 }}>{n.tab}</div>}
                        </div>
                        {!n.read && <div style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--tavil-accent)', marginTop: 5, flexShrink: 0 }} />}
                    </button>
                ))}
            </div>
        </>
    );

    return createPortal(
        <div className={isDarkMode ? 'dark' : ''} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--tavil-bg)', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 6px', height: 56, flexShrink: 0 }}>
                <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--tavil-accent)', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}>
                    <ChevronLeft size={20} strokeWidth={2} /> Enrere
                </button>
                {unread > 0 && (
                    <button onClick={onMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--tavil-muted)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        Marca-ho tot
                    </button>
                )}
            </div>

            {/* Eyebrow + title */}
            <div style={{ padding: '4px 20px 20px' }}>
                <div style={{ fontSize: 10.5, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>ACTIVITAT</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, letterSpacing: '0em', lineHeight: 1.05, margin: '0 0 6px', color: 'var(--tavil-text)' }}>Notificacions</h1>
                <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: 0 }}>
                    {unread > 0 ? <>Tens <strong>{unread} sense llegir</strong>.</> : 'Estàs al dia.'}
                </p>
            </div>

            {/* Lists */}
            {notifications.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12 }}>
                    <Bell size={30} style={{ color: 'var(--tavil-faint)', opacity: 0.3 }} />
                    <p style={{ fontSize: 14, color: 'var(--tavil-faint)' }}>No hi ha notificacions</p>
                </div>
            ) : (
                <div style={{ paddingBottom: 32 }}>
                    <Section label="AVUI" items={today} />
                    <Section label="ABANS" items={before} />
                </div>
            )}
        </div>,
        document.body
    );
}
