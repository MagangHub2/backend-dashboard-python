import express from "express";
import { waState } from "../services/wa-state.service.js";
import { initSocket, disconnectSocket, getConnectionStatus } from "../baileys/socket.js";

const router = express.Router();

/**
 * GET /wa/status
 * Mendapatkan status koneksi WhatsApp
 */
router.get("/wa/status", (req, res) => {
  const state = waState.getState();
  res.json({
    status: state.status,
    user: state.user,
    hasQR: !!state.qrCode,
    qrTimestamp: state.qrTimestamp,
    lastError: state.lastError,
  });
});

/**
 * GET /wa/qr
 * Mendapatkan QR code dalam format base64
 */
router.get("/wa/qr", (req, res) => {
  const state = waState.getState();

  if (!state.qrCode) {
    return res.status(404).json({
      error: "QR code not available",
      status: state.status,
      message:
        state.status === "connected"
          ? "Already connected to WhatsApp"
          : "Waiting for QR code generation",
    });
  }

  res.json({
    qrCode: state.qrCode,
    timestamp: state.qrTimestamp,
    expiresIn: 20000, // QR expires in ~20 seconds
  });
});

/**
 * POST /wa/reconnect
 * Force reconnect WhatsApp (generate new QR)
 */
router.post("/wa/reconnect", async (req, res) => {
  try {
    waState.reset();
    waState.setStatus("connecting");

    // Disconnect existing connection
    await disconnectSocket();

    // Reinitialize
    await initSocket();

    res.json({
      success: true,
      message: "Reconnecting... Check /wa/qr for new QR code",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /wa/logout
 * Logout dari WhatsApp (hapus session)
 */
router.post("/wa/logout", async (req, res) => {
  try {
    await disconnectSocket();
    waState.reset();

    // Delete auth_info folder
    const fs = await import("fs/promises");
    const path = await import("path");
    const authPath = path.join(process.cwd(), "auth_info");

    try {
      await fs.rm(authPath, { recursive: true, force: true });
    } catch (e) {
      // Ignore if folder doesn't exist
    }

    res.json({
      success: true,
      message: "Logged out successfully. Restart service to scan new QR.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
