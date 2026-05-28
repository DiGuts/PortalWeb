import React, { useState } from 'react';
import { Sun, Moon, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { AuthOut, apiLogin } from '../../api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage({ onLoginResult, isDarkMode, toggleDarkMode }: {
    onLoginResult: (data: AuthOut) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!EMAIL_RE.test(email.trim())) { setError('Format de correu no vàlid.'); return; }
        setLoading(true);
        try {
            const data = await apiLogin(email.trim().toLowerCase(), password);
            data.remember = remember;
            onLoginResult(data);
        } catch (err: any) {
            setError(err.message ?? 'Correu o contrasenya incorrectes.');
        } finally {
            setLoading(false);
        }
    };

    const isMobileLogin = typeof window !== 'undefined' && window.innerWidth < 768;
    const [mobileLang, setMobileLang] = useState<'ca'|'es'|'en'>('ca');

    const mobileInputStyle: React.CSSProperties = {
        width: '100%', height: 50, padding: '0 14px 0 42px',
        background: 'var(--tavil-card)', color: 'var(--tavil-text)',
        border: '1px solid var(--tavil-border)',
        borderRadius: 14, fontSize: 15, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit',
    };
    const mobileLabelStyle: React.CSSProperties = {
        fontSize: 13, color: 'var(--tavil-muted)', marginBottom: 6, fontWeight: 500, display: 'block',
    };

    // ── Mobile layout — matches design's LoginScreen ──────────────────────────
    if (isMobileLogin) {
        return (
            <div className={cn("min-h-screen flex flex-col transition-colors", isDarkMode && "dark")}
                style={{ background: 'var(--tavil-bg)', color: 'var(--tavil-text)', padding: '20px 24px 32px' }}>

                {/* Top: logo + language switcher */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {isDarkMode ? (
                            <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogoDark.png`} alt="TAVIL" style={{ height: 16, display: 'block' }} />
                        ) : (
                            <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogo.png`} alt="TAVIL" style={{ height: 16, display: 'block' }} />
                        )}
                    </div>
                    <div style={{ display: 'inline-flex', background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 999, padding: 3, gap: 0 }}>
                        {(['ca','es','en'] as const).map(l => (
                            <button key={l} onClick={() => setMobileLang(l)} style={{
                                padding: '5px 10px', fontSize: 11, fontWeight: 600,
                                background: mobileLang === l ? 'var(--tavil-text)' : 'transparent',
                                color: mobileLang === l ? 'var(--tavil-bg)' : 'var(--tavil-muted)',
                                border: 'none', borderRadius: 999, cursor: 'pointer',
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                fontFamily: 'inherit', transition: 'background-color 200ms var(--ease-out-cubic), color 200ms var(--ease-out-cubic)',
                            }}>{l}</button>
                        ))}
                    </div>
                </div>

                {/* Heading */}
                <div style={{ marginBottom: 36 }}>
                    <div style={{
                        fontSize: 10.5, color: 'var(--tavil-accent)', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
                    }}>PORTAL INTERN</div>
                    <img
                        src={`${process.env.PUBLIC_URL}/assets/images/${isDarkMode ? 'TAVILhub.svg?v=3' : 'tavilNet.svg'}`}
                        alt="TAVIL net"
                        style={{ height: 34, width: 'auto', display: 'block', margin: '0 0 12px' }}
                    />
                    <p style={{ fontSize: 14.5, color: 'var(--tavil-muted)', margin: 0, lineHeight: 1.45 }}>
                        Les teves credencials TAVIL.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 20 }}>
                    <div style={{ marginBottom: 14 }}>
                        <span style={mobileLabelStyle}>Correu electrònic</span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="nom.cognom@tavil.net" required autoComplete="email"
                                inputMode="email"
                                style={mobileInputStyle}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                        <span style={mobileLabelStyle}>Contrasenya</span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
                            <input
                                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" required autoComplete="current-password"
                                style={{ ...mobileInputStyle, padding: '0 42px 0 42px' }}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)} style={{
                                position: 'absolute', right: 14, color: 'var(--tavil-faint)',
                                background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                            }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tavil-muted)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: 'var(--tavil-accent)', width: 15, height: 15 }} />
                            Recorda'm
                        </label>
                        <button type="button" style={{
                            background: 'none', border: 'none', color: 'var(--tavil-accent)',
                            fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                        }}>Has oblidat la contrasenya?</button>
                    </div>
                    {error && (
                        <p style={{ fontSize: 13, color: 'var(--tavil-accent)', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>
                    )}
                    <button type="submit" disabled={loading} style={{
                        height: 52, borderRadius: 14, border: 'none',
                        background: loading ? '#a21b18' : 'var(--tavil-accent)', color: '#fff',
                        fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 160ms var(--ease-out-cubic), opacity 160ms', opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
                    }}>
                        {loading ? 'Carregant…' : 'Inicia sessió'}
                    </button>
                </form>

                <div style={{ flex: 1 }} />

                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--tavil-faint)', letterSpacing: '0.02em' }}>
                    TAVIL · Portal intern · 2026
                </div>
            </div>
        );
    }

    // ── Desktop layout — split panel ─────────────────────────────────────────
    const deskInputStyle: React.CSSProperties = {
        width: '100%', height: 46, padding: '0 14px 0 42px',
        background: 'var(--tavil-card)', color: 'var(--tavil-text)',
        border: '1px solid var(--tavil-border)',
        borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color 160ms',
    };
    const deskLabelStyle: React.CSSProperties = {
        fontSize: 12.5, color: 'var(--tavil-muted)', marginBottom: 6, fontWeight: 500, display: 'block',
    };
    return (
        <div className={cn("min-h-screen", isDarkMode && "dark")} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)', background: 'var(--tavil-bg)', color: 'var(--tavil-text)' }}>

            {/* ── Left: form panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 60px', minHeight: '100vh', boxSizing: 'border-box' }}>
                {/* Logo + dark toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isDarkMode
                            ? <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogoDark.png`} alt="TAVIL" style={{ height: 18 }} />
                            : <img src={`${process.env.PUBLIC_URL}/assets/images/tavilLogo.png`} alt="TAVIL" style={{ height: 18 }} />
                        }
                    </div>
                    <button onClick={toggleDarkMode} style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-muted)' }}>
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                {/* Center form */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 440 }}>
                    <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 14 }}>
                        Portal intern
                    </div>
                    <img
                        src={`${process.env.PUBLIC_URL}/assets/images/${isDarkMode ? 'TAVILhub.svg?v=3' : 'tavilNet.svg'}`}
                        alt="TAVIL net"
                        style={{ height: 52, width: 'auto', display: 'block', margin: '0 0 14px' }}
                    />
                    <p style={{ fontSize: 15, color: 'var(--tavil-muted)', margin: '0 0 32px', lineHeight: 1.5 }}>
                        Les teves credencials TAVIL.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: 16 }}>
                            <span style={deskLabelStyle}>Correu electrònic</span>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Mail size={15} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
                                <input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="nom.cognom@tavil.net" required autoComplete="email"
                                    style={deskInputStyle}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: 16 }}>
                            <span style={deskLabelStyle}>Contrasenya</span>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Lock size={15} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
                                <input
                                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••" required autoComplete="current-password"
                                    style={{ ...deskInputStyle, padding: '0 44px' }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tavil-faint)', display: 'flex', padding: 0 }}>
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember + forgot */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tavil-muted)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: 'var(--tavil-accent)', width: 15, height: 15 }} />
                                Recorda'm en aquest equip
                            </label>
                            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--tavil-accent)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 500 }}>
                                Has oblidat la contrasenya?
                            </button>
                        </div>

                        {error && <p style={{ fontSize: 13, color: 'var(--tavil-accent)', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

                        <button type="submit" disabled={loading} style={{ width: '100%', height: 48, borderRadius: 10, border: 'none', background: loading ? '#a21b18' : 'var(--tavil-accent)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background-color 160ms var(--ease-out-cubic), opacity 160ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                            {loading ? 'Carregant…' : 'Inicia sessió'}
                            {!loading && <ArrowRight size={16} />}
                        </button>
                    </form>


                    <div style={{ marginTop: 36, fontSize: 12.5, color: 'var(--tavil-faint)', textAlign: 'center' }}>
                        © 2026 TAVIL S.A. · Portal intern · v4.2
                    </div>
                </div>
            </div>

            {/* ── Right: editorial cover ── */}
            <div style={{ background: 'var(--tavil-accent)', color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '48px 60px', justifyContent: 'center', minHeight: '100vh', boxSizing: 'border-box' }}>
                {/* Texture + circles */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.08, background: 'repeating-linear-gradient(45deg, transparent 0 18px, #fff 18px 19px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '-18%', right: '-14%', width: 480, height: 480, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-22%', left: '-12%', width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 88, lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: 20, fontStyle: 'italic' }}>
                        Som <br />un equip.
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1.5, opacity: 0.92, maxWidth: 460 }}>
                        El portal intern de TAVIL. Notícies, agenda, formació, sol·licituds i la veu de cadascú — en un sol lloc.
                    </div>
                    <div style={{ display: 'flex', gap: 40, marginTop: 44 }}>
                        {[{ n: '+100', l: 'anys de coneixement' }, { n: '+45', l: 'països' }, { n: '+1.200', l: 'projectes' }].map(s => (
                            <div key={s.l}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1, letterSpacing: '-0.025em' }}>{s.n}</div>
                                <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 6 }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
