import { useEffect, useRef } from 'react';

export function scrollPageToTop() {
    try {
        const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (y <= 0) return;
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {}
}

// Smoothly scrolls element into view if its top is below 60% of viewport.
// Use after opening drawers/modals/inline forms positioned low on the page.
export function scrollIntoViewIfBelowFold(
    el: HTMLElement | null,
    opts?: { threshold?: number; block?: ScrollLogicalPosition }
) {
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const threshold = opts?.threshold ?? 0.6;
    const belowFold = rect.top > vh * threshold;
    const aboveView = rect.bottom < 0 || rect.top < 0;
    if (belowFold || aboveView) {
        el.scrollIntoView({ behavior: 'smooth', block: opts?.block ?? 'center' });
    }
}

// Hook: when `active` flips truthy, scrolls the ref'd element into view if below fold.
export function useScrollIntoViewWhen<T extends HTMLElement = HTMLElement>(
    active: unknown,
    opts?: { threshold?: number; block?: ScrollLogicalPosition; delay?: number }
) {
    const ref = useRef<T | null>(null);
    useEffect(() => {
        if (!active) return;
        const t = window.setTimeout(() => scrollIntoViewIfBelowFold(ref.current, opts), opts?.delay ?? 60);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);
    return ref;
}
