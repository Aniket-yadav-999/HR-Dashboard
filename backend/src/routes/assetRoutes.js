import { Router } from "express";
import { requireAuth, requireHrOrAdmin } from "../middleware/auth.js";
import { Asset } from "../models/Asset.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

const router = Router();
const categories = ["laptop", "desktop", "accessory", "mouse", "other"];
const statuses = ["available", "issued", "maintenance", "returned", "retired"];
const conditions = ["new", "good", "needs_repair", "damaged"];

function labelFor(value) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toAsset(asset) {
  return {
    id: asset._id,
    name: asset.name,
    assetTag: asset.assetTag,
    category: asset.category,
    categoryLabel: labelFor(asset.category),
    status: asset.status,
    statusLabel: labelFor(asset.status),
    condition: asset.condition,
    conditionLabel: labelFor(asset.condition),
    issuedAt: asset.issuedAt,
    returnedAt: asset.returnedAt,
    notes: asset.notes,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    assignedTo: asset.assignedTo
      ? {
          id: asset.assignedTo._id,
          name: asset.assignedTo.name,
          email: asset.assignedTo.email,
          department: asset.assignedTo.department,
          teamName: asset.assignedTo.teamName,
          managerEmail: asset.assignedTo.managerEmail
        }
      : null
  };
}

function buildPayload(body) {
  const payload = {
    name: body.name?.trim(),
    assetTag: body.assetTag?.trim(),
    category: categories.includes(body.category) ? body.category : "laptop",
    status: statuses.includes(body.status) ? body.status : "available",
    condition: conditions.includes(body.condition) ? body.condition : "good",
    notes: body.notes?.trim() || "",
    issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,
    returnedAt: body.returnedAt ? new Date(body.returnedAt) : undefined
  };

  if (!payload.name || !payload.assetTag) {
    throw new Error("Asset name and tag are required");
  }

  return payload;
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
      type: "asset"
    }))
  );
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    let assets = await Asset.find().populate("assignedTo", "name email department teamName managerEmail").sort({ updatedAt: -1 });

    if (!["admin", "hr"].includes(req.user.role)) {
      assets = assets.filter((asset) => {
        if (!asset.assignedTo) {
          return false;
        }

        if (String(asset.assignedTo._id) === String(req.user._id)) {
          return true;
        }

        return req.user.role === "manager" && asset.assignedTo.managerEmail === req.user.email;
      });
    }

    res.json(assets.map(toAsset));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const payload = buildPayload(req.body);
    const assignedTo = req.body.assignedTo ? await User.findById(req.body.assignedTo) : null;

    const exists = await Asset.exists({ assetTag: payload.assetTag });
    if (exists) {
      return res.status(409).json({ message: "Asset tag already exists" });
    }

    const asset = await Asset.create({
      ...payload,
      assignedTo: assignedTo?._id,
      status: assignedTo ? "issued" : payload.status,
      issuedAt: assignedTo ? payload.issuedAt || new Date() : payload.issuedAt,
      createdBy: req.user._id
    });

    const populated = await asset.populate("assignedTo", "name email department teamName managerEmail");

    await notifyRecipients({
      actor: req.user,
      recipients: assignedTo ? [assignedTo] : [],
      title: "Asset issued",
      message: `${req.user.name} issued ${asset.name}.`
    });

    res.status(201).json(toAsset(populated));
  } catch (error) {
    if (error.message === "Asset name and tag are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.put("/:id", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const previousAssignedTo = asset.assignedTo;
    const assignedTo = req.body.assignedTo ? await User.findById(req.body.assignedTo) : null;

    Object.assign(asset, buildPayload({ ...asset.toObject(), ...req.body }));
    asset.assignedTo = assignedTo?._id || undefined;

    if (req.body.status === "returned" || req.body.status === "available") {
      asset.returnedAt = new Date();
      asset.assignedTo = undefined;
    }

    if (assignedTo && String(previousAssignedTo || "") !== String(assignedTo._id)) {
      asset.status = "issued";
      asset.issuedAt = new Date();
    }

    await asset.save();
    const populated = await asset.populate("assignedTo", "name email department teamName managerEmail");

    await notifyRecipients({
      actor: req.user,
      recipients: [assignedTo].filter(Boolean),
      title: "Asset updated",
      message: `${req.user.name} updated ${asset.name}.`
    });

    res.json(toAsset(populated));
  } catch (error) {
    if (error.message === "Asset name and tag are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

export default router;
