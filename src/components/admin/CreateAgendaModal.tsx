import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { apiCreateAgendaEvent, apiUpdateAgendaEvent, AgendaEvent } from '../../api';
import { AField, AInput, ASelect, AdminCreateModalShell } from './primitives';
import { DatePicker } from '../shared/AgendaPickers';
import { useConfirm } from '../ConfirmDialog';
import { DeptSearch } from './DeptSearch';

const TYPE_OPTIONS = ['Sessió interna', 'Visita comercial', 'Fira', 'Festiu', 'Activitat empresa'];

// ── Shared form fields ────────────────────────────────────────────────────
interface FormState {
  title: string; date: string; time: string; timeEnd: string;
  location: string; type: string; depts: string[];
}

function AgendaFormFields({ form, setForm, dateError, setDateError, titleTouched, setTitleTouched }: {
  form: FormState;
  setForm: (patch: Partial<FormState>) => void;
  dateError: boolean;
  setDateError: (v: boolean) => void;
  titleTouched: boolean;
  setTitleTouched: (v: boolean) => void;
}) {
  const titleError = titleTouched && !form.title.trim();

  return (
    <>
      <AField label="Títol" required error={titleError ? "El títol és obligatori." : undefined}>
        <AInput
          value={form.title}
          onChange={e => setForm({ title: (e as React.ChangeEvent<HTMLInputElement>).target.value })}
          onBlur={() => setTitleTouched(true)}
          placeholder="Nom de l'esdeveniment"
          hasError={titleError}
        />
      </AField>

      <AField label="Data" required error={dateError ? "La data és obligatòria." : undefined}>
        <DatePicker
          value={form.date}
          onChange={v => { setForm({ date: v }); if (dateError && v) setDateError(false); }}
          onClose={() => { if (!form.date) setDateError(true); }}
          error={dateError}
        />
      </AField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AField label="Hora inici" hint="Opcional. Buit = dia sencer.">
          <AInput
            type="time" value={form.time}
            onChange={e => setForm({ time: (e as React.ChangeEvent<HTMLInputElement>).target.value })}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              const v = e.target.value.trim();
              if (!v) return;
              if (/^\d{1,2}$/.test(v)) setForm({ time: v.padStart(2,'0') + ':00' });
              else if (/^\d{1,2}:$/.test(v)) setForm({ time: v.slice(0,-1).padStart(2,'0') + ':00' });
            }}
          />
        </AField>
        <AField label="Hora final" hint="Opcional.">
          <AInput
            type="time" value={form.timeEnd}
            onChange={e => setForm({ timeEnd: (e as React.ChangeEvent<HTMLInputElement>).target.value })}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              const v = e.target.value.trim();
              if (!v) return;
              if (/^\d{1,2}$/.test(v)) setForm({ timeEnd: v.padStart(2,'0') + ':00' });
              else if (/^\d{1,2}:$/.test(v)) setForm({ timeEnd: v.slice(0,-1).padStart(2,'0') + ':00' });
            }}
          />
        </AField>
      </div>

      <AField label="Ubicació">
        <AInput
          value={form.location}
          onChange={e => setForm({ location: (e as React.ChangeEvent<HTMLInputElement>).target.value })}
          placeholder="Sala, edifici, ciutat…"
          icon={MapPin}
        />
      </AField>

      <AField label="Tipus">
        <ASelect value={form.type} onChange={e => setForm({ type: (e as React.ChangeEvent<HTMLSelectElement>).target.value })} options={TYPE_OPTIONS} />
      </AField>

      <AField label="Departaments destinataris">
        <DeptSearch value={form.depts} onChange={depts => setForm({ depts })} />
      </AField>
    </>
  );
}

// ── CreateAgendaModal ──────────────────────────────────────────────────────
export function CreateAgendaModal({ open, onClose, onCreated, initialDate }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: AgendaEvent) => void;
  initialDate?: string;
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const blank = (): FormState => ({ title: '', date: initialDate ?? todayStr, time: '', timeEnd: '', location: '', type: TYPE_OPTIONS[0], depts: [] });
  const [form, setFormRaw] = useState<FormState>(blank);
  const setForm = (patch: Partial<FormState>) => setFormRaw(p => ({ ...p, ...patch }));
  const [dateError, setDateError] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  useEffect(() => {
    if (open) { setFormRaw(blank()); setDateError(false); setTitleTouched(false); setError(null); setSaving(false); }
  }, [open]);

  const isDirty = form.title.trim() !== '' || form.location.trim() !== '' || form.depts.length > 0 || form.timeEnd !== '';

  const handleClose = async () => {
    if (!isDirty) { onClose(); return; }
    const ok = await confirm({ title: 'Descartar canvis?', message: 'Hi ha dades al formulari que es perdran.', confirmLabel: 'Sí, descarta', cancelLabel: 'Torna al formulari', destructive: true });
    if (ok) onClose();
  };

  const submit = async () => {
    setTitleTouched(true);
    if (!form.title.trim()) { setError('Cal indicar el títol.'); return; }
    if (!form.date) { setDateError(true); setError('Cal seleccionar una data.'); return; }
    const [, mStr, dStr] = form.date.split('-');
    const day = parseInt(dStr, 10), month = parseInt(mStr, 10);
    if (!day || !month) { setDateError(true); setError('Data no vàlida.'); return; }
    const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (form.time && !timeRe.test(form.time)) { setError("Hora d'inici no vàlida."); return; }
    if (form.timeEnd && !timeRe.test(form.timeEnd)) { setError('Hora final no vàlida.'); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiCreateAgendaEvent({ title: form.title.trim(), day, month, time: form.time || '', time_end: form.timeEnd || undefined, location: form.location.trim(), type: form.type, target_departments: form.depts });
      onCreated(created);
    } catch (e: any) { setError(e?.message ?? 'Error creant esdeveniment'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <AdminCreateModalShell open={open} onClose={handleClose} onSubmit={submit} title="Crea un esdeveniment" kicker="NOU ESDEVENIMENT" saveLabel="Crea esdeveniment" savingLabel="Creant…" saving={saving} error={error}>
        <AgendaFormFields form={form} setForm={setForm} dateError={dateError} setDateError={setDateError} titleTouched={titleTouched} setTitleTouched={setTitleTouched} />
      </AdminCreateModalShell>
      {confirmNode}
    </>
  );
}

// ── EditAgendaModal ────────────────────────────────────────────────────────
export function EditAgendaModal({ open, onClose, onSave, saving, title, setTitle, date, setDate, time, setTime, timeEnd, setTimeEnd, location, setLocation, type, setType, depts, setDepts }: {
  open: boolean; onClose: () => void; onSave: () => void; saving: boolean;
  title: string; setTitle: (v: string) => void;
  date: string; setDate: (v: string) => void;
  time: string; setTime: (v: string) => void;
  timeEnd: string; setTimeEnd: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  type: string; setType: (v: string) => void;
  depts: string[]; setDepts: (v: string[]) => void;
}) {
  const [dateError, setDateError] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, confirmNode } = useConfirm();

  const form: FormState = { title, date, time, timeEnd, location, type, depts };
  const setForm = (patch: Partial<FormState>) => {
    if (patch.title !== undefined) setTitle(patch.title);
    if (patch.date !== undefined) setDate(patch.date);
    if (patch.time !== undefined) setTime(patch.time);
    if (patch.timeEnd !== undefined) setTimeEnd(patch.timeEnd);
    if (patch.location !== undefined) setLocation(patch.location);
    if (patch.type !== undefined) setType(patch.type);
    if (patch.depts !== undefined) setDepts(patch.depts);
  };

  const isDirty = true; // edit always has data

  const handleClose = async () => {
    const ok = await confirm({ title: 'Descartar canvis?', message: "Perdràs els canvis no desats.", confirmLabel: 'Sí, descarta', cancelLabel: 'Torna al formulari', destructive: true });
    if (ok) onClose();
  };

  const submit = async () => {
    setTitleTouched(true);
    if (!title.trim()) { setError('Cal indicar el títol.'); return; }
    if (!date) { setDateError(true); setError('Cal seleccionar una data.'); return; }
    setError(null);
    onSave();
  };

  return (
    <>
      <AdminCreateModalShell open={open} onClose={handleClose} onSubmit={submit} title="Edita l'esdeveniment" kicker="EDITAR ESDEVENIMENT" saveLabel="Desa canvis" savingLabel="Desant…" saving={saving} error={error}>
        <AgendaFormFields form={form} setForm={setForm} dateError={dateError} setDateError={setDateError} titleTouched={titleTouched} setTitleTouched={setTitleTouched} />
      </AdminCreateModalShell>
      {confirmNode}
    </>
  );
}
