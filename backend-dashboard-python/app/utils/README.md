# app/utils/

Folder berisi utilitas:

- `jwt.py` — helper pembuatan dan verifikasi JWT.
- `security.py` — helper security seperti password hashing.

Tips:

- Jangan letakkan secret langsung di code; gunakan environment variables.
- Unit test utilitas ini untuk mencegah regresi.
