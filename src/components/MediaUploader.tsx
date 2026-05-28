import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { apiUploadMedia } from '../api';

export type MediaKind = 'image' | 'video';

export interface MediaUploaderProps {
  value?: string;
  kind?: MediaKind;
  accept?: 'image' | 'video' | 'both';
  onChange: (url: string, kind: MediaKind) => void;
  onError?: (msg: string) => void;
  placeholder?: string;
  className?: string;
  /** Resolves a relative /uploads/... path to a full URL for preview. */
  resolveSrc?: (path: string) => string;
}

const ACCEPT_MAP: Record<NonNullable<MediaUploaderProps['accept']>, string> = {
  image: 'image/jpeg,image/png,image/gif,image/webp',
  video: 'video/mp4,video/webm,video/quicktime',
  both:  'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime',
};

export function MediaUploader({
  value,
  kind = 'image',
  accept = 'image',
  onChange,
  onError,
  placeholder,
  className,
  resolveSrc,
}: MediaUploaderProps) {
  const previewSrc = value ? (resolveSrc ? resolveSrc(value) : value) : '';
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    if (accept === 'image' && !file.type.startsWith('image/')) {
      onError?.('Només s\'accepten imatges'); return;
    }
    if (accept === 'video' && !file.type.startsWith('video/')) {
      onError?.('Només s\'accepten vídeos'); return;
    }
    setUploading(true); setProgress(0);
    try {
      const { url, kind: k } = await apiUploadMedia(file, setProgress);
      onChange(url, k);
    } catch (e) {
      onError?.((e as Error).message);
    } finally {
      setUploading(false); setProgress(0);
    }
  }, [accept, onChange, onError]);

  const onFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  const clear = () => onChange('', kind);

  if (value && !uploading) {
    return (
      <div className={`relative inline-block rounded-xl overflow-hidden border border-[var(--tavil-border)] ${className ?? ''}`}>
        {kind === 'video' ? (
          <video src={previewSrc} controls style={{ maxWidth: '100%', maxHeight: 280, display: 'block' }} />
        ) : (
          <img src={previewSrc} alt="" style={{ maxWidth: '100%', maxHeight: 280, display: 'block' }} />
        )}
        <button
          type="button"
          onClick={clear}
          aria-label="Eliminar"
          style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff',
                   border: 'none', borderRadius: 999, width: 26, height: 26, display: 'flex',
                   alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        ><X size={14} /></button>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={className}
      style={{
        border: `2px dashed ${dragging ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
        borderRadius: 12,
        padding: '24px 16px',
        textAlign: 'center',
        cursor: uploading ? 'wait' : 'pointer',
        background: dragging ? 'var(--tavil-bg)' : 'transparent',
        transition: 'all 0.15s',
        color: 'var(--tavil-muted)',
        fontSize: 13,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        onChange={onFilePick}
        style={{ display: 'none' }}
      />
      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Loader2 size={20} className="anim-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
          <div>Pujant… {Math.round(progress * 100)}%</div>
          <div style={{ width: '100%', maxWidth: 220, height: 4, background: 'var(--tavil-border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: 'var(--tavil-accent)', transition: 'width 0.2s' }} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Upload size={22} />
          <div style={{ fontWeight: 600, color: 'var(--tavil-text)' }}>
            {placeholder ?? (accept === 'video' ? 'Arrossega un vídeo o clica' : accept === 'both' ? 'Arrossega imatge o vídeo' : 'Arrossega una imatge o clica')}
          </div>
          <div style={{ fontSize: 11 }}>
            {accept === 'video' ? 'mp4 / webm / mov · màx 50 MB' : accept === 'both' ? 'jpg/png/webp 5MB · mp4/webm 50MB' : 'jpg / png / gif / webp · màx 5 MB'}
          </div>
        </div>
      )}
    </div>
  );
}
