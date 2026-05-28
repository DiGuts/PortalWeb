import React, { useState } from 'react';
import { Sun, Moon, ChevronLeft, Shield } from 'lucide-react';
import { cn } from '../../lib/cn';
import { AuthOut, apiVerifyOTP } from '../../api';
import { TavilLogo } from './TavilLogo';

export function OTPPage({ email, onBack, onVerified, isDarkMode, toggleDarkMode }: {
    email: string;
    onBack: () => void;
    onVerified: (data: AuthOut) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await apiVerifyOTP(email, code.trim());
            onVerified(data);
        } catch (err: any) {
            setError(err.message ?? 'Codi invàlid o caducat.');
        } finally {
            setLoading(false);
        }
    };

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
                        <Shield size={22} className="text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">Verificació en dos passos</h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 text-center mb-1">Hem enviat un codi de 6 dígits a</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 text-center mb-6">{email}</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Codi d'accés</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                required
                                autoFocus
                                className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg py-3 px-4 text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-red-400 dark:bg-zinc-800 dark:text-white"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button type="submit" disabled={loading || code.length < 6}
                            className="press w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60">
                            Verificar
                        </button>
                    </form>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 text-center mt-4">El codi caduca en 10 minuts.</p>
                </div>
            </div>
            <div className="py-4 text-center text-xs text-gray-400 border-t border-gray-200 dark:border-zinc-800">
                © 2026 TAVIL · Portal intern
            </div>
        </div>
    );
}
