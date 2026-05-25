/**
 * WhatsApp Connection State Manager
 * Menyimpan QR code dan status koneksi untuk di-expose ke API
 */

let state = {
  status: "disconnected", // disconnected | connecting | connected | qr_ready
  qrCode: null,
  qrTimestamp: null,
  user: null,
  lastError: null,
};

// Listeners untuk real-time updates (WebSocket)
const listeners = new Set();

export const waState = {
  // Getter
  getState: () => ({ ...state }),

  // Setter untuk status
  setStatus: (status) => {
    state.status = status;
    waState.notifyListeners();
  },

  // Setter untuk QR code
  setQR: (qrCode) => {
    state.qrCode = qrCode;
    state.qrTimestamp = Date.now();
    state.status = "qr_ready";
    waState.notifyListeners();
  },

  // Clear QR (setelah login berhasil)
  clearQR: () => {
    state.qrCode = null;
    state.qrTimestamp = null;
    waState.notifyListeners();
  },

  // Set user info setelah login
  setUser: (user) => {
    state.user = user;
    state.status = "connected";
    waState.notifyListeners();
  },

  // Set error
  setError: (error) => {
    state.lastError = error;
    waState.notifyListeners();
  },

  // Reset state
  reset: () => {
    state = {
      status: "disconnected",
      qrCode: null,
      qrTimestamp: null,
      user: null,
      lastError: null,
    };
    waState.notifyListeners();
  },

  // Listener management untuk WebSocket
  addListener: (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  notifyListeners: () => {
    const currentState = waState.getState();
    listeners.forEach((callback) => {
      try {
        callback(currentState);
      } catch (e) {
        // silently ignore listener errors
      }
    });
  },
};
