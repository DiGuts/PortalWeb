// Module-level nav-hide signal so any tab can hide the bottom nav without prop drilling.
let _setGlobalNavHidden: ((h: boolean) => void) | null = null;

export function registerGlobalNavSetter(fn: ((h: boolean) => void) | null) {
    _setGlobalNavHidden = fn;
}

export function setGlobalNavHidden(h: boolean) {
    _setGlobalNavHidden?.(h);
}
