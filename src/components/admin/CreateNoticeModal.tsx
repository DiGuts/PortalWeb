import React, { useState, useEffect } from 'react';
import { apiCreateNotice, Notice } from '../../api';
import { AField, AInput, ATextarea, ASelect, AToggle, AdminCreateModalShell } from './primitives';
import { useConfirm } from '../ConfirmDialog';

const KIND_OPTIONS = ['warning', 'danger', 'neutral'];

export function CreateNoticeModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: Notice) => void;
}) {
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [content, setContent] = useState('');
  const [contentTouched, setContentTouched] = useState(false);
  const [link, setLink] = useState('');
  const [linkText, setLinkText] = useState('');
  const [kind, setKind] = useState<Notice['kind']>('warning');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  useEffect(() => {
    if (open) {
      setTitle(''); setTitleTouched(false); setContent(''); setContentTouched(false);
      setLink(''); setLinkText(''); setKind('warning'); setActive(true);
      setError(null); setSaving(false);
    }
  }, [open]);

  const isDirty = title.trim() !== '' || content.trim() !== '' || link.trim() !== '';
  const titleError = titleTouched && !title.trim();
  const contentError = contentTouched && !content.trim();

  const handleClose = async () => {
    if (!isDirty) { onClose(); return; }
    const ok = await confirm({ title: 'Descartar canvis?', message: 'Hi ha dades al formulari que es perdran.', confirmLabel: 'Sí, descarta', cancelLabel: 'Torna al formulari', destructive: true });
    if (ok) onClose();
  };

  const submit = async () => {
    setTitleTouched(true); setContentTouched(true);
    if (!title.trim()) { setError('Cal indicar el títol.'); return; }
    if (!content.trim()) { setError('Cal escriure el contingut.'); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiCreateNotice({
        title: title.trim(), content: content.trim(),
        link: link.trim(), link_text: linkText.trim(),
        active: active ? 1 : 0, kind,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Error creant avís');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminCreateModalShell
        open={open} onClose={handleClose} onSubmit={submit}
        title="Crea un avís" kicker="NOU AVÍS"
        saveLabel="Crea avís" savingLabel="Creant…"
        saving={saving} error={error}
      >
        <AField label="Títol" required error={titleError ? 'El títol és obligatori.' : undefined}>
          <AInput value={title} onChange={e => setTitle(e.target.value)} onBlur={() => setTitleTouched(true)} placeholder="Títol del banner" hasError={titleError} />
        </AField>
        <AField label="Contingut" required hint="Text breu, visible al portal." error={contentError ? 'El contingut és obligatori.' : undefined}>
          <ATextarea rows={3} value={content} onChange={e => setContent(e.target.value)} onBlur={() => setContentTouched(true)} placeholder="Missatge de l'avís" hasError={contentError} />
        </AField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <AField label="Enllaç (opcional)">
            <AInput value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" />
          </AField>
          <AField label="Text de l'enllaç">
            <AInput value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Llegir més" />
          </AField>
        </div>
        <AField label="Tipus" hint="Determina el color del banner al portal.">
          <ASelect value={kind} onChange={e => setKind(e.target.value as Notice['kind'])} options={KIND_OPTIONS} />
        </AField>
        <AToggle value={active} onChange={setActive} label="Actiu (visible al portal)" hint="Quan està desactivat, l'avís queda arxivat però no es mostra." />
      </AdminCreateModalShell>
      {confirmNode}
    </>
  );
}
