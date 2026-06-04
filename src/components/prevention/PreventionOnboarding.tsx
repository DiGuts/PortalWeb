import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts, PDFTextField } from 'pdf-lib';
import { API_BASE, apiPreventionSign } from '../../api';

type DocumentKey = 'inf_ca' | 'inf_en' | 'epi_1' | 'epi_2' | 'epi_3' | 'epi_3i' | 'epi_4';

const DOC_TITLES: Record<DocumentKey, string> = {
  inf_ca:  'Informació i Formació en Prevenció de Riscos Laborals',
  inf_en:  'Information and Training on Occupational Risk Prevention',
  epi_1:   "Lliurament d'EPI – Grup 1 (Mecànics / Taller / Magatzem)",
  epi_2:   "Lliurament d'EPI – Grup 2 (Oficina Tècnica / Qualitat)",
  epi_3:   "Lliurament d'EPI – Grup 3 (Posta en Marxa / I+D)",
  epi_3i:  "Lliurament d'EPI – Grup 3 Internacional",
  epi_4:   "Lliurament d'EPI – Grup 4 (Personal d'Oficines)",
};

// pdf-lib StandardFonts only support Latin-1 — strip accents for the signature page text
function latinize(s: string): string {
  return s
    .replace(/[àáâã]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõ]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/ç/g, 'c')
    .replace(/[ÀÁÂÃ]/g, 'A').replace(/[ÈÉÊË]/g, 'E').replace(/[ÌÍÎÏ]/g, 'I')
    .replace(/[ÒÓÔÕ]/g, 'O').replace(/[ÙÚÛÜ]/g, 'U').replace(/Ç/g, 'C')
    .replace(/·/g, '-').replace(/[–—]/g, '-');
}

interface Props {
  documentKey: DocumentKey;
  userName: string;
  userDept: string;
  onDone: () => void;
}

export function PreventionOnboarding({ documentKey, userName, userDept, onDone }: Props) {
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

  const buildSignedPdf = async (signatureDataUrl: string): Promise<string | undefined> => {
    try {
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) return undefined;
      const pdfArrayBuffer = await pdfResponse.arrayBuffer();

      const pdfDoc = await PDFDocument.load(pdfArrayBuffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Decode signature PNG
      const sigBase64 = signatureDataUrl.split(',')[1];
      const sigBinary = atob(sigBase64);
      const sigBytes = new Uint8Array(sigBinary.length);
      for (let i = 0; i < sigBinary.length; i++) sigBytes[i] = sigBinary.charCodeAt(i);
      const sigImage = await pdfDoc.embedPng(sigBytes);

      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

      // ── Fill AcroForm text fields ─────────────────────────────────────────
      const form = pdfDoc.getForm();
      const allFields = form.getFields();
      console.log('[PRL] fields:', allFields.map(f => `${f.constructor.name}:${f.getName()}`));

      // Track where the signature widget lives so we can draw the image there
      let sigRect: { x: number; y: number; width: number; height: number } | null = null;

      for (const field of allFields) {
        const name = field.getName();
        const nameLow = name.toLowerCase();
        try {
          if (field instanceof PDFTextField) {
            if (/nom|name|treballad|cognoms/i.test(nameLow)) {
              field.setText(latinize(userName));
            } else if (/data|date/i.test(nameLow)) {
              field.setText(dateStr);
            } else if (/lloc|departament|treball|dept|puesto|carrego|carrec/i.test(nameLow)) {
              field.setText(latinize(userDept));
            } else if (/sign|firma|signatur/i.test(nameLow)) {
              // leave as-is but grab position
            }
          }
        } catch (_) { /* skip unrecognised fields */ }

        // Grab widget rectangle for signature field (any name)
        if (/sign|firma|signatur/i.test(nameLow)) {
          try {
            const widgets = (field as any).acroField?.getWidgets?.() ?? [];
            if (widgets.length > 0) {
              sigRect = widgets[0].getRectangle();
            }
          } catch (_) {}
        }
      }

      // ── Draw signature image on last page ─────────────────────────────────
      const lastPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
      const { width: W, height: H } = lastPage.getSize();

      // Fallback: if no signature widget found, estimate position from page
      // Based on TAVIL INF/EPI template: signature box is ~left side, ~38% from bottom
      if (!sigRect) {
        sigRect = { x: 78, y: H * 0.36, width: 210, height: 72 };
      }

      // Draw signature image inside the widget rectangle (with 4pt inset)
      const inset = 4;
      lastPage.drawImage(sigImage, {
        x: sigRect.x + inset,
        y: sigRect.y + inset,
        width:  sigRect.width  - inset * 2,
        height: sigRect.height - inset * 2,
      });

      // Also write date next to/below data field (best effort, ~same Y as signature, right side)
      try {
        const dateFieldExists = allFields.some(f => /data|date/i.test(f.getName().toLowerCase()) && f instanceof PDFTextField);
        if (!dateFieldExists) {
          // Draw date text near signature area if no Date field found
          lastPage.drawText(dateStr, {
            x: sigRect.x + sigRect.width + 20,
            y: sigRect.y + sigRect.height / 2 - 5,
            size: 10, font, color: rgb(0, 0, 0),
          });
        }
      } catch (_) {}

      // Also write worker name if no name field found
      try {
        const nameFieldExists = allFields.some(f => /nom|name|treballad|cognoms/i.test(f.getName().toLowerCase()) && f instanceof PDFTextField);
        if (!nameFieldExists) {
          lastPage.drawText(latinize(userName), {
            x: sigRect.x,
            y: sigRect.y + sigRect.height + 28,
            size: 10, font, color: rgb(0, 0, 0),
          });
        }
      } catch (_) {}

      // Flatten form so filled fields are baked into the PDF
      try { form.flatten(); } catch (_) {}

      return await pdfDoc.saveAsBase64();
    } catch (err) {
      console.warn('[PRL] PDF generation failed:', err);
      return undefined;
    }
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSubmitting(true);
    setError('');
    try {
      const signatureDataUrl = canvas.toDataURL('image/png');
      const pdfBase64 = await buildSignedPdf(signatureDataUrl);
      await apiPreventionSign(documentKey, signatureDataUrl, pdfBase64);
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
      ref={scrollRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '24px 16px 40px',
      }}
    >
      <div style={{
        background: 'var(--tavil-card)', borderRadius: 16,
        width: '100%', maxWidth: 820,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: 'var(--tavil-accent)', color: '#fff', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 4 }}>
            Portal TAVIL · Prevenció de Riscos Laborals
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Documents obligatoris</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            Has de llegir el document fins al final i signar per continuar.
          </div>
        </div>

        {/* PDF */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tavil-muted)', marginBottom: 8 }}>
            Document: <span style={{ color: 'var(--tavil-text)' }}>{docTitle}</span>
          </div>
          <div style={{ border: '1px solid var(--tavil-border)', borderRadius: 8, overflow: 'hidden', height: '65vh', background: '#f9f9f9' }}>
            <iframe src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} title={docTitle} />
          </div>
          <div ref={sentinelRef} style={{ height: 1, marginTop: 2 }} />
        </div>

        {/* Signature */}
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
              userSelect: 'none', WebkitUserSelect: 'none', overflow: 'hidden',
            }}>
              <canvas
                ref={canvasRef}
                width={760} height={160}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <button onClick={clearCanvas} style={{
                fontSize: 12, color: 'var(--tavil-muted)', background: 'none',
                border: '1px solid var(--tavil-border)', borderRadius: 6,
                padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Esborrar signatura
              </button>
              <div style={{ fontSize: 11, color: 'var(--tavil-muted)' }}>
                {!hasSignature ? 'Dibuixa la teva signatura al requadre' : ''}
              </div>
            </div>
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</div>}

          <div style={{ marginTop: 20 }}>
            <button onClick={handleSubmit} disabled={!canSubmit} style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: canSubmit ? 'var(--tavil-accent)' : 'var(--tavil-border)',
              color: canSubmit ? '#fff' : 'var(--tavil-muted)',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'background 200ms, color 200ms',
            }}>
              {submitting ? 'Generant PDF i signant...' : 'Signo i accepto el document'}
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
