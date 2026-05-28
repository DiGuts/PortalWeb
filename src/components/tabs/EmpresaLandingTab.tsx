import { Building2, Users, GraduationCap, Activity as ActivityIcon, ChevronRight } from 'lucide-react';

export function EmpresaLandingTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
    const items: { id: string; label: string; icon: any; desc: string }[] = [
        { id: 'Espai', label: 'Tavipedia', icon: Building2, desc: 'Manual, polítiques, beneficis, identitat' },
        { id: 'Directori', label: 'Who is who?', icon: Users, desc: 'Troba companys per departament' },
        { id: 'Campus', label: 'Campus TAVIL', icon: GraduationCap, desc: 'Formació i cursos' },
        { id: 'Activitats', label: 'Connect', icon: ActivityIcon, desc: "Activitats i esdeveniments TAVIL" },
    ];
    return (
        <div className="space-y-2">
            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-3">Accés ràpid a les seccions d'empresa</p>
            {items.map(({ id, label, icon: Icon, desc }) => (
                <button
                    key={id}
                    onClick={() => onNavigate?.(id)}
                    className="w-full flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 p-4 hover:border-red-300 dark:hover:border-red-800 transition-colors text-left"
                >
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 flex-shrink-0">
                        <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </button>
            ))}
        </div>
    );
}
