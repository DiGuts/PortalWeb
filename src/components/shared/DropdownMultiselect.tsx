import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/cn';

interface Props {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

export function DropdownMultiselect({ options, value, onChange, placeholder = 'Tots' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  };

  const clear = () => { onChange([]); setOpen(false); };

  const label = value.length === 0
    ? placeholder
    : value.length === 1
      ? value[0]
      : value.length === 2
        ? value.join(', ')
        : `${value[0]}, ${value[1]} +${value.length - 2}`;

  const active = value.length > 0;

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 whitespace-nowrap',
          active
            ? 'bg-[var(--tavil-text)] text-[var(--tavil-bg)] border-[var(--tavil-text)]'
            : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
        )}
      >
        <span className="max-w-[200px] truncate">{label}</span>
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          zIndex: 50, minWidth: 220, maxHeight: 320, overflowY: 'auto',
          background: 'var(--tavil-card)',
          border: '1px solid var(--tavil-border)',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(34,39,37,0.14)',
        }}>
          {options.map((opt, i) => {
            const checked = value.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', background: 'transparent', border: 'none',
                  borderBottom: i < options.length - 1 ? '1px solid var(--tavil-border)' : 'none',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--tavil-bgAlt)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Custom checkbox */}
                <span style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: checked ? 'var(--tavil-text)' : 'transparent',
                  border: checked ? '1.5px solid var(--tavil-text)' : '1.5px solid var(--tavil-border)',
                  transition: 'background 120ms, border-color 120ms',
                }}>
                  {checked && <Check size={10} strokeWidth={3} color="var(--tavil-bg)" />}
                </span>
                <span style={{ fontSize: 13.5, color: 'var(--tavil-text)', fontWeight: checked ? 500 : 400 }}>
                  {opt}
                </span>
              </button>
            );
          })}

          {active && (
            <div style={{
              padding: '8px 14px', borderTop: '1px solid var(--tavil-border)',
              display: 'flex', justifyContent: 'flex-end',
            }}>
              <button
                onClick={clear}
                style={{
                  fontSize: 12, fontWeight: 500, color: 'var(--tavil-muted)',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  padding: '2px 0', textDecoration: 'underline',
                }}
              >
                Esborra filtres
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
