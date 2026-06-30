import {
  ArrowRight,
  Bell,
  CalendarDays,
  CakeSlice,
  CheckCircle2,
  Headphones,
  Laptop,
  Package,
  UserRoundPlus,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAssets, getAttendance, getEngagementItems, getHelpdeskTickets, getNotifications } from "../services/api";
import { formatDate } from "../utils/employeeStats";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function dateParts(value) {
  const date = new Date(value);
  return { day: date.getUTCDate(), month: date.getUTCMonth(), year: date.getUTCFullYear() };
}

function birthdayThisYear(value) {
  const parts = dateParts(value);
  return new Date(new Date().getFullYear(), parts.month, parts.day);
}

function daysUntil(value) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const birthday = birthdayThisYear(value);
  const candidate = birthday < base ? new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate()) : birthday;
  return Math.round((candidate - base) / 86400000);
}

function KpiCard({ color, icon: Icon, label, sublabel, value }) {
  return (
    <article className="relative min-h-28 overflow-hidden rounded-3xl p-5 text-white shadow-xl" style={{ backgroundColor: color }}>
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute bottom-0 right-0 h-16 w-32 rounded-tl-full bg-white/10" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-black text-white/85">{label}</p>
          <h3 className="mt-3 text-4xl font-black">{value}</h3>
          <p className="mt-2 text-xs font-bold text-white/70">{sublabel}</p>
        </div>
        <span className="rounded-2xl bg-white/14 p-3 ring-1 ring-white/20">
          <Icon size={22} />
        </span>
      </div>
    </article>
  );
}

function Panel({ action, children, className = "", title, subtitle }) {
  return (
    <section className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-xl font-black text-[#15372b]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? (
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-[#064b36] hover:bg-[#eff6df]" type="button">
            {action}
            <ArrowRight size={14} />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ReportsAnalytics({ currentUser, users = [] }) {
  const [attendance, setAttendance] = useState([]);
  const [assets, setAssets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [engagement, setEngagement] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    setLoading(true);

    try {
      const [attendanceData, assetData, ticketData, engagementData, notificationData] = await Promise.all([
        getAttendance(),
        getAssets(),
        getHelpdeskTickets(),
        getEngagementItems(),
        getNotifications()
      ]);
      setAttendance(attendanceData);
      setAssets(assetData);
      setTickets(ticketData);
      setEngagement(engagementData);
      setNotifications(notificationData);
    } catch {
      setAttendance([]);
      setAssets([]);
      setTickets([]);
      setEngagement([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", weekday: "long" });
  const activeUsers = users.filter((user) => user.status === "active");
  const newJoiners = users.filter((user) => {
    const joinedAt = new Date(user.joinedAt);
    return joinedAt.getMonth() === today.getMonth() && joinedAt.getFullYear() === today.getFullYear();
  });
  const todayAttendance = attendance.filter((record) => new Date(record.date).toDateString() === today.toDateString());
  const presentCount = todayAttendance.filter((record) => record.type === "present").length;
  const openTickets = tickets.filter((ticket) => ["open", "in_progress"].includes(ticket.status)).length;
  const birthdayToday = users.filter((user) => {
    if (!user.dateOfBirth) {
      return false;
    }
    const parts = dateParts(user.dateOfBirth);
    return parts.day === today.getDate() && parts.month === today.getMonth();
  });
  const upcomingBirthdays = users
    .filter((user) => user.dateOfBirth && daysUntil(user.dateOfBirth) >= 0)
    .sort((first, second) => daysUntil(first.dateOfBirth) - daysUntil(second.dateOfBirth))
    .slice(0, 4);

  const attendanceMix = [
    ["Present", presentCount, "#66bb5a"],
    ["Work From Home", todayAttendance.filter((record) => record.type === "work_from_home").length, "#3b82f6"],
    ["On Leave", todayAttendance.filter((record) => ["paid_leave", "sick_leave"].includes(record.type)).length, "#f59e0b"],
    ["Absent", Math.max(0, activeUsers.length - todayAttendance.length), "#ef4444"]
  ];

  const assetCounts = ["laptop", "desktop", "accessory", "mouse", "other"].map((category) => [
    category.charAt(0).toUpperCase() + category.slice(1),
    assets.filter((asset) => asset.category === category).length
  ]);

  const ticketRows = [
    ["Open", tickets.filter((ticket) => ticket.status === "open").length, "#8b3a78"],
    ["In Progress", tickets.filter((ticket) => ticket.status === "in_progress").length, "#f59e0b"],
    ["Resolved", tickets.filter((ticket) => ticket.status === "resolved").length, "#22c55e"],
    ["Closed", tickets.filter((ticket) => ticket.status === "closed").length, "#64748b"]
  ];

  const topManager = users.find((user) => user.role === "admin") || users.find((user) => user.role === "manager") || users[0];
  const directReports = topManager ? users.filter((user) => user.managerEmail === topManager.email).slice(0, 4) : [];

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-[#064b36] p-8 text-white shadow-2xl shadow-emerald-900/25">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(191,255,47,0.22),transparent_55%)]" />
        <div className="absolute right-8 top-5 hidden text-white/20 lg:block">
          <UsersRound size={132} strokeWidth={1.2} />
        </div>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-black">AAGarg HR Command Center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">Your central hub for people, operations, and workplace excellence.</p>
          </div>
          <button onClick={loadReports} className="inline-flex w-fit items-center gap-2 rounded-2xl bg-[#bfff2f] px-5 py-3 text-sm font-black text-[#064b36] shadow-lg shadow-emerald-950/20" type="button">
            <CalendarDays size={18} className={loading ? "animate-pulse" : ""} />
            {todayLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard color="#064b36" icon={UsersRound} label="Workforce Snapshot" sublabel="Total Employees" value={activeUsers.length} />
        <KpiCard color="#123c69" icon={CalendarDays} label="Leave Balance" sublabel="Paid / Sick Leave" value="28 / 13" />
        <KpiCard color="#5d3b09" icon={CakeSlice} label="Birthday Today" sublabel={birthdayToday[0]?.name || "No birthdays"} value={birthdayToday.length} />
        <KpiCard color="#4a2f73" icon={UserRoundPlus} label="New Joiners" sublabel="This Month" value={newJoiners.length} />
        <KpiCard color="#064b36" icon={Headphones} label="Open Tickets" sublabel="Need Attention" value={openTickets} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr_0.75fr]">
        <Panel action="View All" title="Employee Directory" subtitle="Latest employees in the organization.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-black">Employee</th>
                  <th className="px-5 py-4 font-black">Department</th>
                  <th className="px-5 py-4 font-black">Role</th>
                  <th className="px-5 py-4 font-black">Status</th>
                  <th className="px-5 py-4 font-black">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.slice(0, 5).map((user) => (
                  <tr key={user.id} className="hover:bg-[#eff6df]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white" style={{ backgroundColor: user.avatarColor || "#064b36" }}>{getInitials(user.name)}</span>
                        <div>
                          <p className="font-black text-[#15372b]">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{user.department}</td>
                    <td className="px-5 py-4 capitalize text-slate-600">{user.role}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{user.status}</span></td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(user.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Attendance Summary" subtitle="Today's attendance overview">
          <div className="grid gap-5 p-5 sm:grid-cols-[0.8fr_1fr] sm:items-center">
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#66bb5a_0_65%,#e5e7eb_65%_100%)]">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-black text-[#15372b]">{todayAttendance.length}</span>
                <span className="text-xs font-bold text-slate-500">Total</span>
              </div>
            </div>
            <div className="space-y-3">
              {attendanceMix.map(([label, value, color]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 font-bold text-slate-600"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />{label}</span>
                  <span className="font-black text-[#15372b]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel action="View All" title="Upcoming Birthdays">
          <div className="divide-y divide-slate-100">
            {upcomingBirthdays.map((user) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#bfff2f] text-xs font-black text-[#064b36]">{getInitials(user.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#15372b]">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.designation}</p>
                </div>
                <span className="rounded-full bg-[#eff6df] px-3 py-1 text-xs font-black text-[#064b36]">{formatDate(birthdayThisYear(user.dateOfBirth))}</span>
              </div>
            ))}
            {!upcomingBirthdays.length ? <p className="px-5 py-10 text-center text-sm font-bold text-slate-500">No upcoming birthdays.</p> : null}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr_0.65fr_0.85fr]">
        <Panel action="View Org Chart" title="Organization Structure" subtitle="Top of the organization">
          <div className="p-5">
            {topManager ? (
              <div className="flex flex-col items-center">
                <div className="rounded-2xl bg-[#eff6df] px-8 py-4 text-center">
                  <p className="font-black text-[#15372b]">{topManager.name}</p>
                  <p className="text-xs text-slate-500">{topManager.designation}</p>
                </div>
                {directReports.length ? (
                  <>
                    <div className="h-8 w-px bg-slate-300" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {directReports.map((user) => (
                        <div key={user.id} className="rounded-2xl bg-rose-50 px-4 py-3 text-center">
                          <p className="text-sm font-black text-[#15372b]">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.designation}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : <p className="text-sm font-bold text-slate-500">No organization data yet.</p>}
          </div>
        </Panel>

        <Panel action="View All" title="Asset Register" subtitle="Organization assets overview">
          <div className="divide-y divide-slate-100">
            {assetCounts.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between px-5 py-4">
                <span className="inline-flex items-center gap-3 text-sm font-black text-[#15372b]"><Package size={18} className="text-[#064b36]" />{label}</span>
                <span className="font-black text-[#064b36]">{count}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel action="View All" title="Ticket Desk" subtitle="Helpdesk ticket summary">
          <div className="divide-y divide-slate-100">
            {ticketRows.map(([label, count, color]) => (
              <div key={label} className="flex items-center justify-between px-5 py-4">
                <span className="inline-flex items-center gap-3 text-sm font-black text-[#15372b]"><span className="h-8 w-8 rounded-xl" style={{ backgroundColor: color }} />{label}</span>
                <span className="font-black text-[#064b36]">{count}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel action="View All" title="Recent Notifications">
          <div className="divide-y divide-slate-100">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#064b36] text-white"><Bell size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-600">{notification.message}</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{new Date(notification.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
            {!notifications.length ? <p className="px-5 py-10 text-center text-sm font-bold text-slate-500">No notifications yet.</p> : null}
          </div>
        </Panel>
      </div>
    </section>
  );
}

export default ReportsAnalytics;
