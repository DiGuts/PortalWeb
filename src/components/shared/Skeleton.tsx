import React from 'react';
import { cn } from '../../lib/cn';

// Shimmer placeholders. Render while data loads for faster perceived speed.

export const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <div className={cn('skeleton', className)} style={style} aria-hidden="true" />
);

export const SkeletonText = ({ className, width }: { className?: string; width?: string }) => (
    <Skeleton className={cn('skeleton-text', className)} style={{ width: width ?? '100%' }} />
);

export const SkeletonCard = ({ className, lines = 2, media = true }: { className?: string; lines?: number; media?: boolean }) => (
    <div className={cn('rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3', className)} role="status" aria-busy="true" aria-label="Carregant">
        {media && <Skeleton className="w-full h-40 rounded-lg" />}
        <Skeleton className="skeleton-title" style={{ width: '70%' }} />
        {Array.from({ length: lines }).map((_, i) => (
            <SkeletonText key={i} width={i === lines - 1 ? '55%' : '100%'} />
        ))}
    </div>
);
