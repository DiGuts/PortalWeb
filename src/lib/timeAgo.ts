export function timeAgo(isoStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
    const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return t('timeago.justNow');
    if (diff < 3600) return t('timeago.minutesAgo', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('timeago.hoursAgo', { count: Math.floor(diff / 3600) });
    if (diff < 172800) return t('timeago.yesterday');
    return t('timeago.daysAgo', { count: Math.floor(diff / 86400) });
}
