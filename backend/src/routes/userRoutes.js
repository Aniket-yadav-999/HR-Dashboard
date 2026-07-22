import { Router } from "express";
import { requireAuth, requireHrOrAdmin } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";

const router = Router();
const roles = ["admin", "hr", "manager", "employee"];
const statuses = ["active", "inactive", "exited"];

function toUserCard(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    department: user.department,
    location: user.location,
    designation: user.designation,
    teamName: user.teamName,
    managerEmail: user.managerEmail,
    managerName: user.managerName,
    joinedAt: user.joinedAt,
    dateOfBirth: user.dateOfBirth,
    exitedAt: user.exitedAt,
    avatarColor: user.avatarColor
  };
}

function toOverviewUserCard(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    department: user.department,
    location: user.location,
    designation: user.designation,
    joinedAt: user.joinedAt,
    exitedAt: user.exitedAt,
    avatarColor: user.avatarColor
  };
}

function visibleUserFilter(user) {
  if (["admin", "hr"].includes(user.role)) {
    return {};
  }

  if (user.role === "manager") {
    return {
      $or: [{ email: user.email }, { managerEmail: user.email }]
    };
  }

  return { _id: user._id };
}

function overviewUserFilter(user) {
  if (["admin", "hr"].includes(user.role)) {
    return {};
  }

  const teamFilters = [];

  if (user.managerEmail) {
    teamFilters.push({ managerEmail: user.managerEmail });
    teamFilters.push({ email: user.managerEmail });
  }

  if (user.role === "manager") {
    teamFilters.push({ managerEmail: user.email });
  }

  if (user.teamName && user.teamName !== "General") {
    teamFilters.push({ teamName: user.teamName });
  }

  if (!teamFilters.length) {
    return { _id: { $in: [] } };
  }

  return {
    _id: { $ne: user._id },
    $or: teamFilters
  };
}

function buildUserPayload(body, existingUser) {
  const status = statuses.includes(body.status) ? body.status : existingUser?.status || "active";
  const payload = {
    name: body.name,
    email: body.email?.toLowerCase(),
    role: roles.includes(body.role) ? body.role : "employee",
    status,
    department: body.department || "People Operations",
    location: body.location || "",
    designation: body.designation || "Employee",
    teamName: body.teamName || "General",
    managerEmail: body.managerEmail ? body.managerEmail.toLowerCase() : "",
    managerName: body.managerName || "",
    joinedAt: body.joinedAt ? new Date(body.joinedAt) : existingUser?.joinedAt || new Date(),
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : existingUser?.dateOfBirth,
    exitedAt: status === "exited" ? existingUser?.exitedAt || new Date() : undefined
  };

  if (!payload.name || !payload.email) {
    throw new Error("Name and email are required");
  }

  return payload;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const users = await User.find(visibleUserFilter(req.user)).sort({ joinedAt: -1 });
    res.json(users.map(toUserCard));
  } catch (error) {
    next(error);
  }
});

router.get("/overview", requireAuth, async (req, res, next) => {
  try {
    const users = await User.find(overviewUserFilter(req.user)).sort({ joinedAt: -1 });
    res.json(users.map(toOverviewUserCard));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const payload = buildUserPayload(req.body);
    const exists = await User.exists({ email: payload.email });

    if (exists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const colors = ["#0f766e", "#2563eb", "#7c3aed", "#be123c", "#b45309", "#475569"];
    const user = await User.create({
      ...payload,
      passwordHash: hashPassword(password),
      avatarColor: colors[Math.floor(Math.random() * colors.length)]
    });

    res.status(201).json(toUserCard(user));
  } catch (error) {
    if (error.message === "Name and email are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.put("/:id", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const payload = buildUserPayload(req.body, user);
    const duplicate = await User.exists({ email: payload.email, _id: { $ne: user._id } });

    if (duplicate) {
      return res.status(409).json({ message: "Email already exists" });
    }

    Object.assign(user, payload);

    if (req.body.password) {
      user.passwordHash = hashPassword(req.body.password);
    }

    await user.save();
    res.json(toUserCard(user));
  } catch (error) {
    if (error.message === "Name and email are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.delete("/:id", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    if (String(req.user._id) === req.params.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
