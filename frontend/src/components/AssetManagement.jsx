import { CheckCircle2, Laptop, Loader2, PackageCheck, Plus, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createAsset, getAssets, updateAsset } from "../services/api";

const categories = ["laptop", "desktop", "accessory", "mouse", "other"];
const statuses = ["available", "issued", "maintenance", "returned", "retired"];
const conditions = ["new", "good", "needs_repair", "damaged"];
const emptyForm = {
  assetId: "",
  name: "",
  category: "laptop",
  brandModel: "",
  serialNumber: "",
  assignedTo: "",
  department: "",
  location: "",
  status: "available",
  condition: "good",
  ipAddress: "",
  notes: ""
};

function titleCase(value) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function statusClass(status) {
  return {
    available: "bg-emerald-50 text-emerald-700",
    issued: "bg-sky-50 text-sky-700",
    maintenance: "bg-amber-50 text-amber-700",
    returned: "bg-slate-100 text-slate-600",
    retired: "bg-rose-50 text-rose-700"
  }[status] || "bg-slate-100 text-slate-600";
}

function AssetManagement({ currentUser, users = [], onChanged }) {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canManage = ["admin", "hr"].includes(currentUser.role);

  const stats = useMemo(() => ({
    total: assets.length,
    issued: assets.filter((asset) => asset.status === "issued").length,
    available: assets.filter((asset) => asset.status === "available").length,
    maintenance: assets.filter((asset) => asset.status === "maintenance").length
  }), [assets]);

  const visibleAssets = selectedCategory === "all" ? assets : assets.filter((asset) => asset.category === selectedCategory);

  async function loadAssets() {
    setLoading(true);

    try {
      const data = await getAssets();
      setAssets(data);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, []);

  function updateForm(field, value) {
    setForm((current) => {
      if (field === "assignedTo") {
        const selectedUser = users.find((user) => user.id === value);
        return {
          ...current,
          assignedTo: value,
          department: selectedUser?.department || current.department,
          status: value ? "issued" : current.status === "issued" ? "available" : current.status
        };
      }

      return { ...current, [field]: value };
    });
  }

  async function submitAsset(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await createAsset({ ...form, assignedTo: form.assignedTo || undefined });
      setForm(emptyForm);
      setMessage("Asset saved and notification sent.");
      await loadAssets();
      onChanged();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save asset.");
    } finally {
      setSaving(false);
    }
  }

  async function patchAsset(asset, updates) {
    setMessage("");

    try {
      await updateAsset(asset.id, { ...asset, assignedTo: asset.assignedTo?.id, ...updates });
      setMessage("Asset updated and notification sent.");
      await loadAssets();
      onChanged();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update asset.");
    }
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-[#064b36] bg-[#064b36] p-6 text-white shadow-xl shadow-emerald-900/25">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#bfff2f]">Asset Management</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Issue, track, return, maintain</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Manage company assets with ownership, lifecycle status, condition, and employee notifications.
            </p>
          </div>
          <button onClick={loadAssets} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#bfff2f] px-5 py-4 text-sm font-black text-[#064b36] shadow-lg shadow-emerald-950/20" type="button">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Assets", stats.total, Laptop, "#064b36"],
          ["Issued", stats.issued, PackageCheck, "#123c69"],
          ["Available", stats.available, CheckCircle2, "#5d3b09"],
          ["Maintenance", stats.maintenance, Wrench, "#4a2f73"]
        ].map(([label, value, Icon, color]) => (
          <article key={label} className="relative min-h-28 overflow-hidden rounded-3xl p-5 text-white shadow-xl" style={{ backgroundColor: color }}>
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-white/80">{label}</p>
                <h2 className="mt-2 text-4xl font-black">{value}</h2>
              </div>
              <span className="rounded-2xl bg-white/14 p-3 ring-1 ring-white/20">
                <Icon size={22} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className={`grid gap-6 ${canManage ? "xl:grid-cols-[0.85fr_1.15fr]" : ""}`}>
        {canManage ? (
          <form onSubmit={submitAsset} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#064b36]">Asset Desk</p>
            <h2 className="mt-1 text-2xl font-black text-[#15372b]">Add or issue asset</h2>
            <div className="mt-5 grid gap-3">
              <input className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" placeholder="Asset ID" value={form.assetId} onChange={(event) => updateForm("assetId", event.target.value)} required />
              <input className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" placeholder="Asset name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} required />
              <select className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
                {categories.map((category) => <option key={category} value={category}>{titleCase(category)}</option>)}
              </select>
              <input className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" placeholder="Brand / Model" value={form.brandModel} onChange={(event) => updateForm("brandModel", event.target.value)} />
              <input className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" placeholder="Serial number" value={form.serialNumber} onChange={(event) => updateForm("serialNumber", event.target.value)} />
              <select className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" value={form.condition} onChange={(event) => updateForm("condition", event.target.value)}>
                {conditions.map((condition) => <option key={condition} value={condition}>{titleCase(condition)}</option>)}
              </select>
              <select className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" value={form.assignedTo} onChange={(event) => updateForm("assignedTo", event.target.value)}>
                <option value="">Keep available</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.email}</option>)}
              </select>
              <input className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" placeholder="Department" value={form.department} onChange={(event) => updateForm("department", event.target.value)} />
              <input className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" placeholder="Location" value={form.location} onChange={(event) => updateForm("location", event.target.value)} />
              <select className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                {statuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
              <input className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold outline-none focus:border-[#064b36]" placeholder="IP address" value={form.ipAddress} onChange={(event) => updateForm("ipAddress", event.target.value)} />
              <textarea className="min-h-28 rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-bold leading-6 outline-none focus:border-[#064b36]" placeholder="Notes" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
              <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#064b36] px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-[#0b5d43]" disabled={saving} type="submit">
                {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
                Save Asset
              </button>
            </div>
            {message ? <p className="mt-3 text-sm font-black text-[#064b36]">{message}</p> : null}
          </form>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#064b36]">Inventory</p>
              <h2 className="mt-1 text-2xl font-black text-[#15372b]">Asset register</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedCategory("all")} className={`rounded-full px-4 py-2 text-xs font-black ${selectedCategory === "all" ? "bg-[#064b36] text-white" : "bg-[#eff6df] text-[#064b36]"}`} type="button">All</button>
              {categories.map((category) => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`rounded-full px-4 py-2 text-xs font-black ${selectedCategory === category ? "bg-[#123c69] text-white" : "bg-[#eff6df] text-[#064b36]"}`} type="button">
                  {titleCase(category)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#064b36] text-xs uppercase tracking-widest text-white">
                <tr>
                  <th className="px-4 py-4 font-black">Asset ID</th>
                  <th className="px-4 py-4 font-black">Asset Name</th>
                  <th className="px-4 py-4 font-black">Category</th>
                  <th className="px-4 py-4 font-black">Brand/Model</th>
                  <th className="px-4 py-4 font-black">Serial Number</th>
                  <th className="px-4 py-4 font-black">Assigned To</th>
                  <th className="px-4 py-4 font-black">Department</th>
                  <th className="px-4 py-4 font-black">Location</th>
                  <th className="px-4 py-4 font-black">Status</th>
                  <th className="px-4 py-4 font-black">Condition</th>
                  <th className="px-4 py-4 font-black">IP Address</th>
                  <th className="px-4 py-4 font-black">Notes</th>
                  {canManage ? <th className="px-4 py-4 font-black">Manage</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {visibleAssets.map((asset) => (
                  <tr key={asset.id} className="transition hover:bg-[#eff6df]">
                    <td className="whitespace-nowrap px-4 py-4 font-black text-[#15372b]">{asset.assetId}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-black text-[#15372b]">{asset.name}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{asset.categoryLabel}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{asset.brandModel || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{asset.serialNumber || "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{asset.assignedTo?.name || "Available"}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{asset.department || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{asset.location || "—"}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(asset.status)}`}>{asset.statusLabel}</span></td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{asset.conditionLabel}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{asset.ipAddress || "—"}</td>
                    <td className="min-w-48 px-4 py-4 text-xs text-slate-500">{asset.notes || "—"}</td>
                    {canManage ? (
                      <td className="px-4 py-4">
                        <div className="flex min-w-44 flex-col gap-2">
                          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none" value={asset.status} onChange={(event) => patchAsset(asset, { status: event.target.value })}>
                            {statuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                          </select>
                          <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none" value={asset.assignedTo?.id || ""} onChange={(event) => patchAsset(asset, { assignedTo: event.target.value || undefined })}>
                            <option value="">Unassigned</option>
                            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                          </select>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!visibleAssets.length ? (
                  <tr>
                    <td className="px-5 py-10 text-center text-sm font-bold text-slate-500" colSpan={canManage ? 13 : 12}>No assets found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AssetManagement;
