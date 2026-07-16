import {
  Award,
  BookOpenCheck,
  CalendarDays,
  CakeSlice,
  Clock3,
  Edit3,
  GraduationCap,
  HeartHandshake,
  Loader2,
  MapPin,
  Megaphone,
  PartyPopper,
  Plus,
  Save,
  Sparkles,
  Star,
  Send,
  Trash2,
  Trophy,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createEngagementItem, deleteEngagementItem, getEngagementItems, getEngagementPeople, updateEngagementItem } from "../services/api";
import { formatDate } from "../utils/employeeStats";

const categories = [
  { value: "birthday", label: "Birthday", icon: CakeSlice },
  { value: "work_anniversary", label: "Work Anniversary", icon: Star },
  { value: "office_anniversary", label: "Office Anniversary", icon: CalendarDays },
  { value: "promotion", label: "Promotion", icon: Trophy },
  { value: "recognition", label: "Recognition", icon: HeartHandshake },
  { value: "event", label: "Events", icon: Megaphone },
  { value: "epr_internal_training", label: "EPR Internal Training", icon: BookOpenCheck },
  { value: "training", label: "Training", icon: GraduationCap },
  { value: "feedback", label: "Feedback", icon: Edit3 },
  { value: "training_suggestion", label: "Training Suggestions", icon: Send }
];

const publishCategories = categories.filter((category) => ["promotion", "recognition", "event", "epr_internal_training", "training"].includes(category.value));

const boardTabs = [
  { value: "birthday", label: "Birthdays", icon: CakeSlice, color: "#064b36" },
  { value: "work_anniversary", label: "Anniversaries", icon: PartyPopper, color: "#123c69" },
  { value: "promotion", label: "Promotions", icon: Trophy, color: "#5d3b09" },
  { value: "event", label: "Events", icon: Megaphone, color: "#4a2f73" },
  { value: "epr_internal_training", label: "EPR Internal Training", icon: BookOpenCheck, color: "#075985" },
  { value: "training", label: "Training", icon: GraduationCap, color: "#9a3412" }
];

const trainingCategories = ["epr_internal_training", "training"];
const emptyForm = { category: "event", title: "", employeeName: "", eventDate: "", description: "", trainer: "", venue: "", duration: "", mode: "In person" };
const emptyFeedback = { title: "", description: "" };
const emptyTrainingSuggestion = { title: "", description: "" };

function isValidDate(value) {
  const date = value ? new Date(value) : null;
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function isCurrentMonth(value, { includeYear = true } = {}) {
  if (!isValidDate(value)) {
    return false;
  }

  const date = dateParts(value);
  const today = new Date();
  const monthMatches = date.month === today.getMonth();
  return includeYear ? monthMatches && date.year === today.getFullYear() : monthMatches;
}

function dayNumber(value) {
  return isValidDate(value) ? dateParts(value).day : 99;
}

function dateParts(value) {
  const date = new Date(value);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate()
  };
}

function birthdayDateThisYear(value) {
  if (!isValidDate(value)) {
    return null;
  }

  const parts = dateParts(value);
  return new Date(new Date().getFullYear(), parts.month, parts.day);
}

function daysUntilBirthday(value) {
  const birthday = birthdayDateThisYear(value);

  if (!birthday) {
    return Number.POSITIVE_INFINITY;
  }

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const candidate = birthday < todayOnly ? new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate()) : birthday;
  return Math.round((candidate - todayOnly) / 86400000);
}

function anniversaryDateThisYear(value) {
  if (!isValidDate(value)) {
    return value;
  }

  const joinedAt = new Date(value);
  const anniversary = new Date();
  anniversary.setMonth(joinedAt.getMonth(), joinedAt.getDate());
  return anniversary;
}

function hasCompletedOneYear(value) {
  if (!isValidDate(value)) {
    return false;
  }

  const joinedAt = new Date(value);
  const firstAnniversary = new Date(joinedAt);
  firstAnniversary.setFullYear(joinedAt.getFullYear() + 1);
  return firstAnniversary <= new Date();
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

function PersonIdCard({ user, date, label, variant = "default" }) {
  const isUpcoming = variant === "upcoming";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl">
      <div className={`relative h-28 p-4 text-white ${isUpcoming ? "bg-[#123c69]" : "bg-[#064b36]"}`}>
        <div className={`absolute -right-8 -top-10 h-28 w-28 rounded-full ${isUpcoming ? "bg-sky-200/20" : "bg-[#bfff2f]/20"}`} />
        <div className="absolute bottom-0 left-0 h-16 w-full rounded-t-[44%] bg-white" />
        <p className={`relative text-xs font-black uppercase tracking-[0.2em] ${isUpcoming ? "text-sky-100" : "text-[#bfff2f]"}`}>{label}</p>
      </div>
      <div className="relative px-5 pb-5">
        <div className={`-mt-10 flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white text-xl font-black shadow-lg shadow-emerald-900/15 ${isUpcoming ? "bg-sky-100 text-[#123c69]" : "bg-[#bfff2f] text-[#064b36]"}`}>
          {getInitials(user.name)}
        </div>
        <h3 className="mt-3 truncate text-lg font-black text-[#15372b]">{user.name}</h3>
        <p className="mt-1 truncate text-xs font-bold text-slate-500">{user.designation || user.role}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Date</span>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${isUpcoming ? "bg-sky-50 text-[#123c69]" : "bg-[#eff6df] text-[#064b36]"}`}>{formatDate(date)}</span>
        </div>
      </div>
    </article>
  );
}

function PostIdCard({ item, canManage, onEdit, onDelete }) {
  const isPromotion = item.category === "promotion";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl">
      <div className={`relative h-28 p-4 text-white ${isPromotion ? "bg-[#5d3b09]" : "bg-[#4a2f73]"}`}>
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/12" />
        <div className="absolute bottom-0 left-0 h-14 w-full rounded-t-[46%] bg-white" />
        <p className="relative text-xs font-black uppercase tracking-[0.2em] text-white/80">{item.categoryLabel}</p>
      </div>
      <div className="relative px-5 pb-5">
        <div className="-mt-9 flex h-16 w-16 items-center justify-center rounded-3xl border-4 border-white bg-[#bfff2f] text-[#064b36] shadow-lg shadow-emerald-900/15">
          {isPromotion ? <Trophy size={26} /> : <Megaphone size={26} />}
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-14 text-lg font-black text-[#15372b]">{item.title}</h3>
        {item.employeeName ? <p className="truncate text-xs font-bold text-slate-500">{item.employeeName}</p> : null}
        {item.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-[#eff6df] px-3 py-1 text-xs font-black text-[#064b36]">{item.eventDate ? formatDate(item.eventDate) : "No date"}</span>
          {canManage ? (
            <span className="flex items-center gap-2">
              <button onClick={() => onEdit(item)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-[#eff6df] hover:text-[#064b36]" type="button" title="Edit">
                <Edit3 size={15} />
              </button>
              <button onClick={() => onDelete(item)} className="rounded-xl border border-rose-100 p-2 text-rose-500 hover:bg-rose-50" type="button" title="Delete">
                <Trash2 size={15} />
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function TrainingCard({ item, canManage, onEdit, onDelete }) {
  const isEpr = item.category === "epr_internal_training";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl">
      <div className={`relative p-5 text-white ${isEpr ? "bg-gradient-to-br from-[#075985] to-[#0c4a6e]" : "bg-gradient-to-br from-[#9a3412] to-[#7c2d12]"}`}>
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between gap-4">
          <span className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
            {isEpr ? <BookOpenCheck size={24} /> : <GraduationCap size={24} />}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20">{item.mode || "Scheduled"}</span>
        </div>
        <p className="relative mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{item.categoryLabel}</p>
        <h3 className="relative mt-2 text-xl font-black leading-tight">{item.title}</h3>
      </div>
      <div className="p-5">
        {item.description ? <p className="line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p> : null}
        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><CalendarDays size={15} className="text-[#064b36]" />{item.eventDate ? formatDate(item.eventDate) : "Date to be announced"}</span>
          <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><UserRound size={15} className="text-[#064b36]" />{item.trainer || "Trainer to be announced"}</span>
          <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><MapPin size={15} className="text-[#064b36]" />{item.venue || item.mode || "Venue to be announced"}</span>
          <span className="flex items-center gap-2 text-xs font-bold text-slate-600"><Clock3 size={15} className="text-[#064b36]" />{item.duration || "Duration to be announced"}</span>
        </div>
        {canManage ? (
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => onEdit(item)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-[#eff6df] hover:text-[#064b36]" type="button" title="Edit training"><Edit3 size={16} /></button>
            <button onClick={() => onDelete(item)} className="rounded-xl border border-rose-100 p-2 text-rose-500 hover:bg-rose-50" type="button" title="Delete training"><Trash2 size={16} /></button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PostCard({ item, canManage, onEdit, onDelete }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#064b36]">{item.categoryLabel}</p>
          <h3 className="mt-2 text-xl font-black text-[#15372b]">{item.title}</h3>
          {item.employeeName ? <p className="mt-1 text-sm font-bold text-slate-500">{item.employeeName}</p> : null}
        </div>
        {canManage ? (
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(item)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-[#eff6df] hover:text-[#064b36]" type="button" title="Edit">
              <Edit3 size={16} />
            </button>
            <button onClick={() => onDelete(item)} className="rounded-xl border border-rose-100 p-2 text-rose-500 hover:bg-rose-50" type="button" title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        ) : null}
      </div>
      {item.description ? <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p> : null}
      {item.eventDate ? <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Date: {formatDate(item.eventDate)}</p> : null}
    </article>
  );
}

function EmptyState({ title }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center shadow-xl shadow-slate-200/50">
      <Sparkles className="mx-auto text-[#064b36]" size={24} />
      <p className="mt-3 text-sm font-bold text-slate-500">{title}</p>
    </div>
  );
}

function EmployeeEngagement({ currentUser, users = [], onChanged }) {
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState(users);
  const [activeBoard, setActiveBoard] = useState("birthday");
  const [birthdayView, setBirthdayView] = useState("today");
  const [activeCategory, setActiveCategory] = useState("event");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [feedback, setFeedback] = useState(emptyFeedback);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [trainingSuggestion, setTrainingSuggestion] = useState(emptyTrainingSuggestion);
  const [trainingSuggestionSaving, setTrainingSuggestionSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canManage = ["admin", "hr"].includes(currentUser.role);
  const visibleCategories = canManage ? categories : categories.filter((category) => !["feedback", "training_suggestion"].includes(category.value));

  const monthName = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  const currentMonth = useMemo(() => {
    const peopleSource = people.length ? people : users;
    const birthdaysThisMonth = peopleSource
      .filter((user) => isCurrentMonth(user.dateOfBirth, { includeYear: false }))
      .sort((first, second) => dayNumber(first.dateOfBirth) - dayNumber(second.dateOfBirth));
    const todayDate = new Date();
    const today = peopleSource.filter((user) => {
      if (!isValidDate(user.dateOfBirth)) {
        return false;
      }

      const birth = dateParts(user.dateOfBirth);
      return birth.month === todayDate.getMonth() && birth.day === todayDate.getDate();
    });
    const upcomingBirthdays = peopleSource
      .filter((user) => isValidDate(user.dateOfBirth) && daysUntilBirthday(user.dateOfBirth) > 0 && daysUntilBirthday(user.dateOfBirth) <= 31)
      .sort((first, second) => daysUntilBirthday(first.dateOfBirth) - daysUntilBirthday(second.dateOfBirth));
    const anniversaries = peopleSource
      .filter((user) => hasCompletedOneYear(user.joinedAt) && isCurrentMonth(user.joinedAt, { includeYear: false }))
      .sort((first, second) => dayNumber(first.joinedAt) - dayNumber(second.joinedAt));
    const promotions = items.filter((item) => item.category === "promotion" && isCurrentMonth(item.eventDate));
    const events = items.filter((item) => item.category === "event" && isCurrentMonth(item.eventDate));
    const eprTrainings = items.filter((item) => item.category === "epr_internal_training");
    const trainings = items.filter((item) => item.category === "training");

    return { birthdays: birthdaysThisMonth, today, upcomingBirthdays, anniversaries, promotions, events, eprTrainings, trainings };
  }, [items, people, users]);

  const filteredItems = useMemo(() => items.filter((item) => item.category === activeCategory), [items, activeCategory]);

  const boardCounts = {
    birthday: currentMonth.today.length + currentMonth.upcomingBirthdays.length,
    work_anniversary: currentMonth.anniversaries.length,
    promotion: currentMonth.promotions.length,
    event: currentMonth.events.length,
    epr_internal_training: currentMonth.eprTrainings.length,
    training: currentMonth.trainings.length
  };

  async function loadItems() {
    setLoading(true);

    try {
      const data = await getEngagementItems();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPeople() {
    try {
      const data = await getEngagementPeople();
      setPeople(data);
    } catch {
      setPeople(users);
    }
  }

  useEffect(() => {
    loadItems();
    loadPeople();
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      category: item.category,
      title: item.title,
      employeeName: item.employeeName || "",
      eventDate: item.eventDate ? item.eventDate.slice(0, 10) : "",
      description: item.description || "",
      trainer: item.trainer || "",
      venue: item.venue || "",
      duration: item.duration || "",
      mode: item.mode || "In person"
    });
    setActiveCategory(item.category);
    setMessage("");
  }

  function resetForm() {
    setEditingId("");
    setForm({ ...emptyForm, category: publishCategories.some((category) => category.value === activeCategory) ? activeCategory : "event" });
  }

  async function submitFeedback() {
    setFeedbackSaving(true);
    setMessage("");

    try {
      const title = feedback.title.trim() || `Feedback from ${currentUser.name}`;
      await createEngagementItem({
        category: "feedback",
        title,
        employeeName: currentUser.name,
        eventDate: new Date().toISOString().slice(0, 10),
        description: feedback.description
      });
      setFeedback(emptyFeedback);
      setMessage("Feedback submitted privately to HR.");
      await loadItems();
      onChanged?.();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not submit feedback.");
    } finally {
      setFeedbackSaving(false);
    }
  }

  async function submitTrainingSuggestion() {
    setTrainingSuggestionSaving(true);
    setMessage("");

    try {
      await createEngagementItem({
        category: "training_suggestion",
        title: trainingSuggestion.title.trim(),
        employeeName: currentUser.name,
        eventDate: new Date().toISOString().slice(0, 10),
        description: trainingSuggestion.description
      });
      setTrainingSuggestion(emptyTrainingSuggestion);
      setMessage("Training suggestion sent privately to HR.");
      await loadItems();
      onChanged?.();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not submit training suggestion.");
    } finally {
      setTrainingSuggestionSaving(false);
    }
  }

  async function saveItem() {
    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        await updateEngagementItem(editingId, form);
        setMessage("Engagement item updated and notification sent.");
      } else {
        await createEngagementItem(form);
        setMessage("Engagement item added and notification sent.");
      }
      resetForm();
      await loadItems();
      onChanged?.();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save engagement item.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item) {
    const confirmed = window.confirm(`Delete ${item.title}?`);

    if (!confirmed) {
      return;
    }

    await deleteEngagementItem(item.id);
    await loadItems();
    onChanged?.();
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-[#064b36] bg-[#064b36] p-6 text-white shadow-xl shadow-emerald-900/25">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#bfff2f]">Employee Engagement</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">Celebrate people, every month</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Current month birthdays, anniversaries, promotions, and HR events in one clean engagement board.
            </p>
          </div>
          <div className="rounded-2xl border border-[#bfff2f]/60 bg-[#bfff2f] px-5 py-4 text-[#064b36]">
            <p className="text-xs font-black uppercase tracking-widest">Viewing</p>
            <p className="mt-1 text-lg font-black">{monthName}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {boardTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeBoard === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveBoard(tab.value);
                if (canManage && trainingCategories.includes(tab.value) && !editingId) {
                  setForm((current) => ({ ...current, category: tab.value }));
                }
              }}
              className={`relative min-h-24 overflow-hidden rounded-3xl p-4 text-left text-white shadow-xl transition hover:-translate-y-0.5 ${active ? "ring-4 ring-[#bfff2f]/35" : ""}`}
              style={{ backgroundColor: tab.color }}
              type="button"
            >
              <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute bottom-0 right-0 h-12 w-24 rounded-tl-full bg-white/10" />
              <div className="relative flex h-full items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white/80">{tab.label}</p>
                  <h2 className="mt-1 text-3xl font-black">{boardCounts[tab.value]}</h2>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/65">{trainingCategories.includes(tab.value) ? "Learning calendar" : monthName}</p>
                </div>
                <span className="rounded-2xl bg-white/14 p-2.5 ring-1 ring-white/20">
                  <Icon size={20} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#064b36]">{trainingCategories.includes(activeBoard) ? "Training Calendar" : "Current Month"}</p>
            <h2 className="mt-1 text-2xl font-black text-[#15372b]">{boardTabs.find((tab) => tab.value === activeBoard)?.label}</h2>
          </div>
          <Award className="text-[#064b36]" size={24} />
        </div>

        {activeBoard === "birthday" ? (
          <div className="mt-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setBirthdayView("today")}
                className={`rounded-full px-4 py-2 text-xs font-black transition ${birthdayView === "today" ? "bg-[#064b36] text-white shadow-lg shadow-emerald-900/15" : "bg-[#eff6df] text-[#064b36] hover:bg-[#bfff2f]"}`}
                type="button"
              >
                {currentMonth.today.length} Today
              </button>
              <button
                onClick={() => setBirthdayView("upcoming")}
                className={`rounded-full px-4 py-2 text-xs font-black transition ${birthdayView === "upcoming" ? "bg-[#123c69] text-white shadow-lg shadow-sky-900/15" : "bg-sky-50 text-[#123c69] hover:bg-sky-100"}`}
                type="button"
              >
                {currentMonth.upcomingBirthdays.length} Upcoming
              </button>
            </div>

            {birthdayView === "today" ? (
              <div>
                <h3 className="text-lg font-black text-[#15372b]">Birthdays Today</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {currentMonth.today.length ? currentMonth.today.map((user) => <PersonIdCard key={user.id} user={user} date={user.dateOfBirth} label="Birthday today" />) : <EmptyState title="No birthdays today." />}
                </div>
              </div>
            ) : null}

            {birthdayView === "upcoming" ? (
              <div>
                <h3 className="text-lg font-black text-[#15372b]">Upcoming Birthdays</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {currentMonth.upcomingBirthdays.length ? (
                    currentMonth.upcomingBirthdays.map((user) => <PersonIdCard key={user.id} user={user} date={birthdayDateThisYear(user.dateOfBirth)} label="Upcoming birthday" variant="upcoming" />)
                  ) : currentMonth.birthdays.length ? (
                    <EmptyState title="No more upcoming birthdays in the next few weeks." />
                  ) : (
                    <EmptyState title="No birthdays this month. Hope next month brings a celebration!" />
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeBoard === "work_anniversary" ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {currentMonth.anniversaries.length ? (
              currentMonth.anniversaries.map((user) => <PersonIdCard key={user.id} user={user} date={anniversaryDateThisYear(user.joinedAt)} label="Work anniversary" />)
            ) : (
              <EmptyState title="No work anniversaries this month." />
            )}
          </div>
        ) : null}

        {activeBoard === "promotion" ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {currentMonth.promotions.length ? (
              currentMonth.promotions.map((item) => <PostIdCard key={item.id} item={item} canManage={canManage} onEdit={startEdit} onDelete={removeItem} />)
            ) : (
              <EmptyState title="No promotions posted this month." />
            )}
          </div>
        ) : null}

        {activeBoard === "event" ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {currentMonth.events.length ? (
              currentMonth.events.map((item) => <PostIdCard key={item.id} item={item} canManage={canManage} onEdit={startEdit} onDelete={removeItem} />)
            ) : (
              <EmptyState title="No HR events posted this month." />
            )}
          </div>
        ) : null}

        {activeBoard === "epr_internal_training" || activeBoard === "training" ? (
          <div className="mt-5">
            <div className="mb-5 rounded-3xl bg-[#f6f8f4] p-5 ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#064b36]">Learning & Development</p>
                  <h3 className="mt-2 text-xl font-black text-[#15372b]">{activeBoard === "epr_internal_training" ? "EPR knowledge, shared internally" : "Build skills that move work forward"}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">View the complete schedule, trainer details, delivery mode, venue, and duration in one place.</p>
                </div>
                <span className="shrink-0 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#064b36] shadow-sm">{boardCounts[activeBoard]} scheduled</span>
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {(activeBoard === "epr_internal_training" ? currentMonth.eprTrainings : currentMonth.trainings).length ? (
                (activeBoard === "epr_internal_training" ? currentMonth.eprTrainings : currentMonth.trainings).map((item) => <TrainingCard key={item.id} item={item} canManage={canManage} onEdit={startEdit} onDelete={removeItem} />)
              ) : (
                <EmptyState title={`No ${activeBoard === "epr_internal_training" ? "EPR internal training" : "training"} has been scheduled yet.`} />
              )}
            </div>
          </div>
        ) : null}
      </div>

      {trainingCategories.includes(activeBoard) ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#15372b] to-[#064b36] p-6 text-white">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#bfff2f]/20" />
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#bfff2f]">Suggest a Training</p>
                <h2 className="mt-3 text-3xl font-black">What should we learn next?</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-emerald-50/80">Recommend a topic, tool, or skill that would help you or your team. Your suggestion goes privately to HR for review.</p>
              </div>
            </div>
            <div className="grid gap-3 p-5">
              <input className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-semibold outline-none focus:border-[#064b36] focus:bg-white" placeholder="Training topic or skill" value={trainingSuggestion.title} onChange={(event) => setTrainingSuggestion((current) => ({ ...current, title: event.target.value }))} />
              <textarea className="min-h-28 rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-semibold leading-6 outline-none focus:border-[#064b36] focus:bg-white" placeholder="Why would this training be useful? Add the expected outcome or team need." value={trainingSuggestion.description} onChange={(event) => setTrainingSuggestion((current) => ({ ...current, description: event.target.value }))} />
              <button onClick={submitTrainingSuggestion} disabled={trainingSuggestionSaving || !trainingSuggestion.title.trim() || !trainingSuggestion.description.trim()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#064b36] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-[#0b5d43] disabled:cursor-not-allowed disabled:opacity-60" type="button">
                {trainingSuggestionSaving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                Send Suggestion to HR
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canManage ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#064b36]">HR &amp; Admin Controls</p>
            <h2 className="mt-1 text-2xl font-black text-[#15372b]">{editingId ? "Update engagement post" : "Create engagement post"}</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-[0.8fr_1fr_0.7fr]">
            <select className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36]" value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
              {publishCategories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            <input className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36]" placeholder="Title" value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
            <input className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36]" type="date" value={form.eventDate} onChange={(event) => updateForm("eventDate", event.target.value)} />
            <input className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36]" placeholder="Employee name (optional)" value={form.employeeName} onChange={(event) => updateForm("employeeName", event.target.value)} />
            <input className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36] lg:col-span-2" placeholder="Description" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
          </div>
          {trainingCategories.includes(form.category) ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <input className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36]" placeholder="Trainer / facilitator" value={form.trainer} onChange={(event) => updateForm("trainer", event.target.value)} />
              <input className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36]" placeholder="Venue or meeting link" value={form.venue} onChange={(event) => updateForm("venue", event.target.value)} />
              <input className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36]" placeholder="Duration (e.g. 2 hours)" value={form.duration} onChange={(event) => updateForm("duration", event.target.value)} />
              <select className="rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm outline-none focus:border-[#064b36]" value={form.mode} onChange={(event) => updateForm("mode", event.target.value)}>
                <option>In person</option>
                <option>Online</option>
                <option>Hybrid</option>
              </select>
            </div>
          ) : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button onClick={saveItem} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#064b36] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-[#0b5d43] disabled:opacity-60" type="button">
              {saving ? <Loader2 size={17} className="animate-spin" /> : editingId ? <Save size={17} /> : <Plus size={17} />}
              {editingId ? "Update Item" : "Add Item"}
            </button>
            {editingId ? (
              <button onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-[#eff6df]" type="button">
                <X size={17} />
                Cancel
              </button>
            ) : null}
          </div>
          {message ? <p className="mt-3 text-sm font-bold text-[#064b36]">{message}</p> : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative overflow-hidden bg-[#064b36] p-6 text-white">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#bfff2f]/20" />
            <div className="absolute bottom-0 left-0 h-20 w-40 rounded-tr-full bg-white/10" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#bfff2f]">Feedback</p>
              <h2 className="mt-3 text-3xl font-black">Share office ideas</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-emerald-50/80">
                Send suggestions for office events, parties, celebrations, activities, and workplace improvements.
              </p>
              <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#bfff2f] ring-1 ring-white/15">Private: visible only to HR</p>
            </div>
          </div>
          <div className="grid gap-3 p-5">
            <input
              className="rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#064b36] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              placeholder="Suggestion title"
              value={feedback.title}
              onChange={(event) => setFeedback((current) => ({ ...current, title: event.target.value }))}
            />
            <textarea
              className="min-h-32 rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-4 text-sm font-semibold leading-6 outline-none transition focus:border-[#064b36] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
              placeholder="Write your suggestion..."
              value={feedback.description}
              onChange={(event) => setFeedback((current) => ({ ...current, description: event.target.value }))}
            />
            <button
              onClick={submitFeedback}
              disabled={feedbackSaving || !feedback.description.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#064b36] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-[#0b5d43] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
            >
              {feedbackSaving ? <Loader2 size={17} className="animate-spin" /> : <Edit3 size={17} />}
              Submit Feedback
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#064b36]">All Posts</p>
            <h2 className="mt-1 text-2xl font-black text-[#15372b]">Engagement library</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => {
                  setActiveCategory(category.value);
                  if (!editingId && publishCategories.some((item) => item.value === category.value)) {
                    setForm((current) => ({ ...current, category: category.value }));
                  }
                }}
                className={`rounded-full px-4 py-2 text-xs font-black transition ${
                  activeCategory === category.value ? "bg-[#064b36] text-white" : "bg-[#eff6df] text-[#064b36] hover:bg-[#bfff2f]"
                }`}
                type="button"
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {loading ? (
            <EmptyState title="Loading engagement board..." />
          ) : filteredItems.length ? (
            filteredItems.map((item) => <PostCard key={item.id} item={item} canManage={canManage && item.category !== "feedback"} onEdit={startEdit} onDelete={removeItem} />)
          ) : (
            <EmptyState title="No items in this section yet." />
          )}
        </div>
      </div>
    </section>
  );
}

export default EmployeeEngagement;
