import React from 'react';
import { createPortal } from 'react-dom';
import { Home, Newspaper, Calendar, Users, Menu } from 'lucide-react';
import { cn } from '../../lib/cn';

export function BottomNavBar({ activeTab, onTabChange, onOpenDrawer: _onOpenDrawer, isDarkMode, hidden }: {
    activeTab: string;
    onTabChange: (id: string) => void;
    onOpenDrawer: () => void;
    isDarkMode: boolean;
    hidden?: boolean;
}) {
    const items = [
        { id: 'Inici', icon: Home, label: 'Inici' },
        { id: 'Notícies', icon: Newspaper, label: 'Notícies' },
        { id: 'Agenda', icon: Calendar, label: 'Agenda' },
        { id: 'Directori', icon: Users, label: 'Who is who?' },
        { id: '__more', icon: Menu, label: 'Més' },
    ];

    return createPortal(
        <div className={cn("md:hidden", isDarkMode && "dark")}>
            <nav
                aria-label="Navegació principal"
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
                    background: 'var(--tavil-card)',
                    borderTop: '1px solid var(--tavil-border)',
                    padding: '8px 8px calc(22px + env(safe-area-inset-bottom))',
                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                    boxShadow: '0 -4px 24px -12px rgba(34,39,37,0.08)',
                    transform: hidden ? 'translateY(105%)' : 'translateY(0)',
                    transition: 'transform 280ms cubic-bezier(0.23,1,0.32,1)',
                }}
            >
                {items.map(({ id, icon: Icon, label }) => {
                    const active = id === '__more' ? activeTab === 'Més' : activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id === '__more' ? 'Més' : id)}
                            aria-label={label}
                            aria-current={active ? 'page' : undefined}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '6px 0', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: 3, fontFamily: 'inherit',
                                color: active ? 'var(--tavil-accent)' : 'var(--tavil-muted)',
                                position: 'relative',
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                            } as React.CSSProperties}
                        >
                            {/* Top indicator */}
                            <div style={{
                                height: 3, width: 22, background: 'var(--tavil-accent)',
                                borderRadius: 2, position: 'absolute', top: -8,
                                opacity: active ? 1 : 0,
                                transition: 'opacity 220ms var(--ease-out-cubic)',
                            }} />
                            <Icon size={22} strokeWidth={active ? 1.9 : 1.6} />
                            <span style={{
                                fontSize: 10.5,
                                fontWeight: active ? 600 : 500,
                                letterSpacing: '0.01em',
                            }}>{label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>,
        document.body
    );
}
