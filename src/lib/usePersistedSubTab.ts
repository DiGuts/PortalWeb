import { useState } from 'react';
import { scrollPageToTop } from './scroll';

// Persist subtab to sessionStorage so reloads restore the inner page.
export function usePersistedSubTab<T extends string>(
    key: string,
    fallback: T,
    allowed?: readonly T[]
): [T, (v: T) => void] {
    const storageKey = `tavil_subtab_${key}`;
    const [value, setValue] = useState<T>(() => {
        if (typeof window === 'undefined') return fallback;
        const saved = window.sessionStorage.getItem(storageKey) as T | null;
        if (!saved) return fallback;
        if (allowed && !allowed.includes(saved)) return fallback;
        return saved;
    });
    const update = (v: T) => {
        try { window.sessionStorage.setItem(storageKey, v); } catch {}
        setValue(v);
        scrollPageToTop();
    };
    return [value, update];
}
