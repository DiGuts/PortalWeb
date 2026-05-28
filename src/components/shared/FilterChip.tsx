import { cn } from '../../lib/cn';

export const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        aria-pressed={active}
        style={{ touchAction: 'manipulation' }}
        className={cn(
            'press px-3.5 py-2 md:py-1.5 min-h-[40px] md:min-h-0 rounded-lg text-sm font-medium transition-all duration-200 border flex-shrink-0 whitespace-nowrap focus-ring',
            active
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 active:bg-gray-50 dark:active:bg-zinc-800'
        )}
    >
        {label}
    </button>
);
