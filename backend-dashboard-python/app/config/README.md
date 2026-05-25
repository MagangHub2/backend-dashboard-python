# app/config/

Folder ini berisi konfigurasi aplikasi.

Files utama:

- `config.py` — konfigurasi umum aplikasi.
- `confiq_whapi.py` — pengaturan WHAPI (pydantic BaseSettings).
- `database.py` — koneksi SQLAlchemy.
- `deps.py` — dependency injection helpers.

Environment variables penting:

- `DATABASE_URL` — URL koneksi PostgreSQL.
- `WHAPI_BASE_URL` — base URL provider WHAPI (contoh: https://whapi.example).
- `WHAPI_TOKEN` — token/secret untuk mengirim pesan ke WHAPI.
- `WHAPI_ADMINS` — (opsional) daftar nomor admin dipisah koma, mis: 62811...,62812...
- `OPENAI_API_KEY` — (opsional) kunci API OpenAI untuk AI fallback.

Contoh .env:

```ini
DATABASE_URL=postgresql://user:pass@localhost/dbname
WHAPI_BASE_URL=https://your-whapi.example
WHAPI_TOKEN=supersecrettoken
WHAPI_ADMINS=62811xxxx
OPENAI_API_KEY=sk-xxx
```

Catatan:

- `confiq_whapi.py` menggunakan Pydantic `BaseSettings` dan membaca `.env` bila tersedia.
