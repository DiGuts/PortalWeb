# TAVIL Hub — Portal intern

Portal intern per als empleats de **Tavil Industrial S.A.U.** (Sant Jaume de Llierca). SPA React + API PHP amb front-controller + MariaDB.

## Stack

| Capa | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Create React App |
| Backend | PHP 8.1+, front-controller (`api/index.php`) |
| Base de dades | MariaDB (`tavil_portal`) |
| Autenticació | JWT (HS256, 8h) |
| Desplegament | FTP via `deploy.sh` |
| i18n | i18next — català (CA), castellà (ES), anglès (EN) |

## Requisits previs

- Node.js 18+
- `npm`
- Accés FTP al servidor de producció (`ftp_deploy.cfg`)

## Desenvolupament local

```bash
npm install
npm start        # http://localhost:3000
```

La SPA espera una API a `/api/`. En local, configura un proxy o apunta a l'API de producció al fitxer `package.json` (`"proxy": "https://…"`).

## Build i desplegament

```bash
# 1. Compilar el frontend
npm run build

# 2. Desplegar frontend + backend PHP per FTP
bash deploy.sh
```

> **Important:** `deploy.sh` aplica CHMOD 644 a tots els fitxers PHP automàticament. Si s'oblida, `api/index.php` no pot fer `require` dels route files i retorna 500.

### Desplegar només PHP (sense recompilar frontend)

```bash
curl.exe -K ftp_deploy.cfg -T api/routes/courses.php ftp://…/api/routes/courses.php
curl.exe -K ftp_deploy.cfg -Q "CHMOD 644 api/routes/courses.php" ftp://…/
```

> **Nota:** Usa sempre `-K ftp_deploy.cfg` (mai inline) perquè la contrasenya pot contenir `!` que bash interpreta com a historial.

## Variables d'entorn — `api/.env`

```env
DB_DSN=mysql:host=localhost;dbname=tavil_portal;charset=utf8mb4
DB_USER=tavil_user
DB_PASS=…
JWT_SECRET=…          # mínim 32 caràcters aleatoris — CANVIA en producció
CORS_ORIGIN=https://portal.tavil.net
SMTP_HOST=smtp.tavil.net
SMTP_PORT=587
SMTP_USER=no-reply@tavil.net
SMTP_PASS=…
```

> **Mai versionar `api/.env` ni `ftp_deploy.cfg` al git.**

## Migracions de base de dades

Els scripts viuen a `api/migrations/`. Cada fitxer és idempotent (pot executar-se més d'una vegada). Per executar-ne un:

1. Afegeix una ruta temporal a `api/index.php`:
   ```php
   '_mig_nom' => __DIR__ . '/migrations/_add_nom.php',
   ```
2. Despliega i executa:
   ```bash
   curl.exe -H "Authorization: Bearer <token>" https://…/api/_mig_nom
   ```
3. Elimina la ruta temporal i redespliega.

## Estructura de fitxers

```
portalWeb/
├── api/
│   ├── index.php          # Front-controller (punt d'entrada únic)
│   ├── config.php         # DB, JWT, SMTP
│   ├── helpers.php        # jwt_encode/decode, require_auth, require_role, db()
│   ├── routes/            # Un fitxer per recurs (courses.php, news.php, …)
│   ├── migrations/        # Scripts SQL idempotents
│   └── uploads/           # Imatges pujades
├── src/
│   ├── App.tsx            # Component arrel + totes les pestanyes
│   ├── api.ts             # Funcions fetch + interfaces TypeScript
│   ├── index.css          # Tokens CSS globals + Tailwind
│   ├── components/
│   │   ├── admin/         # Backoffice, creació de contingut
│   │   ├── tabs/          # Pestanyes principals (Campus, Agenda, …)
│   │   ├── mobile/        # Navegació i header mòbil
│   │   ├── auth/          # LoginPage
│   │   └── shared/        # Skeletons, components reutilitzables
│   └── locales/           # ca.json · es.json · en.json
├── public/                # Assets estàtics (logo, header img)
├── build/                 # Sortida del build (no versionar)
├── deploy.sh              # Script de desplegament FTP
└── ftp_deploy.cfg         # Credencials FTP (no versionar)
```

## Mòduls del portal

- **Inici** — Notícies destacades, calendari, accessos ràpids
- **Notícies** — Notícies per categories + editor de contingut (tile grid 12 cols)
- **Activitats** — Connect TAVIL: activitats extraempresarials amb inscripció
- **Agenda** — Esdeveniments corporatius per departament
- **Campus TAVIL** — Catàleg de formacions, progrés, formació presencial
- **Vacances** — Sol·licituds de vacances i permisos, aprovació RRHH
- **Suggeriments** — Canal anònim de propostes
- **Incidències** — Reporte i seguiment d'incidències
- **Enquestes / Quizzes** — Avaluació de formacions
- **Directori** — Cerca d'empleats i organigrama
- **Empresa** — Info corporativa i Espai Corporatiu (documents)
- **Backoffice** — Gestió de continguts i usuaris (rols privilegiats)

## Rols

| Rol | Permisos |
|---|---|
| `Administrador/a` | Accés complet |
| `Recursos humans` | Usuaris, vacances, formacions, notícies |
| `Comunicacions` | Notícies, avisos, agenda |
| `Formacions` | Campus TAVIL, agenda de formació |
| `Cap de departament` | Aprovació vacances del seu dept. |
| `SolicitudsVacances` | Gestió sol·licituds de vacances |
| `SolicitudsDissabtes` | Gestió sol·licituds de dissabtes/permisos |
| `Treballador/a` | Accés de lectura (rol base) |

Els usuaris poden tenir múltiples rols simultàniament (`roles[]` JSON al camp `users.roles`).

## Remots git

```bash
git remote -v
# origin   https://github.com/DiGuts/PortalWeb.git
# tavil    git@srlnxgit01.tavil.net:unaiclapers/PortalWeb.git

git push origin master
git push tavil master
```
