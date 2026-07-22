import { BriefcaseBusiness, CalendarDays, Mail, MapPin, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createUser, updateUser } from "../services/api";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  status: "active",
  department: "",
  location: "",
  designation: "",
  teamName: "",
  managerEmail: "",
  managerName: "",
  dateOfBirth: "",
  joinedAt: new Date().toISOString().slice(0, 10)
};

function toForm(user) {
  if (!user) {
    return initialForm;
  }

  return {
    name: user.name || "",
    email: user.email || "",
    password: "",
    role: user.role || "employee",
    status: user.status || "active",
    department: user.department || "",
    location: user.location || "",
    designation: user.designation || "",
    teamName: user.teamName || "",
    managerEmail: user.managerEmail || "",
    managerName: user.managerName || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : "",
    joinedAt: user.joinedAt ? new Date(user.joinedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  };
}

function AdminPanel({ currentUser, open, editingUser, onClose, onUserCreated, onUserUpdated }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(editingUser));
      setMessage("");
      setError("");
    }
  }, [editingUser, open]);

  if (!open || !["admin", "hr"].includes(currentUser?.role)) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const user = editingUser ? await updateUser(editingUser.id, form) : await createUser(form);

      if (editingUser) {
        onUserUpdated(user);
      } else {
        onUserCreated(user);
      }

      setForm(initialForm);
      setMessage(`${user.name} ${editingUser ? "updated" : "created"} successfully.`);
      window.setTimeout(() => {
        setMessage("");
        onClose();
      }, 700);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not create user");
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eff6df]0/20 px-4 py-6">
      <section className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-emerald-200/40">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden min-h-full overflow-hidden bg-[#064b36] p-7 text-white lg:block">
            <div className="absolute -left-16 top-16 h-44 w-44 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-lime-900/20 blur-2xl" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
                <ShieldCheck size={24} />
              </div>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-white/80">Admin Panel</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">Create employee access with clean HR records.</h2>
              <p className="mt-4 text-sm leading-6 text-white/80">
                Add role, department, designation, and joining details in one quick workflow.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#064b36]">{editingUser ? "Edit Employee" : "Create Employee"}</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#15372b]">Employee Details</h2>
              </div>
              <button
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
                type="button"
                aria-label="Close create employee"
              >
                <X size={18} />
              </button>
            </div>

            {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</div> : null}
            {error ? <div className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div> : null}

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              {[
                ["name", "Full name", "text", UserRound],
                ["email", "Email", "email", Mail],
                ["password", "Password", "password", ShieldCheck],
                ["department", "Department", "text", BriefcaseBusiness],
                ["location", "Location", "text", MapPin],
                ["designation", "Designation", "text", UserRound],
                ["teamName", "Team Name", "text", BriefcaseBusiness],
                ["managerName", "Manager Name", "text", UserRound],
                ["managerEmail", "Manager Email", "email", Mail]
              ].map(([field, placeholder, type, Icon]) => (
                <label key={field}>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">{placeholder}</span>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-[#064b36] focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/10">
                    <Icon size={17} className="text-slate-400" />
                    <input
                      className="w-full border-0 bg-transparent text-sm outline-none"
                      placeholder={placeholder}
                      type={type}
                      value={form[field]}
                      onChange={(event) => updateField(field, event.target.value)}
                      required={["name", "email"].includes(field) || (field === "password" && !editingUser)}
                    />
                  </div>
                </label>
              ))}

              <label>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Role</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#064b36] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Status</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#064b36] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="exited">Exited</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Joining Date</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-[#064b36] focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/10">
                  <CalendarDays size={17} className="text-slate-400" />
                  <input
                    className="w-full border-0 bg-transparent text-sm outline-none"
                    type="date"
                    value={form.joinedAt}
                    onChange={(event) => updateField("joinedAt", event.target.value)}
                  />
                </div>
              </label>
              <label>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400">Birth Date</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-[#064b36] focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/10">
                  <CalendarDays size={17} className="text-slate-400" />
                  <input
                    className="w-full border-0 bg-transparent text-sm outline-none"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) => updateField("dateOfBirth", event.target.value)}
                  />
                </div>
              </label>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064b36] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-[#0b5d43] sm:col-span-2"
                type="submit"
              >
                <Plus size={18} />
                {loading ? "Saving..." : editingUser ? "Update Employee" : "Create Employee"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminPanel;
