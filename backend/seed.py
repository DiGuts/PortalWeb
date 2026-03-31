# seed.py — One-time script to create & populate the TAVIL Portal database.
# Run from: C:/UNAI/portalWeb/backend
# Usage:    venv/Scripts/python seed.py

import asyncio
from database import engine, init_db
from auth import hash_password
from sqlalchemy import text


# ── Users ─────────────────────────────────────────────────────────────────────

USERS = [
    ("Carles Homs",    "carleshoms@tavil.net", "1234", "Treballador/a",   "General"),
    ("Marta García",   "m.garcia@tavil.com",   "1234", "Treballador/a",   "Operacions"),
    ("Jordi Bellmunt", "j.bellmunt@tavil.com", "1234", "Administrador/a", "Direcció"),
    ("Unai",           "unai@tavil.net",       "1234", "Administrador/a", "Sistemes"),
]

# ── Suggestions ───────────────────────────────────────────────────────────────

SUGGESTIONS = [
    ("Ampliar l'horari del menjador fins a les 15:30", "", "Instal·lacions", 1, "Anònim", 14, "En revisió",
     "Estem valorant la proposta amb el servei de càtering. Resposta prevista abans del 31 de març."),
    ("Programa de bicicleta compartida per venir a la planta", "", "Sostenibilitat", 1, "Anònim", 23, "Acceptada",
     "Acceptat! Es posarà en marxa al maig amb 10 bicicletes disponibles al pàrquing."),
    ("Habilitar un espai de descans a la planta 2", "", "Benestar", 1, "Anònim", 18, "En revisió", ""),
    ("Sessions de ioga durant la pausa del migdia", "", "Benestar", 1, "Anònim", 9, "Pendent", ""),
]

# ── Incidències ───────────────────────────────────────────────────────────────

INCIDENCIES = [
    ("Avaria climatització sala de reunions 3", "", "Instal·lacions", "Mitjana", "Carles Homs",
     "En gestió", "David López", ""),
    ("Porta d'emergència bloquejada al magatzem B", "", "Seguretat", "Alta", "Marta García",
     "Resolta", "Pere Soler",
     "Resolt el 19/03. Es va substituir el mecanisme de tancament. Verificat per Xavier Casals."),
    ("Impressora 2n pis fora de servei", "", "Equipament", "Baixa", "Carles Homs",
     "Oberta", "Raül Ibáñez", ""),
    ("Fuita d'aire comprimit a la secció de muntatge", "", "Instal·lacions", "Alta", "Marta García",
     "Resolta", "David López",
     "Resolt el 14/03. Reparació d'urgència del connector pneumàtic."),
    ("Senyal Wi-Fi feble al menjador", "", "Sistemes", "Baixa", "Carles Homs",
     "En gestió", "Oriol Prats", ""),
]

# ── Enquestes ─────────────────────────────────────────────────────────────────

ENQUESTES = [
    ("Enquesta de clima laboral Q1 2026",      20, "2026-03-31", "Laura Martí",  84,  140, "Disponible"),
    ("Satisfacció amb el servei de menjador",  10, "2026-03-15", "Elena Pujol",  112, 140, "Completada"),
    ("Valoració de la formació 2025",          15, "2026-01-31", "Laura Martí",  98,  140, "Tancada"),
    ("Enquesta de necessitats formatives 2026",12, "2026-04-15", "Elena Pujol",  45,  140, "Disponible"),
]

# ── Employees (from EMPLOYEES constant in App.tsx) ────────────────────────────

EMPLOYEES = [
    ("Àlex Font",       "Director comercial",        "Comercial",       "a.font@tavil.com",      "934 12 00 10", "801",  "AF", "bg-red-400"),
    ("Marina Torres",   "Executiva de comptes",      "Comercial",       "m.torres@tavil.com",    "934 12 00 11", "802",  "MT", "bg-pink-500"),
    ("Núria Camps",     "Responsable de compres",    "Compres",         "n.camps@tavil.com",     "934 12 00 20", "701",  "NC", "bg-orange-500"),
    ("Jordi Bellmunt",  "Director general",          "Direcció",        "j.bellmunt@tavil.com",  "934 12 00 01", "101",  "JB", "bg-blue-500"),
    ("Carme Martínez",  "Directora financera",       "Direcció",        "c.martinez@tavil.com",  "934 12 00 02", "102",  "CM", "bg-emerald-500"),
    ("Carla Vidal",     "Comptable sènior",          "Direcció",        "c.vidal@tavil.com",     "934 12 00 03", "103",  "CV", "bg-teal-500"),
    ("Marc Ferrer",     "Enginyer de processos",     "Enginyeria",      "m.ferrer@tavil.com",    "934 12 34 80", "601",  "MF", "bg-violet-500"),
    ("Sílvia Roca",     "Dissenyadora de producte",  "Enginyeria",      "s.roca@tavil.com",      "934 12 34 81", "602",  "SR", "bg-indigo-400"),
    ("Gerard Costa",    "Enginyer mecànic",          "Enginyeria",      "g.costa@tavil.com",     "934 12 34 82", "603",  "GC", "bg-blue-400"),
    ("Jordi Fàbrega",   "Responsable de màrqueting", "Màrqueting",      "j.fabrega@tavil.com",   "934 12 34 90", "901",  "JF", "bg-rose-500"),
    ("Marta García",    "Responsable d'operacions",  "Operacions",      "m.garcia@tavil.com",    "934 12 34 56", "301",  "MG", "bg-red-500"),
    ("Pere Soler",      "Cap de logística",          "Operacions",      "p.soler@tavil.com",     "934 12 34 58", "302",  "PS", "bg-amber-500"),
    ("David López",     "Tècnic de manteniment",     "Operacions",      "d.lopez@tavil.com",     "934 12 34 59", "303",  "DL", "bg-orange-400"),
    ("Joan Puig",       "Director de producció",     "Producció",       "j.puig@tavil.com",      "934 12 34 57", "401",  "JP", "bg-amber-600"),
    ("Roger Bosch",     "Cap de torn – matí",        "Producció",       "r.bosch@tavil.com",     "934 12 34 70", "402",  "RB", "bg-cyan-500"),
    ("Sandra Vila",     "Cap de torn – tarda",       "Producció",       "s.vila@tavil.com",      "934 12 34 71", "403",  "SV", "bg-indigo-500"),
    ("Laura Martí",     "Responsable de RRHH",       "Recursos humans", "l.marti@tavil.com",     "934 12 34 60", "201",  "LM", "bg-violet-400"),
    ("Elena Pujol",     "Tècnica de selecció",       "Recursos humans", "e.pujol@tavil.com",     "934 12 34 61", "202",  "EP", "bg-pink-500"),
    ("Pau Torrent",     "Cap de sistemes",           "Sistemes",        "p.torrent@tavil.com",   "934 12 34 50", "501",  "PT", "bg-sky-500"),
    ("Irene Molina",    "Tècnica de sistemes",       "Sistemes",        "i.molina@tavil.com",    "934 12 34 51", "502",  "IM", "bg-cyan-600"),
    ("Bernat Camps",    "Responsable de qualitat",   "Qualitat",        "b.camps@tavil.com",     "934 12 34 40", "1001", "BC", "bg-green-500"),
]

# ── Activities ────────────────────────────────────────────────────────────────

ACTIVITIES = [
    # upcoming (past=0)
    ("Torneig de pàdel TAVIL",          "Esport",  "Competició amistosa per parelles, oberta a tots els nivells. Inclou berenar i premi als finalistes.",                               "5 abr 2026",  "10:00 – 14:00", "Club esportiu Mollet",               32,  24,  0),
    ("Partit de futbol interempresa",   "Esport",  "Partit amistós contra l'equip de Fixaciones Ibéricas. Veniu a animar o a jugar!",                                                   "12 abr 2026", "18:00 – 20:00", "Camp municipal de Mollet",           22,  18,  0),
    ("Sortida cultural al MNAC",        "Cultura", "Visita guiada a l'exposició temporal «Art i indústria» amb transport des de la planta.",                                            "19 abr 2026", "09:30 – 14:00", "Museu Nacional d'Art de Catalunya",  25,  20,  0),
    ("Cursa solidària 5K",              "RSC",     "Corre per una bona causa. Recaptació destinada al Banc dels Aliments.",                                                             "26 abr 2026", "09:00 – 12:00", "Passeig marítim de Barcelona",       50,  38,  0),
    ("Sessió de ioga al parc",          "Benestar","Sessió de ioga per a tots els nivells al parc annex a la planta. Porta roba còmoda.",                                               "3 mai 2026",  "08:00 – 09:00", "Parc exterior planta",               20,  12,  0),
    ("Sopar d'equip primavera 2026",    "Social",  "Sopar de convivència per a tots els treballadors de TAVIL. Inclou menú i activitat de team building.",                              "15 mai 2026", "20:00 – 23:30", "Restaurant Can Mollet",              120, 87,  0),
    # past (past=1)
    ("Jornada de voluntariat ambiental","RSC",     "Plantada d'arbres i neteja forestal als voltants de la planta. Activitat per a totes les edats.",                                   "22 mar 2026", "09:00 – 13:00", "Bosc periurbà de Mollet",            40,  40,  1),
    ("Taller de cuina saludable",       "Benestar","Sessió pràctica amb un nutricionista per aprendre a preparar àpats equilibrats al dia a dia.",                                       "15 mar 2026", "13:00 – 15:00", "Menjador de planta",                 20,  20,  1),
]

# ── Agenda events ─────────────────────────────────────────────────────────────

AGENDA_EVENTS = [
    ("Comitè de direcció",              24, 3, "09:00 – 11:00", "Sala de reunions",          "Sessió interna"),
    ("Reunió general trimestral",       25, 3, "10:00 – 12:00", "Auditori de planta",        "Sessió interna"),
    ("Revisió de projectes R+D",        26, 3, "15:00 – 16:30", "Sala d'enginyeria",         "Sessió interna"),
    ("Taller de seguretat laboral",     27, 3, "09:00 – 13:00", "Sala de formació",          "Sessió interna"),
    ("Divendres Sant",                  3,  4, "",              "",                          "Festiu"),
    ("Formació Excel avançat",          3,  4, "10:00 – 12:00", "Sala de formació",          "Sessió interna"),
    ("Torneig de pàdel TAVIL",          5,  4, "10:00 – 14:00", "Club esportiu Mollet",      "Activitat empresa"),
    ("Dilluns de Pasqua",               6,  4, "",              "",                          "Festiu"),
    ("Visita client Grupo Aldesa",      8,  4, "10:00 – 13:00", "Planta Mollet",             "Visita comercial"),
    ("Fira Hispack Barcelona",          15, 4, "09:00 – 18:00", "Fira de Barcelona",         "Fira"),
]

# ── Notices ───────────────────────────────────────────────────────────────────

NOTICES = [
    ("Tall de subministrament elèctric previst",
     "Diumenge 23 de març, de 06:00 a 14:00. Afecta les plantes 1 i 2. Reviseu el protocol d'aturada.",
     "Veure protocol", 1),
    ("Nova normativa de teletreball 2026",
     "S'han actualitzat les condicions per als dies de treball remot. Consulteu els canvis a la secció de RRHH.",
     "Llegir més", 1),
    ("Campus TAVIL: Obertes inscripcions",
     "Ja pots apuntar-te als cursos d'automatització industrial per al segon trimestre.",
     "Inscriure'm", 1),
]

# ── News ──────────────────────────────────────────────────────────────────────

NEWS = [
    # (category, title, summary, content, author, date, image, featured)
    ("Notícies corporatives",
     "Nova línia de producció inaugurada a la planta de Mollet",
     "La inversió de 2,3 milions d'euros permetrà augmentar la capacitat productiva un 15% durant el segon semestre de 2026.",
     "La nova línia de producció, inaugurada ahir a la planta de Mollet, representa la inversió més gran de TAVIL dels últims cinc anys. Amb una capacitat addicional del 15%, l'empresa podrà respondre a la creixent demanda del mercat europeu.",
     "Jordi Fàbrega", "20 mar 2026", "/assets/images/img_4.png", 1),
    ("Notícies corporatives",
     "Resultats del primer trimestre: creixement del 8%",
     "Les vendes internacionals han impulsat els resultats per sobre de les previsions.",
     "TAVIL tanca el primer trimestre de 2026 amb un creixement del 8% respecte al mateix període de l'any anterior. Les vendes internacionals han estat el principal motor de creixement, especialment al mercat alemany i francès.",
     "Carme Martínez", "18 mar 2026", "/assets/images/img_7.png", 0),
    ("Recursos humans",
     "Convocatòria oberta per al programa de mentoria interna",
     "Els treballadors interessats poden inscriure's fins al 31 de març.",
     "El Departament de Recursos Humans obre la convocatòria del programa de mentoria interna per al segon trimestre de 2026. Els treballadors amb més de dos anys d'experiència a l'empresa poden sol·licitar ser mentors.",
     "Laura Martí", "15 mar 2026", "/assets/images/img_3.png", 0),
    ("Seguretat",
     "Actualització del protocol de seguretat en zones de càrrega",
     "A partir de l'1 d'abril s'aplicaran noves mesures de seguretat.",
     "El Departament de Prevenció de Riscos Laborals ha actualitzat el protocol de seguretat per a les zones de càrrega i descàrrega. Les noves mesures inclouen senyalització ampliada i l'ús obligatori d'armilles reflectants.",
     "Xavier Casals", "12 mar 2026", "/assets/images/img_8.png", 0),
]

# ── Courses ───────────────────────────────────────────────────────────────────

COURSES = [
    # (title, category, description, hours, mandatory, cert)
    ("Prevenció i seguretat a planta",           "Seguretat",   "Formació obligatòria anual sobre prevenció de riscos laborals per a personal de planta.",               "8h",  1, 0),
    ("Procediments de qualitat ISO 9001",        "Qualitat",    "Formació sobre el sistema de gestió de qualitat de TAVIL segons la norma ISO 9001.",                    "6h",  1, 0),
    ("Introducció a l'ERP (SAP Business One)",   "Sistemes",    "Curs bàsic per aprendre a navegar i utilitzar les funcions principals de l'ERP corporatiu.",            "10h", 0, 0),
    ("Bones pràctiques comercials",              "Comercial",   "Tècniques de venda consultiva i gestió de clients adaptades al sector industrial.",                     "12h", 0, 0),
    ("Formació en protecció de dades (RGPD)",    "Compliance",  "Formació obligatòria sobre la normativa de protecció de dades personals.",                              "4h",  1, 1),
    ("Manual d'acollida per a noves incorporacions","Acollida", "Curs introductori per als nous treballadors amb tota la informació corporativa.",                        "5h",  1, 1),
    ("Anglès B2 per a entorn professional",      "Idiomes",     "Millorar el nivell d'anglès per a comunicació professional escrita i oral.",                            "40h", 0, 0),
]

# Course progress for the seeded users (Carles Homs = user id 1)
# Maps course title → (status, progress)
USER_PROGRESS = {
    "Prevenció i seguretat a planta":          ("En curs",   62),
    "Procediments de qualitat ISO 9001":       ("Pendent",    0),
    "Introducció a l'ERP (SAP Business One)":  ("En curs",   40),
    "Bones pràctiques comercials":             ("Pendent",    0),
    "Formació en protecció de dades (RGPD)":   ("Completat", 100),
    "Manual d'acollida per a noves incorporacions": ("Completat", 100),
    "Anglès B2 per a entorn professional":     ("En curs",   25),
}


# ── Seed runner ───────────────────────────────────────────────────────────────

async def seed():
    print("Initialising schema...")
    await init_db()

    async with engine.begin() as conn:
        # Clear existing data (order respects FK dependencies)
        for tbl in [
            "user_course_progress", "enquesta_responses", "solicituds",
            "courses", "news", "notices", "agenda_events", "activities",
            "employees", "enquestes", "incidencies", "suggestions", "users",
        ]:
            await conn.execute(text(f"DELETE FROM {tbl}"))

        # Users
        print("Seeding users...")
        user_ids: dict[str, int] = {}
        for name, email, password, role, dept in USERS:
            r = await conn.execute(
                text("INSERT INTO users (name, email, password, role, dept) VALUES (:n,:e,:p,:r,:d)"),
                {"n": name, "e": email, "p": hash_password(password), "r": role, "d": dept},
            )
            user_ids[email] = r.lastrowid

        # Suggestions
        print("Seeding suggestions...")
        for title, desc, cat, anon, author, votes, status, response in SUGGESTIONS:
            await conn.execute(
                text("INSERT INTO suggestions (title,description,category,anonymous,author,votes,status,response) VALUES (:t,:d,:c,:a,:au,:v,:s,:r)"),
                {"t": title, "d": desc, "c": cat, "a": anon, "au": author, "v": votes, "s": status, "r": response},
            )

        # Incidències
        print("Seeding incidencies...")
        for title, desc, area, priority, author, status, assigned_to, resolution in INCIDENCIES:
            await conn.execute(
                text("INSERT INTO incidencies (title,description,area,priority,author,status,assigned_to,resolution) VALUES (:t,:d,:a,:p,:au,:s,:at,:r)"),
                {"t": title, "d": desc, "a": area, "p": priority, "au": author, "s": status, "at": assigned_to, "r": resolution},
            )

        # Enquestes
        print("Seeding enquestes...")
        for title, questions, deadline, creator, responses, total, status in ENQUESTES:
            await conn.execute(
                text("INSERT INTO enquestes (title,questions,deadline,creator,responses,total,status) VALUES (:t,:q,:dl,:cr,:re,:to,:s)"),
                {"t": title, "q": questions, "dl": deadline, "cr": creator, "re": responses, "to": total, "s": status},
            )

        # Employees
        print("Seeding employees...")
        for name, role, dept, email, phone, ext, initials, color in EMPLOYEES:
            await conn.execute(
                text("INSERT INTO employees (name,role,dept,email,phone,ext,initials,color) VALUES (:n,:r,:d,:e,:ph,:ex,:i,:c)"),
                {"n": name, "r": role, "d": dept, "e": email, "ph": phone, "ex": ext, "i": initials, "c": color},
            )

        # Activities
        print("Seeding activities...")
        for title, cat, desc, date, time, location, capacity, enrolled, past in ACTIVITIES:
            await conn.execute(
                text("INSERT INTO activities (title,category,description,date,time,location,capacity,enrolled,past) VALUES (:t,:c,:d,:da,:ti,:l,:ca,:en,:p)"),
                {"t": title, "c": cat, "d": desc, "da": date, "ti": time, "l": location, "ca": capacity, "en": enrolled, "p": past},
            )

        # Agenda
        print("Seeding agenda events...")
        for title, day, month, time, location, type_ in AGENDA_EVENTS:
            await conn.execute(
                text("INSERT INTO agenda_events (title,day,month,time,location,type) VALUES (:t,:d,:m,:ti,:l,:ty)"),
                {"t": title, "d": day, "m": month, "ti": time, "l": location, "ty": type_},
            )

        # Notices
        print("Seeding notices...")
        for title, content, link, active in NOTICES:
            await conn.execute(
                text("INSERT INTO notices (title,content,link,active) VALUES (:t,:c,:l,:a)"),
                {"t": title, "c": content, "l": link, "a": active},
            )

        # News
        print("Seeding news...")
        for cat, title, summary, content, author, date, image, featured in NEWS:
            await conn.execute(
                text("INSERT INTO news (category,title,summary,content,author,date,image,featured) VALUES (:ca,:t,:su,:co,:au,:da,:im,:fe)"),
                {"ca": cat, "t": title, "su": summary, "co": content, "au": author, "da": date, "im": image, "fe": featured},
            )

        # Courses + per-user progress for Carles Homs
        print("Seeding courses...")
        course_ids: dict[str, int] = {}
        for title, cat, desc, hours, mandatory, cert in COURSES:
            r = await conn.execute(
                text("INSERT INTO courses (title,category,description,hours,mandatory,cert) VALUES (:t,:c,:d,:h,:m,:ce)"),
                {"t": title, "c": cat, "d": desc, "h": hours, "m": mandatory, "ce": cert},
            )
            course_ids[title] = r.lastrowid

        carles_id = user_ids.get("carleshoms@tavil.net")
        if carles_id:
            for title, (status, progress) in USER_PROGRESS.items():
                cid = course_ids.get(title)
                if cid:
                    await conn.execute(
                        text("INSERT INTO user_course_progress (user_id,course_id,status,progress) VALUES (:u,:c,:s,:p)"),
                        {"u": carles_id, "c": cid, "s": status, "p": progress},
                    )

    print("\nDone! Seeded:")
    print(f"  {len(USERS)} users")
    print(f"  {len(SUGGESTIONS)} suggestions")
    print(f"  {len(INCIDENCIES)} incidencies")
    print(f"  {len(ENQUESTES)} enquestes")
    print(f"  {len(EMPLOYEES)} employees")
    print(f"  {len(ACTIVITIES)} activities")
    print(f"  {len(AGENDA_EVENTS)} agenda events")
    print(f"  {len(NOTICES)} notices")
    print(f"  {len(NEWS)} news articles")
    print(f"  {len(COURSES)} courses + {len(USER_PROGRESS)} progress records")
    print("\nLogin credentials:")
    print("  carleshoms@tavil.net  / 1234  (Treballador/a)")
    print("  m.garcia@tavil.com    / 1234  (Treballador/a)")
    print("  j.bellmunt@tavil.com  / 1234  (Administrador/a)")
    print("  unai@tavil.net        / 1234  (Administrador/a)")


if __name__ == "__main__":
    asyncio.run(seed())
