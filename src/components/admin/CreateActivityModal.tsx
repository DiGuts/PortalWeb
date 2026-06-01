import React, { useState, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { apiCreateActivity, Activity } from '../../api';
import { AField, AInput, ATextarea, ASelect, AdminCreateModalShell } from './primitives';
import { useConfirm } from '../ConfirmDialog';

const CATEGORY_OPTIONS = ['Cultura', 'Esport', 'Formació', 'Jornada', 'Salut', 'Voluntariat', 'Social'];

export function CreateActivityModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: Activity) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [locationTouched, setLocationTouched] = useState(false);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [capacity, setCapacity] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  useEffect(() => {
    if (open) {
      setTitle(''); setTitleTouched(false); setDescription(''); setDate(today); setTime('10:00');
      setLocation(''); setLocationTouched(false); setCategory(CATEGORY_OPTIONS[0]); setCapacity(20);
      setError(null); setSaving(false);
    }
  }, [open]);

  const isDirty = title.trim() !== '' || description.trim() !== '' || location.trim() !== '';
  const titleError = titleTouched && !title.trim();
  const locationError = locationTouched && !location.trim();

  const handleClose = async () => {
    if (!isDirty) { onClose(); return; }
    const ok = await confirm({ title: 'Descartar canvis?', message: 'Hi ha dades al formulari que es perdran.', confirmLabel: 'Sí, descarta', cancelLabel: 'Torna al formulari', destructive: true });
    if (ok) onClose();
  };

  const submit = async () => {
    setTitleTouched(true); setLocationTouched(true);
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
    <>
      <AdminCreateModalShell
        open={open} onClose={handleClose} onSubmit={submit}
        title="Crea una activitat" kicker="NOVA ACTIVITAT"
        saveLabel="Crea activitat" savingLabel="Creant…"
        saving={saving} error={error}
      >
        <AField label="Títol" required error={titleError ? 'El títol és obligatori.' : undefined}>
          <AInput value={title} onChange={e => setTitle(e.target.value)} onBlur={() => setTitleTouched(true)} placeholder="Nom de l'activitat" hasError={titleError} />
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
        <AField label="Ubicació" required error={locationError ? 'La ubicació és obligatòria.' : undefined}>
          <AInput value={location} onChange={e => setLocation(e.target.value)} onBlur={() => setLocationTouched(true)} placeholder="Sala, edifici, ciutat…" icon={MapPin} hasError={locationError} />
        </AField>
      </AdminCreateModalShell>
      {confirmNode}
    </>
  );
}
