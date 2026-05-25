import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { readFileSync, writeFileSync } from "fs";
import { logger } from "../utils/logger.js";
import { registerEvents } from "./event.js";
import { waState } from "../services/wa-state.service.js";

// Persistent contacts cache for LID → phone resolution (survives restarts)
const CONTACTS_CACHE_FILE = "./contacts-cache.json";
const contactsCache = new Map();

// Load cache from file on startup
try {
  const data = JSON.parse(readFileSync(CONTACTS_CACHE_FILE, "utf8"));
  for (const [lid, phone] of Object.entries(data)) {
    contactsCache.set(lid, phone);
  }
  logger.info(`Loaded ${contactsCache.size} contacts from cache file`);
} catch {
  // File doesn't exist yet, start fresh
}

// Save cache to file whenever a new LID is learned
export const saveCachedContact = (lid, phone) => {
  contactsCache.set(lid, phone);
  try {
    writeFileSync(CONTACTS_CACHE_FILE, JSON.stringify(Object.fromEntries(contactsCache)));
  } catch (e) {
    logger.warn(`Failed to save contacts cache: ${e.message}`);
  }
};

// Persistent phone → LID cache for SENDING to iOS users
// iOS WhatsApp can only decrypt messages addressed to their @lid JID
const PHONE_TO_LID_CACHE_FILE = "./phone-to-lid-cache.json";
const phoneToLidCache = new Map();

try {
  const data = JSON.parse(readFileSync(PHONE_TO_LID_CACHE_FILE, "utf8"));
  for (const [phone, lid] of Object.entries(data)) {
    phoneToLidCache.set(phone, lid);
  }
  logger.info(`Loaded ${phoneToLidCache.size} phone→LID mappings from cache`);
} catch {
  // File doesn't exist yet
}

export const savePhoneToLid = (phone, lid) => {
  if (!phone || !lid) return;
  phoneToLidCache.set(phone, lid);
  try {
    writeFileSync(PHONE_TO_LID_CACHE_FILE, JSON.stringify(Object.fromEntries(phoneToLidCache)));
  } catch (e) {
    logger.warn(`Failed to save phone→LID cache: ${e.message}`);
  }
};

// Resolve JID to @lid if known (required for iOS devices)
const resolveJidForSending = (jid) => {
  if (!jid) return jid;
  if (jid.endsWith("@lid") || jid.endsWith("@g.us")) return jid;

  // Try both @c.us and @s.whatsapp.net as lookup keys
  const normalized = jid.replace("@c.us", "@s.whatsapp.net");
  const lid = phoneToLidCache.get(normalized) || phoneToLidCache.get(jid);
  if (lid) {
    logger.info(`[JID RESOLVE] ${jid} → ${lid} (iOS user, using @lid)`);
    return lid;
  }
  return jid;
};

let sock;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const initSocket = async () => {
  // cegah init dobel (penting untuk nodemon)
  if (isConnecting) return;
  isConnecting = true;
  waState.setStatus("connecting");

  try {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const { version } = await fetchLatestBaileysVersion();

    logger.info(`Using Baileys version: ${version.join(".")}`);

    // Cache pesan yang dikirim agar bisa dikembalikan saat grup member minta retry decrypt
    const msgRetryCache = new Map();

    sock = makeWASocket({
      auth: state,
      version,
      browser: ["Dashboard WA", "Chrome", "1.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: true,
      // WAJIB untuk grup: mencegah "Waiting for this message"
      // Dipanggil saat penerima minta ulang konten pesan yang gagal didekripsi
      getMessage: async (key) => {
        const cached = msgRetryCache.get(`${key.remoteJid}:${key.id}`);
        if (cached) return cached;
        return { conversation: "" };
      },
    });

    // Simpan setiap pesan yang dikirim/diterima ke retry cache
    sock.ev.on("messages.upsert", ({ messages }) => {
      for (const msg of messages) {
        if (!msg.key?.id) continue;
        const cacheKey = `${msg.key.remoteJid}:${msg.key.id}`;
        msgRetryCache.set(cacheKey, msg.message);
        // Jaga ukuran cache: hapus entri lama jika >500
        if (msgRetryCache.size > 500) {
          const firstKey = msgRetryCache.keys().next().value;
          msgRetryCache.delete(firstKey);
        }
      }
    });

    // EVENT CONNECTION
    sock.ev.on("connection.update", async (update) => {
      const { qr, connection, lastDisconnect } = update;

      if (qr) {
        // Simpan QR ke state (untuk API/frontend)
        waState.setQR(qr);

        // Tampilkan di terminal juga
        logger.info("╔════════════════════════════════════════════╗");
        logger.info("║   SCAN QR CODE DENGAN WHATSAPP ANDA        ║");
        logger.info("║   WhatsApp > Linked Devices > Link Device  ║");
        logger.info("║   Atau buka Dashboard > WhatsApp Settings  ║");
        logger.info("╚════════════════════════════════════════════╝");
        qrcode.generate(qr, { small: true });
      }

      // CONNECTED
      if (connection === "open") {
        logger.success("WhatsApp CONNECTED successfully!");
        const user = sock.user;
        if (user) {
          logger.info(`Logged in as: ${user.name || user.id}`);
          waState.setUser({
            id: user.id,
            name: user.name || user.id.split("@")[0],
            phone: user.id.split("@")[0],
          });
        }
        waState.clearQR();
        isConnecting = false;
        reconnectAttempts = 0;
      }

      // ❌ DISCONNECTED
      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        logger.warn(`Connection closed. Status code: ${statusCode}`);
        waState.setStatus("disconnected");
        waState.setError(`Disconnected with code: ${statusCode}`);

        if (statusCode === DisconnectReason.loggedOut) {
          logger.error("WhatsApp logged out. Delete auth_info folder dan restart untuk scan QR baru.");
          isConnecting = false;
          waState.reset();
        } else if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const waitTime = Math.min(reconnectAttempts * 2000, 10000);
          logger.warn(
            `Reconnecting in ${waitTime / 1000}s... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
          );
          isConnecting = false;
          await delay(waitTime);
          initSocket();
        } else {
          logger.error("Max reconnect attempts reached. Restart manually.");
          isConnecting = false;
        }
      }
    });

    // SIMPAN SESSION (INI WAJIB)
    sock.ev.on("creds.update", saveCreds);

    // 📞 CONTACTS SYNC - untuk build LID mapping
    sock.ev.on("contacts.set", ({ contacts }) => {
      logger.info(`Received ${contacts.length} contacts from sync`);
      for (const contact of contacts) {
        if (contact.lid && contact.id) {
          const phone = contact.id.split("@")[0] + "@c.us";
          saveCachedContact(contact.lid, phone);
          logger.info(`Contacts sync: LID ${contact.lid} -> ${phone} (${contact.name || contact.notify})`);
        }
      }
    });

    // REGISTER MESSAGE EVENTS - forward ke Python backend
    registerEvents(sock);
  } catch (error) {
    logger.error(`Failed to initialize socket: ${error.message}`);
    waState.setError(error.message);
    waState.setStatus("disconnected");
    isConnecting = false;

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      await delay(3000);
      initSocket();
    }
  }
};

// 🔌 DISCONNECT
export const disconnectSocket = async () => {
  if (sock) {
    try {
      sock.end();
      sock = null;
    } catch (e) {
      logger.warn(`Disconnect warning: ${e.message}`);
    }
  }
  isConnecting = false;
  reconnectAttempts = 0;
};

// GET STATUS
export const getConnectionStatus = () => {
  return waState.getState();
};

// GET SOCK INSTANCE (for presence, etc.)
export const getSock = () => sock;

// KIRIM PESAN
export const sendText = async (jid, text, mentions = []) => {
  if (!sock) throw new Error("WA socket not initialized");

  const resolvedJid = resolveJidForSending(jid);
  const messagePayload = { text };
  if (mentions && mentions.length > 0) messagePayload.mentions = mentions;

  return sock.sendMessage(resolvedJid, messagePayload);
};

// KIRIM IMAGE
export const sendImage = async (jid, buffer, caption = "", mimetype = "image/jpeg", mentions = []) => {
  if (!sock) throw new Error("WA socket not initialized");

  const resolvedJid = resolveJidForSending(jid);
  const messagePayload = { image: buffer, caption: caption || undefined, mimetype };
  if (mentions && mentions.length > 0) messagePayload.mentions = mentions;

  return sock.sendMessage(resolvedJid, messagePayload);
};

// KIRIM DOCUMENT
export const sendDocument = async (jid, buffer, filename = "file", mimetype = "application/octet-stream", caption = "", mentions = []) => {
  if (!sock) throw new Error("WA socket not initialized");

  const resolvedJid = resolveJidForSending(jid);
  const messagePayload = { document: buffer, fileName: filename, mimetype, caption: caption || undefined };
  if (mentions && mentions.length > 0) messagePayload.mentions = mentions;

  return sock.sendMessage(resolvedJid, messagePayload);
};

// Export contacts cache for LID resolution
export { contactsCache };

// Get socket instance
export const getSocket = () => sock;
