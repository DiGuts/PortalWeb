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
      <div className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 border border-gray-100 dark:border-zinc-800 ${isClosing ? 'anim-scale-out' : 'anim-scale-in'}`}>
        <h3 className="font-bold text-gray-900 dark:text-white mb-2">{heading}</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={handleCancel} className="press px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">{cancel}</button>
          <button
            onClick={handleConfirm}
            className={`press px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-900 dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-900'}`}
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
