import { Building2, Download, Network, Search, UserRound, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getEngagementPeople } from "../services/api";

const tabs = [
  { value: "me", label: "Me", icon: UserRound },
  { value: "team", label: "My Team", icon: UsersRound },
  { value: "all", label: "All", icon: Network }
];

function normalizeEmail(email = "") {
  return email.toLowerCase().trim();
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

function buildTree(people) {
  const byEmail = new Map(people.map((person) => [normalizeEmail(person.email), { ...person, children: [] }]));
  const roots = [];

  byEmail.forEach((person) => {
    const managerEmail = normalizeEmail(person.managerEmail);
    const manager = byEmail.get(managerEmail);

    if (manager && manager.email !== person.email) {
      manager.children.push(person);
    } else {
      roots.push(person);
    }
  });

  function sortNode(node) {
    node.children.sort((first, second) => first.name.localeCompare(second.name));
    node.children.forEach(sortNode);
  }

  roots.sort((first, second) => first.name.localeCompare(second.name));
  roots.forEach(sortNode);
  return roots;
}

function filterTree(nodes, query) {
  if (!query.trim()) {
    return nodes;
  }

  const needle = query.toLowerCase();

  return nodes
    .map((node) => {
      const children = filterTree(node.children || [], query);
      const matches = [node.name, node.email, node.designation, node.department, node.teamName].some((value) => value?.toLowerCase().includes(needle));
      return matches || children.length ? { ...node, children } : null;
    })
    .filter(Boolean);
}

function PersonCard({ person, compact = false }) {
  return (
    <div className={`min-w-64 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-lg shadow-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${compact ? "min-w-56" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ backgroundColor: person.avatarColor || "#064b36" }}>
          {getInitials(person.name)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[#15372b]">{person.name}</h3>
          <p className="truncate text-xs font-bold text-slate-500">{person.designation || person.role}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold uppercase tracking-widest text-slate-400">Team</span>
          <span className="truncate font-black text-[#064b36]">{person.teamName || "General"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold uppercase tracking-widest text-slate-400">Dept</span>
          <span className="truncate font-bold text-slate-600">{person.department || "Operations"}</span>
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, depth = 0 }) {
  return (
    <div className="flex flex-col items-center">
      <PersonCard person={node} compact={depth > 1} />
      {node.children?.length ? (
        <>
          <div className="h-7 w-px bg-slate-300" />
          <div className="relative flex gap-6 overflow-x-auto px-3 pb-2">
            <div className="absolute left-8 right-8 top-0 h-px bg-slate-300" />
            {node.children.map((child) => (
              <div key={child.id || child.email} className="relative flex flex-col items-center pt-7">
                <div className="absolute top-0 h-7 w-px bg-slate-300" />
                <TreeNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function FlatTeamView({ manager, members }) {
  return (
    <div className="flex min-w-max flex-col items-center">
      {manager ? <PersonCard person={manager} /> : null}
      {members.length ? (
        <>
          <div className="h-8 w-px bg-slate-300" />
          <div className="relative flex gap-6 px-3">
            <div className="absolute left-8 right-8 top-0 h-px bg-slate-300" />
            {members.map((member) => (
              <div key={member.id || member.email} className="relative pt-8">
                <div className="absolute left-1/2 top-0 h-8 w-px -translate-x-1/2 bg-slate-300" />
                <PersonCard person={member} compact />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-6 text-sm font-bold text-slate-500">
          No direct team members found.
        </div>
      )}
    </div>
  );
}

function OrganizationTree({ currentUser, users = [] }) {
  const [people, setPeople] = useState(users);
  const [activeTab, setActiveTab] = useState("me");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const exportRef = useRef(null);

  useEffect(() => {
    async function loadPeople() {
      setLoading(true);

      try {
        const data = await getEngagementPeople();
        setPeople(data);
      } catch {
        setPeople(users);
      } finally {
        setLoading(false);
      }
    }

    loadPeople();
  }, [users]);

  const currentEmail = normalizeEmail(currentUser.email);
  const peopleByEmail = useMemo(() => new Map(people.map((person) => [normalizeEmail(person.email), person])), [people]);
  const currentPerson = peopleByEmail.get(currentEmail) || currentUser;
  const manager = peopleByEmail.get(normalizeEmail(currentPerson.managerEmail));
  const managerForTeam = currentPerson.role === "manager" ? currentPerson : manager;
  const teamMembers = managerForTeam
    ? people.filter((person) => normalizeEmail(person.managerEmail) === normalizeEmail(managerForTeam.email)).sort((first, second) => first.name.localeCompare(second.name))
    : [currentPerson];

  const meNodes = useMemo(() => {
    if (manager && normalizeEmail(manager.email) !== currentEmail) {
      return [{ ...manager, children: [{ ...currentPerson, children: [] }] }];
    }

    return [{ ...currentPerson, children: [] }];
  }, [currentEmail, currentPerson, manager]);

  const allTree = useMemo(() => filterTree(buildTree(people), query), [people, query]);

  async function downloadJpg() {
    const element = exportRef.current;

    if (!element) {
      return;
    }

    const width = Math.max(element.scrollWidth, element.clientWidth, 1200);
    const height = Math.max(element.scrollHeight, element.clientHeight, 700);
    const serialized = new XMLSerializer().serializeToString(element.cloneNode(true));
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;min-height:${height}px;background:#f8faf7;font-family:Arial,sans-serif;padding:24px;box-sizing:border-box;">
            ${serialized}
          </div>
        </foreignObject>
      </svg>
    `;
    const image = new Image();
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#f8faf7";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0);
      URL.revokeObjectURL(svgUrl);

      const link = document.createElement("a");
      link.download = `aagarg-organization-${activeTab}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.92);
      link.click();
    };

    image.src = svgUrl;
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-[#064b36] bg-[#064b36] p-6 text-white shadow-xl shadow-emerald-900/25">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#bfff2f]">AAGarg Organization</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Organization hierarchy</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Understand reporting lines, managers, teams, and the complete organization structure from employee records.
            </p>
          </div>
          <div className="rounded-2xl border border-[#bfff2f]/60 bg-[#bfff2f] px-5 py-4 text-[#064b36]">
            <p className="text-xs font-black uppercase tracking-widest">People</p>
            <p className="mt-1 text-3xl font-black">{people.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                    active ? "bg-[#064b36] text-white shadow-lg shadow-emerald-900/15" : "bg-[#eff6df] text-[#064b36] hover:bg-[#bfff2f]"
                  }`}
                  type="button"
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8f4] px-4 py-3 focus-within:border-[#064b36] focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-900/10 xl:w-96">
            <Search size={18} className="text-slate-400" />
            <input className="w-full bg-transparent text-sm font-bold outline-none" placeholder="Search employee" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button onClick={downloadJpg} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#064b36] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-[#0b5d43]" type="button">
            <Download size={18} />
            Download JPG
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#f8faf7] shadow-xl shadow-slate-200/70">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#064b36] text-white">
              <Building2 size={20} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#064b36]">{tabs.find((tab) => tab.value === activeTab)?.label}</p>
              <h2 className="text-xl font-black text-[#15372b]">Hierarchy view</h2>
            </div>
          </div>
          {loading ? <span className="rounded-full bg-[#eff6df] px-4 py-2 text-xs font-black text-[#064b36]">Loading</span> : null}
        </div>

        <div ref={exportRef} className="min-h-[520px] overflow-auto p-8">
          <div className="flex min-w-max justify-center" style={{ animation: "slideFade 260ms ease-out" }}>
            {activeTab === "me" ? (
              <div className="flex gap-8">{meNodes.map((node) => <TreeNode key={node.id || node.email} node={node} />)}</div>
            ) : null}

            {activeTab === "team" ? <FlatTeamView manager={managerForTeam} members={teamMembers} /> : null}

            {activeTab === "all" ? (
              allTree.length ? (
                <div className="flex gap-12">{allTree.map((node) => <TreeNode key={node.id || node.email} node={node} />)}</div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-sm font-bold text-slate-500">No employees match your search.</div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrganizationTree;
