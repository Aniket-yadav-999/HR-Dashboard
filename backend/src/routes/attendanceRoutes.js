import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { AttendanceRequest } from "../models/AttendanceRequest.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { sendAttendanceEmail } from "../services/mailService.js";

const router = Router();
const types = ["present", "work_from_home", "paid_leave", "sick_leave", "client_visit", "half_day", "spot_visit"];
const approvalTypes = ["work_from_home", "paid_leave", "sick_leave", "half_day"];
const terminalStatuses = ["rejected", "cancelled", "withdrawn"];

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
    fromDate: record.fromDate || record.date,
    toDate: record.toDate || record.date,
    dayPortion: record.dayPortion || "full_day",
    type: record.type,
    label: labelFor(record.type),
    employeeName: record.user?.name || "Unknown",
    employeeEmail: record.user?.email || "",
    role: record.user?.role || "",
    teamName: record.user?.teamName || "",
    department: record.user?.department || "",
    mailStatus: record.mailStatus,
    approvalStatus: record.approvalStatus || "not_required",
    managerComment: record.managerComment || "",
    hrComment: record.hrComment || "",
    managerActionBy: record.managerActionBy?.name || "",
    hrActionBy: record.hrActionBy?.name || ""
  };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const visibleUsers = await User.find(visibleAttendanceUserFilter(req.user)).select("_id");
    const userIds = visibleUsers.map((user) => user._id);
    const records = await AttendanceRequest.find({ user: { $in: userIds } })
      .populate("user", "name email role teamName department managerEmail")
      .populate("managerActionBy hrActionBy", "name email")
      .sort({ date: -1, createdAt: -1 });

    res.json(records.map(toAttendanceRow));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { type, reason, clientName, location, mailSubject, mailBody, fromDate, toDate, dayPortion } = req.body;

    if (!types.includes(type)) {
      return res.status(400).json({ message: "Invalid attendance type" });
    }

    const isApprovalRequest = approvalTypes.includes(type);
    const date = isApprovalRequest && fromDate ? startOfDay(new Date(`${fromDate}T00:00:00`)) : new Date();
    const endDate = isApprovalRequest && toDate ? startOfDay(new Date(`${toDate}T00:00:00`)) : date;
    if (Number.isNaN(date.getTime()) || Number.isNaN(endDate.getTime()) || endDate < date) {
      return res.status(400).json({ message: "Choose a valid from and to date" });
    }
    if ((endDate - date) / 86400000 > 60) return res.status(400).json({ message: "A request cannot exceed 60 days" });
    const portion = ["full_day", "first_half", "second_half"].includes(dayPortion) ? dayPortion : "full_day";
    if (portion !== "full_day" && date.toDateString() !== endDate.toDateString()) {
      return res.status(400).json({ message: "Half-day can only be requested for a single date" });
    }
    const user = req.user;
    if (isApprovalRequest && !String(reason || "").trim()) return res.status(400).json({ message: "Reason is required" });
    if (isApprovalRequest) {
      const overlap = await AttendanceRequest.exists({
        user: user._id,
        type: { $in: approvalTypes },
        approvalStatus: { $nin: terminalStatuses },
        fromDate: { $lte: endDate },
        toDate: { $gte: date }
      });
      if (overlap) return res.status(409).json({ message: "An active request already overlaps these dates" });
    }
    const hrUsers = await User.find({ role: { $in: ["hr", "admin"] }, status: "active" });
    const manager = user.managerEmail ? await User.findOne({ email: user.managerEmail, status: "active" }) : null;
    const to = hrUsers.map((hrUser) => hrUser.email);
    const cc = manager ? [manager.email] : [];
    const template = defaultTemplate({ user, type, reason, clientName, location, date });
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const attendanceRequest = isApprovalRequest
      ? new AttendanceRequest({ user: user._id, date })
      : (await AttendanceRequest.findOne({ user: user._id, date: { $gte: dayStart, $lte: dayEnd } })) ||
        new AttendanceRequest({ user: user._id, date });

    attendanceRequest.type = type;
    attendanceRequest.fromDate = date;
    attendanceRequest.toDate = endDate;
    attendanceRequest.dayPortion = portion;
    attendanceRequest.reason = reason;
    attendanceRequest.clientName = clientName;
    attendanceRequest.location = location;
    attendanceRequest.mailSubject = type === "present" ? "" : mailSubject || template.subject;
    attendanceRequest.mailBody = type === "present" ? "" : mailBody || template.body;
    attendanceRequest.mailTo = type === "present" ? [] : to;
    attendanceRequest.mailCc = type === "present" ? [] : cc;
    attendanceRequest.mailStatus = "not_sent";
    attendanceRequest.approvalStatus = isApprovalRequest ? (manager ? "pending_manager" : "pending_hr") : "not_required";
    attendanceRequest.managerComment = "";
    attendanceRequest.hrComment = "";

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

router.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const action = String(req.body.action || "");
    const comment = String(req.body.comment || "").trim();
    const record = await AttendanceRequest.findById(req.params.id).populate("user", "name email managerEmail");
    if (!record) return res.status(404).json({ message: "Request not found" });
    const isOwner = String(record.user._id) === String(req.user._id);
    const isHr = ["hr", "admin"].includes(req.user.role);
    const isManager = req.user.role === "manager" && record.user.managerEmail === req.user.email;

    if (["reject"].includes(action) && !comment) return res.status(400).json({ message: "Rejection reason is required" });
    if (action === "approve" && record.approvalStatus === "pending_manager" && isManager) {
      record.approvalStatus = "pending_hr";
      record.managerComment = comment;
      record.managerActionBy = req.user._id;
      record.managerActionAt = new Date();
    } else if (action === "reject" && record.approvalStatus === "pending_manager" && isManager) {
      record.approvalStatus = "rejected";
      record.managerComment = comment;
      record.managerActionBy = req.user._id;
      record.managerActionAt = new Date();
    } else if (action === "approve" && record.approvalStatus === "pending_hr" && isHr) {
      record.approvalStatus = "approved";
      record.hrComment = comment;
      record.hrActionBy = req.user._id;
      record.hrActionAt = new Date();
    } else if (action === "reject" && record.approvalStatus === "pending_hr" && isHr) {
      record.approvalStatus = "rejected";
      record.hrComment = comment;
      record.hrActionBy = req.user._id;
      record.hrActionAt = new Date();
    } else if (action === "withdraw" && isOwner && ["pending_manager", "pending_hr"].includes(record.approvalStatus)) {
      record.approvalStatus = "withdrawn";
      record.withdrawnAt = new Date();
    } else if (action === "cancel" && ((isOwner && record.approvalStatus === "approved") || (isHr && !terminalStatuses.includes(record.approvalStatus)))) {
      record.approvalStatus = "cancelled";
      record.cancelledAt = new Date();
      if (isHr) record.hrComment = comment || record.hrComment;
    } else {
      return res.status(403).json({ message: "This action is not allowed at the current approval stage" });
    }

    await record.save();
    const hrUsers = await User.find({ role: { $in: ["hr", "admin"] }, status: "active" }).select("_id");
    const recipientIds = new Set([String(record.user._id)]);
    hrUsers.forEach((item) => recipientIds.add(String(item._id)));
    await Notification.insertMany([...recipientIds].filter((id) => id !== String(req.user._id)).map((recipient) => ({
      recipient, actor: req.user._id, type: "attendance", title: `Request ${record.approvalStatus.replace("_", " ")}`,
      message: `${record.user.name}'s ${labelFor(record.type)} request is ${record.approvalStatus.replace("_", " ")}.`
    })));
    const populated = await record.populate("managerActionBy hrActionBy", "name email");
    res.json(toAttendanceRow(populated));
  } catch (error) { next(error); }
});

export default router;
