import React, { useState } from 'react';
import { Sun, Moon, ChevronLeft, Mail } from 'lucide-react';
import { cn } from '../../lib/cn';
import { AuthOut, apiVerifyEmail, apiResendVerification } from '../../api';
import { TavilLogo } from './TavilLogo';

export function VerifyEmailPage({ email, onBack, onVerified, isDarkMode, toggleDarkMode }: {
    email: string;
    onBack: () => void;
    onVerified: (data: AuthOut) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resent, setResent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await apiVerifyEmail(email, code.trim());
            onVerified(data);
        } catch (err: any) {
            setError(err.message ?? 'Codi invàlid o caducat.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResent(false);
        try {
            await apiResendVerification(email);
            setResent(true);
        } catch {}
    };

    const isMobileVerify = typeof window !== 'undefined' && window.innerWidth < 768;
    const [verifyLang, setVerifyLang] = useState<'ca'|'es'|'en'>('ca');
    const CODE_LEN = 8;
    const [slots, setSlots] = useState<string[]>(Array(CODE_LEN).fill(''));
    const slotRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const setSlot = (i: number, v: string) => {
        v = v.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 1);
        const next = [...slots]; next[i] = v; setSlots(next);
        setCode(next.join(''));
        if (v && i < CODE_LEN - 1) slotRefs.current[i + 1]?.focus();
    };
    const onSlotKey = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !slots[i] && i > 0) { slotRefs.current[i - 1]?.focus(); }
        if (e.key === 'ArrowLeft' && i > 0) slotRefs.current[i - 1]?.focus();
        if (e.key === 'ArrowRight' && i < CODE_LEN - 1) slotRefs.current[i + 1]?.focus();
    };
    const onSlotPaste = (e: React.ClipboardEvent) => {
        const txt = (e.clipboardData?.getData('text') || '').toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, CODE_LEN);
        if (!txt) return;
        e.preventDefault();
        const next = Array(CODE_LEN).fill('');
        for (let i = 0; i < txt.length; i++) next[i] = txt[i];
        setSlots(next); setCode(next.join(''));
        slotRefs.current[Math.min(txt.length, CODE_LEN - 1)]?.focus();
    };

    if (isMobileVerify) {
        const complete = slots.join('').length === CODE_LEN;
        return (
            <div className={cn("min-h-screen flex flex-col transition-colors", isDarkMode && "dark")}
                style={{ background: 'var(--tavil-bg)', color: 'var(--tavil-text)', padding: '10px 24px 28px' }}>

                {/* Top: back + lang */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                    <button onClick={onBack} style={{
                        width: 40, height: 40, borderRadius: 20,
                        background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0,
                    }}>
                        <ChevronLeft size={18} />
                    </button>
                    <div style={{ display: 'inline-flex', background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 999, padding: 3, gap: 0 }}>
                        {(['ca','es','en'] as const).map(l => (
                            <button key={l} onClick={() => setVerifyLang(l)} style={{
                                padding: '5px 10px', fontSize: 11, fontWeight: 600,
                                background: verifyLang === l ? 'var(--tavil-text)' : 'transparent',
                                color: verifyLang === l ? 'var(--tavil-bg)' : 'var(--tavil-muted)',
                                border: 'none', borderRadius: 999, cursor: 'pointer',
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                fontFamily: 'inherit', transition: 'background-color 200ms var(--ease-out-cubic), color 200ms var(--ease-out-cubic)',
                            }}>{l}</button>
                        ))}
                    </div>
                </div>

                {/* Step indicator — both steps complete */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--tavil-accent)' }} />
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--tavil-accent)' }} />
                </div>

                {/* Heading */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
                        Pas 2 de 2
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 34, fontWeight: 400, lineHeight: 1.04, margin: '0 0 10px',
                        letterSpacing: '-0.02em', color: 'var(--tavil-text)',
                    }}>Verifica el teu correu</h1>
                    <p style={{ fontSize: 14, color: 'var(--tavil-muted)', margin: 0, lineHeight: 1.45 }}>
                        Hem enviat un codi a{' '}
                        <span style={{ color: 'var(--tavil-text)', fontWeight: 500 }}>{email || 'nom.cognom@tavil.net'}</span>
                    </p>
                </div>

                {/* 8-slot code input */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 13, color: 'var(--tavil-muted)', marginBottom: 10, fontWeight: 500 }}>Codi de verificació</div>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }} onPaste={onSlotPaste}>
                            {slots.map((c, i) => (
                                <input
                                    key={i}
                                    ref={el => { slotRefs.current[i] = el; }}
                                    value={c}
                                    onChange={e => setSlot(i, e.target.value)}
                                    onKeyDown={e => onSlotKey(i, e)}
                                    maxLength={1}
                                    inputMode="text"
                                    autoCapitalize="characters"
                                    style={{
                                        flex: '1 1 0', minWidth: 0, height: 50, textAlign: 'center',
                                        fontFamily: '"JetBrains Mono", "Courier New", monospace',
                                        fontSize: 18, fontWeight: 500,
                                        color: 'var(--tavil-text)',
                                        background: 'var(--tavil-card)',
                                        border: `1px solid ${c ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
                                        borderRadius: 10, outline: 'none', padding: 0,
                                        transition: 'border-color 160ms var(--ease-out-cubic), box-shadow 160ms var(--ease-out-cubic)', textTransform: 'uppercase',
                                        boxShadow: c ? '0 0 0 3px rgba(191,33,30,0.12)' : 'none',
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--tavil-faint)', marginTop: 8, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em' }}>
                            Format: 8 car. hex · ex. E2A76B29
                        </div>
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--tavil-muted)', marginBottom: 24 }}>
                        No l'has rebut?{' '}
                        <button type="button" onClick={handleResend} style={{
                            background: 'none', border: 'none', color: 'var(--tavil-accent)',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                        }}>Reenviar</button>
                        {resent && <span style={{ display: 'block', fontSize: 11.5, color: '#3f7a52', marginTop: 4 }}>✓ Codi reenviat</span>}
                    </div>

                    {error && <p style={{ fontSize: 13, color: 'var(--tavil-accent)', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

                    <div style={{ flex: 1 }} />
                    <button type="submit" disabled={loading || !complete} style={{
                        width: '100%', height: 52, borderRadius: 14, border: 'none',
                        background: 'var(--tavil-accent)', color: '#fff',
                        fontSize: 15, fontWeight: 600, cursor: (loading || !complete) ? 'not-allowed' : 'pointer',
                        transition: 'background-color 160ms var(--ease-out-cubic), opacity 160ms', opacity: (loading || !complete) ? 0.6 : 1, fontFamily: 'inherit',
                    }}>
                        {loading ? 'Verificant…' : 'Verificar compte'}
                    </button>
                </form>
            </div>
        );
    }

    // ── Desktop layout ───────────────────────────────────────────────────────────
    return (
        <div className={cn("min-h-screen bg-gray-100 dark:bg-zinc-950 flex flex-col transition-colors", isDarkMode && "dark")}>
            <div className="flex justify-end p-4">
                <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors">
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
                <TavilLogo />
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-8">Portal intern del treballador</p>
                <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-sm anim-scale-in">
                    <button onClick={onBack} className="flex items-center gap-1 text-sm text-red-500 hover:underline mb-4">
                        <ChevronLeft size={15} /> Tornar
                    </button>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 mb-4 mx-auto">
                        <Mail size={22} className="text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">Verifica el teu correu</h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mb-1">Hem enviat un codi a</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 text-center mb-6">{email}</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Codi de verificació</label>
                            <input
                                type="text"
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                placeholder="A3F92BDE"
                                maxLength={8}
                                required
                                className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg py-3 px-4 text-sm text-center tracking-widest font-mono outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white uppercase"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {resent && <p className="text-green-600 text-sm text-center">Nou codi enviat!</p>}
                        <button type="submit" disabled={loading || code.length < 8}
                            className="press w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60">
                            Verificar compte
                        </button>
                    </form>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mt-4">
                        No has rebut el correu?{' '}
                        <button onClick={handleResend} className="text-red-500 font-medium hover:underline">Reenviar</button>
                    </p>
                </div>
            </div>
            <div className="py-4 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-zinc-800">
                © 2026 TAVIL · Portal intern
            </div>
        </div>
    );
}
