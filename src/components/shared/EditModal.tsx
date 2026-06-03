import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function EditModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    const [isClosing, setIsClosing] = useState(false);
    const mouseDownOnBackdrop = useRef(false);
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 220);
    };
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);
    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm ${isClosing ? 'anim-fade-out' : 'anim-fade-in'}`}
            onMouseDown={(e) => { mouseDownOnBackdrop.current = e.target === e.currentTarget; }}
            onClick={(e) => { if (mouseDownOnBackdrop.current && e.target === e.currentTarget) handleClose(); mouseDownOnBackdrop.current = false; }}
        >
            <div className={`bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-lg md:mx-4 border border-gray-100 dark:border-zinc-800 overflow-y-auto max-h-[92vh] md:max-h-[90vh] ${isClosing ? 'anim-scale-out' : 'anim-scale-in'}`}>
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                    <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 transition-colors">✕</button>
                </div>
                <div className="p-4 md:p-5">{children}</div>
            </div>
        </div>,
        document.body
    );
}
