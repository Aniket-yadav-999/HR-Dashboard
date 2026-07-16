import { Bell, CalendarDays, CakeSlice, CheckCircle2, Headphones, HeartHandshake, Inbox, Laptop, PartyPopper, Sparkles, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

const sectionStyles = {
  birthday: { label: "Birthday", color: "#064b36", icon: CakeSlice },
  work_anniversary: { label: "Work Anniversary", color: "#123c69", icon: PartyPopper },
  office_anniversary: { label: "Office Anniversary", color: "#0f5f6b", icon: CalendarDays },
  promotion: { label: "Promotion", color: "#5d3b09", icon: Trophy },
  recognition: { label: "Recognition", color: "#7a2e25", icon: HeartHandshake },
  event: { label: "Events", color: "#4a2f73", icon: Bell },
  feedback: { label: "Feedback", color: "#2f5f53", icon: Sparkles },
  epr_internal_training: { label: "EPR Internal Training", color: "#075985", icon: Sparkles },
  training: { label: "Training", color: "#9a3412", icon: Sparkles },
  training_suggestion: { label: "Training Suggestion", color: "#064b36", icon: Sparkles },
  attendance: { label: "Attendance & Leave", color: "#064b36", icon: CalendarDays },
  asset: { label: "Asset Management", color: "#123c69", icon: Laptop },
  helpdesk: { label: "Helpdesk & Requests", color: "#0f5f6b", icon: Headphones },
  engagement: { label: "Employee Engagement", color: "#4a2f73", icon: HeartHandshake },
  default: { label: "General Updates", color: "#5d3b09", icon: Bell }
};

const primaryTypes = ["birthday", "work_anniversary", "office_anniversary", "promotion", "recognition", "event", "feedback", "epr_internal_training", "training", "training_suggestion", "attendance", "asset", "helpdesk"];
const fallbackColors = ["#064b36", "#123c69", "#5d3b09", "#4a2f73", "#7a2e25", "#0f5f6b"];

function getSection(type) {
  const key = type || "default";
  const fallbackLabel = key
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (sectionStyles[key]) {
    return sectionStyles[key];
  }

  const hash = key.split("").reduce((total, letter) => total + letter.charCodeAt(0), 0);
  return { ...sectionStyles.default, color: fallbackColors[hash % fallbackColors.length], label: fallbackLabel || sectionStyles.default.label };
}

function groupNotifications(notifications) {
  return notifications.reduce((groups, notification) => {
    const key = notification.type || "default";
    return { ...groups, [key]: [...(groups[key] || []), notification] };
  }, {});
}

function NotificationsPanel({ notifications }) {
  const [activeType, setActiveType] = useState("birthday");
  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);
  const tabs = useMemo(() => {
    const dynamicTypes = Object.keys(grouped).filter((type) => !primaryTypes.includes(type));
    return [...primaryTypes, ...dynamicTypes];
  }, [grouped]);
  const activeSection = getSection(activeType);
  const ActiveIcon = activeSection.icon;
  const activeNotifications = grouped[activeType] || [];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-[#064b36] bg-[#064b36] p-6 text-white shadow-xl shadow-emerald-900/25">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#bfff2f]">Notifications</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Notification Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Section-wise updates from attendance, engagement, feedback, and future workspace modules.
            </p>
          </div>
          <div className="rounded-2xl border border-[#bfff2f]/60 bg-[#bfff2f] px-5 py-4 text-[#064b36]">
            <p className="text-xs font-black uppercase tracking-widest">Total</p>
            <p className="mt-1 text-3xl font-black">{notifications.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tabs.map((type) => {
            const section = getSection(type);
            const Icon = section.icon;
            const active = activeType === type;
            const count = grouped[type]?.length || 0;

            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`group flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
                  active ? "border-transparent text-white shadow-xl" : "border-slate-200 bg-white text-[#15372b] shadow-sm hover:bg-[#eff6df]"
                }`}
                style={active ? { backgroundColor: section.color } : undefined}
                type="button"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/15 text-white ring-1 ring-white/20" : "text-white"}`}
                  style={!active ? { backgroundColor: section.color } : undefined}
                >
                  <Icon size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{section.label}</span>
                  <span className={`mt-1 block text-xs font-bold ${active ? "text-white/70" : "text-slate-400"}`}>{count} updates</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {notifications.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: activeSection.color }}>
                <ActiveIcon size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: activeSection.color }}>
                  {activeSection.label}
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#15372b]">{activeNotifications.length} updates</h2>
              </div>
            </div>
            <span className="rounded-full bg-[#eff6df] px-4 py-2 text-xs font-black text-[#064b36]">Latest first</span>
          </div>

          {activeNotifications.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead style={{ backgroundColor: activeSection.color }}>
                  <tr className="text-xs uppercase tracking-widest text-white">
                    <th className="px-5 py-4 font-black">Status</th>
                    <th className="px-5 py-4 font-black">Title</th>
                    <th className="px-5 py-4 font-black">Message</th>
                    <th className="px-5 py-4 font-black">Actor</th>
                    <th className="px-5 py-4 font-black">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {activeNotifications.map((notification) => (
                    <tr key={notification.id} className="transition hover:bg-[#eff6df]">
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          <CheckCircle2 size={14} />
                          New
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-[#15372b]">{notification.title}</td>
                      <td className="max-w-xl px-5 py-4 leading-6 text-slate-600">{notification.message}</td>
                      <td className="px-5 py-4 text-slate-600">{notification.actor?.name || "System"}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-500">{new Date(notification.createdAt).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Inbox className="mx-auto" style={{ color: activeSection.color }} size={34} />
              <h3 className="mt-4 text-xl font-black text-[#15372b]">No {activeSection.label.toLowerCase()} notifications</h3>
              <p className="mt-2 text-sm text-slate-500">Updates from this section will appear here automatically.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-xl shadow-slate-200/70">
          <Inbox className="mx-auto text-[#064b36]" size={34} />
          <h2 className="mt-4 text-2xl font-black text-[#15372b]">No notifications yet</h2>
          <p className="mt-2 text-sm text-slate-500">Updates from your workspace sections will appear here automatically.</p>
        </div>
      )}
    </section>
  );
}

export default NotificationsPanel;
