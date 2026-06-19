import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface ImageCropParams {
  cx: number;    // focal center X as fraction of natural image width [0–1]
  cy: number;    // focal center Y as fraction of natural image height [0–1]
  zoom: number;  // scale / minScale (≥1)
  natW: number;
  natH: number;
}

interface CropUIProps {
  src: string;
  vpW: number;
  vpH: number;
  initialCrop?: ImageCropParams;
  onConfirm: (params: ImageCropParams) => void;
  onCancel: () => void;
}

function CropUI({ src, vpW, vpH, initialCrop, onConfirm, onCancel }: CropUIProps) {
  const [scale, setScale] = useState(1);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [minScale, setMinScale] = useState(1);
  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);
  const scaleRef = useRef(1);
  const oxRef = useRef(0);
  const oyRef = useRef(0);
  const natWRef = useRef(0);
  const natHRef = useRef(0);
  const minScaleRef = useRef(1);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const initialCropRef = useRef(initialCrop);

  const clampX = (v: number, s: number, nw: number) => Math.min(0, Math.max(vpW - nw * s, v));
  const clampY = (v: number, s: number, nh: number) => Math.min(0, Math.max(vpH - nh * s, v));

  const applyOx = (v: number) => { oxRef.current = v; setOx(v); };
  const applyOy = (v: number) => { oyRef.current = v; setOy(v); };

  const initFromDimensions = useCallback((nw: number, nh: number, vw: number, vh: number) => {
    const ms = Math.max(vw / nw, vh / nh);
    minScaleRef.current = ms;
    setMinScale(ms);

    const crop = initialCropRef.current;
    if (crop && crop.natW > 0) {
      // Restore saved position: scale at saved zoom level, centre on saved focal point
      const s = Math.max(ms, ms * crop.zoom);
      const cx_px = crop.cx * nw * s;
      const cy_px = crop.cy * nh * s;
      const nx = clampX(vw / 2 - cx_px, s, nw);
      const ny = clampY(vh / 2 - cy_px, s, nh);
      scaleRef.current = s; setScale(s);
      applyOx(nx); applyOy(ny);
    } else {
      const nx = clampX((vw - nw * ms) / 2, ms, nw);
      const ny = clampY((vh - nh * ms) / 2, ms, nh);
      scaleRef.current = ms; setScale(ms);
      applyOx(nx); applyOy(ny);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vpW, vpH]);

  const onLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img || vpW === 0 || vpH === 0) return;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    natWRef.current = nw; natHRef.current = nh;
    setNatW(nw); setNatH(nh);
    initFromDimensions(nw, nh, vpW, vpH);
  }, [vpW, vpH, initFromDimensions]);

  // Re-init when inline viewport width becomes known
  useEffect(() => {
    if (vpW > 0 && vpH > 0 && natWRef.current > 0) {
      initFromDimensions(natWRef.current, natHRef.current, vpW, vpH);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vpW, vpH]);

  const changeScale = (newS: number) => {
    const ratio = newS / scaleRef.current;
    const nx = clampX(vpW / 2 - (vpW / 2 - oxRef.current) * ratio, newS, natWRef.current);
    const ny = clampY(vpH / 2 - (vpH / 2 - oyRef.current) * ratio, newS, natHRef.current);
    scaleRef.current = newS; setScale(newS);
    applyOx(nx); applyOy(ny);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: oxRef.current, oy: oyRef.current };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    applyOx(clampX(dragRef.current.ox + e.clientX - dragRef.current.x, scaleRef.current, natWRef.current));
    applyOy(clampY(dragRef.current.oy + e.clientY - dragRef.current.y, scaleRef.current, natHRef.current));
  };

  const onPointerUp = () => { dragRef.current = null; };

  const doCrop = () => {
    const s = scaleRef.current;
    const ms = minScaleRef.current;
    const nw = natWRef.current, nh = natHRef.current;
    const viewCx = (-oxRef.current + vpW / 2) / s;
    const viewCy = (-oyRef.current + vpH / 2) / s;
    onConfirm({ cx: viewCx / nw, cy: viewCy / nh, zoom: ms > 0 ? s / ms : 1, natW: nw, natH: nh });
  };

  const canRender = vpW > 0 && vpH > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {canRender && (
        <div
          style={{ width: vpW, height: vpH, overflow: 'hidden', position: 'relative', borderRadius: 6, background: '#111', cursor: 'grab', userSelect: 'none', touchAction: 'none', flexShrink: 0 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <img
            ref={imgRef} src={src} onLoad={onLoad} draggable={false}
            style={{ position: 'absolute', left: ox, top: oy, width: natW * scale, height: natH * scale, maxWidth: 'none', maxHeight: 'none', pointerEvents: 'none', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[1, 2].map(i => <div key={`v${i}`} style={{ position: 'absolute', left: `${i * 33.33}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.18)' }} />)}
            {[1, 2].map(i => <div key={`h${i}`} style={{ position: 'absolute', top: `${i * 33.33}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.18)' }} />)}
            <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255,255,255,0.5)', borderRadius: 6 }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--tavil-faint)', width: 36, flexShrink: 0 }}>Zoom</span>
        <input
          type="range"
          min={minScale} max={minScale * 3} step={minScale * 0.001}
          value={scale}
          onChange={e => changeScale(+e.target.value)}
          style={{ flex: 1, accentColor: 'var(--tavil-accent)' } as React.CSSProperties}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid var(--tavil-border)', background: 'transparent', color: 'var(--tavil-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel·la</button>
        <button onClick={doCrop} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: 'var(--tavil-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Aplica</button>
      </div>
    </div>
  );
}

export function ImageCropModal({ src, onConfirm, onCancel, inline = false, initialCrop }: {
  src: string;
  onConfirm: (params: ImageCropParams) => void;
  onCancel: () => void;
  inline?: boolean;
  initialCrop?: ImageCropParams;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [vpW, setVpW] = useState(inline ? 0 : 400);
  const vpH = inline ? 128 : 267;

  useEffect(() => {
    if (!inline) return;
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setVpW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [inline]);

  if (inline) {
    return (
      <div ref={wrapRef} style={{ width: '100%', padding: '0 0 12px', background: 'var(--tavil-card)', boxSizing: 'border-box' }}>
        <div style={{ padding: '8px 16px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--tavil-faint)', marginBottom: 8 }}>
          Enquadra la imatge
        </div>
        <div style={{ padding: '0 16px' }}>
          <CropUI src={src} onConfirm={onConfirm} onCancel={onCancel} vpW={vpW} vpH={vpH} initialCrop={initialCrop} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties}>
      <div style={{ background: 'var(--tavil-card)', borderRadius: 12, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--tavil-faint)' }}>Enquadra la imatge</div>
        <CropUI src={src} onConfirm={onConfirm} onCancel={onCancel} vpW={400} vpH={267} initialCrop={initialCrop} />
      </div>
    </div>
  );
}
