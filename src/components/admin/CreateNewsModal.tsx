import React, { useState, useEffect } from 'react';
import { apiCreateNews, NewsArticle } from '../../api';
import { AField, AInput, ATextarea, ASelect, AToggle, AdminCreateModalShell } from './primitives';
import { DatePicker } from '../shared/AgendaPickers';
import { useConfirm } from '../ConfirmDialog';

const CATEGORY_OPTIONS = ['Comunicats interns', 'Notícies corporatives', 'Recursos humans', 'Esdeveniments', 'Innovació', 'Seguretat'];

export function CreateNewsModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: NewsArticle) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState(today);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  useEffect(() => {
    if (open) {
      setTitle(''); setTitleTouched(false); setCategory(CATEGORY_OPTIONS[0]);
      setSummary(''); setDate(today); setFeatured(false); setActive(true);
      setError(null); setSaving(false);
    }
  }, [open]);

  const isDirty = title.trim() !== '' || summary.trim() !== '';
  const titleError = titleTouched && !title.trim();

  const handleClose = async () => {
    if (!isDirty) { onClose(); return; }
    const ok = await confirm({ title: 'Descartar canvis?', message: 'Hi ha dades al formulari que es perdran.', confirmLabel: 'Sí, descarta', cancelLabel: 'Torna al formulari', destructive: true });
    if (ok) onClose();
  };

  const submit = async () => {
    setTitleTouched(true);
    if (!title.trim()) { setError('Cal indicar el títol.'); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiCreateNews({
        title: title.trim(), category, summary: summary.trim(),
        content: '[]', date, image: '', featured: featured ? 1 : 0, active: active ? 1 : 0,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Error creant article');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminCreateModalShell
        open={open} onClose={handleClose} onSubmit={submit}
        title="Crea un article" kicker="NOVA NOTÍCIA"
        saveLabel="Crea article" savingLabel="Creant…"
        saving={saving} error={error}
        footerNote="Després de crear-lo, s'obrirà l'editor extens per al cos."
      >
        <AField label="Títol" required error={titleError ? 'El títol és obligatori.' : undefined}>
          <AInput value={title} onChange={e => setTitle(e.target.value)} onBlur={() => setTitleTouched(true)} placeholder="Títol de l'article (CA)" hasError={titleError} />
        </AField>
        <AField label="Resum" hint="1–2 frases que apareixen a la llista i a l'inici.">
          <ATextarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Resum breu" />
        </AField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <AField label="Categoria">
            <ASelect value={category} onChange={e => setCategory(e.target.value)} options={CATEGORY_OPTIONS} />
          </AField>
          <AField label="Data">
            <DatePicker value={date} onChange={setDate} />
          </AField>
        </div>
        <AToggle value={active} onChange={setActive} label="Activa" hint="Si està activada, l'article és visible a la pàgina de notícies." />
        <AToggle value={featured} onChange={setFeatured} label="Destacada" hint="Si està activada, apareix al carrusel de portada. Requereix que l'article estigui actiu." />
      </AdminCreateModalShell>
      {confirmNode}
    </>
  );
}
