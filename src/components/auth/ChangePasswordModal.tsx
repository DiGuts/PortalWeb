import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { apiChangePassword } from '../../api';

export function ChangePasswordModal({ onDone, forced = false }: { onDone: () => void; forced?: boolean }) {
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [currentPwd, setCurrentPwd] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (newPwd.length < 8) { setError('Mínim 8 caràcters'); return; }
        if (newPwd !== confirmPwd) { setError('Les contrasenyes no coincideixen'); return; }
        setSaving(true); setError('');
        try {
            await apiChangePassword(newPwd, forced ? undefined : currentPwd);
            onDone();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-red-400 transition-colors';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 anim-fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl anim-scale-in">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600"><Lock size={20} /></div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            {forced ? 'Canvia la contrasenya' : 'Nova contrasenya'}
                        </h2>
                        {forced && <p className="text-xs text-gray-500 dark:text-zinc-400">L'administrador t'ha assignat una contrasenya temporal. Has de canviar-la per continuar.</p>}
                    </div>
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">{error}</p>}
                {!forced && (
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide block mb-1.5">Contrasenya actual</label>
                        <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className={inputCls} placeholder="Contrasenya actual" />
                    </div>
                )}
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide block mb-1.5">Nova contrasenya</label>
                    <div className="relative">
                        <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} className={inputCls + ' pr-10'} placeholder="Mínim 8 caràcters" />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide block mb-1.5">Confirma la nova contrasenya</label>
                    <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className={inputCls} placeholder="Repeteix la contrasenya" />
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving || !newPwd || !confirmPwd || (!forced && !currentPwd)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                    {saving ? 'Guardant...' : 'Canviar contrasenya'}
                </button>
            </div>
        </div>
    );
}
