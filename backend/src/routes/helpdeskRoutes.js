import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { HelpdeskRequest } from "../models/HelpdeskRequest.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

const router = Router();
const categories = ["hr", "admin"];
const priorities = ["low", "medium", "high", "urgent"];
const statuses = ["open", "in_progress", "resolved", "closed"];

function labelFor(value) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toTicket(ticket) {
  return {
    id: ticket._id,
    category: ticket.category,
    categoryLabel: labelFor(ticket.category),
    priority: ticket.priority,
    priorityLabel: labelFor(ticket.priority),
    status: ticket.status,
    statusLabel: labelFor(ticket.status),
    subject: ticket.subject,
    description: ticket.description,
    resolutionNote: ticket.resolutionNote,
    assignedTo: ticket.assignedTo,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    requester: ticket.requester
      ? {
          id: ticket.requester._id,
          name: ticket.requester.name,
          email: ticket.requester.email,
          role: ticket.requester.role,
          department: ticket.requester.department,
          teamName: ticket.requester.teamName,
          managerEmail: ticket.requester.managerEmail
        }
      : null
  };
}

function buildCreatePayload(body) {
  const payload = {
    category: categories.includes(body.category) ? body.category : "hr",
    priority: priorities.includes(body.priority) ? body.priority : "medium",
    subject: body.subject?.trim(),
    description: body.description?.trim()
  };

  if (!payload.subject || !payload.description) {
    throw new Error("Subject and description are required");
  }

  return payload;
}

function visibleTicketFilter(user) {
  if (["admin", "hr"].includes(user.role)) {
    return {};
  }

  if (user.role === "manager") {
    return {
      $or: [{ requester: user._id }, { "requester.managerEmail": user.email }]
    };
  }

  return { requester: user._id };
}

async function notifyRecipients({ actor, recipients, title, message }) {
  const uniqueRecipients = recipients
    .filter(Boolean)
    .filter((recipient) => String(recipient._id) !== String(actor._id))
    .filter((recipient, index, list) => list.findIndex((item) => String(item._id) === String(recipient._id)) === index);

  if (!uniqueRecipients.length) {
    return;
  }

  await Notification.insertMany(
    uniqueRecipients.map((recipient) => ({
      recipient: recipient._id,
      actor: actor._id,
      title,
      message,
      type: "helpdesk"
    }))
  );
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    let tickets = await HelpdeskRequest.find().populate("requester", "name email role department teamName managerEmail").sort({ createdAt: -1 });

    if (!["admin", "hr"].includes(req.user.role)) {
      tickets = tickets.filter((ticket) => {
        const requester = ticket.requester;

        if (!requester) {
          return false;
        }

        if (String(requester._id) === String(req.user._id)) {
          return true;
        }

        return req.user.role === "manager" && requester.managerEmail === req.user.email;
      });
    }

    res.json(tickets.map(toTicket));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const ticket = await HelpdeskRequest.create({
      ...buildCreatePayload(req.body),
      requester: req.user._id
    });

    const populated = await ticket.populate("requester", "name email role department teamName managerEmail");
    const hrAdmins = await User.find({ role: { $in: ["admin", "hr"] }, status: "active" });
    const manager = req.user.managerEmail ? await User.findOne({ email: req.user.managerEmail, status: "active" }) : null;

    await notifyRecipients({
      actor: req.user,
      recipients: [...hrAdmins, manager],
      title: "Helpdesk request created",
      message: `${req.user.name} created ${ticket.subject}.`
    });

    res.status(201).json(toTicket(populated));
  } catch (error) {
    if (error.message === "Subject and description are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!["admin", "hr"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only HR or Admin can update helpdesk tickets" });
    }

    const ticket = await HelpdeskRequest.findById(req.params.id).populate("requester", "name email role department teamName managerEmail");

    if (!ticket) {
      return res.status(404).json({ message: "Helpdesk ticket not found" });
    }

    if (statuses.includes(req.body.status)) {
      ticket.status = req.body.status;
    }

    if (priorities.includes(req.body.priority)) {
      ticket.priority = req.body.priority;
    }

    ticket.assignedTo = req.body.assignedTo?.trim() || ticket.assignedTo;
    ticket.resolutionNote = req.body.resolutionNote?.trim() || ticket.resolutionNote;
    await ticket.save();

    await notifyRecipients({
      actor: req.user,
      recipients: [ticket.requester],
      title: "Helpdesk request updated",
      message: `${req.user.name} updated ${ticket.subject} to ${labelFor(ticket.status)}.`
    });

    res.json(toTicket(ticket));
  } catch (error) {
    next(error);
  }
});

export default router;
