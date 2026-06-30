import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";

export async function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@a2g.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    existingAdmin.name = process.env.ADMIN_NAME || existingAdmin.name || "A2G Admin";
    existingAdmin.passwordHash = hashPassword(adminPassword);
    existingAdmin.role = "admin";
    existingAdmin.status = "active";
    existingAdmin.department = existingAdmin.department || "Leadership";
    existingAdmin.designation = existingAdmin.designation || "HR Administrator";
    existingAdmin.avatarColor = existingAdmin.avatarColor || "#0f766e";
    await existingAdmin.save();
    console.log(`Admin login ready: ${adminEmail}`);
    return;
  }

  await User.create({
    name: process.env.ADMIN_NAME || "A2G Admin",
    email: adminEmail,
    passwordHash: hashPassword(adminPassword),
    role: "admin",
    status: "active",
    department: "Leadership",
    designation: "HR Administrator",
    avatarColor: "#111827"
  });

  console.log(`Seeded admin login: ${adminEmail}`);
}
