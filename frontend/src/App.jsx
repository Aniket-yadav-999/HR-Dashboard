import { AlertCircle, Loader2, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import AdminPanel from "./components/AdminPanel";
import AssetManagement from "./components/AssetManagement";
import AttendanceLeave from "./components/AttendanceLeave";
import EmployeeEngagement from "./components/EmployeeEngagement";
import EmployeeIdCard from "./components/EmployeeIdCard";
import EmployeeOverview from "./components/EmployeeOverview";
import HelpdeskRequests from "./components/HelpdeskRequests";
import LoginModal from "./components/LoginModal";
import NotificationsPanel from "./components/NotificationsPanel";
import OrganizationTree from "./components/OrganizationTree";
import ReportsAnalytics from "./components/ReportsAnalytics";
import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import { deleteUser, getNotifications, getProfile, getUsers, logout } from "./services/api";

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [createEmployeeOpen, setCreateEmployeeOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadUsers() {
    setUsersLoading(true);
    setError("");

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load employees");
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("a2g_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getProfile();
        setUser(profile);
        await loadUsers();
        await loadNotifications();
      } catch {
        localStorage.removeItem("a2g_token");
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function handleAuthenticated(authenticatedUser) {
    setUser(authenticatedUser);
    await loadUsers();
    await loadNotifications();
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Local session cleanup still matters if the server session is already gone.
    }

    localStorage.removeItem("a2g_token");
    setUser(null);
    setUsers([]);
    setNotifications([]);
  }

  function handleUserCreated(createdUser) {
    setUsers((current) => [createdUser, ...current]);
  }

  function handleUserUpdated(updatedUser) {
    setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
    setEditingUser(null);
  }

  async function handleDeleteUser(userToDelete) {
    const confirmed = window.confirm(`Delete ${userToDelete.name}?`);

    if (!confirmed) {
      return;
    }

    await deleteUser(userToDelete.id);
    setUsers((current) => current.filter((item) => item.id !== userToDelete.id));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-[#f8f4ea] px-5 py-4 text-sm font-semibold text-[#15372b] shadow-lg shadow-emerald-900/10">
          <Loader2 className="animate-spin text-[#064b36]" size={20} />
          Loading HR workspace
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {user ? (
        <TopNavbar
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          notifications={notifications}
          onNotificationsClick={() => setActiveView("notifications")}
          onLoginClick={() => setLoginOpen(true)}
          onLogout={handleLogout}
          onProfileClick={() => setActiveView("profile")}
        />
      ) : null}

      <div className="flex">
        {user ? (
          <Sidebar
            collapsed={sidebarCollapsed}
            activeView={activeView}
            onViewChange={setActiveView}
            onToggle={() => setSidebarCollapsed((current) => !current)}
          />
        ) : null}
        <section
          className={`min-w-0 flex-1 px-4 py-6 transition-all duration-300 sm:px-6 lg:px-8 ${
            user ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-72") : ""
          }`}
        >
          {!user ? (
            <LoginModal embedded onClose={() => setLoginOpen(false)} onAuthenticated={handleAuthenticated} />
          ) : (
            <div className="space-y-6">
              {activeView === "overview" ? <div className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-[#064b36] bg-[#064b36] p-6 shadow-xl shadow-emerald-900/25 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#bfff2f]">HR Command Center</p>
                  <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Welcome, {user.name}</h1>
                  <p className="mt-2 text-sm text-emerald-50/80">Review workforce health and manage employee access.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {["admin", "hr"].includes(user.role) ? (
                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setCreateEmployeeOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064b36] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-[#0b5d43]"
                      type="button"
                    >
                      <Plus size={18} />
                      Create Employee
                    </button>
                  ) : null}
                  <button
                    onClick={loadUsers}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#bfff2f] bg-[#bfff2f] px-4 py-3 text-sm font-bold text-[#064b36] shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5"
                    type="button"
                  >
                    <RefreshCw size={17} className={usersLoading ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>
              </div> : null}

              {error ? (
                <div className="flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  <AlertCircle size={18} />
                  {error}
                </div>
              ) : null}

              {activeView === "overview" ? (
                <EmployeeOverview
                  users={users}
                  currentUser={user}
                  onEditUser={(selectedUser) => {
                    setEditingUser(selectedUser);
                    setCreateEmployeeOpen(true);
                  }}
                  onDeleteUser={handleDeleteUser}
                />
              ) : null}
              {activeView === "reports" ? <ReportsAnalytics currentUser={user} users={users} /> : null}
              {activeView === "attendance" ? <AttendanceLeave user={user} users={users} onSubmitted={loadNotifications} /> : null}
              {activeView === "engagement" ? <EmployeeEngagement currentUser={user} users={users} onChanged={loadNotifications} /> : null}
              {activeView === "organization" ? <OrganizationTree currentUser={user} users={users} /> : null}
              {activeView === "assets" ? <AssetManagement currentUser={user} users={users} onChanged={loadNotifications} /> : null}
              {activeView === "helpdesk" ? <HelpdeskRequests currentUser={user} onChanged={loadNotifications} /> : null}
              {activeView === "notifications" ? <NotificationsPanel notifications={notifications} /> : null}
              {activeView === "profile" ? <EmployeeIdCard user={user} /> : null}
            </div>
          )}
        </section>
      </div>

      {loginOpen ? <LoginModal onClose={() => setLoginOpen(false)} onAuthenticated={handleAuthenticated} /> : null}
      <AdminPanel
        currentUser={user}
        open={createEmployeeOpen}
        editingUser={editingUser}
        onClose={() => setCreateEmployeeOpen(false)}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
    </main>
  );
}

export default App;
