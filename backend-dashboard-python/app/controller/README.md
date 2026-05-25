# app/controller/

Folder opsional untuk menaruh controller yang memisahkan logika routing dan bisnis.

Rekomendasi:

- Buat fungsi yang menerima parsed request dan meng-handle flow (validasi, panggil service, buat response).
- Router (`app/whapi/webhook.py` atau `app/routes/*`) cukup memanggil controller, bukan menampung logika penuh.

Contoh struktur file:

- `whapi_controller.py` — parsing payload webhook, verifikasi signature, delegasi ke `bot_service`.

Kenapa? Memisahkan controller membuat unit testing lebih mudah dan route handler tetap ringan.
