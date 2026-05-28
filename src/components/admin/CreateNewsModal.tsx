import React, { useState, useEffect } from 'react';
import { apiCreateNews, NewsArticle } from '../../api';
import { AField, AInput, ATextarea, ASelect, AToggle, AdminCreateModalShell } from './primitives';

const CATEGORY_OPTIONS = ['Comunicats interns', 'Notícies corporatives', 'Recursos humans', 'Esdeveniments', 'Innovació', 'Seguretat'];

export function CreateNewsModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: NewsArticle) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState(today);
  const [featured, setFeatured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(''); setCategory(CATEGORY_OPTIONS[0]); setSummary('');
      setDate(today); setFeatured(false); setError(null); setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!title.trim()) { setError('Cal indicar el títol.'); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiCreateNews({
        title: title.trim(), category, summary: summary.trim(),
        content: '[]', date, image: '', featured: featured ? 1 : 0,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Error creant article');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCreateModalShell
      open={open} onClose={onClose} onSubmit={submit}
      title="Crea un article" kicker="NOVA NOTÍCIA"
      saveLabel="Crea article" savingLabel="Creant…"
      saving={saving} error={error}
      footerNote="Després de crear-lo, s'obrirà l'editor extens per al cos."
    >
      <AField label="Títol">
        <AInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Títol de l'article (CA)" />
      </AField>
      <AField label="Resum" hint="1–2 frases que apareixen a la llista i a l'inici.">
        <ATextarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Resum breu" />
      </AField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <AField label="Categoria">
          <ASelect value={category} onChange={e => setCategory(e.target.value)} options={CATEGORY_OPTIONS} />
        </AField>
        <AField label="Data">
          <AInput type="date" value={date} onChange={e => setDate(e.target.value)} />
        </AField>
      </div>
      <AToggle
        value={featured} onChange={setFeatured}
        label="Destacada (publicada al portal)"
        hint="Quan està activa, apareix al feed d'Inici i a Notícies."
      />
    </AdminCreateModalShell>
  );
}
