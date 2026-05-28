import React, { useState, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { apiCreateActivity, Activity } from '../../api';
import { AField, AInput, ATextarea, ASelect, AdminCreateModalShell } from './primitives';

const CATEGORY_OPTIONS = ['Cultura', 'Esport', 'Formació', 'Jornada', 'Salut', 'Voluntariat', 'Social'];

export function CreateActivityModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: Activity) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [capacity, setCapacity] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(''); setDescription(''); setDate(today); setTime('10:00');
      setLocation(''); setCategory(CATEGORY_OPTIONS[0]); setCapacity(20);
      setError(null); setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!title.trim()) { setError('Cal indicar el títol.'); return; }
    if (!location.trim()) { setError('Cal indicar la ubicació.'); return; }
    if (capacity < 1) { setError("L'aforament ha de ser mínim 1."); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiCreateActivity({
        title: title.trim(), description: description.trim(),
        date, time, location: location.trim(), category, capacity,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Error creant activitat');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCreateModalShell
      open={open} onClose={onClose} onSubmit={submit}
      title="Crea una activitat" kicker="NOVA ACTIVITAT"
      saveLabel="Crea activitat" savingLabel="Creant…"
      saving={saving} error={error}
    >
      <AField label="Títol">
        <AInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom de l'activitat" />
      </AField>
      <AField label="Descripció">
        <ATextarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Breu descripció" />
      </AField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AField label="Data">
          <AInput type="date" value={date} onChange={e => setDate(e.target.value)} />
        </AField>
        <AField label="Hora">
          <AInput type="time" value={time} onChange={e => setTime(e.target.value)} icon={Clock} />
        </AField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AField label="Categoria">
          <ASelect value={category} onChange={e => setCategory(e.target.value)} options={CATEGORY_OPTIONS} />
        </AField>
        <AField label="Aforament">
          <AInput type="number" value={capacity} onChange={e => setCapacity(Math.max(0, +e.target.value))} />
        </AField>
      </div>
      <AField label="Ubicació">
        <AInput value={location} onChange={e => setLocation(e.target.value)} placeholder="Sala, edifici, ciutat…" icon={MapPin} />
      </AField>
    </AdminCreateModalShell>
  );
}
