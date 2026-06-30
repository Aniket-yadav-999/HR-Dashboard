import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import { formatDate } from "../utils/employeeStats";

function ProfileCard({ user, onClose, onOpenProfile }) {
  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="absolute right-0 top-14 z-40 w-80 rounded-2xl border border-slate-200 bg-[#f8f4ea] p-4 shadow-2xl shadow-teal-100/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: user.avatarColor || "#0f766e" }}
          >
            {initials}
          </div>
          <div>
            <button
              onClick={() => {
                onOpenProfile();
                onClose();
              }}
              className="text-left text-base font-semibold text-[#15372b] hover:text-[#064b36]"
              type="button"
            >
              {user.name}
            </button>
            <p className="text-sm text-slate-500">{user.designation}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          type="button"
        >
          x
        </button>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <Mail size={16} className="text-slate-400" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-3">
          <UserRound size={16} className="text-slate-400" />
          <span>{user.department}</span>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-slate-400" />
          <span className="capitalize">{user.role}</span>
        </div>
        <div className="flex items-center gap-3">
          <CalendarDays size={16} className="text-slate-400" />
          <span>Joined {formatDate(user.joinedAt)}</span>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
