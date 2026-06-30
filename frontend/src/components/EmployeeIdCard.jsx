import { BadgeCheck, BriefcaseBusiness, CalendarDays, Mail, MapPin, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { formatDate } from "../utils/employeeStats";

function valueOrFallback(value) {
  return value || "Not added";
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function EmployeeIdCard({ user }) {
  const details = [
    { label: "Email", value: user.email, icon: Mail },
    { label: "Designation", value: user.designation, icon: BriefcaseBusiness },
    { label: "Department", value: user.department, icon: MapPin },
    { label: "Team", value: user.teamName, icon: UsersRound },
    { label: "Role", value: user.role, icon: ShieldCheck },
    { label: "Manager", value: user.managerName || user.managerEmail, icon: UserRound },
    { label: "Joining Date", value: user.joinedAt ? formatDate(user.joinedAt) : "Not added", icon: CalendarDays },
    { label: "Birth Date", value: user.dateOfBirth ? formatDate(user.dateOfBirth) : "Not added", icon: CalendarDays },
    { label: "Status", value: user.status, icon: BadgeCheck }
  ];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
        <div className="grid xl:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[520px] overflow-hidden bg-[#064b36] p-8 text-white">
            <div className="absolute -left-20 top-20 h-80 w-80 rounded-full bg-[#bfff2f]/20 blur-3xl" />
            <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute inset-x-8 bottom-8 h-24 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#bfff2f]">Employee Profile</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-black capitalize ring-1 ring-white/20">
                  <BadgeCheck size={15} />
                  {user.status}
                </span>
              </div>

              <div className="py-12 text-center">
                <div className="mx-auto w-fit rounded-[2rem] bg-[#bfff2f] p-3 shadow-2xl shadow-emerald-950/30">
                  <div
                    className="flex h-32 w-32 items-center justify-center rounded-[1.65rem] text-4xl font-black text-white ring-4 ring-white/25"
                    style={{ backgroundColor: user.avatarColor || "#2563eb" }}
                  >
                    {getInitials(user.name)}
                  </div>
                </div>
                <h1 className="mt-7 text-4xl font-black tracking-tight">{user.name}</h1>
                <p className="mt-2 text-sm font-bold text-emerald-50/80">{valueOrFallback(user.designation)}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-black ring-1 ring-white/15">{valueOrFallback(user.department)}</span>
                  <span className="rounded-full bg-[#bfff2f] px-4 py-2 text-sm font-black capitalize text-[#064b36]">{valueOrFallback(user.role)}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Team", valueOrFallback(user.teamName)],
                  ["Joined", user.joinedAt ? formatDate(user.joinedAt) : "Not added"],
                  ["Manager", valueOrFallback(user.managerName || user.managerEmail)]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#bfff2f]">{label}</p>
                    <p className="mt-2 truncate text-xs font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-[#f8faf7] p-6 lg:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#bfff2f]/25 blur-3xl" />
            <div className="relative">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.26em] text-[#064b36]">Profile Details</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-[#15372b]">Employee information</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">A clean identity card for reporting, team, and lifecycle details.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-[#064b36] px-4 py-3 text-sm font-black capitalize text-white shadow-lg shadow-emerald-900/15">
                  <BadgeCheck size={18} />
                  {user.status}
                </div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {details.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                      <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#bfff2f] text-[#064b36]">
                          <Icon size={17} />
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <p className="mt-4 break-words text-sm font-black capitalize text-[#15372b]">{valueOrFallback(item.value)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmployeeIdCard;
