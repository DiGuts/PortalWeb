import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { DEPT_ORDER } from '../../lib/depts';

export function DeptSearch({ value, onChange, allDepts = DEPT_ORDER }: {
  value: string[];
  onChange: (v: string[]) => void;
  allDepts?: string[];
}) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = allDepts.filter(d => !value.includes(d) && d.toLowerCase().includes(q.toLowerCase()));

  const add = (d: string) => { onChange([...value, d]); setQ(''); inputRef.current?.focus(); };
  const remove = (d: string) => onChange(value.filter(x => x !== d));

  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {value.map(d => (
            <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, background: 'var(--tavil-text)', color: 'var(--tavil-bg)', borderRadius: 999, padding: '3px 10px' }}>
              {d}
              <button type="button" onClick={() => remove(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={value.length === 0 ? 'Cerca departament...' : 'Afegir departament...'}
          style={{ width: '100%', borderRadius: 8, border: '1px solid var(--tavil-border)', padding: '8px 10px 8px 30px', fontSize: 13, background: 'var(--tavil-bg)', color: 'var(--tavil-text)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      {q.length > 0 && filtered.length > 0 && (
        <div style={{ marginTop: 4, borderRadius: 8, border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)', boxShadow: '0 4px 12px rgba(34,39,37,0.10)', overflow: 'hidden' }}>
          {filtered.slice(0, 8).map((d, i) => (
            <button key={d} type="button" onClick={() => add(d)}
              style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', borderBottom: i < Math.min(filtered.length, 8) - 1 ? '1px solid var(--tavil-border)' : 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--tavil-text)', fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--tavil-bgAlt)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{d}</button>
          ))}
        </div>
      )}
      {value.length === 0 && q.length === 0 && (
        <p style={{ fontSize: 11.5, color: 'var(--tavil-faint)', marginTop: 5 }}>Si no en selecciones cap, serà visible per a tothom.</p>
      )}
    </div>
  );
}
