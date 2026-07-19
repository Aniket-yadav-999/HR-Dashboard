import { BadgeCheck, BriefcaseBusiness, CalendarDays, Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { formatDate } from "../utils/employeeStats";

const logoUrl = "https://aagarg.in/wp-content/uploads/2025/05/A2G-New-Logo-Black.avif";
const fallback = (value) => value || "Not added";
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function EmployeeIdCard({ user }) {
  const details = [
    ["Email", user.email, Mail], ["Department", user.department, BriefcaseBusiness], ["Team", user.teamName, UsersRound],
    ["Manager", user.managerName || user.managerEmail, UserRound], ["Joining date", user.joinedAt ? formatDate(user.joinedAt) : "Not added", CalendarDays],
    ["Role", user.role, ShieldCheck]
  ];

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-[#eef4e5] p-5 sm:p-8 lg:p-12">
      <div className="absolute -right-28 top-10 h-72 w-72 rounded-full bg-[#bfff2f]/40 blur-3xl" />
      <div className="relative grid gap-8 xl:grid-cols-[390px_1fr] xl:items-center">
        <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2.5rem] border border-white/70 bg-[#fffdf3] shadow-2xl shadow-emerald-950/20">
          <div className="relative p-7 pb-0">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[5rem] bg-[#bfff2f]" />
            <div className="relative flex items-start justify-between">
              <img src={logoUrl} alt="A2G company logo" className="h-14 w-28 object-contain object-left" />
              <span className="mt-14 inline-flex items-center gap-1 rounded-full bg-[#064b36] px-3 py-1.5 text-[10px] font-black capitalize text-white"><BadgeCheck size={12} />{user.status}</span>
            </div>
            <div className="mt-5 grid grid-cols-[5px_1fr] gap-4">
              <div className="rounded-full bg-[#064b36]" />
              <div>
                <div className="relative overflow-hidden rounded-[2rem] bg-[#bfff2f] p-3 shadow-xl">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border-[12px] border-white/35" />
                  <div className="relative flex aspect-[4/3] items-center justify-center rounded-[1.5rem] bg-[#082437] text-6xl font-black tracking-tight text-white">{initials(user.name)}</div>
                </div>
                <h1 className="mt-6 border-b-4 border-[#bfff2f] pb-2 text-3xl font-black leading-tight text-[#102d24]">{user.name}</h1>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{fallback(user.designation)}</p>
              </div>
            </div>
          </div>
          <div className="mt-7 bg-[#064b36] px-7 py-6 text-white">
            <div className="grid grid-cols-[1fr_auto] items-end gap-5">
              <div><p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#bfff2f]">Employee ID</p><p className="mt-1 font-mono text-sm font-bold">A2G-{String(user.id || "000000").slice(-6).toUpperCase()}</p><p className="mt-3 text-xs text-white/70">{user.email}</p></div>
              <div className="flex h-12 items-end gap-1" aria-label="Employee barcode">{[2,1,3,1,2,4,1,3,2,1,4,2].map((width, index) => <span key={index} className="h-full bg-white" style={{ width }} />)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white bg-white/90 p-6 shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#064b36]">A2G People Suite</p>
          <h2 className="mt-3 text-3xl font-black text-[#15372b]">Employee identity & profile</h2>
          <p className="mt-2 text-sm text-slate-500">Official organization details linked to your secure employee account.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {details.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-slate-100 bg-[#f7f9f3] p-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><span className="rounded-xl bg-[#bfff2f] p-2 text-[#064b36]"><Icon size={16} /></span>{label}</div><p className="mt-3 break-words text-sm font-black capitalize text-[#15372b]">{fallback(value)}</p></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmployeeIdCard;
