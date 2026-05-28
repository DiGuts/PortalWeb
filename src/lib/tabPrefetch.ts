// Module-level cache so tabs can read previously-fetched data synchronously in
// useState initializers, avoiding skeleton flashes on (re)mount and while the
// mobile swipe strip pre-renders adjacent tabs.
import {
    Notice, apiGetNotices,
    NewsArticle, apiGetNews,
    Activity, apiGetActivities,
    AgendaEvent, apiGetAgendaEvents,
    Employee, apiGetEmployees,
    Course, apiGetCourses,
    Solicitud, apiGetSolicituds,
    Vacanca, apiGetVacances,
} from '../api';

export type TabPrefetchCache = {
    notices?: Notice[];
    news?: NewsArticle[];
    activities?: Activity[];
    agendaEvents?: AgendaEvent[];
    employees?: Employee[];
    courses?: Course[];
    solicituds?: Solicitud[];
    vacances?: Vacanca[];
};

export const tabPrefetch: TabPrefetchCache = {};

export const tabPrefetchAt: Record<keyof TabPrefetchCache, number> = {
    notices: 0, news: 0, activities: 0, agendaEvents: 0,
    employees: 0, courses: 0, solicituds: 0, vacances: 0,
};

// Skip refetch on mount whenever cached data exists. Mutations update the
// cache in place, so navigations don't need to refetch — eliminates the
// re-render flash when re-entering a previously-loaded tab.
export function isTabCacheFresh(key: keyof TabPrefetchCache): boolean {
    return tabPrefetch[key] !== undefined;
}

let tabPrefetchPromise: Promise<void> | null = null;

export function prefetchTabData(force = false): Promise<void> {
    if (tabPrefetchPromise && !force) return tabPrefetchPromise;
    const now = () => Date.now();
    tabPrefetchPromise = Promise.allSettled([
        apiGetNotices().then(d => { tabPrefetch.notices = d; tabPrefetchAt.notices = now(); }),
        apiGetNews().then(d => { tabPrefetch.news = d; tabPrefetchAt.news = now(); }),
        apiGetActivities().then(d => { tabPrefetch.activities = d; tabPrefetchAt.activities = now(); }),
        apiGetAgendaEvents().then(d => { tabPrefetch.agendaEvents = d; tabPrefetchAt.agendaEvents = now(); }),
        apiGetEmployees().then(d => { tabPrefetch.employees = d; tabPrefetchAt.employees = now(); }),
        apiGetCourses().then(d => { tabPrefetch.courses = d; tabPrefetchAt.courses = now(); }),
        apiGetSolicituds().then(d => { tabPrefetch.solicituds = d; tabPrefetchAt.solicituds = now(); }),
        apiGetVacances().then(d => { tabPrefetch.vacances = d; tabPrefetchAt.vacances = now(); }),
    ]).then(() => undefined);
    return tabPrefetchPromise;
}

export function resetTabPrefetch() {
    tabPrefetch.notices = undefined;
    tabPrefetch.news = undefined;
    tabPrefetch.activities = undefined;
    tabPrefetch.agendaEvents = undefined;
    tabPrefetch.employees = undefined;
    tabPrefetch.courses = undefined;
    tabPrefetch.solicituds = undefined;
    tabPrefetch.vacances = undefined;
    (Object.keys(tabPrefetchAt) as (keyof TabPrefetchCache)[]).forEach(k => { tabPrefetchAt[k] = 0; });
    tabPrefetchPromise = null;
}
