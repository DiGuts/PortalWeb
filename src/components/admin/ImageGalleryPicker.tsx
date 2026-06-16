import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { apiGetImages, apiUploadImage, apiDeleteImage, apiDedupImages } from '../../api';
import { T, F_BODY, F_DISPLAY, ABtn, resolveUploadUrl } from './primitives';
import { useConfirm } from '../ConfirmDialog';

export function ImageGalleryPicker({ open, selected, onPick, onClose, allowManage = false }: {
  open: boolean;
  selected?: string;
  onPick: (url: string) => void;
  onClose: () => void;
  allowManage?: boolean;
}) {
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { confirm, confirmNode } = useConfirm();

  const refresh = () => {
    setLoading(true);
    apiGetImages().then(setImages).catch(() => setImages([])).finally(() => setLoading(false));
  };

  useEffect(() => { if (open) refresh(); }, [open]);

  if (!open) return null;

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const url = await apiUploadImage(file);
      const m = url.match(/(\/uploads\/[^?#]+)/);
      const rel = m ? m[1] : url;
      refresh();
      onPick(rel);
    } catch (e: any) { alert(e?.message ?? 'Error pujant'); }
    finally { setUploading(false); }
  };

  const remove = async (name: string) => {
    const ok = await confirm(`Vols eliminar la imatge "${name}"? Aquesta acció no es pot desfer.`);
    if (!ok) return;
    try { await apiDeleteImage(name); refresh(); }
    catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  const dedup = async () => {
    const ok = await confirm({
      message: 'Vols eliminar totes les imatges duplicades de la galeria?',
      title: 'Eliminar duplicats',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    try {
      const r = await apiDedupImages();
      await confirm({
        message: `Eliminades ${r.removed_count} imatges duplicades.`,
        title: 'Fet',
        confirmLabel: 'D’acord',
        cancelLabel: 'Tanca',
        destructive: false,
      });
      refresh();
    } catch (e: any) { alert(e?.message ?? 'Error'); }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(34,39,37,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: F_BODY,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
        width: 'min(960px, 92vw)', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px -20px rgba(34,39,37,0.40)',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3 }}>GALERIA</div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 22, fontWeight: 500, color: T.text }}>Imatges del portal</div>
          </div>
          <ABtn variant="secondary" size="sm" icon={Plus} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Pujant…' : 'Puja nova'}
          </ABtn>
          {allowManage && <ABtn variant="ghost" size="sm" onClick={dedup}>Eliminar duplicats</ABtn>}
          <button onClick={onClose} aria-label="Tanca" style={{
            width: 28, height: 28, borderRadius: 14, background: 'transparent', border: 'none',
            cursor: 'pointer', color: T.textFaint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16} /></button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); (e.target as HTMLInputElement).value = ''; }} />
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.textFaint, fontSize: 13 }}>Carregant…</div>
          ) : images.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.textFaint, fontSize: 13 }}>Encara no hi ha imatges. Puja la primera.</div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10,
            }}>
              {images.map(img => {
                const isSel = selected === img.url;
                return (
                  <div key={img.url} style={{ position: 'relative' }}>
                    <button
                      onClick={() => onPick(img.url)}
                      style={{
                        display: 'block', width: '100%', aspectRatio: '4/3',
                        padding: 0, border: `2px solid ${isSel ? T.accent : T.border}`,
                        borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                        background: T.bgAlt,
                      }}
                    >
                      <img src={resolveUploadUrl(img.url)} alt={img.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                    {allowManage && (
                      <button
                        onClick={() => remove(img.name)}
                        aria-label={`Eliminar ${img.name}`}
                        title="Eliminar"
                        style={{
                          position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11,
                          background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      ><X size={12} /></button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {confirmNode}
      </div>
    </div>,
    document.body
  );
}
