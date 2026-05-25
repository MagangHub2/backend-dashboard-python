import express from "express";
import { sendMessage, sendMedia, sendPresence, subscribePresence } from "../controller/send.controller.js";

const router = express.Router();
router.post("/send", sendMessage);
router.post("/send-media", sendMedia);
router.post("/send-presence", sendPresence);
router.post("/subscribe-presence", subscribePresence);

export default router;
