import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { AttendanceRequest } from "../models/AttendanceRequest.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { sendAttendanceEmail } from "../services/mailService.js";

const router = Router();
const types = ["present", "work_from_home", "paid_leave", "sick_leave", "client_visit", "half_day", "spot_visit"];

function labelFor(type) {
  return {
    present: "Present",
    work_from_home: "Work From Home",
    paid_leave: "Paid Leave",
    sick_leave: "Sick Leave",
    client_visit: "Client Visit",
    half_day: "Half Day",
    spot_visit: "Spot Visit"
  }[type];
}

function defaultTemplate({ user, type, reason, clientName, location, date }) {
  const label = labelFor(type);
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);

  if (["client_visit", "spot_visit"].includes(type)) {
    return {
      subject: `${label} update - ${user.name}`,
      body: `Hi Team,\n\nI am marking ${label} for ${formattedDate}.\n\nEmployee: ${user.name}\nClient: ${clientName || "-"}\nLocation: ${location || "-"}\n\nRegards,\n${user.name}`
    };
  }

  return {
    subject: `${label} request - ${user.name}`,
    body: `Hi Team,\n\nI would like to mark ${label} for ${formattedDate}.\n\nEmployee: ${user.name}\nReason: ${reason || "-"}\n\nRegards,\n${user.name}`
  };
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function visibleAttendanceUserFilter(user) {
  if (["admin", "hr"].includes(user.role)) {
    return {};
  }

  if (user.role === "manager") {
    return {
      $or: [{ _id: user._id }, { managerEmail: user.email }]
    };
  }

  return { _id: user._id };
}

function toAttendanceRow(record) {
  return {
    id: record._id,
    date: record.date,
    type: record.type,
    label: labelFor(record.type),
    employeeName: record.user?.name || "Unknown",
    employeeEmail: record.user?.email || "",
    role: record.user?.role || "",
    teamName: record.user?.teamName || "",
    department: record.user?.department || "",
    mailStatus: record.mailStatus
  };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const visibleUsers = await User.find(visibleAttendanceUserFilter(req.user)).select("_id");
    const userIds = visibleUsers.map((user) => user._id);
    const records = await AttendanceRequest.find({ user: { $in: userIds } })
      .populate("user", "name email role teamName department managerEmail")
      .sort({ date: -1, createdAt: -1 });

    res.json(records.map(toAttendanceRow));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { type, reason, clientName, location, mailSubject, mailBody } = req.body;

    if (!types.includes(type)) {
      return res.status(400).json({ message: "Invalid attendance type" });
    }

    const date = new Date();
    const user = req.user;
    const hrUsers = await User.find({ role: { $in: ["hr", "admin"] }, status: "active" });
    const manager = user.managerEmail ? await User.findOne({ email: user.managerEmail, status: "active" }) : null;
    const to = hrUsers.map((hrUser) => hrUser.email);
    const cc = manager ? [manager.email] : [];
    const template = defaultTemplate({ user, type, reason, clientName, location, date });
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const attendanceRequest =
      (await AttendanceRequest.findOne({ user: user._id, date: { $gte: dayStart, $lte: dayEnd } })) ||
      new AttendanceRequest({ user: user._id, date });

    attendanceRequest.type = type;
    attendanceRequest.reason = reason;
    attendanceRequest.clientName = clientName;
    attendanceRequest.location = location;
    attendanceRequest.mailSubject = type === "present" ? "" : mailSubject || template.subject;
    attendanceRequest.mailBody = type === "present" ? "" : mailBody || template.body;
    attendanceRequest.mailTo = type === "present" ? [] : to;
    attendanceRequest.mailCc = type === "present" ? [] : cc;
    attendanceRequest.mailStatus = "not_sent";

    const recipients = [...hrUsers, manager].filter(Boolean).filter((recipient) => String(recipient._id) !== String(user._id));

    if (recipients.length) {
      await Notification.insertMany(
        recipients.map((recipient) => ({
          recipient: recipient._id,
          actor: user._id,
          title: `${labelFor(type)} marked`,
          message: `${user.name} marked ${labelFor(type)} for today.`,
          type: "attendance"
        }))
      );
    }

    if (type !== "present") {
      try {
        if (to.length) {
          await sendAttendanceEmail({
            to,
            cc,
            subject: attendanceRequest.mailSubject,
            body: attendanceRequest.mailBody
          });
          attendanceRequest.mailStatus = "sent";
        }
      } catch {
        attendanceRequest.mailStatus = "failed";
      }
    }

    await attendanceRequest.save();
    const populatedRequest = await attendanceRequest.populate("user", "name email role teamName department managerEmail");
    res.status(201).json({
      id: attendanceRequest._id,
      type: attendanceRequest.type,
      label: labelFor(attendanceRequest.type),
      mailStatus: attendanceRequest.mailStatus,
      mailTo: attendanceRequest.mailTo,
      mailCc: attendanceRequest.mailCc,
      mailSubject: attendanceRequest.mailSubject,
      mailBody: attendanceRequest.mailBody,
      record: toAttendanceRow(populatedRequest)
    });
  } catch (error) {
    next(error);
  }
});

export default router;
