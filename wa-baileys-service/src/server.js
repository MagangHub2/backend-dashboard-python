import app from "./app.js";
import { initSocket } from "./baileys/index.js";
import { ENV } from "./config/index.js";
import { logger } from "./utils/logger.js";

(async () => {
  try {
    logger.info("Starting WhatsApp Baileys Service...");
    await initSocket();
    logger.success("WhatsApp socket initialized");

    app.listen(ENV.PORT, () => {
      logger.success(`Server running on port ${ENV.PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start service: ${err.message}`);
    process.exit(1);
  }
})();
