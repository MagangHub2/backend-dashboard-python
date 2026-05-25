# app/models/

Folder berisi model database (SQLAlchemy).

- `user.py` — model `User` (lihat file untuk field dan enum `admin` dll.).

Tips:

- Gunakan Alembic untuk migrasi (folder `alembic/`).
- Perubahan model harus diikuti dengan membuat revisi Alembic dan menjalankan `alembic upgrade head`.

Contoh commands:

```bash
alembic revision --autogenerate -m "add new field"
alembic upgrade head
```
