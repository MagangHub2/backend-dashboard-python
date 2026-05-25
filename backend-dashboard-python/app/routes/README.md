# app/routes/

Folder berisi definisi endpoint HTTP yang dikelompokkan.

- `auth.py` — route terkait otentikasi.

Router registration:

- `app/main.py` mendaftarkan router dari folder ini. Tambahkan `app.include_router(your_router)` untuk menambahkan route baru.

Contoh menambah router:

```python
from app.routes import new_route
app.include_router(new_route.router, prefix="/new", tags=["New"])
```
