import { BadgeCheck, BriefcaseBusiness, Camera, CreditCard, FlipHorizontal2, IdCard, Loader2, Mail, MapPin, Pencil, Phone, Save, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getProfilePhoto, updateOwnProfile, uploadProfilePhoto } from "../services/api";

const logoUrl = "https://aagarg.in/wp-content/uploads/2025/05/A2G-New-Logo-Black.avif";
const empty = "Not set";
const show = (value) => value || empty;
const titleCase = (value) => value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : empty;
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#15372b] outline-none transition focus:border-[#0b5d43] focus:bg-white focus:ring-4 focus:ring-emerald-100";

const profileFields = {
  primary: [
    ["firstName", "First name"], ["middleName", "Middle name"], ["lastName", "Last name"], ["displayName", "Display name"],
    ["gender", "Gender", "select", [["", "Select"], ["male", "Male"], ["female", "Female"], ["non_binary", "Non-binary"], ["prefer_not_to_say", "Prefer not to say"]]],
    ["dateOfBirth", "Date of birth", "date"],
    ["maritalStatus", "Marital status", "select", [["", "Select"], ["single", "Single"], ["married", "Married"], ["divorced", "Divorced"], ["widowed", "Widowed"]]],
    ["bloodGroup", "Blood group"],
    ["physicallyHandicapped", "Physically handicapped", "select", [["", "Select"], ["no", "No"], ["yes", "Yes"], ["prefer_not_to_say", "Prefer not to say"]]],
    ["nationality", "Nationality"]
  ],
  contact: [["personalEmail", "Personal email", "email"], ["mobileNumber", "Mobile number", "tel"], ["workNumber", "Work number", "tel"], ["residenceNumber", "Residence number", "tel"], ["location", "Location"]],
  emergency: [["emergencyContactName", "Emergency contact name"], ["emergencyContactNumber", "Emergency contact number", "tel"]]
};

function InfoValue({ label, value }) {
  return <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-1.5 text-sm font-bold text-[#15372b]">{show(value)}</p></div>;
}

function EditablePanel({ title, section, fields, form, editing, onEdit, onCancel, onChange, onSave, saving, readOnlyValues = {} }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><h3 className="text-xl font-black text-[#15372b]">{title}</h3>{editing ? <div className="flex gap-2"><button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 p-2 text-slate-500" aria-label={`Cancel editing ${title}`}><X size={17} /></button><button type="button" disabled={saving} onClick={() => onSave(section)} className="inline-flex items-center gap-2 rounded-xl bg-[#064b36] px-3 py-2 text-xs font-black text-white disabled:opacity-60"><Save size={15} />Save</button></div> : <button type="button" onClick={() => onEdit(section)} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-[#0b5d43] hover:bg-emerald-50"><Pencil size={16} />Edit</button>}</header>
      <div className="grid gap-x-8 gap-y-6 p-5 sm:grid-cols-2 sm:p-6">
        {fields.map(([field, label, type = "text", options]) => editing ? <label key={field}><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>{type === "select" ? <select className={inputClass} value={form[field] || ""} onChange={(event) => onChange(field, event.target.value)}>{options.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}</select> : <input className={inputClass} type={type} value={form[field] || ""} onChange={(event) => onChange(field, event.target.value)} />}</label> : <InfoValue key={field} label={label} value={readOnlyValues[field] || (type === "select" ? titleCase(form[field]) : form[field])} />)}
      </div>
    </section>
  );
}

function EmployeeIdCard({ user, onUserUpdated }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [editing, setEditing] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const employeeCode = user.employeeCode || `A2G-${String(user.id || "000000").slice(-6).toUpperCase()}`;
  const displayName = user.displayName || user.name;
  const makeForm = (source) => Object.fromEntries(Object.values(profileFields).flat().map(([field]) => [field, field === "dateOfBirth" && source[field] ? new Date(source[field]).toISOString().slice(0, 10) : source[field] || ""]));
  const [form, setForm] = useState(() => makeForm(user));
  const primaryReadOnly = useMemo(() => ({ displayName, dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "" }), [displayName, user.dateOfBirth]);

  useEffect(() => { setForm(makeForm(user)); }, [user]);
  useEffect(() => { let active = true; if (user.hasProfilePhoto) getProfilePhoto().then((blob) => { if (active) setPhotoUrl(URL.createObjectURL(blob)); }).catch(() => {}); return () => { active = false; }; }, [user.hasProfilePhoto]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  async function handlePhoto(event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setMessage("Choose a JPG, PNG or WebP image.");
    if (file.size > 4 * 1024 * 1024) return setMessage("Profile photo must be 4 MB or smaller.");
    setUploading(true); setMessage(""); const body = new FormData(); body.append("photo", file);
    try { await uploadProfilePhoto(body); setPhotoUrl(URL.createObjectURL(file)); onUserUpdated?.((current) => ({ ...current, hasProfilePhoto: true })); setMessage("Profile photo updated successfully."); }
    catch (error) { setMessage(error.response?.data?.message || "Could not upload profile photo."); } finally { setUploading(false); }
  }

  async function saveSection() {
    setSaving(true); setMessage("");
    try { const updated = await updateOwnProfile(form); onUserUpdated?.(updated); setEditing(""); setMessage("Profile details updated successfully."); }
    catch (error) { setMessage(error.response?.data?.message || "Could not update profile details."); } finally { setSaving(false); }
  }

  function cancelEdit() { setForm(makeForm(user)); setEditing(""); }

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-emerald-900/5 bg-[#f5f7f4] shadow-sm">
      <div className="grid min-h-[820px] xl:grid-cols-[460px_1fr]">
        <aside className="relative overflow-hidden bg-gradient-to-b from-[#f2f8e7] via-[#e8f6df] to-[#d8efe1] px-5 pb-12 pt-2 sm:px-8">
          <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-[#bfff2f]/30 blur-3xl" />
          <div className="relative mx-auto flex w-full max-w-[395px] flex-col items-center">
            <div className="h-24 w-8 rounded-b bg-[#10231d] shadow-lg" /><div className="z-10 -mt-1 h-14 w-14 rounded-full border-[8px] border-[#c7d0cb] bg-transparent shadow-md" /><div className="z-10 -mt-1 h-12 w-6 rounded-b-xl bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 shadow-md" />
            <div className="-mt-2 w-full [perspective:1800px]">
              <div className={`relative aspect-[3/4.65] w-full transition-transform duration-700 ease-[cubic-bezier(.2,.75,.25,1)] [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
                <article className="absolute inset-0 overflow-hidden rounded-[1.8rem] border border-white bg-[#f7faf7] shadow-[0_28px_55px_-20px_rgba(6,75,54,.55)] [backface-visibility:hidden]">
                  <div className="relative h-[64%] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#f7fbef,#dce9df)]"><img src={logoUrl} alt="A2G company logo" className="absolute right-5 top-5 z-10 h-9 w-24 rounded-xl bg-white/95 p-2 shadow-lg" />{photoUrl ? <img src={photoUrl} alt={`${displayName} profile`} className="h-full w-full object-contain object-center" /> : <div className="flex h-full flex-col items-center justify-center"><span className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-[#064b36] text-5xl font-black text-white shadow-xl">{initials(displayName)}</span><p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#426355]">Add your portrait</p></div>}<label className="absolute bottom-4 left-4 z-20 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-[11px] font-black text-[#064b36] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#bfff2f]">{uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}{uploading ? "Uploading" : photoUrl ? "Change photo" : "Upload photo"}<input disabled={uploading} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhoto} /></label></div>
                  <div className="relative flex h-[36%] flex-col bg-[#10231d] px-7 pb-6 pt-6 text-white"><div className="absolute -top-9 left-0 h-10 w-[70%] bg-[#10231d] [clip-path:polygon(0_80%,82%_80%,100%_100%,0_100%)]" /><p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#bfff2f]">Official employee</p><h1 className="mt-2 text-3xl font-black leading-tight">{displayName}</h1><p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100">{show(user.designation || user.role)}</p><div className="mt-auto border-t border-white/15 pt-3"><p className="text-[8px] font-black uppercase tracking-widest text-emerald-200/60">Employee code</p><p className="mt-1 font-mono text-sm font-black">{employeeCode}</p></div></div>
                </article>
                <article className="absolute inset-0 overflow-hidden rounded-[1.8rem] border border-white bg-[#fffdf5] shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]"><div className="h-2 bg-[#bfff2f]" /><div className="flex h-[calc(100%-0.5rem)] flex-col p-6"><div className="flex items-center justify-between"><img src={logoUrl} alt="A2G company logo" className="h-9 w-20 object-contain" /><BadgeCheck className="text-[#064b36]" /></div><h2 className="mt-6 text-xl font-black text-[#15372b]">Employee details</h2><div className="mt-5 space-y-4">{[[Mail,"Email",user.email],[BriefcaseBusiness,"Department",user.department],[UsersRound,"Team",user.teamName],[UserRound,"Manager",user.managerName || user.managerEmail]].map(([Icon,label,value]) => <div key={label} className="flex items-center gap-3 border-b border-slate-200 pb-3"><Icon size={16} className="shrink-0 text-[#0b5d43]" /><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-bold text-[#15372b]">{show(value)}</p></div></div>)}</div><div className="mt-auto font-mono text-xs font-black text-[#064b36]">{employeeCode}</div></div></article>
              </div>
            </div>
            <button type="button" onClick={() => setFlipped((current) => !current)} className="group mt-6 inline-flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/90 px-4 py-3 text-left shadow-[0_12px_30px_-12px_rgba(6,75,54,.65)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#064b36] text-[#bfff2f] transition duration-500 group-hover:[transform:rotateY(180deg)]"><FlipHorizontal2 size={19} /></span><span><span className="block text-xs font-black text-[#15372b]">{flipped ? "Show card front" : "Flip ID card"}</span><span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">{flipped ? "Return to identity" : "View employee details"}</span></span></button>
          </div>
        </aside>

        <main className="min-w-0 bg-[radial-gradient(circle_at_90%_0%,#e4f7dd,transparent_30%),#f8faf9] p-5 sm:p-8 lg:p-10">
          <header className="mb-7 overflow-hidden rounded-[2rem] bg-[#064b36] p-6 text-white shadow-xl shadow-emerald-900/15 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#bfff2f]">Employee workspace</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Welcome, {displayName} <span className="text-emerald-200">to Your Profile</span></h2><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">Manage your personal information, keep emergency details current, and preview your digital employee identity.</p></header>
          <section className="rounded-3xl border border-emerald-900/10 bg-white/90 p-5 shadow-[0_18px_45px_-30px_rgba(6,75,54,.5)] backdrop-blur sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[[Mail,user.email],[Phone,user.mobileNumber || user.workNumber],[MapPin,user.location],[IdCard,employeeCode]].map(([Icon,value], index) => <div key={index} className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0b5d43]"><Icon size={18} /></span><p className="truncate text-sm font-bold text-[#15372b]">{show(value)}</p></div>)}</div>
            <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2"><InfoValue label="Department" value={user.department} /><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Reporting manager</p><div className="mt-2 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8ac567] text-xs font-black text-white">{initials(user.managerName || user.managerEmail || "NA")}</span><p className="text-sm font-bold text-[#0b5d43]">{show(user.managerName || user.managerEmail)}</p></div></div></div>
          </section>

          <nav className="mt-7 inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" aria-label="Profile sections">{[["about","About",CreditCard],["profile","Profile",UserRound]].map(([value,label,Icon]) => <button key={value} type="button" onClick={() => setActiveTab(value)} className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition-all duration-300 ${activeTab === value ? "scale-[1.02] bg-[#064b36] text-white shadow-lg shadow-emerald-900/20" : "text-slate-400 hover:bg-emerald-50 hover:text-[#064b36]"}`}><Icon size={17} />{label}</button>)}</nav>
          {message ? <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}

          {activeTab === "about" ? <div className="mt-6 space-y-6"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-2xl font-black text-[#15372b]">Primary Details</h3><div className="mt-6 grid gap-x-12 gap-y-7 sm:grid-cols-2">{profileFields.primary.filter(([field]) => field !== "displayName").map(([field,label,type]) => <InfoValue key={field} label={label} value={field === "dateOfBirth" ? primaryReadOnly.dateOfBirth : type === "select" ? titleCase(user[field]) : user[field]} />)}</div></section><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-2xl font-black text-[#15372b]">Emergency Details</h3><div className="mt-6 grid gap-7 sm:grid-cols-2"><InfoValue label="Emergency contact name" value={user.emergencyContactName} /><InfoValue label="Emergency contact number" value={user.emergencyContactNumber} /></div></section></div> : null}

          {activeTab === "profile" ? <div className="mt-6 grid gap-6 lg:grid-cols-2"><EditablePanel title="Primary Details" section="primary" fields={profileFields.primary} form={form} editing={editing === "primary"} onEdit={setEditing} onCancel={cancelEdit} onChange={(field,value) => setForm((current) => ({ ...current, [field]: value }))} onSave={saveSection} saving={saving} readOnlyValues={primaryReadOnly} /><EditablePanel title="Contact Details" section="contact" fields={profileFields.contact} form={form} editing={editing === "contact"} onEdit={setEditing} onCancel={cancelEdit} onChange={(field,value) => setForm((current) => ({ ...current, [field]: value }))} onSave={saveSection} saving={saving} readOnlyValues={{ personalEmail: user.personalEmail }} /><div className="lg:col-span-2"><EditablePanel title="Emergency Details" section="emergency" fields={profileFields.emergency} form={form} editing={editing === "emergency"} onEdit={setEditing} onCancel={cancelEdit} onChange={(field,value) => setForm((current) => ({ ...current, [field]: value }))} onSave={saveSection} saving={saving} /></div></div> : null}
        </main>
      </div>
    </section>
  );
}

export default EmployeeIdCard;
