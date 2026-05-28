import { API_BASE } from '../api';

export const resolveImg = (path: string): string => {
    if (!path) return '';
    // Any path containing /uploads/<file> → normalize to API_BASE + /uploads/<file>.
    // Handles: legacy localhost http URLs, full prod URLs, double-prefixed paths,
    // and plain /uploads/ relative paths.
    const m = path.match(/\/uploads\/([^?#]+)/);
    if (m) return `${API_BASE}/uploads/${m[1]}`;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${process.env.PUBLIC_URL}${path}`;
    return path;
};
