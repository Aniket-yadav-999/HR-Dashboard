import { BadgeCheck, BriefcaseBusiness, CalendarDays, Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { formatDate } from "../utils/employeeStats";

const logoUrl = "https://aagarg.in/wp-content/uploads/2025/05/A2G-New-Logo-Black.avif";
const fallback = (value) => value || "Not added";
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const pixelBackground = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='680' viewBox='0 0 480 680'%3E%3Cdefs%3E%3ClinearGradient id='g' x2='1' y2='1'%3E%3Cstop stop-color='%23001862'/%3E%3Cstop offset='.48' stop-color='%230d55ff'/%3E%3Cstop offset='1' stop-color='%23bad8ff'/%3E%3C/linearGradient%3E%3Cpattern id='p' width='44' height='44' patternUnits='userSpaceOnUse'%3E%3Crect width='44' height='44' fill='none' stroke='%23ffffff' stroke-opacity='.09'/%3E%3C/pattern%3E%3CradialGradient id='r' cx='.58' cy='.38' r='.7'%3E%3Cstop stop-color='%23e8f4ff' stop-opacity='.9'/%3E%3Cstop offset='.35' stop-color='%235c9aff' stop-opacity='.62'/%3E%3Cstop offset='1' stop-color='%23001d81' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='480' height='680' fill='url(%23g)'/%3E%3Crect width='480' height='680' fill='url(%23r)'/%3E%3Crect width='480' height='680' fill='url(%23p)'/%3E%3C/svg%3E")`;

function Barcode() {
  return <div className="flex h-11 items-stretch gap-[3px]">{[2,4,1,3,2,1,4,2,3,1,2,4,1,3].map((width, index) => <span key={index} className="bg-[#102d24]" style={{ width }} />)}</div>;
}

function EmployeeIdCard({ user }) {
  const employeeId = `A2G-${String(user.id || "000000").slice(-6).toUpperCase()}`;
  const details = [
    ["Email", user.email, Mail], ["Department", user.department, BriefcaseBusiness], ["Team", user.teamName, UsersRound],
    ["Manager", user.managerName || user.managerEmail, UserRound], ["Joined", user.joinedAt ? formatDate(user.joinedAt) : "Not added", CalendarDays],
    ["Role", user.role, ShieldCheck]
  ];

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-[#eef4e5] p-5 sm:p-8 lg:p-12">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#bfff2f]/30 blur-3xl" />
      <div className="relative grid gap-9 xl:grid-cols-[430px_1fr] xl:items-center">
        <div className="group mx-auto w-full max-w-[410px] [perspective:1500px]" tabIndex={0} aria-label="Employee ID card. Hover or focus to flip.">
          <div className="relative aspect-[3/4.35] w-full transition-transform duration-700 ease-[cubic-bezier(.2,.75,.25,1)] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus:[transform:rotateY(180deg)]">
            <article className="absolute inset-0 overflow-hidden rounded-[2.2rem] border border-white/40 text-white shadow-2xl shadow-blue-950/35 [backface-visibility:hidden]" style={{ backgroundImage: pixelBackground, backgroundPosition: "center", backgroundSize: "cover" }}>
              <div className="absolute inset-0 bg-gradient-to-b from-[#00145c]/10 via-transparent to-[#00103f]/80" />
              <div className="relative flex h-full flex-col p-7 sm:p-8">
                <header className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-white p-3 shadow-lg"><img src={logoUrl} alt="A2G company logo" className="h-10 w-24 object-contain" /></div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-[9px] font-black uppercase tracking-widest ring-1 ring-white/30 backdrop-blur"><BadgeCheck size={12} />{user.status}</span>
                </header>
                <div className="mt-auto">
                  <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[1.7rem] border-4 border-white/70 bg-[#061a35]/80 text-3xl font-black shadow-[8px_8px_0_#bfff2f] backdrop-blur">{initials(user.name)}</div>
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-[#bfff2f]">Official employee</p>
                  <h1 className="mt-3 text-5xl font-black leading-[0.9] tracking-tight sm:text-6xl">{user.name}</h1>
                  <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-blue-100">{fallback(user.designation)}</p>
                  <div className="mt-7 flex items-end justify-between gap-4 border-t border-white/35 pt-5"><div><p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Employee ID</p><p className="mt-1 font-mono text-sm font-bold">{employeeId}</p></div><p className="text-right text-[9px] font-bold uppercase tracking-widest text-blue-100">Hover to<br />view details</p></div>
                </div>
              </div>
            </article>

            <article className="absolute inset-0 overflow-hidden rounded-[2.2rem] border border-slate-200 bg-[#fffdf3] shadow-2xl shadow-emerald-950/25 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="h-3 bg-[#bfff2f]" />
              <div className="flex h-[calc(100%-0.75rem)] flex-col p-7 sm:p-8">
                <header className="flex items-start justify-between"><img src={logoUrl} alt="A2G company logo" className="h-11 w-24 object-contain object-left" /><span className="rounded-full bg-[#064b36] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white">Employee details</span></header>
                <div className="mt-6 grid gap-3">
                  {details.map(([label, value, Icon]) => <div key={label} className="flex items-center gap-3 border-b border-slate-200 pb-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff6df] text-[#064b36]"><Icon size={16} /></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-black capitalize text-[#15372b]">{fallback(value)}</p></div></div>)}
                </div>
                <div className="mt-auto flex items-end justify-between gap-5 border-t-2 border-[#064b36] pt-5"><div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Credential</p><p className="mt-1 font-mono text-sm font-black text-[#15372b]">{employeeId}</p><p className="mt-1 max-w-[190px] truncate text-[10px] text-slate-500">{user.email}</p></div><Barcode /></div>
              </div>
            </article>
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-white bg-white/90 p-6 shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#064b36]">A2G digital credential</p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#15372b]">One card.<br />Two useful sides.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">Card par hover karein—smooth 3D flip ke saath complete employee details milengi. Keyboard users card ko focus karke bhi flip kar sakte hain.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">{[["Front", "Identity & designation"], ["Back", "Organization details"], ["Status", user.status]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#f4f8ec] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-[#064b36]">{label}</p><p className="mt-2 text-sm font-black capitalize text-[#15372b]">{value}</p></div>)}</div>
        </div>
      </div>
    </section>
  );
}

export default EmployeeIdCard;
