# alembic/

Folder untuk migrasi database dengan Alembic.

- `env.py`, `script.py.mako`, dan `versions/` berisi revisi.

Cara membuat dan menjalankan migrasi:

```bash
alembic revision --autogenerate -m "message"
alembic upgrade head
```

Pastikan `DATABASE_URL` di environment mengarah ke database yang benar.
