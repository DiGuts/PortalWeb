import React from 'react';
import { cn } from '../../lib/cn';

export const SidebarItem = ({ icon: Icon, label, active = false, onClick, collapsed = false }: {
    icon: any; label: string; active?: boolean; onClick?: (e: React.MouseEvent<HTMLDivElement>) => void; collapsed?: boolean;
}) => (
    <div
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn('flex items-center gap-2.5 rounded-lg cursor-pointer relative select-none group', collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2')}
        style={{
            background: active ? 'var(--tavil-bg)' : 'transparent',
            border: active ? '1px solid var(--tavil-border)' : '1px solid transparent',
            color: active ? 'var(--tavil-text)' : 'var(--tavil-muted)',
            fontWeight: active ? 600 : 500,
            transition: 'background-color 300ms ease-in-out, color 150ms ease-out, border-color 300ms ease-in-out',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--tavil-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--tavil-text)'; }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--tavil-muted)'; }}}
    >
        <Icon size={18} aria-hidden="true" style={{ color: active ? 'var(--tavil-accent)' : 'inherit', strokeWidth: 1.8, flexShrink: 0, transition: 'color 150ms ease-out' }} />
        {!collapsed && <span style={{ fontSize: 14 }}>{label}</span>}
    </div>
);

export const SidebarSection = ({ title, children, collapsed = false, isAdmin = false }: { title: string; children: React.ReactNode; collapsed?: boolean; isAdmin?: boolean }) => (
    <div className="mb-4">
        {!collapsed && (
            <div className="px-3 mb-1 flex items-center gap-2">
                {isAdmin && (
                    <span style={{
                        fontSize: 9.5, padding: '2px 6px', borderRadius: 3,
                        background: 'var(--tavil-accent)', color: '#fff',
                        letterSpacing: '0.14em', fontWeight: 700,
                    }}>ADMIN</span>
                )}
                <p className="text-[10px] font-semibold uppercase m-0" style={{ color: 'var(--tavil-faint)', letterSpacing: '0.14em' }}>
                    {title}
                </p>
            </div>
        )}
        {collapsed && <div className="mx-auto w-4 h-px mb-2 mt-1" style={{ background: 'var(--tavil-border)' }} />}
        <div className="space-y-0.5">{children}</div>
    </div>
);
