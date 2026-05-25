# app/

Folder `app/` berisi kode utama aplikasi FastAPI.

- `main.py` — entrypoint FastAPI (daftarkan router, event startup).
- `config/` — konfigurasi aplikasi (database, whapi, env).
- `controller/` — (opsional) layer controller untuk logika bisnis dan orchestration.
- `models/` — SQLAlchemy models.
- `routes/` — definisi route/endpoint seperti `auth`.
- `schemas/` — Pydantic schemas untuk request/response.
- `services/` — layanan bisnis (mis. `bot_service.py`).
- `utils/` — utilitas seperti `jwt.py`, `security.py`.
- `whapi/` — integrasi WhatsApp API (client + webhook).

Quick start

1. Pastikan environment variables ter-set (lihat `app/config/README.md`).
2. Jalankan server:

```bash
uvicorn app.main:app --reload
```

3. Untuk menjalankan contoh pengiriman pesan, lihat `app/whapi/README.md`.
