import { Router } from "express";
import { requireAuth, requireHrOrAdmin } from "../middleware/auth.js";
import { Holiday } from "../models/Holiday.js";

const router = Router();

const defaultHolidays = [
  { name: "New Year", date: "2026-01-01", day: "Thursday", imageKey: "new-year" },
  { name: "Republic Day", date: "2026-01-26", day: "Monday", imageKey: "republic-day" },
  { name: "Holi", date: "2026-03-04", day: "Wednesday", imageKey: "holi" },
  { name: "Maharashtra Day", date: "2026-05-01", day: "Friday", imageKey: "maharashtra-day" },
  { name: "Bakri Eid", date: "2026-05-27", day: "Wednesday", imageKey: "eid" },
  { name: "Raksha Bandhan", date: "2026-08-28", day: "Friday", imageKey: "raksha-bandhan" },
  { name: "Ganesh Chaturthi", date: "2026-09-14", day: "Monday", imageKey: "ganesh" },
  { name: "Gandhi Jayanti", date: "2026-10-02", day: "Friday", imageKey: "gandhi" },
  { name: "Dussehra", date: "2026-10-20", day: "Tuesday", imageKey: "dussehra" },
  { name: "Diwali", date: "2026-11-09", day: "Monday", imageKey: "diwali" },
  { name: "Bhai Dooj", date: "2026-11-11", day: "Wednesday", imageKey: "bhai-dooj" },
  { name: "Christmas", date: "2026-12-25", day: "Friday", imageKey: "christmas" }
];

async function ensureDefaultHolidays() {
  const count = await Holiday.countDocuments();

  if (!count) {
    await Holiday.insertMany(defaultHolidays);
  }
}

function toHolidayCard(holiday) {
  return {
    id: holiday._id,
    name: holiday.name,
    date: holiday.date,
    day: holiday.day,
    imageKey: holiday.imageKey
  };
}

function buildHolidayPayload(body) {
  const payload = {
    name: body.name?.trim(),
    date: body.date,
    day: body.day?.trim(),
    imageKey: body.imageKey?.trim() || "festival"
  };

  if (!payload.name || !payload.date || !payload.day) {
    throw new Error("Holiday name, date, and day are required");
  }

  return payload;
}

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    await ensureDefaultHolidays();
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays.map(toHolidayCard));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const holiday = await Holiday.create(buildHolidayPayload(req.body));
    res.status(201).json(toHolidayCard(holiday));
  } catch (error) {
    if (error.message === "Holiday name, date, and day are required") {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Holiday already exists for this date" });
    }

    next(error);
  }
});

router.put("/:id", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    Object.assign(holiday, buildHolidayPayload(req.body));
    await holiday.save();
    res.json(toHolidayCard(holiday));
  } catch (error) {
    if (error.message === "Holiday name, date, and day are required") {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Holiday already exists for this date" });
    }

    next(error);
  }
});

router.delete("/:id", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json({ message: "Holiday deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
