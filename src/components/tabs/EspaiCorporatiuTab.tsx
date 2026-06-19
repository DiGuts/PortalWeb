import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft, ChevronRight, Search, FileText, Shield, BookOpen, Gift, Building2,
    ExternalLink, CheckCircle, Globe, AlertTriangle, Star, Mail, Download,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useIsMobile } from '../../lib/useIsMobile';
import { initGraph, getGraphAccount, graphLogin, graphLogout, listGraphFolder, type SPFile } from '../../graphApi';
import { FilterChip } from '../shared/FilterChip';

const SP_BASE = 'https://tavil.sharepoint.com/teams/provespermisos/Documentos%20compartidos/Forms/AllItems.aspx?id=%2Fteams%2Fprovespermisos%2FDocumentos%20compartidos%2FTavilpedia';

const ESPAI_CATS = [
    {
        icon: FileText, iconColor: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20",
        title: "Manual del treballador", desc: "Guia d'acollida i informació pràctica per al dia a dia", docs: 3,
        sharepointUrl: SP_BASE + '%2FManual%20del%20treballador',
        spFolderPath: 'Tavilpedia/Manual del treballador',
        filters: ['Tots', 'Acollida', 'Espais'],
        documents: [
            { title: "Protocol d'acollida (onboarding)", desc: "Guia completa per als nous treballadors amb tota la informació necessària.", tag: "Acollida", meta: "PDF · 2.4 MB", views: 342 },
            { title: "Guia d'ús dels espais comuns", desc: "Normes per a la utilització de les sales de reunions i zones comunes.", tag: "Espais", meta: "PDF · 0.6 MB", views: 143 },
            { title: "Horaris, calendari i permisos", desc: "Horaris habituals, calendari laboral anual i procediment de permisos.", tag: "Acollida", meta: "PDF · 0.8 MB", views: 421 },
        ],
    },
    {
        icon: Shield, iconColor: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/20",
        title: "Polítiques internes i protocols", desc: "Reglament, codi de conducta, prevenció de riscos i compliance", docs: 6,
        sharepointUrl: SP_BASE + '%2FPol%C3%ADtiques%20internes%20i%20protocols',
        spFolderPath: 'Tavilpedia/Politiques internes i protocols',
        filters: ['Tots', 'Normativa', 'Conducta', 'RRHH', 'Viatges'],
        documents: [
            { title: "Reglament de règim intern", desc: "Normativa interna que regula la convivència, els horaris i els permisos.", tag: "Normativa", meta: "PDF · 1.8 MB", views: 518 },
            { title: "Guia de seguretat i prevenció de riscos", desc: "Manual de prevenció de riscos laborals per a les instal·lacions de TAVIL.", tag: "Normativa", meta: "PDF · 3.1 MB", views: 287 },
            { title: "Codi de conducta TAVIL", desc: "Valors, comportaments esperats i límits ètics de l'empresa.", tag: "Conducta", meta: "PDF · 1.1 MB", views: 320 },
            { title: "Política de protecció de dades", desc: "Tractament de dades personals d'empleats i clients.", tag: "Conducta", meta: "PDF · 0.7 MB", views: 210 },
            { title: "Pla d'igualtat", desc: "Mesures per garantir la igualtat de tracte i oportunitats.", tag: "RRHH", meta: "PDF · 2.0 MB", views: 178 },
            { title: "Política de viatges i despeses", desc: "Normes per a viatges, allotjaments, dietes i justificació de despeses.", tag: "Viatges", meta: "PDF · 1.0 MB", views: 244 },
        ],
    },
    {
        icon: BookOpen, iconColor: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20",
        title: "Manuals i procediments", desc: "Sistemes interns, producte i procediments tècnics", docs: 3,
        sharepointUrl: SP_BASE + '%2FManuals%20i%20procediments',
        spFolderPath: 'Tavilpedia/Manuals i procediments',
        filters: ['Tots', 'Sistemes', 'Producte'],
        documents: [
            { title: "Manual de connexió a la xarxa interna", desc: "Guia pas a pas per connectar-se a la VPN, el correu corporatiu i les eines internes.", tag: "Sistemes", meta: "PDF · 1.3 MB", views: 467 },
            { title: "Manual d'ús de l'ERP", desc: "Guia d'usuari del sistema ERP per a la gestió de comandes, inventari i facturació.", tag: "Sistemes", meta: "PDF · 4.2 MB", views: 234 },
            { title: "Guia tècnica de producte: ancoratges", desc: "Especificacions tècniques, aplicacions i normativa dels ancoratges TAVIL.", tag: "Producte", meta: "PDF · 5.8 MB", views: 178 },
        ],
    },
    {
        icon: Gift, iconColor: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/20",
        title: "Beneficis socials", desc: "Retribució flexible, ajudes i avantatges per al treballador", docs: 4,
        sharepointUrl: SP_BASE + '%2FBeneficis%20socials',
        spFolderPath: 'Tavilpedia/Beneficis socials',
        filters: ['Tots', 'Retribució', 'Salut', 'Formació'],
        documents: [
            { title: "Guia de retribució flexible", desc: "Tickets restaurant, transport, guarderia i altres opcions disponibles.", tag: "Retribució", meta: "PDF · 0.9 MB", views: 312 },
            { title: "Assegurança mèdica corporativa", desc: "Cobertura, accés a la sala mèdica i procediment per a les consultes.", tag: "Salut", meta: "PDF · 0.7 MB", views: 256 },
            { title: "Pla de formació i ajudes", desc: "Programa intern de formació, beques i suport al desenvolupament professional.", tag: "Formació", meta: "PDF · 1.1 MB", views: 198 },
            { title: "Conveni i complements salarials", desc: "Resum del conveni vigent, plusos i complements aplicables.", tag: "Retribució", meta: "PDF · 1.4 MB", views: 489 },
        ],
    },
    {
        icon: Building2, iconColor: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20",
        title: "Identitat", desc: "Recursos de marca, plantilles i materials corporatius", docs: 5,
        sharepointUrl: SP_BASE + '%2FIdentitat',
        spFolderPath: 'Tavilpedia/Identitat',
        filters: ['Tots', 'Plantilles', 'Marca'],
        documents: [
            { title: "Plantilla de presentació corporativa", desc: "Plantilla PowerPoint amb la identitat visual de TAVIL per a presentacions.", tag: "Plantilles", meta: "PPTX · 3.5 MB", views: 534 },
            { title: "Plantilla de dossier comercial", desc: "Plantilla Word per a la creació de dossiers i propostes comercials.", tag: "Plantilles", meta: "DOCX · 2.1 MB", views: 298 },
            { title: "Manual d'identitat visual", desc: "Guia d'ús del logotip, colors, tipografia i aplicacions de la marca TAVIL.", tag: "Marca", meta: "PDF · 6.2 MB", views: 412 },
            { title: "Pack de recursos gràfics", desc: "Logotips en diversos formats, icones, fotografies corporatives i elements gràfics.", tag: "Marca", meta: "ZIP · 45 MB", views: 189 },
            { title: "Signatura i plantilla de correu", desc: "Signatura oficial electrònica i plantilla per a comunicats interns.", tag: "Plantilles", meta: "HTML · 0.2 MB", views: 378 },
        ],
    },
];

export function EspaiCorporatiuTab({ onBack }: { onBack?: () => void }) {
    const { t } = useTranslation();
    const [selectedCat, setSelectedCat] = useState<number | null>(null);
    const [espaiSearch, setEspaiSearch] = useState('');
    const isMobileEspai = useIsMobile();

    // Graph API state
    const [graphAccount, setGraphAccount] = useState(() => getGraphAccount());
    const [spFiles, setSpFiles] = useState<SPFile[] | null>(null);
    const [spLoading, setSpLoading] = useState(false);
    const [spError, setSpError] = useState<string | null>(null);

    // Init MSAL and detect post-redirect
    useEffect(() => {
        initGraph().then(account => {
            if (account) setGraphAccount(account);
        }).catch(() => {});
    }, []);

    // Fetch real files when entering a folder while authenticated
    useEffect(() => {
        if (!graphAccount || selectedCat === null) { setSpFiles(null); return; }
        const path = ESPAI_CATS[selectedCat].spFolderPath;
        setSpLoading(true);
        setSpError(null);
        setSpFiles(null);
        listGraphFolder(path)
            .then(files => { setSpFiles(files); setSpLoading(false); })
            .catch(err  => { setSpError(String(err)); setSpLoading(false); });
    }, [graphAccount, selectedCat]);

    const ftStyle = (meta: string): { bg: string; fg: string } => {
        const t = meta.split('·')[0].trim();
        if (t === 'PDF')  return { bg: '#fee2e2', fg: '#dc2626' };
        if (t === 'PPTX') return { bg: '#ffedd5', fg: '#ea580c' };
        if (t === 'DOCX') return { bg: '#dbeafe', fg: '#2563eb' };
        if (t === 'ZIP')  return { bg: '#fef9c3', fg: '#ca8a04' };
        if (t === 'HTML') return { bg: '#dcfce7', fg: '#16a34a' };
        return { bg: '#f4f4f5', fg: '#71717a' };
    };

    const [catFilter, setCatFilter] = useState('Tots');

    const cat = selectedCat !== null ? ESPAI_CATS[selectedCat] : null;

    const handleSelectCat = (i: number) => {
        if (selectedCat === i) { setSelectedCat(null); setCatFilter('Tots'); }
        else { setSelectedCat(i); setCatFilter('Tots'); }
    };

    const espaiSearchResults = espaiSearch
        ? ESPAI_CATS.flatMap(c => c.documents
                .filter(d => d.title.toLowerCase().includes(espaiSearch.toLowerCase()))
                .map(d => ({ ...d, catTitle: c.title })))
        : [];

    const visibleDocs = cat
        ? (catFilter === 'Tots' ? cat.documents : cat.documents.filter(d => d.tag === catFilter))
                .filter(d => !espaiSearch || d.title.toLowerCase().includes(espaiSearch.toLowerCase()))
        : [];

    // SP helpers
    const spFtStyle = (name: string): { bg: string; fg: string } => {
        const ext = name.split('.').pop()?.toUpperCase() ?? '';
        if (ext === 'PDF')  return { bg: '#fee2e2', fg: '#dc2626' };
        if (ext === 'PPTX' || ext === 'PPT') return { bg: '#ffedd5', fg: '#ea580c' };
        if (ext === 'DOCX' || ext === 'DOC') return { bg: '#dbeafe', fg: '#2563eb' };
        if (ext === 'XLSX' || ext === 'XLS') return { bg: '#dcfce7', fg: '#16a34a' };
        if (ext === 'ZIP'  || ext === 'RAR') return { bg: '#fef9c3', fg: '#ca8a04' };
        return { bg: '#f4f4f5', fg: '#71717a' };
    };
    const fmtSize = (b: number): string => b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;

    // ── Mobile ──────────────────────────────────────────────────────────────────
    if (isMobileEspai) {
        const allDocs = espaiSearch
            ? ESPAI_CATS.flatMap(c => c.documents.filter(d => d.title.toLowerCase().includes(espaiSearch.toLowerCase()) || c.title.toLowerCase().includes(espaiSearch.toLowerCase())).map(d => ({ ...d, section: c.title })))
            : [];
        return (
            <div style={{ background: 'var(--tavil-bg)', paddingBottom: 96 }}>
                <div style={{ height: 82, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
                    <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0, zIndex: 1 }}>
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--tavil-text)', pointerEvents: 'none' }}>Tavipedia</span>
                </div>
                <div style={{ padding: '0 20px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--tavil-accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{t('corporate.kicker')}</div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, lineHeight: 1.05, margin: 0, letterSpacing: '0em', color: 'var(--tavil-text)' }}>Tavipedia</h1>
                    <p style={{ fontSize: 13.5, color: 'var(--tavil-muted)', margin: '8px 0 0', lineHeight: 1.4 }}>{t('corporate.mobileSubtitle')}</p>
                </div>
                <div style={{ padding: '0 16px 16px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-50%)', color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
                    <input type="text" value={espaiSearch} onChange={e => setEspaiSearch(e.target.value)} placeholder={t('corporate.searchPlaceholder')}
                        style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid var(--tavil-border)', background: 'var(--tavil-card)', color: 'var(--tavil-text)', fontSize: 14, padding: '0 14px 0 40px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                {espaiSearch && allDocs.length > 0 ? (
                    <div style={{ padding: '0 16px' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{allDocs.length} resultat{allDocs.length !== 1 ? 's' : ''}</div>
                        <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, overflow: 'hidden' }}>
                            {allDocs.map((doc, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < allDocs.length - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                                    <div style={{ width: 38, height: 44, background: 'var(--tavil-bg)', border: '1px solid var(--tavil-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--tavil-accent)', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.04em' }}>{doc.tag.slice(0, 4).toUpperCase()}</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.3 }}>{doc.title}</div>
                                        <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 2 }}>{doc.meta} · {doc.section}</div>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '0 16px 20px' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>CATEGORIES</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                                {ESPAI_CATS.map((c, i) => (
                                    <div key={i} onClick={() => handleSelectCat(i)} style={{
                                        background: 'var(--tavil-card)', border: `1px solid ${selectedCat === i ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
                                        borderRadius: 10, padding: '10px 6px 8px', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                    }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--tavil-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                                            <c.icon size={15} style={{ color: 'var(--tavil-muted)' }} />
                                        </div>
                                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.2, marginBottom: 2 }}>{c.title.split(' ')[0]}</div>
                                        <div style={{ fontSize: 9.5, color: 'var(--tavil-faint)' }}>{c.docs} docs</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {(selectedCat !== null ? [ESPAI_CATS[selectedCat]] : ESPAI_CATS).map((c, ci) => {
                            const catIdx = selectedCat !== null ? selectedCat : ci;
                            const isLoading = spLoading && selectedCat === catIdx;
                            const files = (selectedCat === catIdx && spFiles !== null) ? spFiles.filter(f => !f.folder) : null;
                            return (
                                <div key={ci} style={{ padding: '0 16px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--tavil-faint)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{c.title.toUpperCase()}</div>
                                        <a href={c.sharepointUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--tavil-accent)', textDecoration: 'none', padding: '4px 8px', borderRadius: 8, background: 'rgba(220,38,38,0.07)' }}>
                                            <ExternalLink size={14} /> SharePoint
                                        </a>
                                    </div>
                                    <div style={{ background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', borderRadius: 14, overflow: 'hidden' }}>
                                        {isLoading ? (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--tavil-faint)', fontSize: 13 }}>Carregant…</div>
                                        ) : files !== null ? files.map((f, fi) => {
                                            const ext = f.name.split('.').pop()?.toUpperCase() ?? '';
                                            const { bg, fg } = spFtStyle(f.name);
                                            return (
                                                <a key={fi} href={f.webUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: fi < files.length - 1 ? '1px solid var(--tavil-border)' : 'none', textDecoration: 'none' }}>
                                                    <div style={{ width: 38, height: 44, background: bg, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                                                        <FileText size={14} style={{ color: fg }} />
                                                        <span style={{ fontSize: 7.5, fontWeight: 800, color: fg, fontFamily: '"JetBrains Mono",monospace' }}>{ext}</span>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/\.[^.]+$/, '')}</div>
                                                        <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)' }}>{fmtSize(f.size)}</div>
                                                    </div>
                                                    <ExternalLink size={14} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                                                </a>
                                            );
                                        }) : c.documents.map((doc, di) => {
                                            const parts = doc.meta.split('·').map((s: string) => s.trim());
                                            const type = parts[0];
                                            const size = parts[1] ?? '';
                                            const { bg, fg } = ftStyle(doc.meta);
                                            return (
                                                <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: di < c.documents.length - 1 ? '1px solid var(--tavil-border)' : 'none' }}>
                                                    <div style={{ width: 38, height: 44, background: bg, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                                                        <FileText size={14} style={{ color: fg }} />
                                                        <span style={{ fontSize: 7.5, fontWeight: 800, color: fg, fontFamily: '"JetBrains Mono",monospace' }}>{type}</span>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tavil-text)', lineHeight: 1.3, marginBottom: 2 }}>{doc.title}</div>
                                                        <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)' }}>{size} · {doc.views} visualitzacions</div>
                                                    </div>
                                                    <ChevronRight size={16} style={{ color: 'var(--tavil-faint)', flexShrink: 0 }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        );
    }

    // ── Desktop ──────────────────────────────────────────────────────────────────
    const fmtDate = (d: string): string => new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-gray-500 dark:text-zinc-400 text-sm">Base de coneixement intern, documentació i recursos corporatius</p>
                {graphAccount ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle size={13} /> {graphAccount.username}
                        </span>
                        <button onClick={() => graphLogout().catch(console.error)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{t('corporate.disconnect')}</button>
                    </div>
                ) : (
                    <button onClick={() => graphLogin().catch(console.error)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-3 py-1.5 rounded-lg transition-colors">
                        <Globe size={13} /> {t('corporate.connectSharePoint')}
                    </button>
                )}
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={espaiSearch} onChange={e => setEspaiSearch(e.target.value)} placeholder="Cercar documents, polítiques, plantilles..." className="w-full max-w-lg bg-gray-100 dark:bg-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm outline-none dark:text-white" />
            </div>

            {espaiSearchResults.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 mb-6">
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-3">{espaiSearchResults.length} resultat{espaiSearchResults.length !== 1 ? 's' : ''}</p>
                    <div className="space-y-2">
                        {espaiSearchResults.map((d, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{d.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">{d.catTitle} · {d.meta}</p>
                                </div>
                                <span className="text-[10px] font-bold bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 px-2 py-0.5 rounded">{d.tag}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {ESPAI_CATS.map((c, i) => (
                    <div key={i} onClick={() => handleSelectCat(i)}
                        className={cn("hover-lift bg-white dark:bg-zinc-900 rounded-xl border-2 p-5 cursor-pointer group", selectedCat === i ? "border-red-500 shadow-md" : "border-gray-100 dark:border-zinc-800")}>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", c.bg)}>
                            <c.icon size={20} className={c.iconColor} />
                        </div>
                        <h3 className={cn("font-semibold text-sm mb-2 transition-colors", selectedCat === i ? "text-red-600" : "text-gray-900 dark:text-white")}>{c.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 leading-relaxed">{c.desc}</p>
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-gray-400 font-medium">{t('corporate.docsCount', { count: c.docs })}</p>
                        </div>
                    </div>
                ))}
            </div>

            {cat ? (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
                    <div className="flex items-center gap-3 mb-4">
                        {spFiles === null && cat.filters.map(f => (
                            <FilterChip key={f} label={f} active={catFilter === f} onClick={() => setCatFilter(f)} />
                        ))}
                        {spFiles !== null && (
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                <CheckCircle size={12} /> {t('corporate.liveSharePoint')}
                            </span>
                        )}
                        <span className="text-sm text-gray-500 dark:text-zinc-400">
                            {t('corporate.docsCount', { count: spFiles !== null ? spFiles.filter(f => !f.folder).length : visibleDocs.length })}
                        </span>
                        <a href={cat.sharepointUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60">
                            <ExternalLink size={14} /> {t('corporate.openInSharePoint')}
                        </a>
                    </div>

                    {spLoading ? (
                        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                            <span className="text-sm">Carregant des de SharePoint…</span>
                        </div>
                    ) : spError ? (
                        <div className="flex flex-col items-center py-8 gap-2 text-gray-400">
                            <AlertTriangle size={20} className="text-amber-400" />
                            <p className="text-sm">{spError}</p>
                            <button onClick={() => { setSpError(null); setSpLoading(true); listGraphFolder(cat.spFolderPath).then(f => { setSpFiles(f); setSpLoading(false); }).catch(e => { setSpError(String(e)); setSpLoading(false); }); }} className="text-xs text-red-600 hover:underline">Reintentar</button>
                        </div>
                    ) : spFiles !== null ? (
                        <div className="space-y-1">
                            {spFiles.filter(f => !f.folder).map((f, i) => {
                                const ext = f.name.split('.').pop()?.toUpperCase() ?? 'FILE';
                                const { bg, fg } = spFtStyle(f.name);
                                return (
                                    <a key={i} href={f.webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors no-underline anim-item" style={{ '--i': i } as React.CSSProperties}>
                                        <div className="w-9 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 flex-shrink-0" style={{ background: bg }}>
                                            <FileText size={15} style={{ color: fg }} />
                                            <span style={{ fontSize: 7.5, fontWeight: 800, color: fg, fontFamily: '"JetBrains Mono",monospace' }}>{ext}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{f.name.replace(/\.[^.]+$/, '')}</p>
                                            <p className="text-xs text-gray-400">{fmtSize(f.size)} · {fmtDate(f.lastModifiedDateTime)}</p>
                                        </div>
                                        <ExternalLink size={14} className="text-gray-300 group-hover:text-red-500 transition-colors flex-shrink-0" />
                                    </a>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {visibleDocs.map((doc, i) => {
                                const { bg, fg } = ftStyle(doc.meta);
                                return (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors anim-item" style={{ '--i': i } as React.CSSProperties}>
                                        <div className="w-9 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 flex-shrink-0" style={{ background: bg }}>
                                            <FileText size={15} style={{ color: fg }} />
                                            <span style={{ fontSize: 7.5, fontWeight: 800, color: fg, fontFamily: '"JetBrains Mono",monospace' }}>{doc.meta.split('·')[0].trim()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">{doc.title}</p>
                                            <p className="text-xs text-gray-400 truncate">{doc.desc}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{doc.meta} · {doc.views} visualitzacions</p>
                                        </div>
                                        <span className="text-[10px] font-bold bg-gray-100 dark:bg-zinc-700 text-gray-500 px-2 py-0.5 rounded">{doc.tag}</span>
                                        <Download size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Star size={15} className="text-amber-500" />
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('corporate.featuredDocuments')}</h3>
                        <a href={SP_BASE} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
                            <ExternalLink size={13} /> {t('corporate.openTavipedia')}
                        </a>
                    </div>
                    <div className="space-y-1">
                        {[
                            { icon: FileText, color: "text-blue-500", title: "Protocol d'acollida (onboarding)", desc: "Guia completa per als nous treballadors...", meta: "PDF · 2.4 MB · 342 visualitzacions" },
                            { icon: Shield, color: "text-purple-500", title: "Reglament de règim intern", desc: "Normativa interna que regula la convivència, els horaris i els permisos...", meta: "PDF · 1.8 MB · 518 visualitzacions" },
                            { icon: AlertTriangle, color: "text-red-500", title: "Guia de seguretat i prevenció de riscos", desc: "Manual de prevenció de riscos laborals per a TAVIL.", meta: "PDF · 3.1 MB · 287 visualitzacions" },
                            { icon: Building2, color: "text-green-500", title: "Política de viatges corporatius", desc: "Normes per a la reserva de viatges, allotjaments i dietes.", meta: "PDF · 890 KB · 195 visualitzacions" },
                            { icon: Mail, color: "text-amber-500", title: "Manual de connexió a la xarxa interna", desc: "Pas a pas per connectar-se a la VPN i el correu corporatiu.", meta: "PDF · 1.2 MB · 421 visualitzacions" },
                        ].map((doc, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                                    <doc.icon size={15} className={doc.color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors">{doc.title}</p>
                                    <p className="text-xs text-gray-400 truncate">{doc.desc}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{doc.meta}</p>
                                </div>
                                <Download size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
