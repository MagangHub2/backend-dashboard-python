# app/whapi/

Folder ini meng-handle integrasi WhatsApp API (WHAPI): client untuk mengirim pesan dan webhook untuk menerima pesan.

Files utama:

- `client.py` — fungsi `send_text(to, text)` yang mengirim request ke `WHAPI_BASE_URL` menggunakan `WHAPI_TOKEN`.
- `webhook.py` — route `/webhook/whapi` untuk menerima pesan masuk dan meneruskan ke `app.services.bot_service.handle_bot`.

Environment variables diperlukan:

- `WHAPI_BASE_URL` — base URL provider WHAPI.
- `WHAPI_TOKEN` — token/authorization untuk mengirim pesan.

Testing & contoh:

1. Jalankan server:

```bash
uvicorn app.main:app --reload
```

2. Simulasikan incoming message (curl):

```bash
curl -X POST http://127.0.0.1:8000/webhook/whapi \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"from":"62811xxxx","text":{"body":"halo"}}]}'
```

3. Untuk menguji pengiriman manual buat file `test_send.py` dan panggil `send_text`:

```python
from app.whapi.client import send_text
print(send_text("62811xxxx", "test message"))
```

Catatan teknis:

- Route webhook menggunakan `BackgroundTasks` sehingga `send_text` (synchronous `requests`) tidak memblokir event loop.
- Untuk produksi direkomendasikan mengubah `client.py` menjadi async menggunakan `httpx.AsyncClient`.
- Jika provider mengirim signature HMAC, tambahkan verifikasi di `webhook.py` (gunakan secret di `confiq_whapi.py`).
