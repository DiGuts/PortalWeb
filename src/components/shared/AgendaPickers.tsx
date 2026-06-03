import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, X, Calendar } from 'lucide-react';

const MONTHS_CA = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
const DAYS_SHORT = ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

// Semantic tokens (TAVIL Design System)
const C = {
  accent:      'var(--tavil-accent)',          // #bf211e Mahogany Red
  accentLight: 'var(--tavil-accent-light)',    // #f9eceb Ember Wash
  accentDark:  'var(--tavil-accent-dark)',     // #a21b18
  text:        'var(--tavil-text)',
  textBg:      'var(--tavil-bg)',              // for text-on-accent
  muted:       'var(--tavil-muted)',
  faint:       'var(--tavil-faint)',
  border:      'var(--tavil-border)',
  bg:          'var(--tavil-bg)',
  bgAlt:       'var(--tavil-bgAlt)',
  card:        'var(--tavil-card)',
  error:       '#c0392b',
  errorBg:     '#fdf0ef',
};

// ── DatePicker ────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string | null | undefined;   // 'YYYY-MM-DD', '' or null/undefined → treated as empty
  onChange: (v: string) => void;
  error?: boolean;
  onClose?: () => void;   // fires when picker closes without selecting (for touched tracking)
  placeholder?: string;
  minDate?: string;            // 'YYYY-MM-DD' — earliest selectable day (earlier days disabled)
  emphasizeSaturday?: boolean; // Saturday-request picker: Saturdays normal, every other day light grey
}

export function DatePicker({ value, onChange, error, onClose, placeholder = 'Selecciona data', minDate, emphasizeSaturday }: DatePickerProps) {
  const today = new Date();
  const safeVal = value ?? '';
  const _d = safeVal ? new Date(safeVal + 'T00:00:00') : null;
  const parsed = _d && !isNaN(_d.getTime()) ? _d : null;
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayMon = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const selectDay = (d: number) => {
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
    if (!value) onClose?.();
  };

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const label = parsed
    ? `${parsed.getDate()} de ${MONTHS_CA[parsed.getMonth()].toLowerCase()} de ${parsed.getFullYear()}`
    : placeholder;

  const triggerBorder = error ? C.error : open ? C.accent : C.border;
  const triggerBg = error && !parsed ? C.errorBg : C.bg;

  return (
    <div>
      <button
        type="button"
        onClick={() => open ? handleClose() : setOpen(true)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px', borderRadius: 10,
          border: `1.5px solid ${triggerBorder}`,
          background: triggerBg,
          color: parsed ? C.text : error ? C.error : C.faint,
          fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
          transition: 'border-color 150ms, background 150ms',
        }}
      >
        <Calendar size={15} style={{ color: error ? C.error : open ? C.accent : C.muted, flexShrink: 0, transition: 'color 150ms' }} />
        <span style={{ flex: 1 }}>{label}</span>
        <ChevronRight
          size={13}
          style={{ color: C.faint, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}
        />
      </button>
      {error && !parsed && (
        <p style={{ fontSize: 11.5, color: C.error, marginTop: 5, paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          Camp obligatori
        </p>
      )}

      {open && (
        <>
          {/* Backdrop to close */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={handleClose} />
          <div style={{
            position: 'relative', zIndex: 11,
            marginTop: 6, borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: C.card,
            boxShadow: '0 8px 32px rgba(34,39,37,0.14)',
            overflow: 'hidden',
          }}>
            {/* Month nav header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '10px 12px',
              background: C.bgAlt,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <button type="button" onClick={prev} style={navBtnStyle}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: C.text }}>
                {MONTHS_CA[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={next} style={navBtnStyle}>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 12px 0' }}>
              {DAYS_SHORT.map((d, i) => (
                <div key={d} style={{
                  textAlign: 'center', fontSize: 10.5, fontWeight: 700,
                  // Saturday-request picker: emphasize Ds (i=5), grey the rest.
                  color: emphasizeSaturday ? (i === 5 ? C.text : '#c2c6cc') : C.muted,
                  padding: '3px 0', letterSpacing: '0.06em',
                }}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '4px 12px 14px', gap: 2 }}>
              {Array.from({ length: firstDayMon }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const isSel = parsed?.getDate() === d && parsed?.getMonth() === viewMonth && parsed?.getFullYear() === viewYear;
                const isToday = today.getDate() === d && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
                const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const isDisabled = !!minDate && dayStr < minDate;
                const dow = new Date(viewYear, viewMonth, d).getDay(); // 0=Sun … 6=Sat
                // Saturday-request picker: emphasize Saturdays (normal colour), grey out
                // every other day. Only when it's a plain day (not selected/today/disabled).
                const weekendColor = emphasizeSaturday && dow !== 6 ? '#a8acb3' : null;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { if (!isDisabled) selectDay(d); }}
                    style={{
                      height: 36, width: '100%', borderRadius: 8,
                      border: 'none',
                      // Selected: tavil-accent. Today (unselected): ember-wash bg + accent text.
                      background: isSel ? C.accent : isToday && !isDisabled ? C.accentLight : 'transparent',
                      color: isDisabled ? C.faint : isSel ? '#fff' : isToday ? C.accent : weekendColor ?? C.text,
                      opacity: isDisabled ? 0.4 : 1,
                      fontSize: 13, fontWeight: isSel ? 700 : isToday ? 600 : 400,
                      cursor: isDisabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 100ms',
                      textDecoration: isDisabled ? 'line-through' : 'none',
                      // Hairline outline for today to reinforce identity
                      outline: isToday && !isSel && !isDisabled ? `1.5px solid ${C.accent}` : 'none',
                      outlineOffset: '-1.5px',
                    }}
                    onMouseEnter={e => { if (!isSel && !isToday && !isDisabled) (e.currentTarget).style.background = C.bgAlt; }}
                    onMouseLeave={e => { if (!isSel && !isToday && !isDisabled) (e.currentTarget).style.background = 'transparent'; }}
                  >{d}</button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: 'none',
  background: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--tavil-muted)',
};

// ── TimePicker ────────────────────────────────────────────────────────────────

interface TimePickerProps {
  value: string;         // 'HH:MM' or '' (empty = all-day)
  onChange: (v: string) => void;
  optional?: boolean;
  error?: boolean;
  placeholder?: string;
}

export function TimePicker({ value, onChange, optional = true, error, placeholder = 'Dia sencer (sense hora)' }: TimePickerProps) {
  const hour = value ? parseInt(value.split(':')[0], 10) : null;
  const min  = value ? parseInt(value.split(':')[1], 10) : 0;

  const setH = (h: number) => onChange(`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`);
  const setM = (m: number) => onChange(`${String(hour ?? 9).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  const init = () => onChange('09:00');
  const clear = () => onChange('');

  if (hour === null) {
    return (
      <button
        type="button"
        onClick={init}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 10,
          border: `1.5px dashed ${C.border}`,
          background: 'transparent',
          color: C.muted,
          fontSize: 13.5, fontFamily: 'inherit', cursor: 'pointer',
          transition: 'border-color 150ms, background 150ms',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = C.accentLight;
          (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent;
          (e.currentTarget as HTMLButtonElement).style.color = C.accent;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
          (e.currentTarget as HTMLButtonElement).style.color = C.muted;
        }}
      >
        <Clock size={14} style={{ flexShrink: 0, color: 'inherit' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{placeholder}</span>
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Afegir</span>
      </button>
    );
  }

  return (
    <div style={{
      borderRadius: 10,
      border: `1.5px solid ${C.accent}`,        // accent border = active state
      background: C.bg,
      padding: '10px 12px',
    }}>
      {/* Current value + clear */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <Clock size={13} style={{ color: C.accent, flexShrink: 0 }} />
        <span style={{
          fontSize: 17, fontWeight: 700, color: C.accent,
          fontFeatureSettings: '"tnum"', letterSpacing: '0.06em',
        }}>
          {String(hour).padStart(2,'0')}:{String(min).padStart(2,'0')}
        </span>
        {optional && (
          <button
            type="button"
            onClick={clear}
            style={{
              marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%',
              border: `1px solid ${C.border}`, background: C.bg,
              color: C.faint, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Hours strip */}
      <div style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Hora</div>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }} className="hide-sb">
        {HOURS.map(h => {
          const active = h === hour;
          return (
            <button
              key={h}
              type="button"
              onClick={() => setH(h)}
              style={{
                flexShrink: 0, minWidth: 36, height: 32, borderRadius: 7,
                border: active ? 'none' : `1px solid ${C.border}`,
                background: active ? C.accent : C.card,
                color: active ? '#fff' : C.muted,
                fontSize: 12, fontWeight: active ? 700 : 400,
                cursor: 'pointer', fontFamily: 'inherit', fontFeatureSettings: '"tnum"',
                transition: 'background 100ms',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget).style.background = C.accentLight; }}
              onMouseLeave={e => { if (!active) (e.currentTarget).style.background = C.card; }}
            >{String(h).padStart(2,'0')}</button>
          );
        })}
      </div>

      {/* Minutes */}
      <div style={{ fontSize: 10, fontWeight: 700, color: C.faint, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '8px 0 5px' }}>Minuts</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {MINUTES.map(m => {
          const active = m === min;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setM(m)}
              style={{
                flex: 1, height: 32, borderRadius: 7,
                border: active ? 'none' : `1px solid ${C.border}`,
                background: active ? C.accent : C.card,
                color: active ? '#fff' : C.muted,
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: 'pointer', fontFamily: 'inherit', fontFeatureSettings: '"tnum"',
                transition: 'background 100ms',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget).style.background = C.accentLight; }}
              onMouseLeave={e => { if (!active) (e.currentTarget).style.background = C.card; }}
            >:{String(m).padStart(2,'0')}</button>
          );
        })}
      </div>
    </div>
  );
}
