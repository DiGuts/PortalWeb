import { Menu, Bell } from 'lucide-react';
import { cn } from '../../lib/cn';

export function MobileAppHeader({
    onOpenDrawer,
    onNotif,
    onTabChange,
    hasUnread,
    isDarkMode,
}: {
    onOpenDrawer: () => void;
    onNotif: () => void;
    onTabChange: (tab: string) => void;
    hasUnread?: boolean;
    isDarkMode: boolean;
}) {
    return (
        <div
            className={cn("flex items-center justify-between px-4 pt-[10px] pb-1", isDarkMode && "dark")}
            style={{ background: 'var(--tavil-bg)' }}
        >
            {/* Hamburger */}
            <button
                onClick={onOpenDrawer}
                aria-label="Obrir menú"
                style={{
                    width: 40, height: 40, borderRadius: 20,
                    background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0,
                }}
            >
                <Menu size={18} />
            </button>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => onTabChange('Inici')}>
                {isDarkMode ? (
                    <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogoDark.png`} alt="TAVIL" style={{ height: 24, display: 'block' }} />
                ) : (
                    <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogo.png`} alt="TAVIL" style={{ height: 24, display: 'block' }} />
                )}
            </div>

            {/* Bell */}
            <button
                onClick={onNotif}
                aria-label="Notificacions"
                style={{
                    width: 40, height: 40, borderRadius: 20,
                    background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--tavil-text)', position: 'relative', flexShrink: 0,
                }}
            >
                <Bell size={18} />
                {hasUnread && (
                    <div style={{
                        position: 'absolute', top: 8, right: 9,
                        width: 8, height: 8, borderRadius: 4,
                        background: 'var(--tavil-accent)', border: '2px solid var(--tavil-card)',
                    }} />
                )}
            </button>
        </div>
    );
}
