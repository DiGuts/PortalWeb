import React, { useRef, useState, useEffect, useCallback } from 'react';
import { API_BASE, apiPreventionSign } from '../../api';

type DocumentKey = 'inf_ca' | 'inf_en' | 'epi_1' | 'epi_2' | 'epi_3' | 'epi_3i' | 'epi_4';

const DOC_TITLES: Record<DocumentKey, string> = {
  inf_ca:  'Informació i Formació en Prevenció de Riscos Laborals',
  inf_en:  'Information and Training on Occupational Risk Prevention',
  epi_1:   'Lliurament d\'EPI – Grup 1 (Mecànics / Taller / Magatzem)',
  epi_2:   'Lliurament d\'EPI – Grup 2 (Oficina Tècnica / Qualitat)',
  epi_3:   'Lliurament d\'EPI – Grup 3 (Posta en Marxa / I+D)',
  epi_3i:  'Lliurament d\'EPI – Grup 3 Internacional',
  epi_4:   'Lliurament d\'EPI – Grup 4 (Personal d\'Oficines)',
};

interface Props {
  documentKey: DocumentKey;
  onDone: () => void;
}

export function PreventionOnboarding({ documentKey, onDone }: Props) {
  const pdfUrl = `${API_BASE}/uploads/prevention/${documentKey}.pdf`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // IntersectionObserver: sentinel visible in scrollRef → enable canvas
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setScrolledToEnd(true); },
      { root: container, threshold: 0.1 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // Init canvas white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPos.current) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  }, [isDrawing]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSubmitting(true);
    setError('');
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await apiPreventionSign(documentKey, dataUrl);
      onDone();
    } catch (e: any) {
      setError(e.message ?? 'Error en signar. Torna-ho a intentar.');
    } finally {
      setSubmitting(false);
    }
  };

  const docTitle = DOC_TITLES[documentKey] ?? documentKey;

  const canSubmit = scrolledToEnd && hasSignature && !submitting;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto',
        padding: '24px 16px 40px',
      }}
      ref={scrollRef}
    >
      <div style={{
        background: 'var(--tavil-card)', borderRadius: 16,
        width: '100%', maxWidth: 820,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--tavil-accent)', color: '#fff',
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 4 }}>
            Portal TAVIL · Prevenció de Riscos Laborals
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            Documents obligatoris
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            Has de llegir el document fins al final i signar per continuar.
          </div>
        </div>

        {/* PDF section */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tavil-muted)', marginBottom: 8 }}>
            Document: <span style={{ color: 'var(--tavil-text)' }}>{docTitle}</span>
          </div>
          <div style={{
            border: '1px solid var(--tavil-border)', borderRadius: 8, overflow: 'hidden',
            height: '65vh', background: '#f9f9f9',
          }}>
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title={docTitle}
            />
          </div>
          {/* Scroll sentinel — becomes visible when user scrolls past the PDF block */}
          <div ref={sentinelRef} style={{ height: 1, marginTop: 2 }} />
        </div>

        {/* Signature section */}
        <div style={{ padding: '20px 24px 28px' }}>
          <div style={{
            borderTop: '1px solid var(--tavil-border)', paddingTop: 20,
            opacity: scrolledToEnd ? 1 : 0.35,
            pointerEvents: scrolledToEnd ? 'auto' : 'none',
            transition: 'opacity 300ms',
          }}>
            {!scrolledToEnd && (
              <div style={{ textAlign: 'center', color: 'var(--tavil-muted)', fontSize: 13, marginBottom: 12 }}>
                Desplaça't fins al final del document per habilitar la signatura
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tavil-text)', marginBottom: 10 }}>
              Signatura del treballador/a
            </div>
            <div style={{
              border: '1.5px solid var(--tavil-border)', borderRadius: 10,
              background: '#fff', cursor: 'crosshair', touchAction: 'none',
              userSelect: 'none', WebkitUserSelect: 'none',
              overflow: 'hidden',
            }}>
              <canvas
                ref={canvasRef}
                width={760}
                height={160}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <button
                onClick={clearCanvas}
                style={{
                  fontSize: 12, color: 'var(--tavil-muted)', background: 'none',
                  border: '1px solid var(--tavil-border)', borderRadius: 6,
                  padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Esborrar signatura
              </button>
              <div style={{ fontSize: 11, color: 'var(--tavil-muted)' }}>
                {!hasSignature ? 'Dibuixa la teva signatura al requadre' : ''}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</div>
          )}

          {/* Submit */}
          <div style={{ marginTop: 20 }}>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: canSubmit ? 'var(--tavil-accent)' : 'var(--tavil-border)',
                color: canSubmit ? '#fff' : 'var(--tavil-muted)',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'background 200ms, color 200ms',
              }}
            >
              {submitting ? 'Signant...' : 'Signo i accepto el document'}
            </button>
            {!scrolledToEnd && (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--tavil-muted)', marginTop: 8 }}>
                Has de llegir el document fins al final per activar el botó
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
