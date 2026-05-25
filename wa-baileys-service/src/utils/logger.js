const now = () => new Date().toISOString().replace("T", " ").split(".")[0];

export const logger = {
  info: (msg) => console.log(`ℹ️  [${now()}] ${msg}`),
  success: (msg) => console.log(`✅ [${now()}] ${msg}`),
  warn: (msg) => console.warn(`⚠️  [${now()}] ${msg}`),
  error: (msg) => console.error(`❌ [${now()}] ${msg}`),
};
