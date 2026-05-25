import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT || 3000,
  PYTHON_WEBHOOK_URL: process.env.PYTHON_WEBHOOK_URL,
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
};
