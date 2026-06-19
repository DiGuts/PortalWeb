import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { apiCreateQuiz, apiCreateExternalCourse } from '../../api';
import { AField, AInput, ATextarea, AToggle, ASegmented, AdminCreateModalShell } from './primitives';
import { useConfirm } from '../ConfirmDialog';
import { DeptSearch } from './DeptSearch';

export function CreateFormacioModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (kind: 'quiz' | 'external', id: number, isPresential: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [url, setUrl] = useState('');
  const [urlTouched, setUrlTouched] = useState(false);
  const [modality, setModality] = useState<string>('');
  const [depts, setDepts] = useState<string[]>([]);
  const [mandatory, setMandatory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  useEffect(() => {
    if (open) {
      setTitle(''); setTitleTouched(false); setDescription('');
      setIsExternal(false); setUrl(''); setUrlTouched(false);
      setModality(''); setDepts([]); setMandatory(false);
      setError(null); setSaving(false);
    }
  }, [open]);

  const isDirty = title.trim() !== '' || description.trim() !== '' || url.trim() !== '' || depts.length > 0;
  const titleError = titleTouched && !title.trim();
  const urlError = isExternal && urlTouched && !url.trim();

  const handleClose = async () => {
    if (!isDirty) { onClose(); return; }
    const ok = await confirm({ title: 'Descartar canvis?', message: 'Hi ha dades al formulari que es perdran.', confirmLabel: 'Sí, descarta', cancelLabel: 'Torna al formulari', destructive: true });
    if (ok) onClose();
  };

  const submit = async () => {
    setTitleTouched(true);
    if (isExternal) setUrlTouched(true);
    if (!title.trim()) { setError('Cal indicar el títol.'); return; }
    if (isExternal && !url.trim()) { setError('Cal una URL externa del curs.'); return; }
    setError(null); setSaving(true);
    try {
      if (isExternal) {
        const created = await apiCreateExternalCourse({
          title: title.trim(), description: description.trim(),
          url: url.trim(), category: '', hours: '',
          mandatory: mandatory ? 1 : 0,
          departments: depts, target_users: [],
          start_at: null, end_at: null,
        });
        onCreated('external', created.id, false);
      } else {
        const created = await apiCreateQuiz({
          title: title.trim(), description: description.trim(),
          image: '', category: '', time_limit: 0, passing_score: 70,
          mandatory: mandatory ? 1 : 0, active: 1,
          start_at: null, end_at: null,
          target_departments: depts, target_users: [],
          is_presential: modality === 'presencial' ? 1 : 0,
          modality: modality,
          location: '',
          questions: [],
        });
        onCreated('quiz', created.id, modality === 'presencial');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error creant formació');
    } finally {
      setSaving(false);
    }
  };

  const footerNote = isExternal ? "El curs s'obre a una URL externa." : modality === 'presencial' ? "S'obrirà l'editor de contingut." : "S'obrirà l'editor de preguntes.";

  return (
    <>
      <AdminCreateModalShell
        open={open} onClose={handleClose} onSubmit={submit}
        title="Nova formació" kicker="NOVA FORMACIÓ"
        saveLabel="Crea formació" savingLabel="Creant…"
        saving={saving} error={error}
        footerNote={footerNote}
      >
        <AField label="Títol" required error={titleError ? 'El títol és obligatori.' : undefined}>
          <AInput value={title} onChange={e => setTitle(e.target.value)} onBlur={() => setTitleTouched(true)} placeholder="Nom de la formació" hasError={titleError} />
        </AField>
        <AField label="Descripció">
          <ATextarea rows={3} maxLength={400} value={description} onChange={e => setDescription(e.target.value)} placeholder="Breu descripció del contingut" />
        </AField>
        <AToggle value={isExternal} onChange={setIsExternal} label="Formació externa" hint="El curs s'obre a una URL externa." />
        {isExternal && (
          <AField label="URL del curs" required error={urlError ? 'La URL és obligatòria.' : undefined}>
            <AInput value={url} onChange={e => setUrl(e.target.value)} onBlur={() => setUrlTouched(true)} placeholder="https://…" type="url" icon={ExternalLink} hasError={urlError} />
          </AField>
        )}
        {!isExternal && (
          <AField label="Modalitat">
            <ASegmented
              value={modality}
              onChange={setModality}
              options={[
                { value: '', label: 'Cap' },
                { value: 'presencial', label: 'Presencial' },
                { value: 'online', label: 'Online' },
                { value: 'hibrida', label: 'Híbrida' },
              ]}
            />
          </AField>
        )}
        <AToggle value={mandatory} onChange={setMandatory} label="Formació obligatòria" hint="Tots els destinataris l'han de completar." />
        <AField label="Departaments destinataris" hint="Si no en selecciones cap, és visible per a tothom.">
          <DeptSearch value={depts} onChange={setDepts} />
        </AField>
      </AdminCreateModalShell>
      {confirmNode}
    </>
  );
}
