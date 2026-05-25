# wa-baileys-service

Service Node.js yang menghubungkan WhatsApp ke backend dashboard menggunakan library Baileys.

---

## Daftar Isi

1. [Apa ini?](#1-apa-ini)
2. [Struktur Folder](#2-struktur-folder)
3. [Cara Menjalankan](#3-cara-menjalankan)
4. [Scan QR WhatsApp](#4-scan-qr-whatsapp)
5. [Environment Variables](#5-environment-variables)
6. [API Endpoints](#6-api-endpoints)
7. [Cara Kerja Internal](#7-cara-kerja-internal)
8. [Catatan iPhone / LID](#8-catatan-iphone--lid)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Apa ini?

Service ini bertugas:
- Konek ke WhatsApp via scan QR (multi-device)
- Menerima pesan masuk dari WA, lalu forward ke Python backend via HTTP webhook
- Menerima perintah dari Python backend untuk kirim pesan / media ke WA

```
WhatsApp ──► wa-baileys-service ──► Python Backend
                    ▲
                    │
         Python Backend (kirim pesan)
```

---

## 2. Struktur Folder

```
wa-baileys-service/
├── src/
│   ├── server.js                  # Entry point Express
│   ├── app.js                     # Setup Express + routes
│   ├── config/
│   │   └── index.js               # Baca ENV vars
│   ├── baileys/
│   │   ├── socket.js              # Koneksi WA, QR, reconnect, kirim pesan
│   │   ├── event.js               # Proses pesan masuk dari WA
│   │   └── index.js               # Re-export fungsi kirim
│   ├── controller/
│   │   └── send.controller.js     # Handler endpoint kirim pesan/media/presence
│   ├── services/
│   │   ├── webhook.service.js     # POST payload ke Python backend
│   │   └── wa-state.service.js    # Simpan state koneksi WA
│   └── utils/
│       └── logger.js
├── auth_info/                     # Session WA (auto-generated saat scan QR)
├── contacts-cache.json            # Cache LID → nomor HP (iPhone)
├── .env
└── package.json
```

---

## 3. Cara Menjalankan

### Install dependencies

```bash
npm install
```

### Buat file `.env`

```env
PORT=3000
PYTHON_WEBHOOK_URL=http://localhost:8000/webhook/baileys
INTERNAL_API_KEY=baileys-internal-2026
PYTHON_BACKEND_URL=http://localhost:8000
```

### Jalankan

```bash
# Development (auto-restart saat ada perubahan file)
npm run dev

# Production
npm start
```

Service akan berjalan di `http://localhost:3000`.

---

## 4. Scan QR WhatsApp

**Pertama kali atau setelah logout:**

1. Jalankan service, QR code akan muncul di terminal
2. Buka WhatsApp di HP bot → **Perangkat Tertaut → Tautkan Perangkat**
3. Scan QR

Log saat berhasil:
```
✅ WhatsApp CONNECTED successfully!
Logged in as: NamaAkunWA
```

**Session tersimpan** di folder `auth_info/` — tidak perlu scan ulang setiap restart.

**Reset session (scan QR baru):**
```bash
rm -rf auth_info/
npm run dev
```

---

## 5. Environment Variables

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `PORT` | | `3000` | Port service ini berjalan |
| `PYTHON_WEBHOOK_URL` | ✅ | — | URL endpoint webhook di Python backend |
| `INTERNAL_API_KEY` | ✅ | — | API key untuk autentikasi ke Python backend |
| `PYTHON_BACKEND_URL` | ✅ | — | Base URL Python backend (untuk download media saat kirim) |

---

## 6. API Endpoints

Semua endpoint membutuhkan header `x-api-key` yang sama dengan `INTERNAL_API_KEY`.

### `POST /send`
Kirim pesan teks ke WA.

**Body:**
```json
{
  "to": "628123456789@c.us",
  "text": "Halo kak!",
  "mentions": ["628123456789@c.us"]
}
```
- `to` untuk grup: `120363xxxxxxxx@g.us`
- `mentions` opsional, untuk tag seseorang di grup

---

### `POST /send-media`
Kirim gambar atau dokumen ke WA.

**Body:**
```json
{
  "to": "628123456789@c.us",
  "mediaUrl": "/uploads/foto.jpg",
  "mediaType": "image",
  "caption": "Ini fotonya kak",
  "filename": "foto.jpg",
  "mentions": []
}
```
- `mediaUrl` adalah path relatif di Python backend (service ini akan download file-nya)
- `mediaType`: `image` atau `document`

---

### `POST /presence/subscribe`
Subscribe untuk menerima update typing dari suatu kontak.

**Body:**
```json
{
  "jid": "628123456789@c.us"
}
```

---

### `POST /presence/send`
Kirim indikator mengetik ke customer.

**Body:**
```json
{
  "to": "628123456789@c.us",
  "status": "composing"
}
```
- `status`: `composing` (mengetik), `paused` (berhenti), `available`

---

### `GET /wa-status`
Cek status koneksi WhatsApp.

**Response:**
```json
{
  "status": "connected",
  "user": {
    "id": "628xxx@s.whatsapp.net",
    "name": "NamaBot",
    "phone": "628xxx"
  }
}
```

---

## 7. Cara Kerja Internal

### Koneksi WA (`socket.js`)

- Menggunakan `@whiskeysockets/baileys` (WhatsApp Multi-Device)
- Auto-reconnect maksimal **5 kali** dengan jeda bertambah (2s, 4s, ... maks 10s)
- Jika status `loggedOut` → tidak reconnect, harus scan QR baru

### Proses Pesan Masuk (`event.js`)

Urutan saat pesan baru masuk dari WA:

```
1. Filter  → skip: pesan dari diri sendiri, status@broadcast
2. Dedup   → skip: messageId yang sudah pernah diproses (cegah duplikat)
3. Extract → ambil teks dari message (handle wrapper iPhone: ephemeral, viewOnce)
4. Media   → download media jika ada (image/video/dokumen/audio) → base64
5. Skip    → jika tidak ada teks DAN tidak ada media
6. Grup?   → ambil participant + resolve LID ke nomor HP (iPhone)
7. Mention → cek apakah bot di-tag (khusus pesan grup)
8. Kirim   → POST payload ke Python backend via webhook
```

### Format Payload ke Python Backend

```json
{
  "messages": [{
    "from": "120363xxx@g.us",
    "pushname": "Nama Customer",
    "text": "halo bot",
    "isMentioned": true,
    "mentionedJid": ["628bot@s.whatsapp.net"],
    "isGroup": true,
    "participant": "628customer@c.us",
    "participantName": "Nama Customer",
    "groupName": "Nama Grup",
    "mediaBase64": null,
    "mediaType": null,
    "mediaFilename": null,
    "mediaMimetype": null
  }],
  "source": "baileys"
}
```

### Typing Indicator

Saat customer mengetik, Baileys kirim event `presence.update`. Service ini forward ke Python backend via `POST /webhook/typing`.

---

## 8. Catatan iPhone / LID

iPhone menggunakan format JID **`@lid`** (bukan `@s.whatsapp.net`). Ini bisa menyebabkan:

- Nomor HP customer tidak terbaca dengan benar
- Mention di grup tidak terdeteksi
- Pesan dengan **disappearing messages aktif** terbungkus `ephemeralMessage`

### Cara resolusi LID → nomor HP

Service ini menyimpan mapping LID → nomor HP di `contacts-cache.json`. Urutan resolusi:

1. Cek cache (`contacts-cache.json`)
2. Cek `msg.key.senderPn` (field nomor HP dari WA)
3. Cek `msg.key.participant`
4. Query `sock.onWhatsApp()`
5. Fallback: pakai LID apa adanya

Cache diisi otomatis dari event `contacts.set`, `contacts.update`, dan `contacts.upsert`.

### Pesan ephemeral (disappearing messages)

Pesan dari iPhone di chat dengan disappearing messages aktif dibungkus seperti ini:

```json
{
  "ephemeralMessage": {
    "message": {
      "conversation": "isi pesan"
    }
  }
}
```

Service ini sudah menangani unwrap wrapper tersebut sebelum extract teks dan cek mention.

---

## 9. Troubleshooting

### Pesan tidak dikirim ke Python backend

```bash
# Cek log webhook
grep "Webhook" logs

# Pastikan PYTHON_WEBHOOK_URL benar dan Python backend berjalan
curl http://localhost:8000/
```

### WhatsApp terus disconnect

- Cek koneksi internet
- Jika kode error `401` atau `loggedOut` → hapus `auth_info/` dan scan QR baru
- Jika kode lain → service akan auto-reconnect

### Pesan iPhone tidak terdeteksi

Cek log `DEBUG Message content` untuk lihat struktur pesan:
```
DEBUG Message content: { "ephemeralMessage": { ... } }
```
Jika ada wrapper yang belum ditangani, tambahkan di fungsi `extractText` di `event.js`.

### `contacts-cache.json` corrupt

```bash
rm contacts-cache.json
# Restart service, cache akan dibangun ulang dari sync kontak
```
