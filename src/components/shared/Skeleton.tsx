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
    <div className={cn('rounded-xl p-4 space-y-3', className)} style={{ border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)' }} role="status" aria-busy="true" aria-label="Carregant">
        {media && <Skeleton className="w-full h-40 rounded-lg" />}
        <Skeleton className="skeleton-title" style={{ width: '70%' }} />
        {Array.from({ length: lines }).map((_, i) => (
            <SkeletonText key={i} width={i === lines - 1 ? '55%' : '100%'} />
        ))}
    </div>
);

// ── Per-tab skeletons ─────────────────────────────────────────────────────────

export const SkeletonInici = () => (
  <div aria-busy="true" role="status" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {/* Greeting */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="skeleton skeleton-title" style={{ width: '55%' }} />
      <div className="skeleton skeleton-text" style={{ width: '35%' }} />
    </div>

    {/* Quick access — 4-column grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
      ))}
    </div>

    {/* Hero card */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />
      <div className="skeleton skeleton-title" style={{ width: '70%' }} />
      <div className="skeleton skeleton-text" style={{ width: '45%' }} />
    </div>

    {/* News list — 3 rows */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonNoticies = () => (
  <div aria-busy="true" role="status" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {/* Search bar */}
    <div className="skeleton" style={{ height: 40, borderRadius: 999 }} />

    {/* Filter chips */}
    <div style={{ display: 'flex', gap: '8px', overflowX: 'hidden' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 32, width: 72 + i * 8, borderRadius: 999, flexShrink: 0 }} />
      ))}
    </div>

    {/* News cards */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="skeleton" style={{ height: 160, borderRadius: 14 }} />
          <div className="skeleton skeleton-title" style={{ width: '70%' }} />
          <div className="skeleton skeleton-text" style={{ width: '90%' }} />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonActivitats = () => (
  <div aria-busy="true" role="status" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {/* Filter chips */}
    <div style={{ display: 'flex', gap: '8px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 32, width: 80, borderRadius: 999 }} />
      ))}
    </div>

    {/* Activity cards */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)' }}>
          {/* Icon circle */}
          <div className="skeleton skeleton-avatar" style={{ width: 40, height: 40, flexShrink: 0 }} />
          {/* Text block */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton skeleton-title" style={{ width: '65%' }} />
            <div className="skeleton skeleton-text" style={{ width: '45%' }} />
          </div>
          {/* Right pill */}
          <div className="skeleton" style={{ width: 56, height: 24, borderRadius: 999, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonAgenda = () => (
  <div aria-busy="true" role="status" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {/* Calendar grid */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Day header row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text" style={{ margin: '0 auto', width: '60%' }} />
        ))}
      </div>
      {/* 5 weeks × 7 cells */}
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {Array.from({ length: 7 }).map((_, col) => (
            <div key={col} className="skeleton" style={{ height: 36, borderRadius: 8 }} />
          ))}
        </div>
      ))}
    </div>

    {/* Upcoming events */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="skeleton skeleton-title" style={{ width: '40%' }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="skeleton skeleton-avatar" style={{ width: 10, height: 10, flexShrink: 0 }} />
          <div className="skeleton skeleton-text" style={{ width: '55%' }} />
          <div className="skeleton skeleton-text" style={{ width: '25%' }} />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonDirectori = () => (
  <div aria-busy="true" role="status" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {/* Search bar */}
    <div className="skeleton" style={{ height: 40, borderRadius: 999 }} />

    {/* Filter chips */}
    <div style={{ display: 'flex', gap: '8px' }}>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 32, width: 90, borderRadius: 999 }} />
      ))}
    </div>

    {/* Employee rows */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="skeleton skeleton-avatar" style={{ width: 40, height: 40, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div className="skeleton skeleton-text" style={{ width: '55%' }} />
            <div className="skeleton skeleton-text" style={{ width: '35%' }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonCampus = () => (
  <div aria-busy="true" role="status" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {/* Section title */}
    <div className="skeleton skeleton-title" style={{ width: '45%' }} />

    {/* Course cards grid */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)', padding: '0 0 12px 0' }}>
          <div className="skeleton" style={{ height: 128, borderRadius: 0 }} />
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton skeleton-title" style={{ width: '80%' }} />
            <div className="skeleton skeleton-text" style={{ width: '55%' }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
