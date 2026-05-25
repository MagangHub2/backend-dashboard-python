import axios from "axios";
import { sendText, sendImage, sendDocument } from "../baileys/index.js";
import { getSock } from "../baileys/socket.js";
import { logger } from "../utils/logger.js";

/**
 * Controller: Send WhatsApp Message (Personal / Group)
 */
export const sendMessage = async (req, res) => {
  try {
    const { to, text, mentions } = req.body;

    if (!to || !text) {
      return res.status(400).json({
        ok: false,
        error: "to and text required",
      });
    }

    await sendText(to, text, mentions);

    return res.json({
      ok: true,
      message: "sent",
    });
  } catch (err) {
    logger.error(`[SEND CONTROLLER ERROR] ${err.message}`);

    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};

/**
 * Controller: Send WhatsApp Media (Image / Document)
 * Expects: { to, mediaUrl, mediaType, caption?, filename?, mentions? }
 * mediaUrl is a relative path like "/uploads/filename.jpg" which we fetch from the Python backend
 */
export const sendMedia = async (req, res) => {
  try {
    const { to, mediaUrl, mediaType, caption, filename, mentions } = req.body;

    if (!to || !mediaUrl || !mediaType) {
      return res.status(400).json({
        ok: false,
        error: "to, mediaUrl, and mediaType required",
      });
    }

    // Download file from Python backend
    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
    const fullUrl = `${backendUrl}${mediaUrl}`;

    const response = await axios.get(fullUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "application/octet-stream";


    if (mediaType === "image") {
      await sendImage(to, buffer, caption || "", contentType, mentions || []);
    } else {
      await sendDocument(to, buffer, filename || "file", contentType, caption || "", mentions || []);
    }

    return res.json({
      ok: true,
      message: "media sent",
    });
  } catch (err) {
    logger.error(`[SEND-MEDIA CONTROLLER ERROR] ${err.message}`);

    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};

/**
 * Controller: Subscribe to presence updates from a contact
 * Expects: { jid: "628xxx@c.us" }
 * Must be called before presence.update events fire for that contact
 */
export const subscribePresence = async (req, res) => {
  try {
    const { jid } = req.body;

    if (!jid) {
      return res.status(400).json({ ok: false, error: "jid required" });
    }

    const sock = getSock();
    if (!sock) {
      return res.status(503).json({ ok: false, error: "WhatsApp not connected" });
    }

    await sock.presenceSubscribe(jid);
    logger.info(`[PRESENCE] Subscribed to presence of ${jid}`);

    return res.json({ ok: true });
  } catch (err) {
    logger.error(`[PRESENCE SUBSCRIBE ERROR] ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * Controller: Send Presence Update (typing indicator to customer)
 * Expects: { to: "628xxx@c.us", status: "composing" | "paused" | "available" }
 */
export const sendPresence = async (req, res) => {
  try {
    const { to, status = "composing" } = req.body;

    if (!to) {
      return res.status(400).json({ ok: false, error: "to required" });
    }

    const sock = getSock();
    if (!sock) {
      return res.status(503).json({ ok: false, error: "WhatsApp not connected" });
    }

    await sock.sendPresenceUpdate(status, to);
    logger.info(`[PRESENCE] Sent "${status}" to ${to}`);

    return res.json({ ok: true });
  } catch (err) {
    logger.error(`[PRESENCE CONTROLLER ERROR] ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
