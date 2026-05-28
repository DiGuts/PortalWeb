import { cn } from '../../lib/cn';

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <button onClick={onToggle} className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0', on ? 'bg-red-600' : 'bg-gray-200 dark:bg-zinc-700')}>
            <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform" style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }} />
        </button>
    );
}
