import { BadgeCheck, BriefcaseBusiness, Camera, FlipHorizontal2, Loader2, Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getProfilePhoto, uploadProfilePhoto } from "../services/api";

const logoUrl = "https://aagarg.in/wp-content/uploads/2025/05/A2G-New-Logo-Black.avif";
const fallback = (value) => value || "Not added";
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function DetailRow({ icon: Icon, label, value }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/80 p-3.5 shadow-sm"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf7df] text-[#064b36]"><Icon size={17} /></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-black text-[#15372b]">{fallback(value)}</p></div></div>;
}

function EmployeeIdCard({ user, onUserUpdated }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const employeeCode = user.employeeCode || `A2G-${String(user.id || "000000").slice(-6).toUpperCase()}`;

  useEffect(() => {
    let active = true;
    if (user.hasProfilePhoto) getProfilePhoto().then((blob) => { if (active) setPhotoUrl(URL.createObjectURL(blob)); }).catch(() => { if (active) setMessage("Saved profile photo could not be loaded."); });
    return () => { active = false; };
  }, [user.hasProfilePhoto]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  async function handlePhoto(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setMessage("Choose a JPG, PNG or WebP image.");
    if (file.size > 4 * 1024 * 1024) return setMessage("Profile photo must be 4 MB or smaller.");
    setUploading(true); setMessage("");
    const body = new FormData(); body.append("photo", file);
    try {
      await uploadProfilePhoto(body); setPhotoUrl(URL.createObjectURL(file));
      onUserUpdated?.((current) => ({ ...current, hasProfilePhoto: true }));
      setMessage("Profile photo updated successfully.");
    } catch (error) { setMessage(error.response?.data?.message || "Could not upload profile photo."); }
    finally { setUploading(false); }
  }

  function toggleCard(event) {
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    if (event.type === "keydown") event.preventDefault();
    setFlipped((current) => !current);
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#f8f4ea] via-[#eef7e7] to-[#dff0dd] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#bfff2f]/25 blur-3xl" /><div className="absolute -right-24 -top-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-10 xl:grid-cols-[430px_1fr] xl:items-center">
        <div className="mx-auto w-full max-w-[390px]">
          <div className="mx-auto mb-[-9px] h-8 w-28 rounded-t-[1.2rem] bg-[#112d24] shadow-lg"><div className="mx-auto h-full w-12 rounded-full border-[7px] border-[#d4ddd7] bg-[#f8f4ea]" /></div>
          <div className="group [perspective:1800px]" role="button" tabIndex={0} aria-label="Employee ID card. Hover, click or press Enter to flip." onClick={toggleCard} onKeyDown={toggleCard}>
            <div className={`relative aspect-[3/4.65] w-full transition-transform duration-700 ease-[cubic-bezier(.2,.75,.25,1)] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}>
              <article className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white bg-[#f7faf7] shadow-[0_30px_70px_-25px_rgba(6,75,54,.55)] [backface-visibility:hidden]">
                <div className="relative h-[61%] overflow-hidden bg-gradient-to-br from-[#eef4ef] to-[#dfe9e2]">
                  <div className="absolute right-5 top-5 z-10 rounded-xl bg-white/90 p-2.5 shadow-lg backdrop-blur"><img src={logoUrl} alt="A2G company logo" className="h-8 w-20 object-contain" /></div>
                  {photoUrl ? <img src={photoUrl} alt={`${user.name} profile`} className="h-full w-full object-cover object-top" /> : <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#d7f2c2,transparent_42%),linear-gradient(145deg,#edf4ee,#d8e5dc)]"><span className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-[#064b36] text-5xl font-black text-white shadow-xl">{initials(user.name)}</span><p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#426355]">Add your portrait</p></div>}
                  <label className="absolute bottom-4 left-4 z-10 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2.5 text-xs font-black text-[#064b36] shadow-lg transition hover:bg-[#bfff2f]" onClick={(event) => event.stopPropagation()}>{uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}{uploading ? "Uploading..." : photoUrl ? "Change photo" : "Upload photo"}<input disabled={uploading} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhoto} /></label>
                </div>
                <div className="relative flex h-[39%] flex-col bg-[#10231d] px-7 pb-6 pt-7 text-white">
                  <div className="absolute -top-10 left-0 h-12 w-[67%] bg-[#10231d] [clip-path:polygon(0_83%,82%_83%,100%_100%,0_100%)]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#bfff2f]">Official employee</p><h1 className="mt-2 text-3xl font-black leading-tight tracking-tight">{user.name}</h1><p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">{fallback(user.designation || user.role)}</p>
                  <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/15 pt-4"><div><p className="text-[9px] font-black uppercase tracking-widest text-emerald-200/60">Employee code</p><p className="mt-1 font-mono text-sm font-black">{employeeCode}</p></div><span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100/70"><FlipHorizontal2 size={13} />Flip</span></div>
                </div>
              </article>
              <article className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/60 bg-[#f8f4ea] shadow-[0_30px_70px_-25px_rgba(6,75,54,.55)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="h-2.5 bg-[#bfff2f]" /><div className="flex h-[calc(100%-0.625rem)] flex-col p-7">
                  <header className="flex items-center justify-between gap-4"><img src={logoUrl} alt="A2G company logo" className="h-10 w-24 object-contain object-left" /><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[#064b36]"><BadgeCheck size={13} />Verified</span></header>
                  <div className="mt-7"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0b5d43]">Employee information</p><h2 className="mt-2 text-2xl font-black text-[#15372b]">{user.name}</h2></div>
                  <div className="mt-5 grid gap-3"><DetailRow icon={Mail} label="Email" value={user.email} /><DetailRow icon={BriefcaseBusiness} label="Department" value={user.department} /><DetailRow icon={UsersRound} label="Team name" value={user.teamName} /><DetailRow icon={UserRound} label="Manager" value={user.managerName || user.managerEmail} /></div>
                  <div className="mt-auto flex items-end justify-between border-t border-emerald-900/10 pt-5"><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Employee code</p><p className="mt-1 font-mono text-sm font-black text-[#15372b]">{employeeCode}</p></div><ShieldCheck className="text-[#064b36]" size={30} /></div>
                </div>
              </article>
            </div>
          </div>
        </div>
        <div className="rounded-[2.25rem] border border-white/80 bg-white/75 p-6 shadow-xl backdrop-blur sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf7df] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#064b36]"><BadgeCheck size={16} />Digital employee identity</span>
          <h2 className="mt-6 max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-[#15372b] sm:text-5xl">Your identity,<br /><span className="text-[#0b7a54]">beautifully presented.</span></h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">Upload a clear portrait and your official card updates instantly. Hover over the card—or tap it on mobile—to reveal your workplace details.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">{[["Identity", user.designation || user.role], ["Team", user.teamName || "General"], ["Account", user.status]].map(([label, value]) => <div key={label} className="rounded-2xl border border-emerald-900/10 bg-[#f7faef] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-[#0b5d43]">{label}</p><p className="mt-2 truncate text-sm font-black capitalize text-[#15372b]">{value}</p></div>)}</div>
          {message ? <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}

export default EmployeeIdCard;
