import { Router } from "express";
import multer from "multer";
import PDFDocument from "pdfkit";
import { requireAuth, requireHrOrAdmin } from "../middleware/auth.js";
import { Appraisal } from "../models/Appraisal.js";
import { AppraisalTemplate } from "../models/AppraisalTemplate.js";
import { HrDocument } from "../models/HrDocument.js";
import { Reimbursement } from "../models/Reimbursement.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
const reimbursementUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    const hasAllowedExtension = /\.(pdf|jpe?g|png)$/i.test(file.originalname);
    const valid = allowed.includes(file.mimetype) && hasAllowedExtension;
    callback(valid ? null : new Error("Proof must be a PDF, JPEG, JPG or PNG file"), valid);
  }
});
const protect = [requireAuth, requireHrOrAdmin];
const defaultAppraisalQuestions = [
  "How would you reflect on your performance during the period 2025–2026 (till date)?",
  "What are your career aspirations within A2G?",
  "What are your salary expectations for the next 1–2 years?",
  "What is your plan of action to achieve your aspirations and salary expectations in the next 1–2 years?",
  "Which key skills and capabilities do you want to develop to achieve your plan of action and goals?",
  "How do you envision your long-term growth with A2G?",
  "How would you assess your professional journey so far?",
  "What organizational support would help enhance your performance and professional growth?"
];

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

router.post("/documents", ...protect, upload.single("file"), async (req, res, next) => {
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

router.patch("/documents/:id", ...protect, upload.single("file"), async (req, res, next) => {
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

router.get("/appraisals", requireAuth, async (req, res, next) => {
  try {
    const filter = ["admin", "hr"].includes(req.user.role) ? {} : { employee: req.user._id };
    res.json(await Appraisal.find(filter).populate("employee", "name email department designation").sort({ submittedAt: -1, createdAt: -1 }));
  } catch (error) { next(error); }
});

router.get("/appraisal-template", requireAuth, async (req, res, next) => {
  try {
    let template = await AppraisalTemplate.findOne({ active: true }).sort({ updatedAt: -1 });
    if (!template) template = await AppraisalTemplate.create({ reviewCycle: "2025–2026", questions: defaultAppraisalQuestions, updatedBy: req.user._id });
    res.json(template);
  } catch (error) { next(error); }
});

router.put("/appraisal-template", ...protect, async (req, res, next) => {
  try {
    const questions = Array.isArray(req.body.questions) ? req.body.questions.map((item) => item.trim()).filter(Boolean) : [];
    if (!req.body.reviewCycle?.trim() || !questions.length) return res.status(400).json({ message: "Review cycle and at least one question are required" });
    const template = await AppraisalTemplate.findOneAndUpdate(
      { reviewCycle: req.body.reviewCycle.trim() },
      { questions, active: true, updatedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(template);
  } catch (error) { next(error); }
});

router.post("/appraisals", requireAuth, async (req, res, next) => {
  try {
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const template = await AppraisalTemplate.findOne({ reviewCycle: req.body.reviewCycle, active: true });
    if (!template || answers.length !== template.questions.length || answers.some((item, index) => item.question !== template.questions[index] || !item.answer?.trim())) {
      return res.status(400).json({ message: "The appraisal questions changed. Refresh and answer every current question." });
    }
    const existing = await Appraisal.findOne({ employee: req.user._id, reviewCycle: req.body.reviewCycle });
    if (existing) return res.status(409).json({ message: "You have already submitted this appraisal" });
    const item = await Appraisal.create({
      employee: req.user._id,
      reviewCycle: req.body.reviewCycle,
      answers,
      rating: req.body.rating,
      status: "in_review",
      submittedAt: new Date(),
      createdBy: req.user._id
    });
    res.status(201).json(await item.populate("employee", "name email department designation"));
  } catch (error) { next(error); }
});

router.patch("/appraisals/:id", ...protect, async (req, res, next) => {
  try {
    const update = {};
    if (req.body.hrNotes !== undefined) update.hrNotes = req.body.hrNotes;
    if (["in_review", "completed"].includes(req.body.status)) update.status = req.body.status;
    const item = await Appraisal.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate("employee", "name email department designation");
    if (!item) return res.status(404).json({ message: "Appraisal not found" });
    res.json(item);
  } catch (error) { next(error); }
});

router.get("/appraisals/:id/pdf", ...protect, async (req, res, next) => {
  try {
    const item = await Appraisal.findById(req.params.id).populate("employee", "name email department designation");
    if (!item) return res.status(404).json({ message: "Appraisal not found" });
    const fileName = `${item.employee?.name || "employee"}-${item.reviewCycle}-appraisal.pdf`.replace(/[^a-z0-9.-]+/gi, "-");
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    const pdf = new PDFDocument({ margin: 54, size: "A4", info: { Title: `${item.employee?.name} Appraisal` } });
    pdf.pipe(res);
    pdf.fillColor("#064b36").fontSize(22).font("Helvetica-Bold").text("A2G Employee Appraisal");
    pdf.moveDown(0.4).fillColor("#4b5563").fontSize(10).font("Helvetica")
      .text(`Review cycle: ${item.reviewCycle}`)
      .text(`Employee: ${item.employee?.name || "-"}`)
      .text(`Email: ${item.employee?.email || "-"}`)
      .text(`Department / Designation: ${item.employee?.department || "-"} / ${item.employee?.designation || "-"}`)
      .text(`Submitted: ${item.submittedAt ? item.submittedAt.toLocaleDateString("en-IN") : "-"}`);
    pdf.moveDown(1.2);
    item.answers.forEach((entry, index) => {
      pdf.fillColor("#15372b").fontSize(11).font("Helvetica-Bold").text(`${index + 1}. ${entry.question}`, { continued: false });
      pdf.moveDown(0.3).fillColor("#374151").fontSize(10).font("Helvetica").text(entry.answer, { lineGap: 3 });
      pdf.moveDown(0.9);
    });
    pdf.fillColor("#15372b").fontSize(11).font("Helvetica-Bold").text(`${item.answers.length + 1}. Self-rating`);
    pdf.moveDown(0.3).fillColor("#374151").fontSize(10).font("Helvetica").text(`${item.rating} / 5`);
    if (item.hrNotes) {
      pdf.moveDown(1).fillColor("#15372b").fontSize(11).font("Helvetica-Bold").text("HR Notes");
      pdf.moveDown(0.3).fillColor("#374151").fontSize(10).font("Helvetica").text(item.hrNotes, { lineGap: 3 });
    }
    pdf.end();
  } catch (error) { next(error); }
});

router.get("/reimbursements", requireAuth, async (req, res, next) => {
  try {
    const filter = ["admin", "hr"].includes(req.user.role) ? {} : { employee: req.user._id };
    res.json(await Reimbursement.find(filter).select("-proofData").populate("employee", "name email department designation").sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

router.post("/reimbursements", requireAuth, reimbursementUpload.single("proof"), async (req, res, next) => {
  try {
    if (!req.body.category || !req.body.amount || !req.body.expenseDate || !req.body.description?.trim() || !req.file) {
      return res.status(400).json({ message: "Reason, amount, date, description and proof are required" });
    }
    const item = await Reimbursement.create({
      employee: req.user._id, category: req.body.category, amount: req.body.amount,
      expenseDate: req.body.expenseDate, description: req.body.description.trim(), status: "pending",
      proofFileName: req.file.originalname, proofMimeType: req.file.mimetype,
      proofSize: req.file.size, proofData: req.file.buffer, createdBy: req.user._id
    });
    await item.populate("employee", "name email department designation");
    const result = item.toObject(); delete result.proofData;
    res.status(201).json(result);
  } catch (error) { next(error); }
});

router.patch("/reimbursements/:id", ...protect, async (req, res, next) => {
  try {
    if (!["pending", "reviewed", "paid"].includes(req.body.status)) return res.status(400).json({ message: "Invalid reimbursement status" });
    const update = { status: req.body.status, reviewedBy: req.user._id };
    const item = await Reimbursement.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .select("-proofData").populate("employee", "name email department designation");
    if (!item) return res.status(404).json({ message: "Reimbursement not found" });
    res.json(item);
  } catch (error) { next(error); }
});

router.get("/reimbursements/:id/proof", requireAuth, async (req, res, next) => {
  try {
    const item = await Reimbursement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Reimbursement not found" });
    const canAccess = ["admin", "hr"].includes(req.user.role) || item.employee.equals(req.user._id);
    if (!canAccess) return res.status(403).json({ message: "You cannot access this proof" });
    res.set("Content-Type", item.proofMimeType);
    res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(item.proofFileName)}`);
    res.send(item.proofData);
  } catch (error) { next(error); }
});

export default router;
