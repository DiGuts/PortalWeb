// Design tokens for TAVIL portal mobile
// Red-driven, comfy, modern, corporate

window.TAVIL_ACCENTS = {
  mahogany: { name: 'Mahogany', primary: '#bf211e', primaryDark: '#a21b18', primaryLight: '#f9eceb', ring: '#d44442' },
  terracotta: { name: 'Terracotta', primary: '#c2532a', primaryDark: '#a94521', primaryLight: '#f8e8df', ring: '#d97958' },
  oxblood: { name: 'Oxblood', primary: '#8a2623', primaryDark: '#6f1d1b', primaryLight: '#f1dcdb', ring: '#a8423f' },
  clay: { name: 'Clay', primary: '#b55139', primaryDark: '#97402c', primaryLight: '#f6e3dc', ring: '#c87158' },
};

window.TAVIL_THEMES = {
  light: {
    bg: '#f7f7f2',           // porcelain
    bgAlt: '#efefe9',
    bgSunken: '#eae9e2',
    card: '#ffffff',
    cardAlt: '#fbfbf7',
    text: '#222725',         // carbon
    textMuted: '#5d655c',
    textFaint: '#8b948a',    // dusty olive-ish
    olive: '#788475',
    border: '#e3e2db',
    borderStrong: '#cecec4',
    shadow: 'rgba(34, 39, 37, 0.06)',
    shadowMd: 'rgba(34, 39, 37, 0.10)',
    overlay: 'rgba(20, 22, 20, 0.5)',
  },
  dark: {
    bg: '#1a1c1a',
    bgAlt: '#141614',
    bgSunken: '#0f110f',
    card: '#242624',
    cardAlt: '#2a2c2a',
    text: '#f0efe8',
    textMuted: '#a8afa6',
    textFaint: '#7a8178',
    olive: '#8a9487',
    border: '#33362f',
    borderStrong: '#444640',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowMd: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
};

// Multilingual strings, extracted from repo + extended with placeholder copy
window.TAVIL_I18N = {
  ca: {
    nav: { inici: 'Inici', noticies: 'Notícies', activitats: 'Activitats', agenda: 'Agenda', directori: 'Qui és qui', veu: 'Veu', solicituds: 'Sol·licituds', perfil: 'Perfil', campus: 'Campus TAVIL', espai: 'Espai corporatiu', more: 'Més' },
    groups: { general: 'General', empresa: 'Empresa', personal: 'Personal' },
    common: { search: 'Cerca…', cancel: 'Cancel·la', save: 'Desa', back: 'Enrere', seeAll: 'Veure-ho tot', readMore: 'Llegir més', today: 'Avui', new: 'Nou', filter: 'Filtra', all: 'Tot', signIn: 'Inicia sessió', signOut: 'Tanca sessió', welcome: 'Benvingut', goodMorning: 'Bon dia', goodAfternoon: 'Bona tarda', goodEvening: 'Bona nit' },
    home: { urgent: 'AVÍS URGENT', latestNews: 'Últimes notícies', upcomingAgenda: 'Propers esdeveniments', quickAccess: 'Accés ràpid' },
    news: { subtitle: 'Informació, comunicats i novetats', newArticle: 'Nou article', minRead: 'min de lectura', share: 'Compartir', featured: 'Destacat' },
    login: { title: 'Portal intern TAVIL', subtitle: 'Entra amb el teu compte corporatiu', email: 'Correu electrònic', password: 'Contrasenya', forgot: 'Has oblidat la contrasenya?', continueWith: 'o', createAccount: 'Crear compte', noAccount: 'Encara no tens compte?', signUp: 'Registra\'t', name: 'Nom complet', confirm: 'Confirma la contrasenya', regTitle: 'Crea el teu compte', regSubtitle: 'Uneix-te al portal intern TAVIL', next: 'Continua', verify: 'Verifica el teu correu', verifySub: 'Hem enviat un codi de 8 caràcters a', codeLabel: 'Codi de verificació', resend: 'Tornar a enviar el codi', welcome: 'Benvingut/da a TAVIL' },
    voice: { title: 'Veu de l\'empleat', subtitle: 'Suggeriments, incidències i enquestes', newSuggestion: 'Nou suggeriment', newIncident: 'Nova incidència', suggestions: 'Suggeriments', incidents: 'Incidències', surveys: 'Enquestes', anonymous: 'Envia anònimament', send: 'Envia', category: 'Categoria', priority: 'Prioritat', affectedArea: 'Àrea afectada' },
    req: { title: 'Sol·licituds personals', subtitle: 'Gestió de peticions i sol·licituds', newRequest: 'Nova sol·licitud', requestedDay: 'Dia sol·licitat', comments: 'Comentaris', send: 'Envia sol·licitud', nonWorking: 'Dies no laborables', sent: 'Enviades' },
    profile: { settings: 'Configuració', language: 'Idioma', theme: 'Aparença', notifications: 'Notificacions', account: 'Compte' },
  },
  es: {
    nav: { inici: 'Inicio', noticies: 'Noticias', activitats: 'Actividades', agenda: 'Agenda', directori: 'Quién es quién', veu: 'Voz', solicituds: 'Solicitudes', perfil: 'Perfil', campus: 'Campus TAVIL', espai: 'Espacio corporativo', more: 'Más' },
    groups: { general: 'General', empresa: 'Empresa', personal: 'Personal' },
    common: { search: 'Buscar…', cancel: 'Cancelar', save: 'Guardar', back: 'Atrás', seeAll: 'Ver todo', readMore: 'Leer más', today: 'Hoy', new: 'Nuevo', filter: 'Filtrar', all: 'Todo', signIn: 'Iniciar sesión', signOut: 'Cerrar sesión', welcome: 'Bienvenido', goodMorning: 'Buenos días', goodAfternoon: 'Buenas tardes', goodEvening: 'Buenas noches' },
    home: { urgent: 'AVISO URGENTE', latestNews: 'Últimas noticias', upcomingAgenda: 'Próximos eventos', quickAccess: 'Acceso rápido' },
    news: { subtitle: 'Información, comunicados y novedades', newArticle: 'Nuevo artículo', minRead: 'min de lectura', share: 'Compartir', featured: 'Destacado' },
    login: { title: 'Portal interno TAVIL', subtitle: 'Inicia sesión con tu cuenta corporativa', email: 'Correo electrónico', password: 'Contraseña', forgot: '¿Olvidaste la contraseña?', continueWith: 'o', createAccount: 'Crear cuenta', noAccount: '¿Aún no tienes cuenta?', signUp: 'Regístrate', name: 'Nombre completo', confirm: 'Confirma la contraseña', regTitle: 'Crea tu cuenta', regSubtitle: 'Únete al portal interno TAVIL', next: 'Continuar', verify: 'Verifica tu correo', verifySub: 'Hemos enviado un código de 8 caracteres a', codeLabel: 'Código de verificación', resend: 'Reenviar el código', welcome: 'Bienvenido/a a TAVIL' },
    voice: { title: 'Voz del empleado', subtitle: 'Sugerencias, incidencias y encuestas', newSuggestion: 'Nueva sugerencia', newIncident: 'Nueva incidencia', suggestions: 'Sugerencias', incidents: 'Incidencias', surveys: 'Encuestas', anonymous: 'Enviar anónimamente', send: 'Enviar', category: 'Categoría', priority: 'Prioridad', affectedArea: 'Área afectada' },
    req: { title: 'Solicitudes personales', subtitle: 'Gestión de peticiones y solicitudes', newRequest: 'Nueva solicitud', requestedDay: 'Día solicitado', comments: 'Comentarios', send: 'Enviar solicitud', nonWorking: 'Días no laborables', sent: 'Enviadas' },
    profile: { settings: 'Ajustes', language: 'Idioma', theme: 'Apariencia', notifications: 'Notificaciones', account: 'Cuenta' },
  },
  en: {
    nav: { inici: 'Home', noticies: 'News', activitats: 'Activities', agenda: 'Calendar', directori: 'Who is who', veu: 'Voice', solicituds: 'Requests', perfil: 'Profile', campus: 'TAVIL Campus', espai: 'Corporate space', more: 'More' },
    groups: { general: 'General', empresa: 'Company', personal: 'Personal' },
    common: { search: 'Search…', cancel: 'Cancel', save: 'Save', back: 'Back', seeAll: 'See all', readMore: 'Read more', today: 'Today', new: 'New', filter: 'Filter', all: 'All', signIn: 'Sign in', signOut: 'Sign out', welcome: 'Welcome', goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening' },
    home: { urgent: 'URGENT NOTICE', latestNews: 'Latest news', upcomingAgenda: 'Upcoming events', quickAccess: 'Quick access' },
    news: { subtitle: 'Company information and announcements', newArticle: 'New article', minRead: 'min read', share: 'Share', featured: 'Featured' },
    login: { title: 'TAVIL internal portal', subtitle: 'Sign in with your corporate account', email: 'Email address', password: 'Password', forgot: 'Forgot your password?', continueWith: 'or', createAccount: 'Create account', noAccount: 'Don\'t have an account yet?', signUp: 'Sign up', name: 'Full name', confirm: 'Confirm password', regTitle: 'Create your account', regSubtitle: 'Join the TAVIL internal portal', next: 'Continue', verify: 'Verify your email', verifySub: 'We\'ve sent an 8-character code to', codeLabel: 'Verification code', resend: 'Resend the code', welcome: 'Welcome to TAVIL' },
    voice: { title: 'Employee voice', subtitle: 'Suggestions, incidents and surveys', newSuggestion: 'New suggestion', newIncident: 'New incident', suggestions: 'Suggestions', incidents: 'Incidents', surveys: 'Surveys', anonymous: 'Send anonymously', send: 'Send', category: 'Category', priority: 'Priority', affectedArea: 'Affected area' },
    req: { title: 'Personal requests', subtitle: 'Manage your personal requests', newRequest: 'New request', requestedDay: 'Requested day', comments: 'Comments', send: 'Send request', nonWorking: 'Non-working days', sent: 'Sent' },
    profile: { settings: 'Settings', language: 'Language', theme: 'Appearance', notifications: 'Notifications', account: 'Account' },
  },
};

// Placeholder data — TAVIL-flavoured
window.TAVIL_DATA = {
  user: { name: 'Marta Vidal', role: 'Sales Operations', dept: 'Comercial', initials: 'MV', ext: '2041' },
  news: [
    { id: 'n1', title: 'Nova col·lecció primavera: presentació oficial a la seu central', summary: 'Aquest dijous al matí es presenta a la seu central la col·lecció primavera 2026, amb assistència dels equips comercial, disseny i producció.', author: 'Comunicació Interna', date: '18 abril 2026', readMin: 4, featured: true, tag: 'Empresa' },
    { id: 'n2', title: 'Resultats Q1 2026: creixement del 8,4% en vendes internacionals', summary: 'El primer trimestre tanca amb xifres rècord als mercats francès, italià i del Benelux. El CEO compartirà el detall a la propera trobada.', author: 'Direcció', date: '16 abril 2026', readMin: 3, featured: false, tag: 'Resultats' },
    { id: 'n3', title: 'Premi a la innovació: TAVIL reconeguda per la seva planta sostenible', summary: 'La nova planta de Terrassa ha rebut el segell A+ en eficiència energètica i gestió de residus, atorgat per l\'associació catalana d\'indústria.', author: 'RRHH', date: '12 abril 2026', readMin: 5, featured: false, tag: 'Sostenibilitat' },
    { id: 'n4', title: 'Obrim inscripcions al programa de mobilitat interna 2026', summary: 'Fins al 30 d\'abril pots sol·licitar una rotació als equips de Barcelona, Milà o Lió. Consulta les places obertes al portal.', author: 'RRHH', date: '10 abril 2026', readMin: 2, featured: false, tag: 'Persones' },
    { id: 'n5', title: 'Nova intranet mòbil: què canvia i com treure\'n profit', summary: 'T\'expliquem les noves funcionalitats de la intranet en versió mòbil, pensades per treballar des de qualsevol lloc.', author: 'IT', date: '05 abril 2026', readMin: 3, featured: false, tag: 'Tecnologia' },
  ],
  agenda: [
    { id: 'a1', day: 22, month: 'abr', title: 'Reunió comercial setmanal', time: '09:30 – 10:30', where: 'Sala Aurora · Seu central', attendees: 8, color: 'accent' },
    { id: 'a2', day: 22, month: 'abr', title: 'Presentació col·lecció primavera', time: '11:00 – 13:00', where: 'Auditori · Seu central', attendees: 42, color: 'olive' },
    { id: 'a3', day: 23, month: 'abr', title: 'Formació: noves eines CRM', time: '15:00 – 17:00', where: 'Campus TAVIL · Online', attendees: 15, color: 'carbon' },
    { id: 'a4', day: 24, month: 'abr', title: 'Jornada portes obertes planta Terrassa', time: 'Tot el dia', where: 'Planta Terrassa', attendees: 120, color: 'accent' },
    { id: 'a5', day: 26, month: 'abr', title: 'Dinar d\'equip Q1', time: '14:00 – 16:00', where: 'Restaurant El Racó', attendees: 24, color: 'olive' },
  ],
  activities: [
    { id: 'ac1', title: 'Iogaterapia al migdia', date: '23 abr · 13:30', where: 'Sala polivalent', enrolled: 12, capacity: 20, tag: 'Benestar', status: 'upcoming' },
    { id: 'ac2', title: 'Club de lectura: "Homo Deus"', date: '25 abr · 19:00', where: 'Campus TAVIL', enrolled: 8, capacity: 15, tag: 'Cultura', status: 'upcoming' },
    { id: 'ac3', title: 'Torneig ping-pong interdepartaments', date: '29 abr · 18:00', where: 'Planta baixa', enrolled: 24, capacity: 32, tag: 'Esport', status: 'upcoming' },
    { id: 'ac4', title: 'Tast de vins DO Penedès', date: '03 mai · 20:00', where: 'Terrassa rooftop', enrolled: 18, capacity: 18, tag: 'Cultura', status: 'full' },
  ],
  directory: [
    { id: 'd1', name: 'Jordi Puig', role: 'Director general', dept: 'Direcció', ext: '2001', initials: 'JP' },
    { id: 'd2', name: 'Anna Ribes', role: 'Cap de RRHH', dept: 'Persones', ext: '2010', initials: 'AR' },
    { id: 'd3', name: 'Pau Mestre', role: 'Responsable IT', dept: 'Tecnologia', ext: '2020', initials: 'PM' },
    { id: 'd4', name: 'Laia Font', role: 'Dissenyadora sènior', dept: 'Disseny', ext: '2031', initials: 'LF' },
    { id: 'd5', name: 'Marc Vives', role: 'Account manager', dept: 'Comercial', ext: '2045', initials: 'MV' },
    { id: 'd6', name: 'Núria Bosch', role: 'Responsable de planta', dept: 'Producció', ext: '2060', initials: 'NB' },
    { id: 'd7', name: 'Èric Solà', role: 'Desenvolupador', dept: 'Tecnologia', ext: '2022', initials: 'ES' },
    { id: 'd8', name: 'Clara Ventura', role: 'Comptable sènior', dept: 'Finances', ext: '2052', initials: 'CV' },
  ],
  suggestions: [
    { id: 's1', title: 'Aparcament de bicicletes cobert a la seu', author: 'Anna R.', date: 'fa 2 dies', up: 14, down: 1, category: 'Instal·lacions', status: 'En revisió' },
    { id: 's2', title: 'Reduir la durada de les reunions setmanals', author: 'Anònim', date: 'fa 4 dies', up: 28, down: 3, category: 'Organització', status: 'Acceptat' },
    { id: 's3', title: 'Menú vegetarià fix al menjador', author: 'Pau M.', date: 'fa 1 setmana', up: 19, down: 2, category: 'Benestar', status: 'Implementat' },
  ],
  requests: [
    { id: 'r1', type: 'Vacances', day: '12 maig 2026', status: 'Aprovada', motive: 'Vacances familiars', date: '15 abril', by: 'Marta V.' },
    { id: 'r2', type: 'Assumptes propis', day: '28 abril 2026', status: 'Pendent', motive: 'Visita mèdica', date: '18 abril', by: 'Marta V.' },
    { id: 'r3', type: 'Teletreball', day: '30 abril 2026', status: 'Aprovada', motive: '—', date: '17 abril', by: 'Marta V.' },
  ],
  notifications: [
    { id: 'no1', title: 'Nova política de teletreball publicada', body: "Consulta els canvis aprovats per direcció per al Q2.", time: 'fa 1 h', unread: true, type: 'news', from: 'Comunicació' },
    { id: 'no2', title: 'La teva sol·licitud ha estat aprovada', body: 'Vacances 12 maig \u2014 aprovada per Anna Ribes.', time: 'fa 3 h', unread: true, type: 'request', from: 'RRHH' },
    { id: 'no3', title: 'Et conviden a "Formació CRM"', body: 'Divendres 23 d\'abril, 15:00 \u2014 Campus TAVIL online.', time: 'ahir', unread: false, type: 'agenda', from: 'Formació' },
    { id: 'no4', title: 'Nova enquesta disponible', body: 'Clima laboral Q1 \u2014 10 minuts, anònima.', time: 'ahir', unread: false, type: 'voice', from: 'Persones' },
    { id: 'no5', title: 'Recordatori: Jornada portes obertes', body: 'Demà a la planta Terrassa. Autobús a les 8:30.', time: 'fa 2 dies', unread: false, type: 'agenda', from: 'Esdeveniments' },
  ],
  courses: [
    { id: 'c1', title: 'Fonaments de negociació comercial', instructor: 'Laia Font', duration: '6 h', level: 'Bàsic', category: 'Comercial', progress: 40, rating: 4.6, lessons: 8 },
    { id: 'c2', title: 'Excel avançat per a finances', instructor: 'Clara Ventura', duration: '10 h', level: 'Avançat', category: 'Finances', progress: 100, rating: 4.8, lessons: 14 },
    { id: 'c3', title: 'Comunicació inclusiva al lloc de treball', instructor: 'Anna Ribes', duration: '3 h', level: 'Bàsic', category: 'Persones', progress: 0, rating: 4.9, lessons: 5, isNew: true },
    { id: 'c4', title: 'Lean manufacturing i millora contínua', instructor: 'Núria Bosch', duration: '8 h', level: 'Intermedi', category: 'Producció', progress: 65, rating: 4.5, lessons: 10 },
    { id: 'c5', title: 'Introducció a la sostenibilitat industrial', instructor: 'Èric Solà', duration: '4 h', level: 'Bàsic', category: 'Sostenibilitat', progress: 0, rating: 4.7, lessons: 6, isNew: true },
  ],
  documents: [
    { id: 'doc1', title: 'Manual d\'acollida TAVIL 2026', section: 'Polítiques', format: 'PDF', size: '2,4 MB', updated: '12 abr' },
    { id: 'doc2', title: 'Política de teletreball', section: 'Polítiques', format: 'PDF', size: '380 KB', updated: '22 abr', isNew: true },
    { id: 'doc3', title: 'Guia d\'estil corporatiu', section: 'Marca', format: 'PDF', size: '8,1 MB', updated: '03 mar' },
    { id: 'doc4', title: 'Plantilla de presentació', section: 'Marca', format: 'PPTX', size: '4,2 MB', updated: '11 feb' },
    { id: 'doc5', title: 'Protocol de prevenció de riscos', section: 'Seguretat', format: 'PDF', size: '1,1 MB', updated: '05 mar' },
    { id: 'doc6', title: 'Conveni col·lectiu 2025-2027', section: 'Persones', format: 'PDF', size: '640 KB', updated: '20 gen' },
  ],
  links: [
    { id: 'l1', title: 'Portal d\'expedients', subtitle: 'SAP · accés SSO', icon: 'requests' },
    { id: 'l2', title: 'Gestió de despeses', subtitle: 'Concur · reemborsaments', icon: 'finance' },
    { id: 'l3', title: 'Suport IT', subtitle: 'Obre un tiquet', icon: 'settings' },
    { id: 'l4', title: 'Reserva de sales', subtitle: 'Seu central · Terrassa', icon: 'mapPin' },
  ],
};
