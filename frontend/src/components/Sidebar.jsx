import { BarChart3, Bell, CalendarDays, ChevronLeft, ChevronRight, Headphones, HeartHandshake, Laptop, Network } from "lucide-react";

const items = [
  { label: "Overview", value: "overview", icon: BarChart3 },
  { label: "Reports & Analytics", value: "reports", icon: BarChart3 },
  { label: "Attendance & Leave", value: "attendance", icon: CalendarDays },
  { label: "Employee Engagement", value: "engagement", icon: HeartHandshake },
  { label: "AAGarg Organization", value: "organization", icon: Network },
  { label: "Asset Management", value: "assets", icon: Laptop, roles: ["admin", "hr"] },
  { label: "Helpdesk & Requests", value: "helpdesk", icon: Headphones },
  { label: "Notifications", value: "notifications", icon: Bell }
];

function Sidebar({ collapsed, activeView, onViewChange, onToggle, currentUser }) {
  const visibleItems = items.filter((item) => !item.roles || item.roles.includes(currentUser?.role));

  return (
    <aside
      className={`fixed bottom-0 left-0 top-0 z-40 hidden border-r border-emerald-950 bg-[#064b36] px-3 py-5 shadow-2xl shadow-emerald-950/25 transition-all duration-300 lg:block ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <button
        onClick={onToggle}
        className="absolute -right-4 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-[#bfff2f] bg-[#bfff2f] text-[#064b36] shadow-lg shadow-emerald-950/20 transition hover:scale-105"
        type="button"
        aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className={`mb-8 mt-12 rounded-3xl border border-emerald-400/20 bg-[#0b5d43] px-3 py-4 shadow-lg shadow-emerald-950/15 ${collapsed ? "text-center" : ""}`}>
        {!collapsed ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#bfff2f]">Workspace</p>
            <h1 className="mt-2 text-xl font-black text-white">HR Dashboard</h1>
            <p className="mt-2 text-xs font-semibold text-emerald-50/75">People operations suite</p>
          </>
        ) : null}
      </div>

      <nav className="space-y-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => onViewChange(item.value)}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition duration-300 ${
                activeView === item.value
                  ? "bg-white text-[#064b36] shadow-xl shadow-emerald-950/20 ring-1 ring-[#bfff2f]"
                  : "border border-emerald-400/20 bg-[#0b5d43] text-emerald-50 shadow-sm shadow-emerald-950/10 hover:-translate-y-0.5 hover:bg-[#11724f] hover:text-white hover:shadow-lg hover:shadow-emerald-950/20"
              } ${collapsed ? "justify-center" : ""}`}
              type="button"
              title={item.label}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${activeView === item.value ? "bg-[#bfff2f] text-[#064b36]" : "bg-[#064b36] text-[#bfff2f] group-hover:bg-[#bfff2f] group-hover:text-[#064b36]"}`}>
                <Icon size={19} />
              </span>
              {!collapsed ? <span>{item.label}</span> : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
