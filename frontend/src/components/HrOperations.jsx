import { CheckCircle2, Download, FileText, FileUp, IndianRupee, Pencil, Plus, Save, Search, Star, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createAppraisal, createReimbursement, downloadHrDocument, getAppraisals, getHrDocuments,
  getReimbursements, updateAppraisal, updateHrDocument, updateReimbursement, uploadHrDocument
} from "../services/api";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#0b5d43] focus:ring-2 focus:ring-emerald-100";
const statusColor = {
  draft: "bg-slate-100 text-slate-700", scheduled: "bg-sky-100 text-sky-700", in_review: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700", submitted: "bg-sky-100 text-sky-700",
  under_review: "bg-amber-100 text-amber-700", approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700", paid: "bg-violet-100 text-violet-700"
};

function Header({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-[#064b36] p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[0.24em] text-[#bfff2f]">{eyebrow}</p><h1 className="mt-2 text-3xl font-black">{title}</h1><p className="mt-2 text-sm text-emerald-50/80">{description}</p></div>
      {action}
    </div>
  );
}

function Badge({ value }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black capitalize ${statusColor[value] || "bg-slate-100 text-slate-700"}`}>{value?.replaceAll("_", " ")}</span>;
}

function LegacyDocuments() {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => setItems(await getHrDocuments());
  useEffect(() => { load().catch(() => setMessage("Could not load documents.")); }, []);
  async function submit(event) {
    event.preventDefault();
    if (!file) return setMessage("Please select a file.");
    setBusy(true); setMessage("");
    const body = new FormData();
    body.append("file", file); body.append("title", title); body.append("description", description);
    try {
      await uploadHrDocument(body); setFile(null); setTitle(""); setDescription(""); setMessage("Document uploaded successfully."); await load();
      event.currentTarget.reset();
    } catch (error) { setMessage(error.response?.data?.message || "Upload failed."); } finally { setBusy(false); }
  }
  return (
    <>
      <Header eyebrow="HR knowledge hub" title="Document & Policy" description="Upload, organise and download company policies or HR files in any format." />
      <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-slate-200 bg-[#f8f4ea] p-5 shadow-sm md:grid-cols-4">
        <input className={inputClass} placeholder="Document title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1 file:font-bold file:text-[#064b36]`} type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#bfff2f] px-4 py-2.5 font-black text-[#064b36] disabled:opacity-60"><FileUp size={18} />{busy ? "Uploading..." : "Upload file"}</button>
      </form>
      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-[#15372b]">{item.title}</p><p className="mt-1 truncate text-xs text-slate-500">{item.fileName}</p></div><button onClick={() => downloadHrDocument(item.id, item.fileName)} className="rounded-xl bg-emerald-100 p-2 text-[#064b36]" title="Download"><Download size={18} /></button></div>
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">{item.description || "No description"}</p>
            <p className="mt-4 text-xs font-bold text-slate-400">{(item.size / 1024).toFixed(1)} KB · {item.uploadedBy} · {new Date(item.createdAt).toLocaleDateString("en-IN")}</p>
          </article>)}
          {!items.length ? <p className="col-span-full py-10 text-center text-sm font-bold text-slate-500">No documents uploaded yet.</p> : null}
        </div>
      </div>
    </>
  );
}

const policyTabs = [
  ["paid-leave", "Paid Leave", "This leave will be paid when not used"],
  ["sick-leave", "Sick Leave", "Health-related leave policy and eligibility"],
  ["paternity", "Paternity", "Paternity leave entitlement and process"],
  ["unpaid", "Unpaid", "Leave without pay policy and approval process"],
  ["holiday-hr", "Holiday HR", "Company holiday calendar and HR guidelines"]
];

const paidLeaveCopy = `Leave Quota
You are allocated a total of 18 days of leave in a year beginning Jan 2026 till Dec 2026. You can consume this leave in the same year it is accrued or credited.

You are allowed to have more than the annual quota of leave if additional leave is granted manually by management.

Leave Accrual
Your annual quota is 18 days. Paid Leave accrues once every month on the 1st, at the rate of 1.5 days. Only leave accrued as of the request date can be used; future accruals are not considered.`;

function PolicyDocuments({ currentUser }) {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("paid-leave");
  const [form, setForm] = useState({ title: "Paid Leave", description: "", policyContent: paidLeaveCopy });
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => setItems(await getHrDocuments());
  useEffect(() => { load().catch(() => setMessage("Could not load policies.")); }, []);
  const tab = policyTabs.find(([id]) => id === activeTab);
  const policy = items.find((item) => (item.category || "paid-leave") === activeTab);
  const isAdmin = currentUser?.role === "admin";

  function openEditor() {
    setForm({ title: policy?.title || tab[1], description: policy?.description || tab[2], policyContent: policy?.policyContent || (activeTab === "paid-leave" ? paidLeaveCopy : "") });
    setFile(null); setMessage(""); setEditing(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (!policy && !file) return setMessage("Please select a policy file for the first upload.");
    setBusy(true); setMessage("");
    const body = new FormData();
    if (file) body.append("file", file);
    body.append("category", activeTab);
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    try {
      if (policy) await updateHrDocument(policy.id, body); else await uploadHrDocument(body);
      setEditing(false); setFile(null); setMessage(policy ? "Policy updated successfully." : "Policy uploaded successfully."); await load();
    } catch (error) { setMessage(error.response?.data?.message || "Could not save the policy."); } finally { setBusy(false); }
  }

  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#0b5d43]">HR knowledge hub</p><h1 className="mt-1 text-2xl font-black text-[#15372b]">Document &amp; Policy</h1></div>
      {isAdmin ? <button type="button" onClick={openEditor} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064b36] px-4 py-2.5 text-sm font-bold text-white"><Pencil size={16} />{policy ? "Edit policy" : "Upload policy"}</button> : null}
    </div>
    <div className="overflow-x-auto border-b border-slate-200 px-5 pt-5"><div className="flex min-w-max" role="tablist" aria-label="Leave policies">{policyTabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => { setActiveTab(id); setEditing(false); setMessage(""); }} className={`border border-b-0 px-5 py-3 text-sm font-bold transition first:rounded-tl-lg last:rounded-tr-lg ${activeTab === id ? "border-[#064b36] bg-[#064b36] text-white" : "border-slate-200 bg-white text-[#0b5d43] hover:bg-emerald-50"}`}>{label}</button>)}</div></div>
    {message ? <p className="mx-5 mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
    {editing && isAdmin ? <form onSubmit={submit} className="m-5 grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-slate-700">Policy title<input required className={`${inputClass} mt-2`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label className="text-sm font-bold text-slate-700">Short introduction<input className={`${inputClass} mt-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label></div>
      <label className="text-sm font-bold text-slate-700">Policy details<textarea rows="8" className={`${inputClass} mt-2 resize-y leading-6`} value={form.policyContent} onChange={(e) => setForm({ ...form, policyContent: e.target.value })} placeholder="Add the full policy details here..." /></label>
      <label className="text-sm font-bold text-slate-700">{policy ? "Replace attachment (optional)" : "Policy attachment"}<input required={!policy} className={`${inputClass} mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1 file:font-bold file:text-[#064b36]`} type="file" onChange={(e) => setFile(e.target.files[0])} /></label>
      <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Cancel</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#bfff2f] px-4 py-2.5 text-sm font-black text-[#064b36] disabled:opacity-60">{policy ? <Save size={17} /> : <FileUp size={17} />}{busy ? "Saving..." : "Save policy"}</button></div>
    </form> : <div className="p-5 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-3xl font-black text-[#172d25]">{policy?.title || tab[1]}</h2><p className="mt-3 text-sm text-slate-600">{policy?.description || tab[2]}</p></div>{policy ? <button type="button" onClick={() => downloadHrDocument(policy.id, policy.fileName)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-[#064b36]"><Download size={17} />Download policy</button> : null}</div>
      <div className="mt-10 max-w-5xl whitespace-pre-line text-[15px] leading-7 text-slate-700">{policy?.policyContent || (activeTab === "paid-leave" ? paidLeaveCopy : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><FileText className="mx-auto mb-3 text-slate-400" size={32} /><p className="font-bold text-slate-600">Policy details will be added soon.</p>{isAdmin ? <p className="mt-1 text-sm text-slate-400">Use “Upload policy” to publish this section.</p> : null}</div>)}</div>
      {policy ? <p className="mt-10 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-400">{policy.fileName} · {(policy.size / 1024).toFixed(1)} KB · Updated {new Date(policy.createdAt).toLocaleDateString("en-IN")}</p> : null}
    </div>}
  </section>;
}

function Appraisals({ users }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ employee: "", reviewCycle: "FY 2026-27", reviewer: "", rating: 3, status: "scheduled", dueDate: "", goals: "" });
  const load = async () => setItems(await getAppraisals());
  useEffect(() => { load(); }, []);
  async function submit(e) { e.preventDefault(); await createAppraisal(form); setForm({ ...form, employee: "", goals: "", dueDate: "" }); await load(); }
  const completed = items.filter((x) => x.status === "completed").length;
  return (
    <>
      <Header eyebrow="Performance management" title="Appraisal" description="Plan review cycles, track ratings and keep performance conversations on schedule." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Total reviews", items.length], ["Completed", completed], ["Average rating", items.length ? (items.reduce((sum, x) => sum + x.rating, 0) / items.length).toFixed(1) : "—"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-[#064b36]">{value}</p></div>)}
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-3xl bg-[#f8f4ea] p-5 md:grid-cols-4">
        <select required className={inputClass} value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}><option value="">Select employee</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <input required className={inputClass} value={form.reviewCycle} onChange={(e) => setForm({ ...form, reviewCycle: e.target.value })} placeholder="Review cycle" />
        <input className={inputClass} value={form.reviewer} onChange={(e) => setForm({ ...form, reviewer: e.target.value })} placeholder="Reviewer" />
        <input required type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        <select className={inputClass} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>{[1,2,3,4,5].map((x) => <option key={x} value={x}>{x} stars</option>)}</select>
        <input className={`${inputClass} md:col-span-2`} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="Goals / review notes" />
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064b36] px-4 py-2 font-black text-white"><Plus size={18} />Schedule appraisal</button>
      </form>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-[#064b36] text-white"><tr>{["Employee","Cycle","Reviewer","Rating","Due date","Status","Action"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item._id} className="border-b border-slate-100"><td className="px-4 py-4 font-black">{item.employee?.name}</td><td className="px-4">{item.reviewCycle}</td><td className="px-4">{item.reviewer || "—"}</td><td className="px-4"><span className="inline-flex items-center gap-1 font-black"><Star size={14} fill="#f59e0b" className="text-amber-500"/>{item.rating}</span></td><td className="px-4">{item.dueDate ? new Date(item.dueDate).toLocaleDateString("en-IN") : "—"}</td><td className="px-4"><Badge value={item.status}/></td><td className="px-4"><select className="rounded-lg border p-2 text-xs" value={item.status} onChange={async (e) => { await updateAppraisal(item._id, { status: e.target.value }); await load(); }}>{["draft","scheduled","in_review","completed"].map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>
    </>
  );
}

function Reimbursements({ users }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ employee: "", category: "travel", amount: "", expenseDate: "", description: "", reference: "" });
  const load = async () => setItems(await getReimbursements());
  useEffect(() => { load(); }, []);
  const shown = useMemo(() => items.filter((x) => `${x.employee?.name} ${x.description} ${x.status}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  async function submit(e) { e.preventDefault(); await createReimbursement(form); setForm({ ...form, employee: "", amount: "", expenseDate: "", description: "", reference: "" }); await load(); }
  const pending = items.filter((x) => ["submitted","under_review"].includes(x.status)).reduce((s,x) => s + x.amount, 0);
  return (
    <>
      <Header eyebrow="Expense operations" title="Reimbursement" description="Review employee claims, approve valid expenses and track payments from one queue." />
      <div className="grid gap-4 sm:grid-cols-3">{[["Total claims", items.length],["Pending value", `₹${pending.toLocaleString("en-IN")}`],["Paid claims", items.filter((x) => x.status === "paid").length]].map(([l,v]) => <div key={l} className="rounded-2xl border bg-white p-5"><p className="text-xs font-black uppercase text-slate-400">{l}</p><p className="mt-2 text-3xl font-black text-[#064b36]">{v}</p></div>)}</div>
      <form onSubmit={submit} className="grid gap-3 rounded-3xl bg-[#f8f4ea] p-5 md:grid-cols-3">
        <select required className={inputClass} value={form.employee} onChange={(e) => setForm({...form, employee:e.target.value})}><option value="">Select employee</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <select className={inputClass} value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>{["travel","food","medical","internet","office","other"].map((x) => <option key={x}>{x}</option>)}</select>
        <div className="relative"><IndianRupee className="absolute left-3 top-3 text-slate-400" size={17}/><input required min="0" type="number" className={`${inputClass} pl-9`} value={form.amount} onChange={(e) => setForm({...form, amount:e.target.value})} placeholder="Amount"/></div>
        <input required type="date" className={inputClass} value={form.expenseDate} onChange={(e) => setForm({...form, expenseDate:e.target.value})}/>
        <input required className={inputClass} value={form.description} onChange={(e) => setForm({...form, description:e.target.value})} placeholder="Expense description"/>
        <button className="rounded-xl bg-[#064b36] font-black text-white">Add claim</button>
      </form>
      <div className="relative max-w-md"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search claims"/></div>
      <div className="grid gap-4 lg:grid-cols-2">{shown.map((item) => <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><div><p className="font-black text-[#15372b]">{item.employee?.name}</p><p className="mt-1 text-sm capitalize text-slate-500">{item.category} · {new Date(item.expenseDate).toLocaleDateString("en-IN")}</p></div><p className="text-xl font-black text-[#064b36]">₹{item.amount.toLocaleString("en-IN")}</p></div><p className="my-4 text-sm text-slate-600">{item.description}</p><div className="flex items-center justify-between"><Badge value={item.status}/><div className="flex gap-2">{!["approved","paid"].includes(item.status) ? <button onClick={async()=>{await updateReimbursement(item._id,{status:"approved"});await load();}} className="rounded-lg bg-emerald-100 p-2 text-emerald-700" title="Approve"><CheckCircle2 size={18}/></button>:null}{!["rejected","paid"].includes(item.status) ? <button onClick={async()=>{await updateReimbursement(item._id,{status:"rejected"});await load();}} className="rounded-lg bg-rose-100 p-2 text-rose-700" title="Reject"><XCircle size={18}/></button>:null}{item.status === "approved" ? <button onClick={async()=>{await updateReimbursement(item._id,{status:"paid"});await load();}} className="rounded-lg bg-violet-100 px-3 text-xs font-black text-violet-700">Mark paid</button>:null}</div></div></article>)}</div>
    </>
  );
}

export default function HrOperations({ activeSection, currentUser, users }) {
  return <div className="space-y-6">{activeSection === "documents" ? <PolicyDocuments currentUser={currentUser} /> : activeSection === "appraisals" ? <Appraisals users={users} /> : <Reimbursements users={users} />}</div>;
}
