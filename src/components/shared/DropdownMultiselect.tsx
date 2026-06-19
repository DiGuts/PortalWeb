import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { cn } from '../../lib/cn';

interface Props {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  getLabel?: (opt: string) => string;
  align?: 'left' | 'right';
}

export function DropdownMultiselect({ options, value, onChange, placeholder, getLabel, align = 'left' }: Props) {
  const { t } = useTranslation();
  const labelFor = (opt: string) => (getLabel ? getLabel(opt) : opt);
  const resolvedPlaceholder = placeholder ?? t('directory.allOption');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setSearch(''); return; }
    setTimeout(() => searchRef.current?.focus(), 50);
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
    ? resolvedPlaceholder
    : value.length === 1
      ? labelFor(value[0])
      : value.length === 2
        ? value.map(labelFor).join(', ')
        : `${labelFor(value[0])}, ${labelFor(value[1])} +${value.length - 2}`;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 whitespace-nowrap',
          value.length > 0
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

      {value.length > 1 && (
        <button
          onClick={clear}
          aria-label={t('directory.clearFilters')}
          style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--tavil-accent-light)',
            border: '1px solid color-mix(in srgb, var(--tavil-accent) 30%, transparent)',
            color: 'var(--tavil-accent)',
            cursor: 'pointer', transition: 'background 140ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--tavil-accent-light) 60%, var(--tavil-accent) 15%)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--tavil-accent-light)'; }}
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      )}

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          ...(align === 'right' ? { right: 0 } : { left: 0 }),
          zIndex: 50, minWidth: 260, maxWidth: 340,
          background: 'var(--tavil-card)',
          border: '1px solid var(--tavil-border)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(34,39,37,0.14)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', padding: '10px 10px 8px', borderBottom: '1px solid var(--tavil-border)', flexShrink: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 22, top: '50%', transform: 'translateY(-6px)', color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('directory.searchDept')}
              style={{
                width: '100%', height: 34, paddingLeft: 30, paddingRight: 10,
                background: 'var(--tavil-bgAlt)', border: '1px solid var(--tavil-border)',
                borderRadius: 7, fontSize: 13, color: 'var(--tavil-text)', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
          {/* Options list */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {options.filter(opt => !search || labelFor(opt).toLowerCase().includes(search.toLowerCase())).map((opt, i, arr) => {
              const checked = value.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggle(opt)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', background: 'transparent', border: 'none',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--tavil-border)' : 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--tavil-bgAlt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: checked ? 'var(--tavil-text)' : 'transparent',
                    border: checked ? '1.5px solid var(--tavil-text)' : '1.5px solid var(--tavil-border)',
                    transition: 'background 120ms, border-color 120ms',
                  }}>
                    {checked && <Check size={10} strokeWidth={3} color="var(--tavil-bg)" />}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--tavil-text)', fontWeight: checked ? 500 : 400, lineHeight: 1.3 }}>
                    {labelFor(opt)}
                  </span>
                </button>
              );
            })}
            {options.filter(opt => !search || labelFor(opt).toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--tavil-faint)', fontSize: 13 }}>{t('directory.noResultsShort')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
