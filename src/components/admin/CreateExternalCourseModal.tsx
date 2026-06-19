import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { apiCreateExternalCourse } from '../../api';
import { AField, AInput, ATextarea, ASelect, AToggle, AdminCreateModalShell } from './primitives';
import { DatePicker } from '../shared/AgendaPickers';
import { useConfirm } from '../ConfirmDialog';
import { DeptSearch } from './DeptSearch';

const CATEGORY_OPTIONS = ['Seguretat', 'Qualitat', 'Sistemes', 'Comercial', 'Compliance', 'Acollida', 'Producció', 'Habilitats', 'Idiomes', 'Altres'];

export function CreateExternalCourseModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: { id: number }) => void;
}) {
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [hours, setHours] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [depts, setDepts] = useState<string[]>([]);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  useEffect(() => {
    if (open) {
      setTitle(''); setTitleTouched(false); setDescription(''); setUrl(''); setUrlTouched(false);
      setCategory(CATEGORY_OPTIONS[0]); setHours(''); setMandatory(false); setDepts([]);
      setStartAt(''); setEndAt(''); setError(null); setSaving(false);
    }
  }, [open]);

  const isDirty = title.trim() !== '' || url.trim() !== '' || description.trim() !== '' || depts.length > 0;
  const titleError = titleTouched && !title.trim();
  const urlError = urlTouched && !url.trim();

  const handleClose = async () => {
    if (!isDirty) { onClose(); return; }
    const ok = await confirm({ title: 'Descartar canvis?', message: 'Hi ha dades al formulari que es perdran.', confirmLabel: 'Sí, descarta', cancelLabel: 'Torna al formulari', destructive: true });
    if (ok) onClose();
  };

  const submit = async () => {
    setTitleTouched(true); setUrlTouched(true);
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
    <>
      <AdminCreateModalShell
        open={open} onClose={handleClose} onSubmit={submit}
        title="Crea una formació externa" kicker="NOVA FORMACIÓ EXTERNA"
        saveLabel="Crea formació" savingLabel="Creant…"
        saving={saving} error={error}
        footerNote="El curs s'obre a una URL externa."
      >
        <AField label="Títol" required error={titleError ? 'El títol és obligatori.' : undefined}>
          <AInput value={title} onChange={e => setTitle(e.target.value)} onBlur={() => setTitleTouched(true)} placeholder="Nom de la formació" hasError={titleError} />
        </AField>
        <AField label="Descripció">
          <ATextarea rows={3} maxLength={400} value={description} onChange={e => setDescription(e.target.value)} placeholder="Breu descripció del contingut" />
        </AField>
        <AField label="URL del curs" required error={urlError ? "La URL és obligatòria." : undefined}>
          <AInput value={url} onChange={e => setUrl(e.target.value)} onBlur={() => setUrlTouched(true)} placeholder="https://…" type="url" icon={ExternalLink} hasError={urlError} />
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
            <DatePicker value={startAt} onChange={setStartAt} />
          </AField>
          <AField label="Final (opcional)">
            <DatePicker value={endAt} onChange={setEndAt} />
          </AField>
        </div>
        <AToggle value={mandatory} onChange={setMandatory} label="Formació obligatòria" hint="Tots els destinataris l'han de completar." />
        <AField label="Departaments destinataris" hint="Si no en selecciones cap, és visible per a tothom.">
          <DeptSearch value={depts} onChange={setDepts} />
        </AField>
      </AdminCreateModalShell>
      {confirmNode}
    </>
  );
}
