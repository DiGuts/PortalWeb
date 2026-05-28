import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { apiCreateAgendaEvent, AgendaEvent } from '../../api';
import { AField, AInput, ASelect, AChipMulti, AdminCreateModalShell } from './primitives';

const TYPE_OPTIONS = ['Sessió interna', 'Visita comercial', 'Fira', 'Festiu', 'Activitat empresa'];
const DEPT_OPTIONS = ['Direcció', 'Persones', 'Comercial', 'Finances', 'IT', 'Producció', 'Sostenibilitat', 'Comunicacions', 'Formacions'];

export function CreateAgendaModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: AgendaEvent) => void;
}) {
  const now = new Date();
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(now.getDate());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [time, setTime] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [depts, setDepts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const d = new Date();
      setTitle(''); setDay(d.getDate()); setMonth(d.getMonth() + 1);
      setTime('09:00'); setTimeEnd(''); setLocation('');
      setType(TYPE_OPTIONS[0]); setDepts([]);
      setError(null); setSaving(false);
    }
  }, [open]);

  const submit = async () => {
    if (!title.trim()) { setError('Cal indicar el títol.'); return; }
    if (day < 1 || day > 31) { setError('Dia no vàlid.'); return; }
    if (month < 1 || month > 12) { setError('Mes no vàlid.'); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiCreateAgendaEvent({
        title: title.trim(), day, month, time,
        time_end: timeEnd.trim() || undefined,
        location: location.trim(), type, target_departments: depts,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Error creant esdeveniment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCreateModalShell
      open={open} onClose={onClose} onSubmit={submit}
      title="Crea un esdeveniment" kicker="NOU ESDEVENIMENT"
      saveLabel="Crea esdeveniment" savingLabel="Creant…"
      saving={saving} error={error}
    >
      <AField label="Títol">
        <AInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom de l'esdeveniment" />
      </AField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AField label="Dia">
          <AInput type="number" value={day} onChange={e => setDay(+e.target.value)} />
        </AField>
        <AField label="Mes">
          <AInput type="number" value={month} onChange={e => setMonth(+e.target.value)} />
        </AField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AField label="Hora inici">
          <AInput type="time" value={time} onChange={e => setTime(e.target.value)} />
        </AField>
        <AField label="Hora final" hint="Opcional.">
          <AInput type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} />
        </AField>
      </div>
      <AField label="Ubicació">
        <AInput value={location} onChange={e => setLocation(e.target.value)} placeholder="Sala, edifici, ciutat…" icon={MapPin} />
      </AField>
      <AField label="Tipus">
        <ASelect value={type} onChange={e => setType(e.target.value)} options={TYPE_OPTIONS} />
      </AField>
      <AField label="Departaments destinataris" hint="Si no en selecciones cap, és visible per a tothom.">
        <AChipMulti
          value={depts} onChange={setDepts}
          options={DEPT_OPTIONS.map(d => ({ value: d, label: d }))}
        />
      </AField>
    </AdminCreateModalShell>
  );
}
