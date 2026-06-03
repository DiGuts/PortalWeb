import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export function ConfirmModal({
  message,
  title,
  confirmLabel,
  cancelLabel,
  destructive = true,
  onConfirm,
  onCancel,
}: {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);
  const handleCancel = () => {
    setIsClosing(true);
    setTimeout(() => onCancel(), 220);
  };
  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => onConfirm(), 180);
  };
  const heading = title ?? t('confirm.deleteTitle');
  const cancel = cancelLabel ?? t('confirm.cancel');
  const ok = confirmLabel ?? t('confirm.delete');
  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm ${isClosing ? 'anim-fade-out' : 'anim-fade-in'}`}
      onClick={e => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-sm mx-4 border border-[#e3e2db] dark:border-zinc-800 ${isClosing ? 'anim-scale-out' : 'anim-scale-in'}`} style={{ boxShadow: '0 8px 32px rgba(34,39,37,0.14)' }}>
        <h3 className="font-bold text-[#222725] dark:text-zinc-100 mb-2">{heading}</h3>
        <p className="text-sm text-[#5d655c] dark:text-zinc-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={handleCancel} className="press px-4 py-2 text-sm rounded-lg border border-[#e3e2db] dark:border-zinc-700 text-[#5d655c] dark:text-zinc-400 hover:bg-[#eeeee9] dark:hover:bg-zinc-800 transition-colors">{cancel}</button>
          <button
            onClick={handleConfirm}
            className={`press px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${destructive ? 'bg-[#bf211e] hover:bg-[#a21b18]' : 'bg-[#222725] hover:bg-[#2e3530] dark:bg-zinc-200 dark:hover:bg-zinc-100 dark:text-zinc-900'}`}
          >{ok}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

type ConfirmRequest = {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function useConfirm() {
  const [pending, setPending] = useState<(ConfirmRequest & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback((req: ConfirmRequest | string): Promise<boolean> => {
    const r: ConfirmRequest = typeof req === 'string' ? { message: req } : req;
    return new Promise<boolean>(resolve => setPending({ ...r, resolve }));
  }, []);

  const node = useMemo(() => {
    if (!pending) return null;
    return (
      <ConfirmModal
        message={pending.message}
        title={pending.title}
        confirmLabel={pending.confirmLabel}
        cancelLabel={pending.cancelLabel}
        destructive={pending.destructive !== false}
        onConfirm={() => { pending.resolve(true); setPending(null); }}
        onCancel={() => { pending.resolve(false); setPending(null); }}
      />
    );
  }, [pending]);

  return { confirm, confirmNode: node };
}
