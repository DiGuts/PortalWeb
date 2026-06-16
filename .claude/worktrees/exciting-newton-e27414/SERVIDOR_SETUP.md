# TAVIL Portal — Configuració del Servidor

> **Backend:** Python 3.11+ · FastAPI · Uvicorn · MariaDB

---

## 1. Requisits previs

```bash
# Assegura't que tens:
python3 --version   # >= 3.11
pip3 --version
# I que el servidor MariaDB (192.168.10.168) és accessible
```

---

## 2. Còpia dels fitxers al servidor

Puja la carpeta `backend/` al servidor (p. ex. a `/opt/tavil-portal/backend/`).

```
/opt/tavil-portal/
└── backend/
    ├── main.py
    ├── database.py
    ├── models.py
    ├── schema.sql
    ├── requirements.txt
    ├── routers/
    ├── uploads/        ← ha d'existir i tenir permisos d'escriptura
    └── .env            ← crea'l manualment (veure pas 3)
```

---

## 3. Fitxer `.env` de producció

Crea `/opt/tavil-portal/backend/.env` amb aquest contingut (adapta els valors):

```env
# Base de dades MariaDB de producció
DB_URL=mysql+aiomysql://dev_app:Fa0VuwEfJwqLyf2tknj4fe@192.168.10.168:3306/app_db

# CORS: domini(s) des d'on s'accedeix al portal (frontend)
CORS_ORIGINS=https://portal.tavil.cat

# JWT
JWT_SECRET=420785bbac6b26ac2914b7022a62d21fa1d1ab139f0c3a15a5d7e8ff8cd6b0cd

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=stmpportalwebtest@gmail.com
SMTP_PASS=votk rzcu ilyr ztth
SMTP_FROM=TAVIL Portal <stmpportalwebtest@gmail.com>
EMAIL_VERIFY_ENABLED=true
LOGIN_2FA_ENABLED=false
```

> **Important:** si el frontend s'accedeix des de dues URL (p. ex. LAN i domini extern), posa-les separades per comes:
> `CORS_ORIGINS=https://portal.tavil.cat,http://192.168.10.x`

---

## 4. Instal·lació de dependències

```bash
cd /opt/tavil-portal/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 5. Servei systemd (sempre actiu + reinici automàtic)

Crea el fitxer `/etc/systemd/system/tavil-backend.service`:

```ini
[Unit]
Description=TAVIL Portal Backend (FastAPI)
After=network.target mariadb.service
Wants=mariadb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/tavil-portal/backend
EnvironmentFile=/opt/tavil-portal/backend/.env
ExecStart=/opt/tavil-portal/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Activa i arrenca el servei:

```bash
sudo systemctl daemon-reload
sudo systemctl enable tavil-backend    # arrenca automàticament en reiniciar el servidor
sudo systemctl start tavil-backend
```

---

## 6. Comprovació

```bash
# Estat del servei
sudo systemctl status tavil-backend

# Logs en temps real
sudo journalctl -u tavil-backend -f

# Prova que l'API respon
curl http://localhost:8000/health
```

---

## 7. Reiniciar el backend (quan calgui)

```bash
sudo systemctl restart tavil-backend
```

Un reinici tarda ~3-5 segons. L'API deixa de respondre durant aquest interval.

---

## 8. Actualitzar el backend (quan es desplegui codi nou)

```bash
# 1. Puja els fitxers nous a /opt/tavil-portal/backend/
# 2. Si hi ha dependències noves:
cd /opt/tavil-portal/backend
source venv/bin/activate
pip install -r requirements.txt
# 3. Reinicia
sudo systemctl restart tavil-backend
```

---

## 9. Carpeta d'imatges pujades (uploads)

La carpeta `uploads/` ha de tenir permisos d'escriptura per a l'usuari del servei:

```bash
sudo chown -R www-data:www-data /opt/tavil-portal/backend/uploads
sudo chmod -R 755 /opt/tavil-portal/backend/uploads
```

Les imatges s'exposen automàticament a `http://[servidor]:8000/uploads/[fitxer]`.

---

## 10. (Opcional) Proxy invers amb Nginx

Si el frontend ja corre sota Nginx, afegeix un bloc per redirigir `/api/` al backend:

```nginx
location /api/ {
    proxy_pass         http://127.0.0.1:8000/;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
}
```

Reinicia Nginx després: `sudo systemctl reload nginx`

---

## Resum ràpid

| Acció | Comanda |
|---|---|
| Veure estat | `sudo systemctl status tavil-backend` |
| Reiniciar | `sudo systemctl restart tavil-backend` |
| Parar | `sudo systemctl stop tavil-backend` |
| Logs en viu | `sudo journalctl -u tavil-backend -f` |
| Logs últimes 100 línies | `sudo journalctl -u tavil-backend -n 100` |
