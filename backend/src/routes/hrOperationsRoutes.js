import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireAuth, requireHrOrAdmin } from "../middleware/auth.js";
import { Appraisal } from "../models/Appraisal.js";
import { HrDocument } from "../models/HrDocument.js";
import { Reimbursement } from "../models/Reimbursement.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
const protect = [requireAuth, requireHrOrAdmin];

router.get("/documents", requireAuth, async (_req, res, next) => {
  try {
    const documents = await HrDocument.find().select("-data").populate("uploadedBy", "name").sort({ createdAt: -1 });
    res.json(documents.map((item) => ({
      id: item._id, title: item.title, category: item.category, description: item.description,
      policyContent: item.policyContent, fileName: item.fileName,
      mimeType: item.mimeType, size: item.size, uploadedBy: item.uploadedBy?.name || "HR", createdAt: item.createdAt
    })));
  } catch (error) { next(error); }
});

router.post("/documents", requireAuth, requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please choose a file to upload" });
    const document = await HrDocument.create({
      title: req.body.title?.trim() || req.file.originalname,
      category: req.body.category || "paid-leave",
      description: req.body.description?.trim() || "",
      policyContent: req.body.policyContent?.trim() || "",
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
      uploadedBy: req.user._id
    });
    res.status(201).json({ id: document._id, message: "Document uploaded successfully" });
  } catch (error) { next(error); }
});

router.patch("/documents/:id", requireAuth, requireAdmin, upload.single("file"), async (req, res, next) => {
  try {
    const document = await HrDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });
    ["title", "category", "description", "policyContent"].forEach((field) => {
      if (req.body[field] !== undefined) document[field] = req.body[field].trim();
    });
    if (req.file) {
      document.fileName = req.file.originalname;
      document.mimeType = req.file.mimetype;
      document.size = req.file.size;
      document.data = req.file.buffer;
    }
    await document.save();
    res.json({ id: document._id, message: "Policy updated successfully" });
  } catch (error) { next(error); }
});

router.get("/documents/:id/download", requireAuth, async (req, res, next) => {
  try {
    const document = await HrDocument.findById(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });
    res.set("Content-Type", document.mimeType);
    res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`);
    res.send(document.data);
  } catch (error) { next(error); }
});

router.get("/appraisals", ...protect, async (_req, res, next) => {
  try {
    res.json(await Appraisal.find().populate("employee", "name email department designation").sort({ dueDate: 1 }));
  } catch (error) { next(error); }
});

router.post("/appraisals", ...protect, async (req, res, next) => {
  try {
    if (!req.body.employee || !req.body.reviewCycle) return res.status(400).json({ message: "Employee and review cycle are required" });
    const item = await Appraisal.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(await item.populate("employee", "name email department designation"));
  } catch (error) { next(error); }
});

router.patch("/appraisals/:id", ...protect, async (req, res, next) => {
  try {
    const item = await Appraisal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("employee", "name email department designation");
    if (!item) return res.status(404).json({ message: "Appraisal not found" });
    res.json(item);
  } catch (error) { next(error); }
});

router.get("/reimbursements", ...protect, async (_req, res, next) => {
  try {
    res.json(await Reimbursement.find().populate("employee", "name email department").sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

router.post("/reimbursements", ...protect, async (req, res, next) => {
  try {
    if (!req.body.employee || !req.body.amount || !req.body.expenseDate || !req.body.description) {
      return res.status(400).json({ message: "Employee, amount, date and description are required" });
    }
    const item = await Reimbursement.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(await item.populate("employee", "name email department"));
  } catch (error) { next(error); }
});

router.patch("/reimbursements/:id", ...protect, async (req, res, next) => {
  try {
    const update = { ...req.body, reviewedBy: req.user._id };
    const item = await Reimbursement.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate("employee", "name email department");
    if (!item) return res.status(404).json({ message: "Reimbursement not found" });
    res.json(item);
  } catch (error) { next(error); }
});

export default router;
