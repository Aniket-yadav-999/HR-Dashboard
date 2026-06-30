import { ArrowRight, Bell, CheckCircle2, LogIn, LogOut, UserCircle } from "lucide-react";
import { useState } from "react";
import ProfileCard from "./ProfileCard";

const logoUrl = "https://aagarg.in/wp-content/uploads/2025/05/A2G-New-Logo-Black.avif";

function TopNavbar({ user, sidebarCollapsed, notifications = [], onNotificationsClick, onLoginClick, onLogout, onProfileClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const previewNotifications = notifications.slice(0, 4);

  return (
    <header
      className={`sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-all duration-300 lg:px-8 ${
        user ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-72") : ""
      }`}
    >
      <div className="flex min-w-0 items-center">
        <img src={logoUrl} alt="A2G logo" className="h-11 w-auto object-contain" />
      </div>
      <div className="relative flex items-center gap-2">
        {user ? (
          <>
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen((current) => !current);
                  setProfileOpen(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/10 bg-white text-[#064b36] shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5"
                type="button"
                aria-label="Open notifications"
              >
                <Bell size={18} />
                {notifications.length ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                ) : null}
              </button>

              {notificationsOpen ? (
                <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-emerald-900/20">
                  <div className="bg-[#064b36] px-4 py-4 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#bfff2f]">Notifications</p>
                    <h2 className="mt-1 text-lg font-black">{notifications.length} updates</h2>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-3">
                    {previewNotifications.length ? (
                      previewNotifications.map((notification) => (
                        <div key={notification.id} className="flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-[#eff6df]">
                          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#bfff2f] text-[#064b36]">
                            <CheckCircle2 size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#15372b]">{notification.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</p>
                            <p className="mt-1 text-[11px] font-bold text-slate-400">{new Date(notification.createdAt).toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">No notifications yet.</p>
                    )}
                  </div>
                  <div className="border-t border-slate-100 p-3">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        onNotificationsClick();
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#064b36] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0b5d43]"
                      type="button"
                    >
                      View Notification Center
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-sm font-bold text-[#15372b] shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5"
              type="button"
            >
              <UserCircle size={18} />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl bg-[#064b36] px-3 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-[#0b5d43]"
              type="button"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
            {profileOpen ? <ProfileCard user={user} onClose={() => setProfileOpen(false)} onOpenProfile={onProfileClick} /> : null}
          </>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 rounded-xl bg-[#064b36] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
            type="button"
          >
            <LogIn size={18} />
            Login
          </button>
        )}
      </div>
    </header>
  );
}

export default TopNavbar;
