import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { apiCreateExternalCourse } from '../../api';
import { AField, AInput, ATextarea, ASelect, AToggle, AChipMulti, AdminCreateModalShell } from './primitives';

const CATEGORY_OPTIONS = ['Seguretat', 'Qualitat', 'Sistemes', 'Comercial', 'Compliance', 'Acollida', 'Producció', 'Habilitats', 'Idiomes', 'Altres'];
const DEPT_OPTIONS = ['Direcció', 'Persones', 'Comercial', 'Finances', 'IT', 'Producció', 'Sostenibilitat', 'Comunicacions', 'Formacions'];

export function CreateExternalCourseModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: { id: number }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [hours, setHours] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [depts, setDepts] = useState<string[]>([]);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(''); setDescription(''); setUrl(''); setCategory(CATEGORY_OPTIONS[0]);
      setHours(''); setMandatory(false); setDepts([]);
      setStartAt(''); setEndAt('');
      setError(null); setSaving(false);
    }
  }, [open]);

  const submit = async () => {
    if (!title.trim()) { setError('Cal indicar el títol.'); return; }
    if (!url.trim()) { setError("Cal una URL externa del curs."); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiCreateExternalCourse({
        title: title.trim(), description: description.trim(),
        url: url.trim(), category, hours: hours.trim(),
        mandatory: mandatory ? 1 : 0,
        departments: depts, target_users: [],
        start_at: startAt || null, end_at: endAt || null,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Error creant formació');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCreateModalShell
      open={open} onClose={onClose} onSubmit={submit}
      title="Crea una formació externa" kicker="NOVA FORMACIÓ EXTERNA"
      saveLabel="Crea formació" savingLabel="Creant…"
      saving={saving} error={error}
      footerNote="El curs s'obre a una URL externa."
    >
      <AField label="Títol">
        <AInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom de la formació" />
      </AField>
      <AField label="Descripció">
        <ATextarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Breu descripció del contingut" />
      </AField>
      <AField label="URL del curs">
        <AInput value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" type="url" icon={ExternalLink} />
      </AField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AField label="Categoria">
          <ASelect value={category} onChange={e => setCategory(e.target.value)} options={CATEGORY_OPTIONS} />
        </AField>
        <AField label="Durada">
          <AInput value={hours} onChange={e => setHours(e.target.value)} placeholder="p.ex. 6h" />
        </AField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AField label="Inici">
          <AInput type="date" value={startAt} onChange={e => setStartAt(e.target.value)} />
        </AField>
        <AField label="Final (opcional)">
          <AInput type="date" value={endAt} onChange={e => setEndAt(e.target.value)} />
        </AField>
      </div>
      <AToggle
        value={mandatory} onChange={setMandatory}
        label="Formació obligatòria"
        hint="Tots els destinataris l'han de completar."
      />
      <AField label="Departaments destinataris" hint="Si no en selecciones cap, és visible per a tothom.">
        <AChipMulti
          value={depts} onChange={setDepts}
          options={DEPT_OPTIONS.map(d => ({ value: d, label: d }))}
        />
      </AField>
    </AdminCreateModalShell>
  );
}
