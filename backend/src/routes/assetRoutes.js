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
    assetId: asset.assetId || asset.assetTag,
    name: asset.name,
    assetTag: asset.assetId || asset.assetTag,
    category: asset.category,
    categoryLabel: labelFor(asset.category),
    status: asset.status,
    statusLabel: labelFor(asset.status),
    condition: asset.condition,
    conditionLabel: labelFor(asset.condition),
    issuedAt: asset.issuedAt,
    returnedAt: asset.returnedAt,
    brandModel: asset.brandModel,
    serialNumber: asset.serialNumber,
    department: asset.department || asset.assignedTo?.department || "",
    location: asset.location,
    ipAddress: asset.ipAddress,
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
  const assetId = (body.assetId || body.assetTag)?.trim();
  const payload = {
    name: body.name?.trim(),
    assetId,
    // Mirror the ID until the legacy assetTag database index is removed.
    assetTag: assetId,
    category: categories.includes(body.category) ? body.category : "laptop",
    status: statuses.includes(body.status) ? body.status : "available",
    condition: conditions.includes(body.condition) ? body.condition : "good",
    brandModel: body.brandModel?.trim() || "",
    serialNumber: body.serialNumber?.trim() || "",
    department: body.department?.trim() || "",
    location: body.location?.trim() || "",
    ipAddress: body.ipAddress?.trim() || "",
    notes: body.notes?.trim() || "",
    issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,
    returnedAt: body.returnedAt ? new Date(body.returnedAt) : undefined
  };

  if (!payload.name || !payload.assetId) {
    throw new Error("Asset ID and name are required");
  }

  return payload;
}

async function resolveAssignedUser(value) {
  const lookup = String(value || "").trim();
  if (!lookup) return null;

  const escaped = lookup.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.findOne({
    $or: [
      { email: lookup.toLowerCase() },
      { name: { $regex: `^${escaped}$`, $options: "i" } }
    ]
  });
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

router.get("/", requireAuth, requireHrOrAdmin, async (_req, res, next) => {
  try {
    const assets = await Asset.find().populate("assignedTo", "name email department teamName managerEmail").sort({ updatedAt: -1 });

    res.json(assets.map(toAsset));
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    const payload = buildPayload(req.body);
    const assignedTo = req.body.assignedTo ? await User.findById(req.body.assignedTo) : null;

    const exists = await Asset.exists({
      $or: [{ assetId: payload.assetId }, { assetTag: payload.assetId }]
    });
    if (exists) {
      return res.status(409).json({ message: "Asset ID already exists" });
    }

    const asset = await Asset.create({
      ...payload,
      department: payload.department || assignedTo?.department || "",
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
    if (error.message === "Asset ID and name are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.post("/bulk", requireAuth, requireHrOrAdmin, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.assets) || !req.body.assets.length) {
      return res.status(400).json({ message: "Excel file does not contain any asset rows" });
    }

    const seenIds = new Set();
    const rows = [];

    for (const [index, item] of req.body.assets.entries()) {
      const payload = buildPayload(item);
      const normalizedId = payload.assetId.toLowerCase();
      if (seenIds.has(normalizedId)) {
        return res.status(400).json({ message: `Duplicate Asset ID on Excel row ${index + 3}: ${payload.assetId}` });
      }
      seenIds.add(normalizedId);

      const assignedTo = await resolveAssignedUser(item.assignedTo);
      if (item.assignedTo && !assignedTo) {
        return res.status(400).json({ message: `Assigned To user not found on Excel row ${index + 3}: ${item.assignedTo}` });
      }

      rows.push({
        ...payload,
        assignedTo: assignedTo?._id,
        department: payload.department || assignedTo?.department || "",
        status: assignedTo ? "issued" : payload.status,
        issuedAt: assignedTo ? payload.issuedAt || new Date() : payload.issuedAt,
        createdBy: req.user._id
      });
    }

    await Asset.deleteMany({});
    const inserted = await Asset.insertMany(rows);

    res.status(201).json({ message: `${inserted.length} assets uploaded successfully`, count: inserted.length });
  } catch (error) {
    if (error.message === "Asset ID and name are required") {
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

    if (assignedTo && !req.body.department) {
      asset.department = assignedTo.department || "";
    }

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
    if (error.message === "Asset ID and name are required") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

export default router;
