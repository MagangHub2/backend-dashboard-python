# app/services/

Folder berisi layanan bisnis dan helper yang tidak langsung terkait route.

- `bot_service.py` — logika chatbot/agent. Saat ini mendukung:
  - AI fallback (gunakan OpenAI bila `OPENAI_API_KEY` diset).
  - Perintah admin lewat env `WHAPI_ADMINS` (`assign`, `unassign`, `reply`).
  - State sederhana disimpan di memori (`user_state`, `last_human_reply`).

Cara kerja `bot_service` singkat:

- Jika user di-set ke `AGENT` atau `PAUSE`, bot tidak membalas (balasan oleh manusia).
- Jika admin mengirim `reply <user> <message>`, maka service mengembalikan token khusus `__ADMIN_REPLY__|<user>|<message>` yang harus dideteksi oleh caller untuk meneruskan pesan ke user target.
- Jika `OPENAI_API_KEY` tersedia, service akan memanggil OpenAI ChatCompletion; jika tidak, mengirim canned response.

Catatan untuk production:

- Ganti state in-memory ke penyimpanan persisten (Redis/db).
- Tambah log audit untuk pesan admin.
- Proteksi admin (verifikasi nomor/otentikasi) sebelum menerima perintah.
