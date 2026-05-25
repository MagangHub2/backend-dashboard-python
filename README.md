# project-root

Monorepo untuk sistem dashboard customer service WhatsApp. Terdiri dari dua service backend yang berjalan bersamaan.

---

## Arsitektur

```
                          ┌─────────────────────────┐
  WhatsApp Customer ─────►│   wa-baileys-service     │ Node.js, port 3000
                          │   (terima & kirim pesan) │
                          └────────────┬────────────┘
                                       │ webhook POST /webhook/baileys
                                       ▼
                          ┌─────────────────────────┐
                          │  backend-dashboard-python│ FastAPI, port 8000
                          │  (bot AI, tiket, agent)  │
                          └────────────┬────────────┘
                                       │ REST API + WebSocket
                                       ▼
                          ┌─────────────────────────┐
                          │  dashboard-message-center│ Next.js, port 3001
                          │  (dashboard admin/agent) │
                          └─────────────────────────┘
```

**Alur pesan masuk:**
```
Customer WA → wa-baileys-service → POST /webhook/baileys → backend-dashboard-python
                                                                    │
                                              ┌─────────────────────┤
                                              │                     │
                                          Bot AI reply        Simpan ke DB
                                              │                     │
                                        Kirim ke WA         WebSocket broadcast
                                                              ke dashboard
```

---

## Services

| Service | Folder | Port | Keterangan |
|---------|--------|------|------------|
| Python Backend | [`backend-dashboard-python/`](./backend-dashboard-python/) | `8000` | FastAPI + PostgreSQL |
| Baileys WA | [`wa-baileys-service/`](./wa-baileys-service/) | `3000` | Node.js WhatsApp bridge |
| PostgreSQL | (Docker only) | `5433` | Database |

Frontend (`dashboard-message-center/`) ada satu level di atas folder ini dan berjalan terpisah.

---

## Cara Menjalankan

### Opsi 1 — Docker (semua sekaligus)

Jalankan PostgreSQL + backend + Baileys dalam satu perintah:

```bash
docker-compose up -d
```

Cek status:
```bash
docker-compose ps
docker-compose logs -f backend
docker-compose logs -f wa-baileys
```

Stop semua:
```bash
docker-compose down
```

**Port yang diexpose:**
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Baileys service: `http://localhost:3001`

> Catatan: Baileys diexpose di `3001` (bukan `3000`) supaya tidak bentrok dengan dev lokal.

---

### Opsi 2 — Manual (tanpa Docker)

Butuh PostgreSQL yang sudah berjalan di lokal.

**Jalankan semua sekaligus:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Atau jalankan satu-satu di terminal berbeda:**

Terminal 1 — Python Backend:
```bash
cd backend-dashboard-python
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — Baileys Service:
```bash
cd wa-baileys-service
npm install
npm run dev
```

---

## Environment Variables

Setiap service punya file `.env` masing-masing:

**`backend-dashboard-python/.env`** — lihat [backend README](./backend-dashboard-python/README.md#4-environment-variables)

**`wa-baileys-service/.env`:**
```env
PORT=3000
PYTHON_WEBHOOK_URL=http://localhost:8000/webhook/baileys
INTERNAL_API_KEY=baileys-internal-2026
PYTHON_BACKEND_URL=http://localhost:8000
```

> `INTERNAL_API_KEY` di Baileys harus sama dengan `BAILEYS_API_KEY` di backend — ini yang mengautentikasi webhook.

---

## Scan QR WhatsApp

Saat pertama kali dijalankan (atau setelah session dihapus), Baileys akan menampilkan QR code di terminal.

1. Buka WhatsApp di HP nomor bot
2. **Perangkat Tertaut → Tautkan Perangkat**
3. Scan QR

Session tersimpan di `wa-baileys-service/auth_info/`. Tidak perlu scan ulang saat restart.

**Reset session:**
```bash
rm -rf wa-baileys-service/auth_info/
```

---

## Dokumentasi

| Service | README |
|---------|--------|
| Python Backend | [backend-dashboard-python/README.md](./backend-dashboard-python/README.md) |
| Baileys WA Service | [wa-baileys-service/README.md](./wa-baileys-service/README.md) |
| Backend API Detail | [backend-dashboard-python/docs/](./backend-dashboard-python/docs/) |
