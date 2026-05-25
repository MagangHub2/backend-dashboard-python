# app/schemas/

Folder untuk Pydantic schemas (request/response validation).

- `auth_schema.py` — schema terkait otentikasi.

Rekomendasi:

- Gunakan schema untuk validasi input pada route handler.
- Buat schema terpisah untuk input dan output jika perlu (mis. `UserCreate`, `UserOut`).
