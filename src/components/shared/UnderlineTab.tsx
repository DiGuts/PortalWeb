import { cn } from '../../lib/cn';

export const UnderlineTab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        style={{ touchAction: 'manipulation' }}
        className={cn(
            'relative px-4 md:px-5 py-3 min-h-[44px] text-sm font-medium border-b-2 transition-colors duration-200 -mb-px focus-ring',
            active
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
        )}
    >
        {label}
    </button>
);
