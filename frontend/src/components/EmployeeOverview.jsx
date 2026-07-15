import { Activity, BriefcaseBusiness, DoorOpen, Pencil, Trash2, UserCheck, UserRoundPlus, Users } from "lucide-react";
import { formatDate, getEmployeeStats } from "../utils/employeeStats";

function StatCard({ title, value, icon: Icon, helper, color }) {
  return (
    <article className="relative min-h-36 overflow-hidden rounded-3xl p-5 text-white shadow-xl" style={{ backgroundColor: color }}>
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white/80">{title}</p>
          <h3 className="mt-3 text-4xl font-black text-white">{value}</h3>
        </div>
        <div className="rounded-2xl bg-white/14 p-3 ring-1 ring-white/20">
          <Icon size={22} />
        </div>
      </div>
      <p className="relative mt-5 text-sm font-medium text-white/75">{helper}</p>
    </article>
  );
}

function EmployeeOverview({ users, currentUser, onEditUser, onDeleteUser }) {
  const stats = getEmployeeStats(users);
  const recentJoiners = [...users].sort((first, second) => new Date(second.joinedAt) - new Date(first.joinedAt)).slice(0, 5);
  const exits = users
    .filter((user) => user.status === "exited")
    .sort((first, second) => new Date(second.exitedAt || second.joinedAt) - new Date(first.exitedAt || first.joinedAt))
    .slice(0, 5);
  const activeRate = stats.total ? Math.round((stats.active / stats.total) * 100) : 0;
  const canManageUsers = ["admin", "hr"].includes(currentUser?.role);

  const cards = [
    { title: "Total Employees", value: stats.total, icon: Users, helper: "Complete workforce strength", color: "#064b36" },
    { title: "Active", value: stats.active, icon: UserCheck, helper: `${activeRate}% currently active`, color: "#123c69" },
    { title: "Inactive", value: stats.inactive, icon: Activity, helper: "Temporarily inactive employees", color: "#5d3b09" },
    { title: "New Joiners", value: stats.newJoiners, icon: UserRoundPlus, helper: "Joined this month", color: "#4a2f73" },
    { title: "Exits", value: stats.exits, icon: DoorOpen, helper: "Total exited employees", color: "#7a2e25" }
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-xl font-black text-[#15372b]">Employee Directory</h3>
              <p className="mt-1 text-sm text-slate-500">Organization-wide employee directory.</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eff6df] text-[#064b36]">
              <BriefcaseBusiness size={22} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#064b36] text-xs uppercase tracking-widest text-white">
                  <th className="px-4 py-4 font-bold">Employee</th>
                  <th className="px-4 py-4 font-bold">Dept</th>
                  <th className="px-4 py-4 font-bold">Role</th>
                  <th className="px-4 py-4 font-bold">Status</th>
                  <th className="px-4 py-4 font-bold">Joined</th>
                  {canManageUsers ? <th className="px-4 py-4 text-right font-bold">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-[#eff6df]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white"
                          style={{ backgroundColor: user.avatarColor || "#064b36" }}
                        >
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#15372b]">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{user.department}</td>
                    <td className="px-4 py-4 capitalize text-slate-700">{user.role}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          user.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : user.status === "inactive"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{formatDate(user.joinedAt)}</td>
                    {canManageUsers ? (
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onEditUser(user)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-[#064b36] hover:bg-[#eff6df] hover:text-[#064b36]"
                            type="button"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => onDeleteUser(user)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                            type="button"
                            aria-label={`Delete ${user.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!users.length ? (
                  <tr>
                    <td className="px-5 py-10 text-center text-slate-500" colSpan={canManageUsers ? 6 : 5}>
                      No employees yet. Admin can create users from the panel.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
            <h3 className="text-xl font-black text-[#15372b]">Recent Joiners</h3>
            <div className="mt-4 space-y-3">
              {recentJoiners.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#064b36] px-4 py-4 shadow-lg shadow-emerald-950/10">
                  <div>
                    <p className="text-sm font-black text-white">{user.name}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-50/75">{user.designation}</p>
                  </div>
                  <span className="rounded-full bg-[#bfff2f] px-3 py-1 text-xs font-bold text-[#064b36]">{formatDate(user.joinedAt)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
            <h3 className="text-xl font-black text-[#15372b]">Exits</h3>
            <div className="mt-4 space-y-3">
              {exits.length ? (
                exits.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-4">
                    <span className="text-sm font-black text-rose-950">{user.name}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-700">Exited</span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">No exits recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EmployeeOverview;
