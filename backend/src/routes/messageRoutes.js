import { Router } from "express";
import { Message } from "../models/Message.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(20);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, text } = req.body;

    if (!name || !text) {
      return res.status(400).json({ message: "Name and text are required" });
    }

    const message = await Message.create({ name, text });
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

export default router;
