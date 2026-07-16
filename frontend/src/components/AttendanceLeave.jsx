import {
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Image,
  Loader2,
  MapPin,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createAttendance, createHoliday, deleteHoliday, getAttendance, getHolidays, updateHoliday } from "../services/api";

const options = [
  { value: "present", label: "Present", tone: "from-emerald-700 to-lime-400", chip: "bg-emerald-50 text-emerald-700" },
  { value: "work_from_home", label: "Work From Home", tone: "from-[#064b36] to-[#bfff2f]", chip: "bg-[#eff6df] text-[#064b36]" },
  { value: "paid_leave", label: "Paid Leave", tone: "from-[#bfff2f] to-[#064b36]", chip: "bg-[#eff6df] text-[#064b36]" },
  { value: "sick_leave", label: "Sick Leave", tone: "from-rose-500 to-pink-500", chip: "bg-rose-50 text-rose-700" },
  { value: "client_visit", label: "Client Visit", tone: "from-amber-500 to-yellow-500", chip: "bg-amber-50 text-amber-700" },
  { value: "half_day", label: "Half Day", tone: "from-[#ff5a1f] to-[#bfff2f]", chip: "bg-orange-50 text-orange-700" },
  { value: "spot_visit", label: "Spot Visit", tone: "from-orange-500 to-red-500", chip: "bg-orange-50 text-orange-700" }
];

const leaveEntitlements = {
  paid_leave: 14,
  sick_leave: 7
};

const monthOptions = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date(2026, month, 1))
}));

const holidayThemes = {
  "new-year": { a: "#0f766e", b: "#38bdf8", c: "#facc15", label: "2026" },
  "republic-day": { a: "#f97316", b: "#ffffff", c: "#16a34a", label: "26" },
  holi: { a: "#ec4899", b: "#f97316", c: "#22c55e", label: "HOLI" },
  "maharashtra-day": { a: "#f97316", b: "#facc15", c: "#7c2d12", label: "MH" },
  eid: { a: "#059669", b: "#99f6e4", c: "#facc15", label: "EID" },
  "raksha-bandhan": { a: "#db2777", b: "#fbbf24", c: "#7c3aed", label: "RAKHI" },
  ganesh: { a: "#ea580c", b: "#fde68a", c: "#dc2626", label: "GANESH" },
  gandhi: { a: "#64748b", b: "#f8fafc", c: "#16a34a", label: "OCT" },
  dussehra: { a: "#b45309", b: "#fb923c", c: "#fef3c7", label: "VIJAY" },
  diwali: { a: "#7c3aed", b: "#f59e0b", c: "#fef08a", label: "LIGHT" },
  "bhai-dooj": { a: "#2563eb", b: "#f472b6", c: "#fde68a", label: "BHAI" },
  christmas: { a: "#166534", b: "#ef4444", c: "#f8fafc", label: "XMAS" },
  festival: { a: "#0f766e", b: "#a78bfa", c: "#f59e0b", label: "JOY" }
};

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

function formatHolidayDate(date) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function dayNameFor(date) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(new Date(`${date}T00:00:00`));
}

function makeTemplate(user, selectedOption, detail) {
  const label = options.find((option) => option.value === selectedOption)?.label || "Attendance";
  const today = formatDate(new Date());

  if (["client_visit", "spot_visit"].includes(selectedOption)) {
    return {
      subject: `${label} update - ${user.name}`,
      body: `Hi Team,\n\nI am marking ${label} for ${today}.\n\nEmployee: ${user.name}\nClient: ${detail.clientName || ""}\nLocation: ${detail.location || ""}\n\nRegards,\n${user.name}`
    };
  }

  return {
    subject: `${label} request - ${user.name}`,
    body: `Hi Team,\n\nI would like to mark ${label} for ${today}.\n\nEmployee: ${user.name}\nReason: ${detail.reason || ""}\n\nRegards,\n${user.name}`
  };
}

function themeFromText(text) {
  const value = String(text || "festival").toLowerCase();
  const knownKey = Object.keys(holidayThemes).find((key) => value.includes(key) || value.includes(key.replace(/-/g, " ")));

  if (knownKey) {
    return holidayThemes[knownKey];
  }

  const palettes = [
    { a: "#0f766e", b: "#38bdf8", c: "#facc15" },
    { a: "#7c3aed", b: "#ec4899", c: "#f59e0b" },
    { a: "#2563eb", b: "#22c55e", c: "#f8fafc" },
    { a: "#be123c", b: "#fb7185", c: "#fde68a" },
    { a: "#0f172a", b: "#06b6d4", c: "#a78bfa" }
  ];
  const score = value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const palette = palettes[score % palettes.length];
  const label = String(text || "JOY").split(/[\s-]+/).filter(Boolean).slice(0, 2).join(" ").toUpperCase().slice(0, 10) || "JOY";
  return { ...palette, label };
}

function holidayImageSrc(holiday) {
  const imageKey = holiday?.imageKey || holiday?.name || "festival";

  if (/^https?:\/\//i.test(imageKey)) {
    return imageKey;
  }

  const theme = themeFromText(`${holiday?.name || ""} ${imageKey}`);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${theme.a}"/>
          <stop offset="0.55" stop-color="${theme.b}"/>
          <stop offset="1" stop-color="${theme.c}"/>
        </linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="12"/></filter>
        <style>
          @keyframes pulse { 0%, 100% { opacity: .3; transform: scale(1); } 50% { opacity: .65; transform: scale(1.12); } }
          @keyframes drift { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(28px); } }
          .pulse { transform-origin: center; animation: pulse 2.6s ease-in-out infinite; }
          .drift { animation: drift 3.4s ease-in-out infinite; }
        </style>
      </defs>
      <rect width="720" height="420" rx="42" fill="url(#bg)"/>
      <circle class="pulse" cx="112" cy="84" r="44" fill="#ffffff"/>
      <circle class="pulse" cx="620" cy="102" r="68" fill="#ffffff" style="animation-delay:.45s"/>
      <circle cx="568" cy="322" r="94" fill="#111827" opacity=".12" filter="url(#soft)"/>
      <path class="drift" d="M80 306 C168 206 252 372 348 256 C442 144 526 204 640 132" fill="none" stroke="#ffffff" stroke-width="18" stroke-linecap="round" opacity=".42"/>
      <g fill="#ffffff" opacity=".88">
        <circle cx="180" cy="172" r="8"/>
        <circle cx="248" cy="112" r="6"/>
        <circle cx="418" cy="108" r="10"/>
        <circle cx="500" cy="210" r="7"/>
        <circle cx="322" cy="320" r="6"/>
      </g>
      <text x="64" y="220" font-family="Arial, sans-serif" font-size="76" font-weight="800" fill="#ffffff">${theme.label}</text>
      <text x="70" y="268" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff" opacity=".86">Upcoming Holiday</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function styleAttendanceWorksheet(worksheet) {
  const header = worksheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064B36" } };
  header.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: worksheet.columnCount } };
  worksheet.getColumn(1).numFmt = "dd mmm yyyy";
  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "middle", horizontal: rowNumber === 1 ? "center" : "left" };
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F7ED" } };
    }
  });
}

async function saveExcelWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function downloadRecordList(records) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance");
  worksheet.columns = [
    { header: "Date", key: "date", width: 16 },
    { header: "Employee Name", key: "employeeName", width: 28 },
    { header: "Status", key: "status", width: 24 }
  ];
  records.forEach((record) => worksheet.addRow({ date: new Date(record.date), employeeName: record.employeeName, status: record.label }));
  styleAttendanceWorksheet(worksheet);
  await saveExcelWorkbook(workbook, `attendance-records-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function attendanceDateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function downloadAttendanceMatrix({ month, people, records, year }) {
  const { default: ExcelJS } = await import("exceljs");
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const attendanceByPersonAndDate = new Map();

  records.forEach((record) => {
    attendanceByPersonAndDate.set(`${record.employeeEmail}|${attendanceDateKey(record.date)}`, record.label);
  });

  const nameCounts = people.reduce((counts, person) => counts.set(person.name, (counts.get(person.name) || 0) + 1), new Map());
  const headings = people.map((person) => (nameCounts.get(person.name) > 1 ? `${person.name} (${person.email})` : person.name));
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`${monthOptions[month].label} ${year}`);
  worksheet.columns = [
    { header: "Date", key: "date", width: 16 },
    ...headings.map((heading, index) => ({ header: heading, key: `employee_${index}`, width: Math.max(18, Math.min(34, heading.length + 4)) }))
  ];

  Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month, day);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const values = people.map((person) => attendanceByPersonAndDate.get(`${person.email}|${dateKey}`) || "Not Marked");
    const row = { date };
    values.forEach((value, valueIndex) => {
      row[`employee_${valueIndex}`] = value;
    });
    worksheet.addRow(row);
  });
  styleAttendanceWorksheet(worksheet);
  const monthName = monthOptions[month].label.toLowerCase();
  await saveExcelWorkbook(workbook, `attendance-${monthName}-${year}.xlsx`);
}

function buildLeaveSummaries({ records, users, currentUser, year }) {
  const people = new Map();

  users.forEach((person) => {
    people.set(person.email, {
      email: person.email,
      name: person.name,
      teamName: person.teamName,
      department: person.department,
      paidUsed: 0,
      sickUsed: 0
    });
  });

  if (!people.size && currentUser?.email) {
    people.set(currentUser.email, {
      email: currentUser.email,
      name: currentUser.name,
      teamName: currentUser.teamName,
      department: currentUser.department,
      paidUsed: 0,
      sickUsed: 0
    });
  }

  records.forEach((record) => {
    if (!["paid_leave", "sick_leave"].includes(record.type)) {
      return;
    }

    if (new Date(record.date).getFullYear() !== year) {
      return;
    }

    const key = record.employeeEmail || record.employeeName;
    const person =
      people.get(key) ||
      {
        email: record.employeeEmail,
        name: record.employeeName,
        teamName: record.teamName,
        department: record.department,
        paidUsed: 0,
        sickUsed: 0
      };

    if (record.type === "paid_leave") {
      person.paidUsed += 1;
    }

    if (record.type === "sick_leave") {
      person.sickUsed += 1;
    }

    people.set(key, person);
  });

  return Array.from(people.values())
    .map((person) => ({
      ...person,
      paidBalance: Math.max(0, leaveEntitlements.paid_leave - person.paidUsed),
      sickBalance: Math.max(0, leaveEntitlements.sick_leave - person.sickUsed)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function AttendanceLeave({ user, users = [], onSubmitted }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState({ reason: "", clientName: "", location: "" });
  const [template, setTemplate] = useState({ subject: "", body: "" });
  const [templateEditable, setTemplateEditable] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsPage, setRecordsPage] = useState(1);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth());
  const [attendanceTeam, setAttendanceTeam] = useState("all");
  const [attendanceEmployee, setAttendanceEmployee] = useState("all");
  const [excelDownloading, setExcelDownloading] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [holidayMessage, setHolidayMessage] = useState("");
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState("");
  const [editingHolidayId, setEditingHolidayId] = useState("");
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", day: "", imageKey: "" });
  const [leaveSummaryScope, setLeaveSummaryScope] = useState(["admin", "hr"].includes(user.role) ? "all" : user.role === "manager" ? "team" : "me");

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const isVisit = ["client_visit", "spot_visit"].includes(selectedType);
  const selectedOption = options.find((option) => option.value === selectedType);
  const canManageHolidays = ["admin", "hr"].includes(user.role);
  const canManageAttendance = ["admin", "hr"].includes(user.role);
  const currentYear = today.getFullYear();
  const recordsPageSize = 8;
  const attendancePeople = useMemo(
    () => [...users].sort((first, second) => first.name.localeCompare(second.name)),
    [users]
  );
  const attendanceTeams = useMemo(
    () => [...new Set(attendancePeople.map((person) => person.teamName).filter(Boolean))].sort((first, second) => first.localeCompare(second)),
    [attendancePeople]
  );
  const attendanceEmployeeOptions = useMemo(
    () => attendancePeople.filter((person) => attendanceTeam === "all" || person.teamName === attendanceTeam),
    [attendancePeople, attendanceTeam]
  );
  const selectedAttendancePeople = useMemo(() => {
    if (attendanceEmployee !== "all") {
      return attendancePeople.filter((person) => person.email === attendanceEmployee);
    }

    return attendancePeople.filter((person) => attendanceTeam === "all" || person.teamName === attendanceTeam);
  }, [attendanceEmployee, attendancePeople, attendanceTeam]);
  const filteredAttendanceRecords = useMemo(
    () => records.filter((record) => {
      const date = new Date(record.date);
      const monthMatches = date.getFullYear() === currentYear && date.getMonth() === attendanceMonth;
      const teamMatches = attendanceTeam === "all" || record.teamName === attendanceTeam;
      const employeeMatches = attendanceEmployee === "all" || record.employeeEmail === attendanceEmployee;
      return monthMatches && teamMatches && employeeMatches;
    }),
    [attendanceEmployee, attendanceMonth, attendanceTeam, currentYear, records]
  );
  const tableRecords = canManageAttendance ? filteredAttendanceRecords : records;
  const recordsTotalPages = Math.max(1, Math.ceil(tableRecords.length / recordsPageSize));
  const visibleRecords = tableRecords.slice((recordsPage - 1) * recordsPageSize, recordsPage * recordsPageSize);
  const leaveSummaries = useMemo(
    () => buildLeaveSummaries({ records, users, currentUser: user, year: currentYear }),
    [records, users, user, currentYear]
  );
  const scopedLeaveSummaries = leaveSummaryScope === "me" ? leaveSummaries.filter((person) => person.email === user.email) : leaveSummaries;
  const leaveScopeOptions = ["admin", "hr"].includes(user.role)
    ? [["me", "Me"], ["all", "All"]]
    : [["me", "Me"], ["team", "Team"]];
  const totalPaidUsed = scopedLeaveSummaries.reduce((total, person) => total + person.paidUsed, 0);
  const totalSickUsed = scopedLeaveSummaries.reduce((total, person) => total + person.sickUsed, 0);
  const totalPaidBalance = scopedLeaveSummaries.reduce((total, person) => total + person.paidBalance, 0);
  const totalSickBalance = scopedLeaveSummaries.reduce((total, person) => total + person.sickBalance, 0);

  const nextHoliday = useMemo(() => {
    return holidays.find((holiday) => holiday.date >= todayKey) || holidays[0] || null;
  }, [holidays, todayKey]);

  const calendarDays = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, () => null);
    const dates = Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1));
    return [...blanks, ...dates];
  }, []);

  async function loadRecords() {
    setRecordsLoading(true);

    try {
      const data = await getAttendance();
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }

  async function loadHolidays() {
    try {
      const data = await getHolidays();
      setHolidays(data);
    } catch {
      setHolidays([]);
    }
  }

  useEffect(() => {
    loadRecords();
    loadHolidays();
  }, []);

  useEffect(() => {
    setRecordsPage((current) => Math.min(current, recordsTotalPages));
  }, [recordsTotalPages]);

  useEffect(() => {
    setRecordsPage(1);
  }, [attendanceEmployee, attendanceMonth, attendanceTeam]);

  function chooseType(type) {
    setSelectedType(type);
    setMessage("");
    setTemplate(makeTemplate(user, type, detail));

    if (type === "present") {
      submitAttendance("present");
      return;
    }

    setDetailOpen(true);
  }

  function updateDetail(field, value) {
    const nextDetail = { ...detail, [field]: value };
    setDetail(nextDetail);
    setTemplate(makeTemplate(user, selectedType, nextDetail));
  }

  function updateHolidayForm(field, value) {
    const nextForm = { ...holidayForm, [field]: value };

    if (field === "date") {
      nextForm.day = dayNameFor(value);
    }

    setHolidayForm(nextForm);
  }

  function startHolidayEdit(holiday) {
    setEditingHolidayId(holiday.id);
    setHolidayForm({ name: holiday.name, date: holiday.date, day: holiday.day, imageKey: holiday.imageKey || holiday.name });
    setHolidayMessage("");
  }

  function resetHolidayForm() {
    setEditingHolidayId("");
    setHolidayForm({ name: "", date: "", day: "", imageKey: "" });
  }

  async function saveHoliday() {
    setHolidaySaving(true);
    setHolidayMessage("");

    try {
      if (editingHolidayId) {
        await updateHoliday(editingHolidayId, holidayForm);
        setHolidayMessage("Holiday updated.");
      } else {
        await createHoliday(holidayForm);
        setHolidayMessage("New holiday added.");
      }

      resetHolidayForm();
      await loadHolidays();
    } catch (error) {
      setHolidayMessage(error.response?.data?.message || "Could not save holiday.");
    } finally {
      setHolidaySaving(false);
    }
  }

  async function removeHoliday(holiday) {
    if (!window.confirm(`Delete ${holiday.name} from the holiday calendar?`)) {
      return;
    }

    setDeletingHolidayId(holiday.id);
    setHolidayMessage("");

    try {
      await deleteHoliday(holiday.id);

      if (editingHolidayId === holiday.id) {
        resetHolidayForm();
      }

      setHolidayMessage("Holiday deleted.");
      await loadHolidays();
    } catch (error) {
      setHolidayMessage(error.response?.data?.message || "Could not delete holiday.");
    } finally {
      setDeletingHolidayId("");
    }
  }

  async function submitAttendance(typeOverride = selectedType) {
    if (!typeOverride) {
      setMessage("Please select an attendance option.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload =
        typeOverride === "present"
          ? { type: "present" }
          : {
              type: typeOverride,
              reason: detail.reason,
              clientName: detail.clientName,
              location: detail.location,
              mailSubject: template.subject,
              mailBody: template.body
            };
      await createAttendance(payload);
      setMessage(typeOverride === "present" ? "Present marked. HR and manager notified." : "Attendance request submitted and notification sent.");
      setRecordsPage(1);
      await loadRecords();
      onSubmitted();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not submit attendance.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadFilteredAttendance() {
    setExcelDownloading(true);

    try {
      if (!canManageAttendance) {
        await downloadRecordList(records);
        return;
      }

      await downloadAttendanceMatrix({
        month: attendanceMonth,
        people: selectedAttendancePeople,
        records: filteredAttendanceRecords,
        year: currentYear
      });
    } catch {
      setMessage("Could not prepare the Excel file. Please try again.");
    } finally {
      setExcelDownloading(false);
    }
  }

  return (
    <section className="space-y-6">
      <style>
        {`
          @keyframes floatHoliday {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-10px) scale(1.015); }
          }
          @keyframes slideFade {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div className="overflow-hidden rounded-3xl border border-[#064b36] bg-[#064b36] shadow-xl shadow-emerald-900/25">
        <div className="relative grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-[#bfff2f]">
              <Sparkles size={16} />
              Attendance & Leave
            </p>
            <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Mark today, track every day</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Present is marked instantly. Other leave and visit statuses keep the mail template flow.
            </p>
          </div>
          <div className="rounded-2xl border border-[#bfff2f]/60 bg-[#bfff2f] px-5 py-4 text-[#064b36] shadow-lg shadow-emerald-950/20">
            <p className="text-xs font-black uppercase tracking-widest">Today</p>
            <p className="mt-1 text-lg font-black">{formatDate(today)}</p>
          </div>
        </div>
      </div>

      <LeaveSummary
        currentYear={currentYear}
        canToggleScope={["admin", "hr", "manager"].includes(user.role)}
        scope={leaveSummaryScope}
        scopeOptions={leaveScopeOptions}
        onScopeChange={setLeaveSummaryScope}
        summaries={scopedLeaveSummaries}
        totalPaidBalance={totalPaidBalance}
        totalPaidUsed={totalPaidUsed}
        totalSickBalance={totalSickBalance}
        totalSickUsed={totalSickUsed}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#15372b]">{today.toLocaleString("en-IN", { month: "long", year: "numeric" })}</h2>
              <p className="text-sm text-slate-500">Only today is active</p>
            </div>
            <CalendarDays className="text-[#064b36]" size={24} />
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              const isToday = date?.toDateString() === today.toDateString();
              return (
                <button
                  key={date?.toISOString() || `blank-${index}`}
                  onClick={() => isToday && setSelectedDate(date)}
                  disabled={!isToday}
                  className={`aspect-square rounded-xl text-sm font-semibold transition duration-300 ${
                    !date
                      ? "bg-transparent"
                      : isToday
                        ? "bg-[#064b36] text-white shadow-lg shadow-emerald-500/20 hover:scale-105"
                        : "bg-[#f6f8f4] text-slate-300"
                  } ${selectedDate?.toDateString() === date?.toDateString() && isToday ? "ring-4 ring-teal-100" : ""}`}
                  type="button"
                >
                  {date?.getDate() || ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
            <h2 className="text-xl font-black text-[#15372b]">Choose Status</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => chooseType(option.value)}
                  disabled={loading}
                  className={`group relative overflow-hidden rounded-xl border px-4 py-4 text-left text-sm font-semibold transition duration-300 ${
                    selectedType === option.value ? "border-transparent text-white shadow-lg" : "border-slate-100 bg-[#f6f8f4] text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                  }`}
                  type="button"
                >
                  <span className={`absolute inset-0 bg-gradient-to-br ${option.tone} transition ${selectedType === option.value ? "opacity-100" : "opacity-0 group-hover:opacity-10"}`} />
                  <span className="relative flex items-center justify-between gap-3">
                    {option.label}
                    {loading && selectedType === option.value ? <Loader2 size={18} className="animate-spin" /> : selectedType === option.value ? <CheckCircle2 size={18} /> : null}
                  </span>
                </button>
              ))}
            </div>
            {message ? <p className="mt-4 rounded-xl bg-[#eff6df] px-3 py-2 text-sm font-semibold text-[#064b36]">{message}</p> : null}
          </div>

          {!selectedType ? (
            <HolidaySpotlight
              canManage={canManageHolidays}
              holidayForm={holidayForm}
              holidayMessage={holidayMessage}
              holidaySaving={holidaySaving}
              deletingHolidayId={deletingHolidayId}
              holidays={holidays}
              nextHoliday={nextHoliday}
              onEdit={startHolidayEdit}
              onDelete={removeHoliday}
              onFormChange={updateHolidayForm}
              onReset={resetHolidayForm}
              onSave={saveHoliday}
              editingHolidayId={editingHolidayId}
            />
          ) : null}

          {selectedType && selectedType !== "present" ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70" style={{ animation: "slideFade 240ms ease-out" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedOption?.chip}`}>{selectedOption?.label}</p>
                  <h2 className="mt-3 text-xl font-black text-[#15372b]">Mail Template</h2>
                </div>
                <button
                  onClick={() => setTemplateEditable((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  type="button"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              </div>
              <input
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-[#064b36] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
                value={template.subject}
                onChange={(event) => setTemplate({ ...template, subject: event.target.value })}
                readOnly={!templateEditable}
              />
              <textarea
                className="mt-3 min-h-44 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none focus:border-[#064b36] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
                value={template.body}
                onChange={(event) => setTemplate({ ...template, body: event.target.value })}
                readOnly={!templateEditable}
              />
              <button
                onClick={() => submitAttendance()}
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#064b36] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-[#0b5d43] disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                {loading ? "Submitting..." : "Submit & Notify"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#064b36]">Daily Records</p>
            <h2 className="mt-2 text-2xl font-black text-[#15372b]">Attendance Table</h2>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            {canManageAttendance ? (
              <>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Month
                  <select className="min-w-36 rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm font-semibold normal-case tracking-normal text-[#15372b] outline-none focus:border-[#064b36]" value={attendanceMonth} onChange={(event) => setAttendanceMonth(Number(event.target.value))}>
                    {monthOptions.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Team
                  <select
                    className="min-w-40 rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm font-semibold normal-case tracking-normal text-[#15372b] outline-none focus:border-[#064b36]"
                    value={attendanceTeam}
                    onChange={(event) => {
                      setAttendanceTeam(event.target.value);
                      setAttendanceEmployee("all");
                    }}
                  >
                    <option value="all">All Teams</option>
                    {attendanceTeams.map((team) => <option key={team} value={team}>{team}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Employee Name
                  <select className="min-w-48 rounded-xl border border-slate-200 bg-[#f6f8f4] px-3 py-3 text-sm font-semibold normal-case tracking-normal text-[#15372b] outline-none focus:border-[#064b36]" value={attendanceEmployee} onChange={(event) => setAttendanceEmployee(event.target.value)}>
                    <option value="all">All Employees</option>
                    {attendanceEmployeeOptions.map((person) => <option key={person.id || person.email} value={person.email}>{person.name}</option>)}
                  </select>
                </label>
              </>
            ) : null}
            <button
              onClick={downloadFilteredAttendance}
              disabled={excelDownloading || (canManageAttendance ? !selectedAttendancePeople.length : !records.length)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-100 bg-[#064b36] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-[#0b5d43] disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {excelDownloading ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
              {excelDownloading ? "Preparing Excel..." : "Download Excel"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#064b36]">
              <tr>
                {["Date", "Employee Name", "Status"].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-left text-xs font-bold uppercase tracking-widest text-white">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {recordsLoading ? (
                <tr>
                  <td className="px-5 py-8 text-sm font-semibold text-slate-500" colSpan="3">
                    <span className="inline-flex items-center gap-2"><Loader2 size={17} className="animate-spin text-[#064b36]" /> Loading records</span>
                  </td>
                </tr>
              ) : tableRecords.length ? (
                visibleRecords.map((record) => {
                  const option = options.find((item) => item.value === record.type);
                  return (
                    <tr key={record.id} className="transition hover:bg-[#eff6df]">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">{formatDate(record.date)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6df] text-[#064b36]">
                            <BriefcaseBusiness size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#15372b]">{record.employeeName}</p>
                            <p className="text-xs text-slate-400">{record.teamName || record.department || "Team"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${option?.chip || "bg-slate-100 text-slate-700"}`}>
                          {record.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-5 py-8 text-sm font-semibold text-slate-500" colSpan="3">{canManageAttendance ? "No attendance records match the selected filters." : "No attendance records yet."}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {tableRecords.length ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <p className="text-xs font-semibold text-slate-500">
              Page {recordsPage} of {recordsTotalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecordsPage((current) => Math.max(1, current - 1))}
                disabled={recordsPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                aria-label="Previous attendance page"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={() => setRecordsPage((current) => Math.min(recordsTotalPages, current + 1))}
                disabled={recordsPage === recordsTotalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                aria-label="Next attendance page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {detailOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eff6df]0/20 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-emerald-200/40" style={{ animation: "slideFade 180ms ease-out" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#064b36]">{isVisit ? "Visit Details" : "Reason Required"}</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#15372b]">{isVisit ? "Enter client name and location" : "Add your reason"}</h2>
              </div>
              <button onClick={() => setDetailOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-500" type="button">
                <X size={18} />
              </button>
            </div>
            {isVisit ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <BriefcaseBusiness size={17} className="text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none" placeholder="Client name" value={detail.clientName} onChange={(event) => updateDetail("clientName", event.target.value)} />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <MapPin size={17} className="text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none" placeholder="Location" value={detail.location} onChange={(event) => updateDetail("location", event.target.value)} />
                </div>
              </div>
            ) : (
              <textarea
                className="mt-5 min-h-36 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-[#064b36] focus:bg-white focus:ring-4 focus:ring-emerald-900/10"
                placeholder="Write your reason"
                value={detail.reason}
                onChange={(event) => updateDetail("reason", event.target.value)}
              />
            )}
            <button
              onClick={() => setDetailOpen(false)}
              className="mt-5 w-full rounded-xl bg-[#064b36] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-[#0b5d43]"
              type="button"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LeaveSummary({ canToggleScope = false, currentYear, onScopeChange, scope = "team", scopeOptions = [["me", "Me"], ["team", "Team"]], summaries, totalPaidBalance, totalPaidUsed, totalSickBalance, totalSickUsed }) {
  const peopleCount = Math.max(1, summaries.length);
  const paidCapacity = peopleCount * leaveEntitlements.paid_leave;
  const sickCapacity = peopleCount * leaveEntitlements.sick_leave;
  const paidUsedPercent = Math.min(100, (totalPaidUsed / paidCapacity) * 100);
  const sickUsedPercent = Math.min(100, (totalSickUsed / sickCapacity) * 100);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70" style={{ animation: "slideFade 240ms ease-out" }}>
      <div className="grid gap-0 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden bg-[#064b36] p-6 text-white">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-lime-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-emerald-300/15 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-lime-50 ring-1 ring-white/15">
              <Sparkles size={14} />
              Leave Summary
            </p>
            <h2 className="mt-4 text-3xl font-semibold">Leave Balance {currentYear}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-lime-50/80">
              Organization policy: 14 paid leaves and 7 sick leaves per employee.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <LeaveMetricCard
                balance={totalPaidBalance}
                capacity={paidCapacity}
                label="Paid Leave"
                tone="from-[#bfff2f] to-[#064b36]"
                used={totalPaidUsed}
                usedPercent={paidUsedPercent}
              />
              <LeaveMetricCard
                balance={totalSickBalance}
                capacity={sickCapacity}
                label="Sick Leave"
                tone="from-rose-300 to-orange-200"
                used={totalSickUsed}
                usedPercent={sickUsedPercent}
              />
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#064b36]">Leave Balance</p>
              <h3 className="mt-2 text-xl font-semibold text-[#15372b]">Employee wise summary</h3>
            </div>
            <div className="flex items-center gap-2">
              {canToggleScope ? (
                <div className="rounded-full bg-[#eff6df] p-1">
                  {scopeOptions.map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => onScopeChange(value)}
                      className={`rounded-full px-3 py-1 text-xs font-black transition ${scope === value ? "bg-[#064b36] text-white shadow-sm" : "text-[#064b36]"}`}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="rounded-full bg-[#eff6df] px-3 py-1 text-xs font-bold text-[#064b36]">{summaries.length} people</div>
            </div>
          </div>

          <div className="mt-4 max-h-80 overflow-y-auto pr-1">
            <table className="min-w-full overflow-hidden rounded-2xl">
              <thead className="sticky top-0 bg-[#064b36]">
                <tr>
                  {["Employee", "Paid", "Sick"].map((heading) => (
                    <th key={heading} className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest text-white">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaries.map((person) => (
                  <tr key={person.email || person.name} className="border-b border-slate-100 transition hover:bg-[#eff6df]">
                    <td className="px-3 py-3">
                      <p className="text-sm font-semibold text-[#15372b]">{person.name}</p>
                      <p className="text-xs text-slate-400">{person.teamName || person.department || "Team"}</p>
                    </td>
                    <td className="px-3 py-3">
                      <LeaveMiniBar balance={person.paidBalance} limit={leaveEntitlements.paid_leave} used={person.paidUsed} />
                    </td>
                    <td className="px-3 py-3">
                      <LeaveMiniBar balance={person.sickBalance} limit={leaveEntitlements.sick_leave} used={person.sickUsed} danger />
                    </td>
                  </tr>
                ))}
                {!summaries.length ? (
                  <tr>
                    <td className="px-2 py-8 text-sm font-semibold text-slate-500" colSpan="3">No leave data available yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaveMetricCard({ balance, capacity, label, tone, used, usedPercent }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs font-semibold text-lime-50/80">{used} used</p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-4xl font-semibold">{balance}</p>
          <p className="text-xs font-semibold text-lime-50/75">balance of {capacity}</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/10 p-2">
          <div className={`h-full rounded-xl bg-gradient-to-br ${tone}`} />
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${usedPercent}%` }} />
      </div>
    </div>
  );
}

function LeaveMiniBar({ balance, danger = false, limit, used }) {
  const percent = Math.min(100, (used / limit) * 100);
  const color = danger ? "from-rose-500 to-orange-400" : "from-[#064b36] to-[#bfff2f]";

  return (
    <div className="min-w-32">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        <span className="text-slate-700">{used}/{limit} used</span>
        <span className={balance <= 2 ? "text-rose-600" : "text-[#064b36]"}>{balance} left</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function HolidaySpotlight({
  canManage,
  deletingHolidayId,
  editingHolidayId,
  holidayForm,
  holidayMessage,
  holidaySaving,
  holidays,
  nextHoliday,
  onDelete,
  onEdit,
  onFormChange,
  onReset,
  onSave
}) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(holidays.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const visibleHolidays = holidays.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function goToPage(nextPage) {
    setPage(Math.min(totalPages, Math.max(1, nextPage)));
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70" style={{ animation: "slideFade 260ms ease-out" }}>
      <div className="grid gap-4 2xl:grid-cols-[0.85fr_1.15fr]">
        <div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-[#064b36]">
          <img
            alt={`${nextHoliday?.name || "Company"} holiday`}
            className="absolute inset-0 h-full w-full object-cover opacity-95"
            src={nextHoliday ? holidayImageSrc(nextHoliday) : holidayImageSrc({ name: "Holiday", imageKey: "festival" })}
            style={{ animation: "floatHoliday 5s ease-in-out infinite" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-900/20 to-transparent" />
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#15372b] shadow-sm">
              <CalendarPlus size={14} />
              Next Holiday
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              {nextHoliday?.day || "Upcoming"}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h2 className="text-3xl font-semibold">{nextHoliday?.name || "Holiday"}</h2>
            <p className="mt-2 text-sm font-semibold text-lime-50">{nextHoliday ? formatHolidayDate(nextHoliday.date) : "Loading date"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#eff6df] px-3 py-1 text-xs font-semibold text-[#064b36]">
                <CalendarPlus size={14} />
                Holiday Calendar
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[#15372b]">Upcoming company holiday</h3>
            </div>
          </div>

          {canManage ? (
            <div className="rounded-2xl border border-emerald-900/10 bg-[#eff6df] p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#064b36] focus:ring-4 focus:ring-emerald-900/10"
                  placeholder="Holiday name"
                  value={holidayForm.name}
                  onChange={(event) => onFormChange("name", event.target.value)}
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#064b36] focus:ring-4 focus:ring-emerald-900/10"
                  type="date"
                  value={holidayForm.date}
                  onChange={(event) => onFormChange("date", event.target.value)}
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#064b36] focus:ring-4 focus:ring-emerald-900/10"
                  placeholder="Day"
                  value={holidayForm.day}
                  onChange={(event) => onFormChange("day", event.target.value)}
                />
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                  <Image size={16} className="text-slate-400" />
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder="GIF URL or festival style"
                    value={holidayForm.imageKey}
                    onChange={(event) => onFormChange("imageKey", event.target.value)}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={onSave}
                  disabled={holidaySaving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#064b36] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-[#0b5d43] disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                >
                  {holidaySaving ? <Loader2 size={17} className="animate-spin" /> : editingHolidayId ? <Save size={17} /> : <Plus size={17} />}
                  {editingHolidayId ? "Update Holiday" : "Add Holiday"}
                </button>
                {editingHolidayId ? (
                  <button onClick={onReset} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50" type="button">
                    Cancel
                  </button>
                ) : null}
              </div>
              {holidayMessage ? <p className="mt-3 text-sm font-semibold text-[#064b36]">{holidayMessage}</p> : null}
            </div>
          ) : null}

          <div className="space-y-2">
            {visibleHolidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-100 hover:shadow-md">
                <div>
                  <p className="text-sm font-semibold text-[#15372b]">{holiday.name}</p>
                  <p className="text-xs text-slate-500">{formatHolidayDate(holiday.date)}</p>
                </div>
                {canManage ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(holiday)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-[#064b36]" type="button" title="Edit holiday" aria-label={`Edit ${holiday.name}`}>
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => onDelete(holiday)}
                      disabled={deletingHolidayId === holiday.id}
                      className="rounded-lg border border-rose-100 p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      title="Delete holiday"
                      aria-label={`Delete ${holiday.name}`}
                    >
                      {deletingHolidayId === holiday.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-emerald-900/10 bg-[#eff6df] px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                aria-label="Previous holiday page"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                aria-label="Next holiday page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceLeave;
