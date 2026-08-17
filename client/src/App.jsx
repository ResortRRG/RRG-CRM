import { useState, useEffect, useRef, useCallback } from "react";
import "./storageClient.js";
import {
  Plus,
  Search,
  X,
  Building2,
  Mail,
  Phone,
  Trash2,
  User,
  Users,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  TrendingUp,
  Wallet,
  LayoutGrid,
  CalendarDays,
  ClipboardList,
  RotateCcw,
  Undo2,
  BarChart3,
  Download,
  Settings,
  Tag,
  Eye,
  EyeOff,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales", icon: TrendingUp },
  { id: "salesentry", label: "New Sale", icon: Plus },
  { id: "leads", label: "All Leads", icon: ClipboardList },
  { id: "employees", label: "Employees", icon: Users },
  { id: "rrgboard", label: "RRG Board", icon: LayoutGrid },
  { id: "payroll", label: "Payroll", icon: Wallet },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "admin", label: "Admin / Settings", icon: Settings },
];

const ROLES = [
  { id: "admin", label: "Admin" },
  { id: "manager", label: "Manager" },
  { id: "rep", label: "Rep" },
];

const ROLE_COLORS = {
  admin: { bg: "#F3E9DA", text: "#8A5A1E" },
  manager: { bg: "#E1EAF5", text: "#2A5488" },
  rep: { bg: "#E7EFEA", text: "#2D5F4C" },
};

const DEFAULT_SOURCES = ["Dialer", "Paper"];
const DEFAULT_LEAD_SOURCES = ["Monster", "PGR"];
const DEFAULT_LEAD_CATEGORIES = ["Monster", "PGR", "Chargeback", "Declined"];
const SALE_STATUSES = ["Approved", "Declined"];
const DEFAULT_MIN_WEEKLY_PAY = 400;
const DEFAULT_COMPANY_NAME = "RRG CRM";

const CATEGORY_COLOR_MAP = {
  Monster: { bg: "#F3E9DA", color: "#8A5A1E" },
  PGR: { bg: "#E1EAF5", color: "#2A5488" },
  Chargeback: { bg: "#FCE9D6", color: "#B8763E" },
  Declined: { bg: "#FCEBEB", color: "#A32D2D" },
};
function categoryColor(name) {
  return CATEGORY_COLOR_MAP[name] || { bg: "#E6E2D6", color: "#767468" };
}

const DEFAULT_SETTINGS = {
  companyName: DEFAULT_COMPANY_NAME,
  minWeeklyPay: DEFAULT_MIN_WEEKLY_PAY,
  sources: DEFAULT_SOURCES,
  leadSources: DEFAULT_LEAD_SOURCES,
  leadCategories: DEFAULT_LEAD_CATEGORIES,
};

// Which sidebar sections each account role can see and use.
// Only roles listed here are RESTRICTED — any role not listed (including
// unknown/future roles) defaults to full access, so this can never
// accidentally lock an admin or existing user out of everything.
const ROLE_PERMISSIONS = {
  rep: ["salesentry"],
};
function getAllowedSections(role) {
  if (ROLE_PERMISSIONS[role]) return ROLE_PERMISSIONS[role];
  return NAV_ITEMS.map((n) => n.id);
}

const ATTENDANCE_STATUSES = [
  { id: "late", label: "Late", color: "#B8763E" },
  { id: "left_early", label: "Left early", color: "#8A5A1E" },
  { id: "absent", label: "Absent", color: "#767468" },
];

const SALE_TYPES = [
  { id: "front", label: "Front", color: "#2B2B28" },
  { id: "close", label: "Close", color: "#1E8E4A" },
  { id: "verification", label: "Verification", color: "#B23B3B" },
];

const REFUND_TARGET_OPTIONS = [
  { id: "front", label: "Opener" },
  { id: "close", label: "Closer" },
  { id: "verification", label: "Verification" },
];

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SALE_REQUIRED_FIELDS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone number" },
  { key: "email", label: "Email address" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip code" },
  { key: "packagePrice", label: "Package price" },
  { key: "dateFlex", label: "Date flex price" },
  { key: "password", label: "Password" },
  { key: "genieNumber", label: "Genie #" },
  { key: "openerId", label: "Opener" },
  { key: "closerId", label: "Closer" },
  { key: "verificationId", label: "Verification" },
  { key: "source", label: "Source" },
  { key: "leadSubmittedTo", label: "Submitted to" },
  { key: "status", label: "Status" },
];

const DEFAULT_EMPLOYEE_NAMES = [
  "Lisa Dombi",
  "Cristina Rossi",
  "Nick Pelloni",
  "Cheyenne Woodring",
  "Allan Lund",
  "Cotey Kewley",
  "Kasha Mosley",
  "Tory Brush",
  "David Cohen",
  "Robert Lott",
  "Christopher Spink",
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function nowLocalInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function blankSale() {
  return {
    timestamp: nowLocalInput(),
    name: "",
    spouseName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    packagePrice: "",
    dateFlex: "",
    password: "",
    totalPrice: "",
    genieNumber: "",
    openerId: "",
    closerId: "",
    verificationId: "",
    source: "",
    leadSubmittedTo: "",
    status: "",
    leadCategory: "",
    notes: "",
  };
}

function formatTimestamp(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function getWeekRange(offset) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun ... 6 = Sat
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);
  return { start: monday, end: saturday };
}

function formatWeekLabel(start, end) {
  const opts = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function getMonthRange(offset) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function formatMonthLabel(start) {
  return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getYearRange(offset) {
  const now = new Date();
  const year = now.getFullYear() + offset;
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

function formatYearLabel(start) {
  return String(start.getFullYear());
}

function isSaleInRange(sale, start, end) {
  if (!sale.timestamp) return false;
  const d = new Date(sale.timestamp);
  if (isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

function dateInRange(dateStr, start, end) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

function getWeekdayIndex(dateObj) {
  const day = dateObj.getDay(); // 0 Sun ... 6 Sat
  const idx = (day + 6) % 7; // 0 Mon ... 6 Sun
  return idx <= 5 ? idx : null;
}

// Package price splits 50/50 between opener and closer; date flex price goes entirely to verification.
function saleCredit(sale, employeeId) {
  const pkg = Number(sale.packagePrice) || 0;
  const flex = Number(sale.dateFlex) || 0;
  let credit = 0;
  if (sale.openerId === employeeId) credit += pkg / 2;
  if (sale.closerId === employeeId) credit += pkg / 2;
  if (sale.verificationId === employeeId) credit += flex;
  return credit;
}

function roleCreditAmount(sale, type) {
  const pkg = Number(sale.packagePrice) || 0;
  const flex = Number(sale.dateFlex) || 0;
  if (type === "front" || type === "close") return pkg / 2;
  if (type === "verification") return flex;
  return 0;
}

function employeeIdForRole(sale, roleId) {
  if (roleId === "front") return sale.openerId;
  if (roleId === "close") return sale.closerId;
  if (roleId === "verification") return sale.verificationId;
  return null;
}

// Dollar amount that should be deducted from a given role's credit due to a refund.
function refundImpactForRole(sale, roleId) {
  if (!sale.refunded) return 0;
  if (sale.refundType === "partial") {
    return Number((sale.refundAmounts && sale.refundAmounts[roleId]) || 0);
  }
  return roleCreditAmount(sale, roleId);
}

// Whether a specific role's credit on a sale is affected by a refund.
// Full refunds affect every role; partial refunds only affect roles with a deduction amount entered.
function isEntryRefunded(sale, roleId) {
  if (!sale.refunded) return false;
  if (sale.refundType === "partial") return refundImpactForRole(sale, roleId) > 0;
  return true;
}

function RoleBadge({ role, size }) {
  if (!role) return null;
  const c = ROLE_COLORS[role] || ROLE_COLORS.rep;
  const label = (ROLES.find((r) => r.id === role) || {}).label || role;
  return (
    <span
      style={{
        fontSize: size === "sm" ? 9.5 : 10.5,
        fontWeight: 600,
        color: c.text,
        background: c.bg,
        padding: size === "sm" ? "1px 6px" : "2px 7px",
        borderRadius: 20,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export default function TeamCRM() {
  const [section, setSection] = useState("dashboard");
  const [view, setView] = useState("salesform");
  const [contacts, setContacts] = useState([]);
  const [sales, setSales] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [payrollOverrides, setPayrollOverrides] = useState({});
  const [attendance, setAttendance] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [users, setUsers] = useState([]);
  const [gateNameInput, setGateNameInput] = useState("");
  const [gateUsernameInput, setGateUsernameInput] = useState("");
  const [gatePasswordInput, setGatePasswordInput] = useState("");
  const [showGatePassword, setShowGatePassword] = useState(false);
  const [gateError, setGateError] = useState("");
  const [search, setSearch] = useState("");
  const [contactModal, setContactModal] = useState(null); // null | 'new' | contact object
  const [saleModal, setSaleModal] = useState(null);
  const [entryJustSaved, setEntryJustSaved] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // {type, id, label}
  const [viewer, setViewer] = useState({ name: "", role: "rep" });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [myItemsOnly, setMyItemsOnly] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dashboardFilterMode, setDashboardFilterMode] = useState("week"); // 'week' | 'month' | 'year' | 'all'
  const [dashboardMonthOffset, setDashboardMonthOffset] = useState(0);
  const [dashboardYearOffset, setDashboardYearOffset] = useState(0);
  const [rrgWeekOffset, setRrgWeekOffset] = useState(0);
  const [payrollWeekOffset, setPayrollWeekOffset] = useState(0);
  const [reportsFilterMode, setReportsFilterMode] = useState("month"); // 'week' | 'month' | 'year' | 'all'
  const [reportsWeekOffset, setReportsWeekOffset] = useState(0);
  const [reportsMonthOffset, setReportsMonthOffset] = useState(0);
  const [reportsYearOffset, setReportsYearOffset] = useState(0);
  const [employeeDetailId, setEmployeeDetailId] = useState(null);
  const [employeesView, setEmployeesView] = useState("active"); // 'active' | 'exemployees'
  const [employeeDetailWeekOffset, setEmployeeDetailWeekOffset] = useState(0);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsFilterMode, setLeadsFilterMode] = useState("all"); // 'week' | 'month' | 'year' | 'all'
  const [leadsCategoryFilter, setLeadsCategoryFilter] = useState(""); // '' | 'Monster' | 'PGR' | 'Chargeback' | 'Declined'
  const [adminNewSource, setAdminNewSource] = useState("");
  const [adminNewLeadSource, setAdminNewLeadSource] = useState("");
  const [adminNewCategory, setAdminNewCategory] = useState("");
  const [adminSaved, setAdminSaved] = useState(false);
  const [userModal, setUserModal] = useState(null);
  const [userFormError, setUserFormError] = useState("");
  const [leadsWeekOffset, setLeadsWeekOffset] = useState(0);
  const [leadsMonthOffset, setLeadsMonthOffset] = useState(0);
  const [leadsYearOffset, setLeadsYearOffset] = useState(0);
  const [confirmRefund, setConfirmRefund] = useState(null); // full sale object being refunded, or null
  const [refundType, setRefundType] = useState("full");
  const [refundAmounts, setRefundAmounts] = useState({ front: "", close: "", verification: "" });
  const saveTimer = useRef(null);

  useEffect(() => {
    if (confirmRefund) {
      setRefundType("full");
      setRefundAmounts({ front: "", close: "", verification: "" });
    }
  }, [confirmRefund]);

  // ---- load ----
  async function loadAppData() {
    try {
      const c = await window.storage.get("crm:contacts", true);
      setContacts(c && c.value ? JSON.parse(c.value) : []);
    } catch (e) {
      setContacts([]);
    }
    try {
      const s = await window.storage.get("crm:sales", true);
      setSales(s && s.value ? JSON.parse(s.value) : []);
    } catch (e) {
      setSales([]);
    }
    try {
      const emp = await window.storage.get("crm:employees", true);
      const loadedEmployees = emp && emp.value ? JSON.parse(emp.value) : [];
      if (loadedEmployees.length === 0) {
        const seeded = DEFAULT_EMPLOYEE_NAMES.map((name) => ({
          id: uid(),
          name,
          role: "rep",
          phone: "",
          email: "",
          notes: "",
          active: true,
          createdAt: Date.now(),
        }));
        setEmployees(seeded);
        window.storage.set("crm:employees", JSON.stringify(seeded), true).catch(() => {});
      } else {
        setEmployees(loadedEmployees);
      }
    } catch (e) {
      setEmployees([]);
    }
    try {
      const po = await window.storage.get("crm:payrollOverrides", true);
      setPayrollOverrides(po && po.value ? JSON.parse(po.value) : {});
    } catch (e) {
      setPayrollOverrides({});
    }
    try {
      const att = await window.storage.get("crm:attendance", true);
      setAttendance(att && att.value ? JSON.parse(att.value) : {});
    } catch (e) {
      setAttendance({});
    }
    try {
      const st = await window.storage.get("crm:settings", true);
      setSettings(st && st.value ? { ...DEFAULT_SETTINGS, ...JSON.parse(st.value) } : DEFAULT_SETTINGS);
    } catch (e) {
      setSettings(DEFAULT_SETTINGS);
    }
    try {
      const v = await window.storage.get("crm:viewer", false);
      if (v && v.value) setViewer(JSON.parse(v.value));
    } catch (e) {
      // no saved viewer yet
    }
    setLoaded(true);
  }

  useEffect(() => {
    loadAppData();
  }, []);

  // Every window.storage call above requires an authenticated session. On a
  // brand-new login (no session cookie yet when the page first mounted),
  // that first load attempt fails silently and leaves everything empty —
  // so re-run it as soon as we know who's actually signed in.
  useEffect(() => {
    if (currentUser) {
      loadAppData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser && currentUser.id]);

  // Multiple people use this CRM at once, but the data only loads once on
  // page load — without this, you'd never see a teammate's changes unless
  // you knew to manually refresh. So: re-check for updates whenever this
  // tab regains focus, and every couple minutes while it's just sitting open.
  useEffect(() => {
    if (!currentUser) return;
    function handleFocus() {
      loadAppData();
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") loadAppData();
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(loadAppData, 120000); // every 2 minutes
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser && currentUser.id]);

  // ---- real auth (separate from the app-data load above) ----
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        const me = await meRes.json();
        if (me.user) {
          setCurrentUser(me.user);
        } else {
          const setupRes = await fetch("/api/auth/needs-setup");
          const setupData = await setupRes.json();
          setNeedsSetup(!!setupData.needsSetup);
        }
      } catch (e) {
        setGateError("Couldn't reach the server. Check your connection and try again.");
      }
      setAuthChecked(true);
    })();
  }, []);

  // If a role's allowed sections don't include the current tab (e.g. right
  // after logging in as a restricted account), send them to a tab they can
  // actually see. Only runs when the signed-in user changes, so it never
  // fights normal navigation.
  useEffect(() => {
    if (!currentUser) return;
    const allowed = getAllowedSections(currentUser.role);
    if (!allowed.includes(section)) {
      setSection(allowed[0] || "dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser && currentUser.id, currentUser && currentUser.role]);

  async function refreshUsers() {
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      // ignore
    }
  }
  useEffect(() => {
    if (currentUser) refreshUsers();
  }, [currentUser && currentUser.id]);

  function updateViewer(next) {
    setViewer(next);
    window.storage.set("crm:viewer", JSON.stringify(next), false).catch(() => {});
  }

  async function attemptUnlock() {
    setGateError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: gateUsernameInput, password: gatePasswordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGateError(data.error || "Incorrect username or password");
        return;
      }
      setCurrentUser(data.user);
    } catch (e) {
      setGateError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  async function completeSetup() {
    setGateError("");
    if (!gateNameInput.trim() || !gateUsernameInput.trim() || !gatePasswordInput.trim()) {
      setGateError("Fill out your name, username, and password first.");
      return;
    }
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: gateNameInput, username: gateUsernameInput, password: gatePasswordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGateError(data.error || "Something went wrong setting up your account.");
        return;
      }
      setCurrentUser(data.user);
      setNeedsSetup(false);
    } catch (e) {
      setGateError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  async function logOut() {
    setGateUsernameInput("");
    setGatePasswordInput("");
    setGateNameInput("");
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
  }

  const persist = useCallback((nextContacts, nextSales, nextEmployees, nextOverrides, nextAttendance, nextSettings) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        if (nextContacts) await window.storage.set("crm:contacts", JSON.stringify(nextContacts), true);
        if (nextSales) await window.storage.set("crm:sales", JSON.stringify(nextSales), true);
        if (nextEmployees) await window.storage.set("crm:employees", JSON.stringify(nextEmployees), true);
        if (nextOverrides) await window.storage.set("crm:payrollOverrides", JSON.stringify(nextOverrides), true);
        if (nextAttendance) await window.storage.set("crm:attendance", JSON.stringify(nextAttendance), true);
        if (nextSettings) await window.storage.set("crm:settings", JSON.stringify(nextSettings), true);
      } catch (e) {
        console.error("save failed", e);
      }
    }, 250);
  }, []);

  function updateContacts(next) {
    setContacts(next);
    persist(next, null, null, null, null, null);
  }
  function updateSales(next) {
    setSales(next);
    persist(null, next, null, null, null, null);
  }
  function updateEmployees(next) {
    setEmployees(next);
    persist(null, null, next, null, null, null);
  }
  function updatePayrollOverrides(next) {
    setPayrollOverrides(next);
    persist(null, null, null, next, null, null);
  }
  function updateAttendance(next) {
    setAttendance(next);
    persist(null, null, null, null, next, null);
  }
  function updateSettings(next) {
    setSettings(next);
    persist(null, null, null, null, null, next);
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 1500);
  }

  function addListItem(listKey, value, clearInput) {
    const v = value.trim();
    if (!v) return;
    if (settings[listKey].some((x) => x.toLowerCase() === v.toLowerCase())) {
      clearInput("");
      return;
    }
    updateSettings({ ...settings, [listKey]: [...settings[listKey], v] });
    clearInput("");
  }
  function removeListItem(listKey, value) {
    updateSettings({ ...settings, [listKey]: settings[listKey].filter((x) => x !== value) });
  }

  function payrollOverrideKey(employeeId, weekStart) {
    return employeeId + "__" + weekStart.toISOString().slice(0, 10);
  }
  function getPayrollOverride(employeeId, weekStart) {
    const key = payrollOverrideKey(employeeId, weekStart);
    return payrollOverrides[key] !== undefined ? payrollOverrides[key] : null;
  }
  function setPayrollOverrideValue(employeeId, weekStart, value) {
    const key = payrollOverrideKey(employeeId, weekStart);
    if (value === "" || value === null) {
      const next = { ...payrollOverrides };
      delete next[key];
      updatePayrollOverrides(next);
    } else {
      updatePayrollOverrides({ ...payrollOverrides, [key]: Number(value) || 0 });
    }
  }
  function clearPayrollOverride(employeeId, weekStart) {
    const key = payrollOverrideKey(employeeId, weekStart);
    const next = { ...payrollOverrides };
    delete next[key];
    updatePayrollOverrides(next);
  }

  function attendanceKey(employeeId, date) {
    return employeeId + "__" + date.toISOString().slice(0, 10);
  }
  function getAttendance(employeeId, date) {
    const key = attendanceKey(employeeId, date);
    return attendance[key] || "";
  }
  function setAttendanceValue(employeeId, date, status) {
    const key = attendanceKey(employeeId, date);
    if (!status) {
      const next = { ...attendance };
      delete next[key];
      updateAttendance(next);
    } else {
      updateAttendance({ ...attendance, [key]: status });
    }
  }

  // ---- derived ----
  const q = search.trim().toLowerCase();
  const vName = viewer.name.trim().toLowerCase();
  const filteredContacts = contacts.filter((c) => {
    if (myItemsOnly && vName && (c.owner || "").trim().toLowerCase() !== vName) return false;
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });
  const contactById = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const employeeById = Object.fromEntries(employees.map((e) => [e.id, e]));

  const totalSalesValue = sales.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0);

  let dashboardRange = null;
  let dashboardRangeLabel = "";
  if (dashboardFilterMode === "week") {
    const w = getWeekRange(weekOffset);
    dashboardRange = w;
    dashboardRangeLabel = formatWeekLabel(w.start, w.end);
  } else if (dashboardFilterMode === "month") {
    const m = getMonthRange(dashboardMonthOffset);
    dashboardRange = m;
    dashboardRangeLabel = formatMonthLabel(m.start);
  } else if (dashboardFilterMode === "year") {
    const y = getYearRange(dashboardYearOffset);
    dashboardRange = y;
    dashboardRangeLabel = formatYearLabel(y.start);
  }
  const dashboardSales = dashboardRange ? sales.filter((s) => isSaleInRange(s, dashboardRange.start, dashboardRange.end)) : sales;
  // Sales don't count toward source totals or dashboard visibility until they're
  // marked Approved — a pending or declined sale shows as $0 here regardless of
  // which source it's tagged with, until someone approves it.
  const dashboardApprovedSales = dashboardSales.filter((s) => s.status === "Approved");
  function dashboardNavPrev() {
    if (dashboardFilterMode === "week") setWeekOffset((w) => w - 1);
    else if (dashboardFilterMode === "month") setDashboardMonthOffset((m) => m - 1);
    else if (dashboardFilterMode === "year") setDashboardYearOffset((y) => y - 1);
  }
  function dashboardNavNext() {
    if (dashboardFilterMode === "week") setWeekOffset((w) => w + 1);
    else if (dashboardFilterMode === "month") setDashboardMonthOffset((m) => m + 1);
    else if (dashboardFilterMode === "year") setDashboardYearOffset((y) => y + 1);
  }
  function dashboardNavReset() {
    if (dashboardFilterMode === "week") setWeekOffset(0);
    else if (dashboardFilterMode === "month") setDashboardMonthOffset(0);
    else if (dashboardFilterMode === "year") setDashboardYearOffset(0);
  }
  const dashboardNavIsCurrent =
    (dashboardFilterMode === "week" && weekOffset === 0) ||
    (dashboardFilterMode === "month" && dashboardMonthOffset === 0) ||
    (dashboardFilterMode === "year" && dashboardYearOffset === 0);

  const salesBySource = settings.leadSources.map((src) => {
    const rows = dashboardApprovedSales.filter((s) => s.leadSubmittedTo === src);
    return {
      source: src,
      count: rows.length,
      total: rows.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0),
    };
  });
  const declinedSales = dashboardSales.filter((s) => s.status === "Declined");

  function salesForEmployee(employeeId) {
    if (!employeeId) return [];
    return sales.filter(
      (s) => s.openerId === employeeId || s.closerId === employeeId || s.verificationId === employeeId
    );
  }

  const activeEmployees = employees.filter((e) => e.active !== false);
  const exEmployees = employees.filter((e) => e.active === false);

  const rrg = getWeekRange(rrgWeekOffset);
  const rrgLabel = formatWeekLabel(rrg.start, rrg.end);
  const rrgDayDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(rrg.start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const rrgWeekSales = sales.filter((s) => isSaleInRange(s, rrg.start, rrg.end) && s.status === "Approved");
  const rrgBoard = activeEmployees.map((emp) => {
    const days = Array.from({ length: 6 }, () => []);
    rrgWeekSales.forEach((s) => {
      const idx = getWeekdayIndex(new Date(s.timestamp));
      if (idx === null) return;
      if (s.openerId === emp.id) days[idx].push({ sale: s, type: "front", amount: roleCreditAmount(s, "front") });
      if (s.closerId === emp.id) days[idx].push({ sale: s, type: "close", amount: roleCreditAmount(s, "close") });
      if (s.verificationId === emp.id)
        days[idx].push({ sale: s, type: "verification", amount: roleCreditAmount(s, "verification") });
    });
    const weekTotal = days.flat().reduce((sum, e) => sum + e.amount, 0);
    return { employee: emp, days, weekTotal };
  });
  const rrgDailyTotals = Array.from({ length: 6 }, (_, i) =>
    rrgBoard.reduce((sum, row) => sum + row.days[i].reduce((s2, e) => s2 + e.amount, 0), 0)
  );
  const rrgWeekGrandTotal = rrgDailyTotals.reduce((a, b) => a + b, 0);

  const payrollWeek = getWeekRange(payrollWeekOffset);
  const payrollWeekLabel = formatWeekLabel(payrollWeek.start, payrollWeek.end);

  const currentWeek = getWeekRange(0);

  let reportsRange = null;
  let reportsRangeLabel = "";
  if (reportsFilterMode === "week") {
    const w = getWeekRange(reportsWeekOffset);
    reportsRange = w;
    reportsRangeLabel = formatWeekLabel(w.start, w.end);
  } else if (reportsFilterMode === "month") {
    const m = getMonthRange(reportsMonthOffset);
    reportsRange = m;
    reportsRangeLabel = formatMonthLabel(m.start);
  } else if (reportsFilterMode === "year") {
    const y = getYearRange(reportsYearOffset);
    reportsRange = y;
    reportsRangeLabel = formatYearLabel(y.start);
  }
  function reportsNavPrev() {
    if (reportsFilterMode === "week") setReportsWeekOffset((w) => w - 1);
    else if (reportsFilterMode === "month") setReportsMonthOffset((m) => m - 1);
    else if (reportsFilterMode === "year") setReportsYearOffset((y) => y - 1);
  }
  function reportsNavNext() {
    if (reportsFilterMode === "week") setReportsWeekOffset((w) => w + 1);
    else if (reportsFilterMode === "month") setReportsMonthOffset((m) => m + 1);
    else if (reportsFilterMode === "year") setReportsYearOffset((y) => y + 1);
  }
  function reportsNavReset() {
    if (reportsFilterMode === "week") setReportsWeekOffset(0);
    else if (reportsFilterMode === "month") setReportsMonthOffset(0);
    else if (reportsFilterMode === "year") setReportsYearOffset(0);
  }
  const reportsNavIsCurrent =
    (reportsFilterMode === "week" && reportsWeekOffset === 0) ||
    (reportsFilterMode === "month" && reportsMonthOffset === 0) ||
    (reportsFilterMode === "year" && reportsYearOffset === 0);

  const reportsSales = reportsRange ? sales.filter((s) => isSaleInRange(s, reportsRange.start, reportsRange.end)) : sales;
  const reportsRefundedSales = reportsRange
    ? sales.filter((s) => s.refunded && dateInRange(s.refundedAt, reportsRange.start, reportsRange.end))
    : sales.filter((s) => s.refunded);

  const reportsTotalSalesValue = reportsSales.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0);
  const reportsTotalPackagePrice = reportsSales.reduce((s, r) => s + (Number(r.packagePrice) || 0), 0);
  const reportsTotalDateFlex = reportsSales.reduce((s, r) => s + (Number(r.dateFlex) || 0), 0);
  const reportsTotalRefunded = reportsRefundedSales.reduce((s, r) => s + (Number(r.refundAmount) || 0), 0);
  const reportsSourceBreakdown = settings.leadSources.map((src) => {
    const rows = reportsSales.filter((s) => s.leadSubmittedTo === src);
    return { source: src, count: rows.length, total: rows.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0) };
  });
  const reportsDeclined = reportsSales.filter((s) => s.status === "Declined");
  const reportsEmployeeRows = activeEmployees
    .map((emp) => {
      const empSales = reportsSales.filter(
        (s) => s.openerId === emp.id || s.closerId === emp.id || s.verificationId === emp.id
      );
      const credited = empSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
      const rate = Number(emp.commissionRate) || 0;
      const refundedCredit = reportsRefundedSales.reduce((sum, s) => {
        if (s.refundType === "partial") {
          let add = 0;
          ["front", "close", "verification"].forEach((roleId) => {
            if (employeeIdForRole(s, roleId) === emp.id) add += refundImpactForRole(s, roleId);
          });
          return sum + add;
        }
        return sum + saleCredit(s, emp.id);
      }, 0);
      const commission = credited * (rate / 100) - refundedCredit * (rate / 100);
      return { employee: emp, salesCount: empSales.length, credited, rate, commission };
    })
    .filter((r) => r.salesCount > 0 || r.rate > 0);
  const reportsTotalCommission = reportsEmployeeRows.reduce((s, r) => s + r.commission, 0);

  function exportReportCSV() {
    const rows = [];
    rows.push(["RRG Team — Business Report"]);
    rows.push(["Period", reportsFilterMode === "all" ? "All time" : reportsRangeLabel]);
    rows.push(["Generated", new Date().toLocaleString("en-US")]);
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total sales", reportsSales.length]);
    rows.push(["Total sales value", reportsTotalSalesValue.toFixed(2)]);
    rows.push(["Total package price", reportsTotalPackagePrice.toFixed(2)]);
    rows.push(["Total date flex price", reportsTotalDateFlex.toFixed(2)]);
    rows.push(["Refunds", reportsRefundedSales.length]);
    rows.push(["Total refunded", reportsTotalRefunded.toFixed(2)]);
    rows.push(["Total commission earned (period)", reportsTotalCommission.toFixed(2)]);
    rows.push([]);
    rows.push(["Sales by source"]);
    rows.push(["Source", "Count", "Total"]);
    reportsSourceBreakdown.forEach((r) => rows.push([r.source, r.count, r.total.toFixed(2)]));
    rows.push(["Declined", reportsDeclined.length, reportsDeclined.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0).toFixed(2)]);
    rows.push([]);
    rows.push(["Employees"]);
    rows.push(["Name", "Sales", "Credited total", "Commission %", "Commission earned"]);
    reportsEmployeeRows.forEach((r) =>
      rows.push([r.employee.name, r.salesCount, r.credited.toFixed(2), r.rate, r.commission.toFixed(2)])
    );
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RRG-Report-${reportsFilterMode}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  let leadsRange = null;
  let leadsRangeLabel = "";
  if (leadsFilterMode === "week") {
    const w = getWeekRange(leadsWeekOffset);
    leadsRange = w;
    leadsRangeLabel = formatWeekLabel(w.start, w.end);
  } else if (leadsFilterMode === "month") {
    const m = getMonthRange(leadsMonthOffset);
    leadsRange = m;
    leadsRangeLabel = formatMonthLabel(m.start);
  } else if (leadsFilterMode === "year") {
    const y = getYearRange(leadsYearOffset);
    leadsRange = y;
    leadsRangeLabel = formatYearLabel(y.start);
  }
  function leadsNavPrev() {
    if (leadsFilterMode === "week") setLeadsWeekOffset((w) => w - 1);
    else if (leadsFilterMode === "month") setLeadsMonthOffset((m) => m - 1);
    else if (leadsFilterMode === "year") setLeadsYearOffset((y) => y - 1);
  }
  function leadsNavNext() {
    if (leadsFilterMode === "week") setLeadsWeekOffset((w) => w + 1);
    else if (leadsFilterMode === "month") setLeadsMonthOffset((m) => m + 1);
    else if (leadsFilterMode === "year") setLeadsYearOffset((y) => y + 1);
  }
  function leadsNavReset() {
    if (leadsFilterMode === "week") setLeadsWeekOffset(0);
    else if (leadsFilterMode === "month") setLeadsMonthOffset(0);
    else if (leadsFilterMode === "year") setLeadsYearOffset(0);
  }
  const leadsNavIsCurrent =
    (leadsFilterMode === "week" && leadsWeekOffset === 0) ||
    (leadsFilterMode === "month" && leadsMonthOffset === 0) ||
    (leadsFilterMode === "year" && leadsYearOffset === 0);

  function weeklySaleEntries(employeeId) {
    const entries = [];
    sales.forEach((s) => {
      if (!isSaleInRange(s, currentWeek.start, currentWeek.end)) return;
      if (s.openerId === employeeId) entries.push({ sale: s, type: "front", amount: roleCreditAmount(s, "front") });
      if (s.closerId === employeeId) entries.push({ sale: s, type: "close", amount: roleCreditAmount(s, "close") });
      if (s.verificationId === employeeId)
        entries.push({ sale: s, type: "verification", amount: roleCreditAmount(s, "verification") });
    });
    return entries.sort((a, b) => new Date(b.sale.timestamp || 0) - new Date(a.sale.timestamp || 0));
  }

  function employeeWeekRows(employeeId, weekStart, weekEnd) {
    const rows = WEEKDAY_LABELS.map((label, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return { date, label, entries: [] };
    });
    sales.forEach((s) => {
      if (!isSaleInRange(s, weekStart, weekEnd)) return;
      const idx = getWeekdayIndex(new Date(s.timestamp));
      if (idx === null) return;
      if (s.openerId === employeeId)
        rows[idx].entries.push({ sale: s, type: "front", amount: roleCreditAmount(s, "front") });
      if (s.closerId === employeeId)
        rows[idx].entries.push({ sale: s, type: "close", amount: roleCreditAmount(s, "close") });
      if (s.verificationId === employeeId)
        rows[idx].entries.push({ sale: s, type: "verification", amount: roleCreditAmount(s, "verification") });
    });
    return rows.map((r) => ({ ...r, dayTotal: r.entries.reduce((sum, e) => sum + e.amount, 0) }));
  }

  function refundedCreditForEmployee(employeeId, weekStart, weekEnd) {
    return sales
      .filter((s) => s.refunded && dateInRange(s.refundedAt, weekStart, weekEnd))
      .reduce((sum, s) => {
        if (s.refundType === "partial") {
          let add = 0;
          ["front", "close", "verification"].forEach((roleId) => {
            if (employeeIdForRole(s, roleId) === employeeId) add += refundImpactForRole(s, roleId);
          });
          return sum + add;
        }
        return sum + saleCredit(s, employeeId);
      }, 0);
  }

  function lookbackWeek(weekStart, weekEnd) {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - 7);
    const end = new Date(weekEnd);
    end.setDate(end.getDate() - 7);
    return { start, end };
  }

  const employeeDetail = employees.find((e) => e.id === employeeDetailId) || null;
  const employeeDetailWeek = getWeekRange(employeeDetailWeekOffset);
  const employeeDetailWeekLabel = formatWeekLabel(employeeDetailWeek.start, employeeDetailWeek.end);
  const employeeDetailRows = employeeDetail
    ? employeeWeekRows(employeeDetail.id, employeeDetailWeek.start, employeeDetailWeek.end)
    : [];
  const employeeDetailTotalSales = employeeDetailRows.reduce((s, r) => s + r.dayTotal, 0);
  const employeeDetailRate = employeeDetail ? Number(employeeDetail.commissionRate) || 0 : 0;
  const employeeDetailRefundLookback = lookbackWeek(employeeDetailWeek.start, employeeDetailWeek.end);
  const employeeDetailRefundedCredit = employeeDetail
    ? refundedCreditForEmployee(employeeDetail.id, employeeDetailRefundLookback.start, employeeDetailRefundLookback.end)
    : 0;
  const employeeDetailRefundDeduction = employeeDetailRefundedCredit * (employeeDetailRate / 100);
  const employeeDetailCommission = employeeDetailTotalSales * (employeeDetailRate / 100) - employeeDetailRefundDeduction;
  const employeeDetailHasBasePay =
    employeeDetail && employeeDetail.basePay !== "" && employeeDetail.basePay !== undefined && employeeDetail.basePay !== null;
  const employeeDetailBasePay = employeeDetailHasBasePay ? Number(employeeDetail.basePay) || 0 : 0;
  const employeeDetailRawTotalPay = employeeDetailCommission + employeeDetailBasePay;
  const employeeDetailTotalPay = Math.max(employeeDetailRawTotalPay, settings.minWeeklyPay);
  const employeeDetailGuarantee = employeeDetailRawTotalPay < settings.minWeeklyPay;

  // ---- actions ----
  function saveContact(form) {
    if (form.id) {
      updateContacts(contacts.map((c) => (c.id === form.id ? { ...c, ...form } : c)));
    } else {
      updateContacts([...contacts, { ...form, id: uid(), createdAt: Date.now() }]);
    }
    setContactModal(null);
  }
  function deleteContact(id) {
    updateContacts(contacts.filter((c) => c.id !== id));
    setConfirmDelete(null);
    setContactModal(null);
  }
  function saveSale(form) {
    if (form.id) {
      updateSales(sales.map((s) => (s.id === form.id ? { ...s, ...form } : s)));
    } else {
      updateSales([...sales, { ...form, id: uid(), createdAt: Date.now() }]);
      setEntryJustSaved(true);
    }
    setSaleModal(null);
  }
  function deleteSale(id) {
    updateSales(sales.filter((s) => s.id !== id));
    setConfirmDelete(null);
    setSaleModal(null);
  }
  function markRefunded(id, opts) {
    updateSales(
      sales.map((s) => {
        if (s.id !== id) return s;
        const amounts =
          opts.type === "partial"
            ? {
                front: Number(opts.amounts.front) || 0,
                close: Number(opts.amounts.close) || 0,
                verification: Number(opts.amounts.verification) || 0,
              }
            : null;
        return {
          ...s,
          refunded: true,
          refundedAt: new Date().toISOString(),
          refundType: opts.type,
          refundAmounts: amounts,
          refundAmount: opts.type === "partial" ? amounts.front + amounts.close + amounts.verification : Number(s.totalPrice) || 0,
        };
      })
    );
    setConfirmRefund(null);
  }
  function undoRefund(id) {
    updateSales(
      sales.map((s) =>
        s.id === id
          ? { ...s, refunded: false, refundedAt: "", refundType: "", refundAmount: "", refundAmounts: null }
          : s
      )
    );
  }
  function saveEmployee(form) {
    if (form.id) {
      updateEmployees(employees.map((e) => (e.id === form.id ? { ...e, ...form } : e)));
    } else {
      updateEmployees([...employees, { ...form, id: uid(), createdAt: Date.now() }]);
    }
    setEmployeeModal(null);
  }
  function deleteEmployee(id) {
    updateEmployees(employees.filter((e) => e.id !== id));
    setConfirmDelete(null);
    setEmployeeModal(null);
  }
  function deactivateEmployee(id) {
    updateEmployees(employees.map((e) => (e.id === id ? { ...e, active: false } : e)));
    setEmployeeModal(null);
  }
  function reactivateEmployee(id) {
    updateEmployees(employees.map((e) => (e.id === id ? { ...e, active: true } : e)));
    setEmployeeModal(null);
  }
  // Moves an employee up/down relative to its position within a displayed subset
  // (e.g. only active employees), while keeping the underlying full list intact.
  function moveEmployee(id, direction, list) {
    const displayList = list || employees;
    const idx = displayList.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= displayList.length) return;
    const idA = displayList[idx].id;
    const idB = displayList[swapIdx].id;
    const next = [...employees];
    const posA = next.findIndex((e) => e.id === idA);
    const posB = next.findIndex((e) => e.id === idB);
    [next[posA], next[posB]] = [next[posB], next[posA]];
    updateEmployees(next);
  }

  if (!loaded || !authChecked) {
    return (
      <div style={{ ...S.app, minHeight: 400 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: T.textMuted, fontFamily: T.mono, fontSize: 13 }}>loading {settings.companyName}…</div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div style={{ ...S.app, minHeight: 480 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
          * { box-sizing: border-box; }
          button { font-family: inherit; cursor: pointer; }
          input { font-family: inherit; }
        `}</style>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={S.gateWrap}>
            <div style={S.brand}>{settings.companyName}</div>
            <div style={{ ...S.brandSub, marginBottom: 24 }}>create the first admin account</div>
            <div style={S.fieldLabel}>Your name</div>
            <input
              autoFocus
              value={gateNameInput}
              onChange={(e) => setGateNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && completeSetup()}
              style={{ ...S.input, marginBottom: 12 }}
              placeholder="Jordan Lee"
            />
            <div style={S.fieldLabel}>Username</div>
            <input
              value={gateUsernameInput}
              onChange={(e) => setGateUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && completeSetup()}
              style={{ ...S.input, marginBottom: 12 }}
              placeholder="Username"
            />
            <div style={S.fieldLabel}>Password</div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type={showGatePassword ? "text" : "password"}
                value={gatePasswordInput}
                onChange={(e) => setGatePasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && completeSetup()}
                style={{ ...S.input, paddingRight: 38 }}
                placeholder="Choose a password"
              />
              <button
                type="button"
                onClick={() => setShowGatePassword((v) => !v)}
                style={S.passwordEyeBtn}
                aria-label={showGatePassword ? "Hide password" : "Show password"}
              >
                {showGatePassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {gateError && <div style={S.errorText}>{gateError}</div>}
            <button style={{ ...S.primaryBtn, width: "100%", justifyContent: "center", marginTop: 4 }} onClick={completeSetup}>
              Create admin account
            </button>
            <div style={{ ...S.hint, marginTop: 14, textAlign: "center" }}>
              This runs once. After this account exists, everyone else signs in from Admin → Users.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ ...S.app, minHeight: 440 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
          * { box-sizing: border-box; }
          button { font-family: inherit; cursor: pointer; }
          input { font-family: inherit; }
        `}</style>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={S.gateWrap}>
            <div style={S.brand}>{settings.companyName}</div>
            <div style={{ ...S.brandSub, marginBottom: 24 }}>sales & payroll</div>
            <div style={S.fieldLabel}>Username</div>
            <input
              autoFocus
              value={gateUsernameInput}
              onChange={(e) => setGateUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && attemptUnlock()}
              style={{ ...S.input, marginBottom: 12 }}
              placeholder="Username"
            />
            <div style={S.fieldLabel}>Password</div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type={showGatePassword ? "text" : "password"}
                value={gatePasswordInput}
                onChange={(e) => setGatePasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && attemptUnlock()}
                style={{ ...S.input, paddingRight: 38 }}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowGatePassword((v) => !v)}
                style={S.passwordEyeBtn}
                aria-label={showGatePassword ? "Hide password" : "Show password"}
              >
                {showGatePassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {gateError && <div style={S.errorText}>{gateError}</div>}
            <button style={{ ...S.primaryBtn, width: "100%", justifyContent: "center", marginTop: 4 }} onClick={attemptUnlock}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .crm-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .crm-scroll::-webkit-scrollbar-thumb { background: #D8D4C6; border-radius: 4px; }
        .crm-row:hover { background: #F4F2EA; }
        .crm-row-del:hover { color: #A32D2D !important; background: #FCEBEB !important; }
        .crm-scroll input[type="number"]:hover, .crm-scroll input[type="number"]:focus { border-color: #D3CEBD !important; background: #FFFFFF !important; }
        .crm-scroll select:hover { border-color: #D3CEBD !important; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea, select { font-family: inherit; }
      `}</style>

      {/* Sidebar */}
      <div style={S.sidebar}>
        <div>
          <div style={S.brand}>{settings.companyName}</div>
          <div style={S.brandSub}>sales & payroll</div>
          <div style={S.navList}>
            {NAV_ITEMS.filter((item) => getAllowedSections(currentUser && currentUser.role).includes(item.id)).map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <button style={S.viewerBtnSidebar} onClick={() => setViewerOpen((o) => !o)}>
            <div style={S.avatarSm}>{currentUser ? initials(currentUser.name) : <User size={12} />}</div>
            <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser ? currentUser.name : "Signed in"}
              </div>
            </div>
            {currentUser && <RoleBadge role={currentUser.role} size="sm" />}
          </button>
          {viewerOpen && (
            <div style={S.viewerPopoverSidebar}>
              <div style={S.fieldLabel}>Signed in as</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 2 }}>
                {currentUser ? currentUser.name : "—"}
              </div>
              <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 12 }}>
                {currentUser ? `@${currentUser.username}` : ""}
              </div>
              <button style={{ ...S.dangerGhostBtn, width: "100%", justifyContent: "center", border: `1px solid #E8B4B4` }} onClick={logOut}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div>
            <div style={S.topbarTitle}>{NAV_ITEMS.find((n) => n.id === section)?.label}</div>
          </div>
          {section === "sales" && (
            <div style={S.searchWrap}>
              <Search size={14} color={T.textMuted} style={{ flexShrink: 0 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                style={S.searchInput}
              />
              {search && (
                <button onClick={() => setSearch("")} style={S.iconBtnGhost}>
                  <X size={13} color={T.textMuted} />
                </button>
              )}
            </div>
          )}
        </div>

        {(section === "dashboard" || section === "sales") && (
          <div style={S.stats}>
            <div style={S.statItem}>
              <div style={S.statLabel}>total sales</div>
              <div style={S.statValue}>{money(totalSalesValue)}</div>
            </div>
            <div style={S.statDivider} />
            <div style={S.statItem}>
              <div style={S.statLabel}>sales logged</div>
              <div style={S.statValue}>{sales.length}</div>
            </div>
          </div>
        )}

        {section === "dashboard" && (
          <div style={S.dashboardWrap}>
            <div style={S.weekNavRow}>
              <div style={S.dashboardSectionLabel}>Sales by source</div>
              <div style={S.weekNav}>
                <div style={{ position: "relative" }}>
                  <select
                    value={dashboardFilterMode}
                    onChange={(e) => setDashboardFilterMode(e.target.value)}
                    style={{ ...S.select, width: 130, paddingRight: 28 }}
                  >
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                    <option value="year">This year</option>
                    <option value="all">All time</option>
                  </select>
                  <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                </div>
                {dashboardFilterMode !== "all" && (
                  <>
                    <button onClick={dashboardNavPrev} style={S.weekNavBtn} aria-label="Previous">
                      ‹
                    </button>
                    <button
                      onClick={dashboardNavReset}
                      style={{ ...S.weekNavLabel, ...(dashboardNavIsCurrent ? S.weekNavLabelActive : {}) }}
                    >
                      {dashboardRangeLabel}
                      {dashboardNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                    </button>
                    <button onClick={dashboardNavNext} style={S.weekNavBtn} aria-label="Next">
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>
            <div style={S.sourceGrid}>
              {salesBySource.map((row) => (
                <div key={row.source} style={S.sourceCard}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        ...S.leadBadge,
                        ...(row.source === "Monster" ? S.leadBadgeMonster : S.leadBadgePGR),
                      }}
                    >
                      {row.source}
                    </span>
                    <span style={S.sourceCount}>
                      {row.count} sale{row.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div style={S.sourceValue}>{money(row.total)}</div>
                </div>
              ))}
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...S.leadBadge, background: "#FCEBEB", color: "#A32D2D" }}>Declined</span>
                  <span style={S.sourceCount}>
                    {declinedSales.length} sale{declinedSales.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={S.sourceValue}>
                  {money(declinedSales.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0))}
                </div>
              </div>
            </div>

            <div style={{ ...S.dashboardSectionLabel, marginTop: 20 }}>
              Approved sales {dashboardFilterMode === "all" ? "(all time)" : `(${dashboardRangeLabel})`} ({dashboardApprovedSales.length})
            </div>
            {dashboardApprovedSales.length === 0 ? (
              <div style={S.emptyState}>
                <TrendingUp size={22} color={T.borderStrong} />
                <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                  {dashboardFilterMode === "all" ? "No approved sales yet" : `No approved sales for ${dashboardRangeLabel} yet`}
                </div>
              </div>
            ) : (
              <div style={S.recentList}>
                {[...dashboardApprovedSales]
                  .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
                  .map((s) => (
                    <div
                      key={s.id}
                      style={S.recentRow}
                      onClick={() => {
                        setSection("sales");
                        setView("salesform");
                        setSaleModal({ ...s });
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.recentTitle}>{s.name}</div>
                        <div style={S.recentSub}>{s.city ? `${s.city}${s.state ? `, ${s.state}` : ""}` : formatTimestamp(s.timestamp)}</div>
                      </div>
                      <div style={S.dealValue}>{s.totalPrice ? money(s.totalPrice) : ""}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {section === "sales" && (
          <div style={S.salesWrap}>
                <div style={S.contactsToolbar}>
                  <span style={S.contactsCount}>
                    {sales.length} sale{sales.length === 1 ? "" : "s"}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setSaleModal(blankSale())}
                      style={S.primaryBtn}
                    >
                      <Plus size={14} /> New sale
                    </button>
                  </div>
                </div>

                {sales.length === 0 ? (
                  <div style={S.emptyState}>
                    <TrendingUp size={22} color={T.borderStrong} />
                    <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                      No sales logged yet — add your first one
                    </div>
                  </div>
                ) : (
                  <div className="crm-scroll" style={S.tableScroll}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          {[
                            "Timestamp",
                            "Name",
                            "Spouse name",
                            "Phone",
                            "Email",
                            "Address",
                            "City",
                            "State",
                            "Zip",
                            "Package price",
                            "Date flex price",
                            "Password",
                            "Total price",
                            "Genie #",
                            "Opener",
                            "Closer",
                            "Verification",
                            "Source",
                            "Submitted to",
                            "Status",
                            "Notes",
                          ].map((h) => (
                            <th key={h} style={S.th}>
                              {h}
                            </th>
                          ))}
                          <th style={S.th}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...sales]
                          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                          .map((s) => (
                            <tr key={s.id} className="crm-row" style={S.tr} onClick={() => setSaleModal({ ...s })}>
                              <td style={S.td}>{formatTimestamp(s.timestamp)}</td>
                              <td style={{ ...S.td, fontWeight: 500 }}>{s.name}</td>
                              <td style={S.td}>{s.spouseName}</td>
                              <td style={S.td}>{s.phone}</td>
                              <td style={S.td}>{s.email}</td>
                              <td style={S.td}>{s.address}</td>
                              <td style={S.td}>{s.city}</td>
                              <td style={S.td}>{s.state}</td>
                              <td style={S.td}>{s.zip}</td>
                              <td style={{ ...S.td, fontFamily: T.mono }}>{s.packagePrice ? money(s.packagePrice) : ""}</td>
                              <td style={{ ...S.td, fontFamily: T.mono }}>{s.dateFlex ? money(s.dateFlex) : ""}</td>
                              <td style={{ ...S.td, fontFamily: T.mono }}>
                                {s.password ? "••••••••" : ""}
                              </td>
                              <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 500 }}>
                                {s.totalPrice ? money(s.totalPrice) : ""}
                              </td>
                              <td style={S.td}>{s.genieNumber}</td>
                              <td style={{ ...S.td, color: SALE_TYPES[0].color, fontWeight: 500 }}>
                                {employeeById[s.openerId] ? employeeById[s.openerId].name : ""}
                              </td>
                              <td style={{ ...S.td, color: SALE_TYPES[1].color, fontWeight: 500 }}>
                                {employeeById[s.closerId] ? employeeById[s.closerId].name : ""}
                              </td>
                              <td style={{ ...S.td, color: SALE_TYPES[2].color, fontWeight: 500 }}>
                                {employeeById[s.verificationId] ? employeeById[s.verificationId].name : ""}
                              </td>
                              <td style={S.td}>
                                {s.source && <span style={S.sourceBadge}>{s.source}</span>}
                              </td>
                              <td style={S.td}>
                                {s.leadSubmittedTo && (
                                  <span
                                    style={{
                                      ...S.leadBadge,
                                      ...(s.leadSubmittedTo === "Monster" ? S.leadBadgeMonster : S.leadBadgePGR),
                                    }}
                                  >
                                    {s.leadSubmittedTo}
                                  </span>
                                )}
                              </td>
                              <td style={S.td}>
                                {s.status && (
                                  <span
                                    style={{
                                      ...S.leadBadge,
                                      ...(s.status === "Declined"
                                        ? { background: "#FCEBEB", color: "#A32D2D" }
                                        : { background: "#EAF3DE", color: "#3B6D11" }),
                                    }}
                                  >
                                    {s.status}
                                  </span>
                                )}
                              </td>
                              <td style={{ ...S.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {s.notes}
                              </td>
                              <td style={S.td}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete({ type: "sale", id: s.id, label: s.name });
                                  }}
                                  className="crm-row-del"
                                  style={S.rowDeleteBtn}
                                  aria-label="Delete sale"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
        )}

        {section === "salesentry" && (
          <div style={S.dashboardWrap}>
            <div style={S.entryScreenWrap}>
              {entryJustSaved ? (
                <>
                  <div style={S.entrySuccessIcon}>✓</div>
                  <div style={S.entrySuccessTitle}>Sale submitted</div>
                  <div style={{ ...S.hint, textAlign: "center", marginBottom: 20 }}>
                    It's been added to the system. You won't see it listed here — that's expected for this account.
                  </div>
                  <button
                    style={S.primaryBtn}
                    onClick={() => {
                      setEntryJustSaved(false);
                      setSaleModal(blankSale());
                    }}
                  >
                    <Plus size={14} /> Add another sale
                  </button>
                </>
              ) : (
                <>
                  <div style={S.entrySuccessTitle}>Submit a new sale</div>
                  <div style={{ ...S.hint, textAlign: "center", marginBottom: 20 }}>
                    Fill out the sale details. Once submitted, it goes straight into the system.
                  </div>
                  <button style={S.primaryBtn} onClick={() => setSaleModal(blankSale())}>
                    <Plus size={14} /> New sale
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {section === "leads" && (
          <div style={S.contactsWrap}>
            {(() => {
              const filteredLeads = [...sales]
                .filter((s) => {
                  if (leadsRange && !isSaleInRange(s, leadsRange.start, leadsRange.end)) return false;
                  if (leadsCategoryFilter && s.leadCategory !== leadsCategoryFilter) return false;
                  const q2 = leadsSearch.trim().toLowerCase();
                  if (!q2) return true;
                  return (
                    s.name.toLowerCase().includes(q2) ||
                    (s.email || "").toLowerCase().includes(q2) ||
                    (s.phone || "").toLowerCase().includes(q2) ||
                    (s.city || "").toLowerCase().includes(q2)
                  );
                })
                .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

              return (
                <>
                  <div style={S.contactsToolbar}>
                    <span style={S.contactsCount}>
                      {filteredLeads.length} lead{filteredLeads.length === 1 ? "" : "s"}
                      {(leadsFilterMode !== "all" || leadsCategoryFilter) && sales.length !== filteredLeads.length ? ` of ${sales.length}` : ""}
                    </span>
                    <div style={S.searchWrap}>
                      <Search size={14} color={T.textMuted} style={{ flexShrink: 0 }} />
                      <input
                        value={leadsSearch}
                        onChange={(e) => setLeadsSearch(e.target.value)}
                        placeholder="Search leads"
                        style={S.searchInput}
                      />
                      {leadsSearch && (
                        <button onClick={() => setLeadsSearch("")} style={S.iconBtnGhost}>
                          <X size={13} color={T.textMuted} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={S.weekNavRow}>
                    <div style={{ position: "relative" }}>
                      <select
                        value={leadsFilterMode}
                        onChange={(e) => setLeadsFilterMode(e.target.value)}
                        style={{ ...S.select, width: 140, paddingRight: 28 }}
                      >
                        <option value="all">All time</option>
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                        <option value="year">Yearly</option>
                      </select>
                      <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                    </div>
                    <div style={{ position: "relative" }}>
                      <select
                        value={leadsCategoryFilter}
                        onChange={(e) => setLeadsCategoryFilter(e.target.value)}
                        style={{ ...S.select, width: 150, paddingRight: 28 }}
                      >
                        <option value="">All categories</option>
                        {settings.leadCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                    </div>
                    {leadsFilterMode !== "all" && (
                      <div style={S.weekNav}>
                        <button onClick={leadsNavPrev} style={S.weekNavBtn} aria-label="Previous">
                          ‹
                        </button>
                        <button
                          onClick={leadsNavReset}
                          style={{ ...S.weekNavLabel, ...(leadsNavIsCurrent ? S.weekNavLabelActive : {}) }}
                        >
                          {leadsRangeLabel}
                          {leadsNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                        </button>
                        <button onClick={leadsNavNext} style={S.weekNavBtn} aria-label="Next">
                          ›
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredLeads.length === 0 ? (
                    <div style={S.emptyState}>
                      <ClipboardList size={22} color={T.borderStrong} />
                      <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                        {sales.length === 0 ? "No leads logged yet" : "No leads match this filter"}
                      </div>
                    </div>
                  ) : (
                    <div style={S.leadList}>
                      {filteredLeads.map((s) => {
                        const opener = employeeById[s.openerId];
                    const closer = employeeById[s.closerId];
                    const verification = employeeById[s.verificationId];
                    const st = SALE_STATUSES.includes(s.status) ? s.status : null;
                    return (
                      <div
                        key={s.id}
                        style={{ ...S.leadCard, ...(s.refunded ? S.leadCardRefunded : {}) }}
                      >
                        <div style={S.leadCardHeader}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={S.leadName}>{s.name}</span>
                            {s.refunded && (
                              <span style={S.refundedBadge}>
                                {s.refundType === "partial" ? `Partial refund ${money(s.refundAmount)}` : "Refunded"}
                              </span>
                            )}
                            {st && (
                              <span
                                style={{
                                  ...S.leadBadge,
                                  ...(st === "Declined" ? { background: "#FCEBEB", color: "#A32D2D" } : { background: "#EAF3DE", color: "#3B6D11" }),
                                }}
                              >
                                {st}
                              </span>
                            )}
                            {s.leadSubmittedTo && (
                              <span style={{ ...S.leadBadge, ...(s.leadSubmittedTo === "Monster" ? S.leadBadgeMonster : S.leadBadgePGR) }}>
                                {s.leadSubmittedTo}
                              </span>
                            )}
                            {s.leadCategory && settings.leadCategories.includes(s.leadCategory) && (
                              <span
                                style={{
                                  ...S.leadBadge,
                                  background: categoryColor(s.leadCategory).bg,
                                  color: categoryColor(s.leadCategory).color,
                                }}
                              >
                                {s.leadCategory}
                              </span>
                            )}
                            {s.source && <span style={S.sourceBadge}>{s.source}</span>}
                          </div>
                          <div style={S.leadCardActions}>
                            <button style={S.ghostBtn} onClick={() => setSaleModal({ ...s })}>
                              Edit
                            </button>
                            {s.refunded ? (
                              <button style={S.ghostBtn} onClick={() => undoRefund(s.id)}>
                                <Undo2 size={12} /> Undo refund
                              </button>
                            ) : (
                              <button
                                style={S.refundBtn}
                                onClick={() => setConfirmRefund({ ...s })}
                              >
                                <RotateCcw size={12} /> Refund
                              </button>
                            )}
                            <button
                              style={S.rowDeleteBtn}
                              onClick={() => setConfirmDelete({ type: "sale", id: s.id, label: s.name })}
                              aria-label="Delete lead"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div style={S.leadInfoGrid}>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Timestamp</span>
                            <span>{formatTimestamp(s.timestamp)}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Spouse name</span>
                            <span>{s.spouseName || "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Phone</span>
                            <span>{s.phone || "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Email</span>
                            <span>{s.email || "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Address</span>
                            <span>
                              {s.address ? `${s.address}${s.city ? `, ${s.city}` : ""}${s.state ? `, ${s.state}` : ""}${s.zip ? ` ${s.zip}` : ""}` : "—"}
                            </span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Package price</span>
                            <span style={{ fontFamily: T.mono }}>{s.packagePrice ? money(s.packagePrice) : "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Date flex price</span>
                            <span style={{ fontFamily: T.mono }}>{s.dateFlex ? money(s.dateFlex) : "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Total price</span>
                            <span style={{ fontFamily: T.mono, fontWeight: 600 }}>{s.totalPrice ? money(s.totalPrice) : "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Genie #</span>
                            <span>{s.genieNumber || "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Password</span>
                            <span style={{ fontFamily: T.mono }}>{s.password ? "••••••••" : "—"}</span>
                          </div>
                        </div>

                        <div style={S.leadEmployeeRow}>
                          <div style={S.leadEmployeeItem}>
                            <span style={{ ...S.commissionRateBadge, color: SALE_TYPES[0].color, background: "#F1F0EE" }}>Opener</span>
                            <span>{opener ? opener.name : "Unassigned"}</span>
                            {refundImpactForRole(s, "front") > 0 && (
                              <span style={S.refundImpactNote}>-{money(refundImpactForRole(s, "front"))}</span>
                            )}
                          </div>
                          <div style={S.leadEmployeeItem}>
                            <span style={{ ...S.commissionRateBadge, color: SALE_TYPES[1].color, background: "#EAF3EC" }}>Closer</span>
                            <span>{closer ? closer.name : "Unassigned"}</span>
                            {refundImpactForRole(s, "close") > 0 && (
                              <span style={S.refundImpactNote}>-{money(refundImpactForRole(s, "close"))}</span>
                            )}
                          </div>
                          <div style={S.leadEmployeeItem}>
                            <span style={{ ...S.commissionRateBadge, color: SALE_TYPES[2].color, background: "#FBEAEA" }}>Verification</span>
                            <span>{verification ? verification.name : "Unassigned"}</span>
                            {refundImpactForRole(s, "verification") > 0 && (
                              <span style={S.refundImpactNote}>-{money(refundImpactForRole(s, "verification"))}</span>
                            )}
                          </div>
                        </div>

                        {s.notes && <div style={S.leadNotes}>{s.notes}</div>}
                      </div>
                    );
                  })}
              </div>
            )}
                </>
              );
            })()}
          </div>
        )}

        {section === "employees" && (
          <div style={S.contactsWrap}>
            <div style={S.contactsToolbar}>
              <div style={S.tabs}>
                <button
                  onClick={() => setEmployeesView("active")}
                  style={{ ...S.tab, ...(employeesView === "active" ? S.tabActive : {}) }}
                >
                  Active ({activeEmployees.length})
                </button>
                <button
                  onClick={() => setEmployeesView("exemployees")}
                  style={{ ...S.tab, ...(employeesView === "exemployees" ? S.tabActive : {}) }}
                >
                  Ex Employees ({exEmployees.length})
                </button>
              </div>
              {employeesView === "active" && (
                <button
                  onClick={() => setEmployeeModal({ name: "", role: "rep", phone: "", email: "", commissionRate: "", basePay: "", active: true, notes: "" })}
                  style={S.primaryBtn}
                >
                  <Plus size={14} /> Employee
                </button>
              )}
            </div>

            {employeesView === "active" ? (
              activeEmployees.length === 0 ? (
                <div style={S.emptyState}>
                  <Users size={22} color={T.borderStrong} />
                  <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                    No employees yet — add your first one
                  </div>
                </div>
              ) : (
                <div style={S.contactGrid}>
                  {activeEmployees.map((emp) => {
                    const empSales = salesForEmployee(emp.id);
                    const empAllTimeTotal = empSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
                    const weekEntries = weeklySaleEntries(emp.id);
                    return (
                      <div key={emp.id} style={S.contactCard} onClick={() => setEmployeeModal({ ...emp })}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={S.avatar}>{initials(emp.name)}</div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={S.contactName}>{emp.name}</div>
                          </div>
                          <RoleBadge role={emp.role} size="sm" />
                        </div>
                        <div style={S.contactMeta}>
                          {emp.email && (
                            <div style={S.contactMetaRow}>
                              <Mail size={11} color={T.textMuted} /> {emp.email}
                            </div>
                          )}
                          {emp.phone && (
                            <div style={S.contactMetaRow}>
                              <Phone size={11} color={T.textMuted} /> {emp.phone}
                            </div>
                          )}
                        </div>
                        <div style={S.employeeStats}>
                          {empSales.length} sale{empSales.length === 1 ? "" : "s"} all-time · {money(empAllTimeTotal)}
                        </div>
                        {weekEntries.length > 0 && (
                          <div style={S.weeklySaleList}>
                            {weekEntries.map((entry, i) => {
                              const t = SALE_TYPES.find((x) => x.id === entry.type);
                              const refunded = isEntryRefunded(entry.sale, entry.type);
                              return (
                                <div
                                  key={entry.sale.id + "-" + entry.type + "-" + i}
                                  style={{
                                    ...S.weeklySaleRow,
                                    color: refunded ? "#A32D2D" : t ? t.color : T.textMuted,
                                    textDecoration: refunded ? "line-through" : "none",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSection("sales");
                                    setView("salesform");
                                    setSaleModal({ ...entry.sale });
                                  }}
                                >
                                  {entry.sale.name} {money(entry.amount)}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeDetailWeekOffset(0);
                            setEmployeeDetailId(emp.id);
                          }}
                          style={S.weeklyTemplateBtn}
                        >
                          <CalendarDays size={12} /> Weekly template
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            ) : exEmployees.length === 0 ? (
              <div style={S.emptyState}>
                <Users size={22} color={T.borderStrong} />
                <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                  No ex-employees — anyone you deactivate shows up here
                </div>
              </div>
            ) : (
              <div style={S.contactGrid}>
                {exEmployees.map((emp) => {
                  const empSales = salesForEmployee(emp.id);
                  const empAllTimeTotal = empSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
                  return (
                    <div
                      key={emp.id}
                      style={{ ...S.contactCard, opacity: 0.7 }}
                      onClick={() => setEmployeeModal({ ...emp })}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={S.avatar}>{initials(emp.name)}</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={S.contactName}>{emp.name}</div>
                        </div>
                        <RoleBadge role={emp.role} size="sm" />
                      </div>
                      <div style={S.contactMeta}>
                        {emp.email && (
                          <div style={S.contactMetaRow}>
                            <Mail size={11} color={T.textMuted} /> {emp.email}
                          </div>
                        )}
                        {emp.phone && (
                          <div style={S.contactMetaRow}>
                            <Phone size={11} color={T.textMuted} /> {emp.phone}
                          </div>
                        )}
                      </div>
                      <div style={S.employeeStats}>
                        {empSales.length} sale{empSales.length === 1 ? "" : "s"} all-time · {money(empAllTimeTotal)}
                      </div>
                      <div style={S.exEmployeeNote}>Deactivated — open to reactivate</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {section === "rrgboard" && (
          <div style={S.dashboardWrap}>
            <div style={S.weekNavRow}>
              <div style={S.dashboardSectionLabel}>RRG board</div>
              <div style={S.weekNav}>
                <button onClick={() => setRrgWeekOffset((w) => w - 1)} style={S.weekNavBtn} aria-label="Previous week">
                  ‹
                </button>
                <button
                  onClick={() => setRrgWeekOffset(0)}
                  style={{ ...S.weekNavLabel, ...(rrgWeekOffset === 0 ? S.weekNavLabelActive : {}) }}
                >
                  {rrgLabel}
                  {rrgWeekOffset === 0 && <span style={S.weekNavThisWeek}>This week</span>}
                </button>
                <button onClick={() => setRrgWeekOffset((w) => w + 1)} style={S.weekNavBtn} aria-label="Next week">
                  ›
                </button>
              </div>
            </div>

            <div style={S.rrgLegend}>
              {SALE_TYPES.map((t) => (
                <div key={t.id} style={S.rrgLegendItem}>
                  <span style={{ ...S.rrgLegendDot, background: t.color }} />
                  {t.label}
                </div>
              ))}
            </div>
            <div style={S.hint}>
              Each day cell has a small dropdown under the sales — use it to mark someone Late, Left early, or Absent for that day.
            </div>

            {activeEmployees.length === 0 ? (
              <div style={S.emptyState}>
                <LayoutGrid size={22} color={T.borderStrong} />
                <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                  Add employees first — the board tracks sales per employee
                </div>
              </div>
            ) : (
              <div className="crm-scroll" style={S.tableScroll}>
                <table style={{ ...S.table, minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Agent</th>
                      {WEEKDAY_LABELS.map((d) => (
                        <th key={d} style={S.th}>
                          {d}
                        </th>
                      ))}
                      <th style={S.th}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rrgBoard.map((row, rowIdx) => (
                      <tr key={row.employee.id} className="crm-row">
                        <td style={{ ...S.td, fontWeight: 500, whiteSpace: "nowrap" }}>
                          <div style={S.reorderCell}>
                            <div style={S.reorderBtns}>
                              <button
                                onClick={() => moveEmployee(row.employee.id, "up", activeEmployees)}
                                disabled={rowIdx === 0}
                                style={{ ...S.reorderBtn, ...(rowIdx === 0 ? S.reorderBtnDisabled : {}) }}
                                aria-label="Move up"
                              >
                                <ChevronUp size={11} />
                              </button>
                              <button
                                onClick={() => moveEmployee(row.employee.id, "down", activeEmployees)}
                                disabled={rowIdx === rrgBoard.length - 1}
                                style={{ ...S.reorderBtn, ...(rowIdx === rrgBoard.length - 1 ? S.reorderBtnDisabled : {}) }}
                                aria-label="Move down"
                              >
                                <ChevronDown size={11} />
                              </button>
                            </div>
                            {row.employee.name}
                          </div>
                        </td>
                        {row.days.map((dayEntries, i) => {
                          const attVal = getAttendance(row.employee.id, rrgDayDates[i]);
                          const attInfo = ATTENDANCE_STATUSES.find((a) => a.id === attVal);
                          return (
                            <td key={i} style={{ ...S.td, whiteSpace: "normal" }}>
                              {dayEntries.length > 0 && (
                                <div style={S.rrgChipRow}>
                                  {dayEntries.map((entry, j) => {
                                    const t = SALE_TYPES.find((x) => x.id === entry.type);
                                    const refunded = isEntryRefunded(entry.sale, entry.type);
                                    const color = refunded ? "#A32D2D" : t ? t.color : T.textMuted;
                                    return (
                                      <span
                                        key={entry.sale.id + "-" + entry.type + "-" + j}
                                        style={{
                                          ...S.rrgChip,
                                          color,
                                          textDecoration: refunded ? "line-through" : "none",
                                        }}
                                        onClick={() => setSaleModal({ ...entry.sale })}
                                        title={refunded ? "Refunded" : t ? t.label : "Not set"}
                                      >
                                        {entry.amount ? money(entry.amount) : "—"}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              <div style={{ position: "relative", marginTop: dayEntries.length > 0 ? 4 : 0 }}>
                                <select
                                  value={attVal}
                                  onChange={(e) => setAttendanceValue(row.employee.id, rrgDayDates[i], e.target.value)}
                                  style={{
                                    ...S.attendanceSelect,
                                    color: attInfo ? attInfo.color : T.borderStrong,
                                    borderColor: attInfo ? attInfo.color : "transparent",
                                    background: attInfo ? "#FBF6EC" : "transparent",
                                  }}
                                >
                                  <option value="">—</option>
                                  {ATTENDANCE_STATUSES.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 500 }}>{money(row.weekTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ ...S.td, fontWeight: 600 }}>Daily totals</td>
                      {rrgDailyTotals.map((t, i) => (
                        <td key={i} style={{ ...S.td, fontFamily: T.mono, fontWeight: 500 }}>
                          {money(t)}
                        </td>
                      ))}
                      <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 600 }}>{money(rrgWeekGrandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {section === "payroll" && (
          <div style={S.dashboardWrap}>
            <div style={S.weekNavRow}>
              <div style={S.dashboardSectionLabel}>Payroll</div>
              <div style={S.weekNav}>
                <button onClick={() => setPayrollWeekOffset((w) => w - 1)} style={S.weekNavBtn} aria-label="Previous week">
                  ‹
                </button>
                <button
                  onClick={() => setPayrollWeekOffset(0)}
                  style={{ ...S.weekNavLabel, ...(payrollWeekOffset === 0 ? S.weekNavLabelActive : {}) }}
                >
                  {payrollWeekLabel}
                  {payrollWeekOffset === 0 && <span style={S.weekNavThisWeek}>This week</span>}
                </button>
                <button onClick={() => setPayrollWeekOffset((w) => w + 1)} style={S.weekNavBtn} aria-label="Next week">
                  ›
                </button>
              </div>
            </div>
            <div style={S.hint}>
              Everyone is guaranteed at least {money(settings.minWeeklyPay)} for the week — if commission plus base pay comes in under that, they're paid {money(settings.minWeeklyPay)} instead. Refunds marked in All Leads deduct the involved employees' credited commission from the payroll week right after the refund was recorded. Total pay is editable — click into the amount to override it for that person's that week; a reset button brings back the calculated number.
            </div>

            {activeEmployees.length === 0 ? (
              <div style={S.emptyState}>
                <Wallet size={22} color={T.borderStrong} />
                <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                  Add employees first — they'll show up here automatically for payroll.
                </div>
              </div>
            ) : (
              <div className="crm-scroll" style={S.tableScroll}>
                <table style={{ ...S.table, minWidth: 940 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Employee</th>
                      <th style={S.th}>Sales this week</th>
                      <th style={S.th}>Sales total</th>
                      <th style={S.th}>Commission %</th>
                      <th style={S.th}>Commission owed</th>
                      <th style={S.th}>Refund deduction</th>
                      <th style={S.th}>Base pay</th>
                      <th style={S.th}>Total pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEmployees.map((emp, empIdx) => {
                      const empSales = salesForEmployee(emp.id).filter((s) => s.status === "Approved");
                      const empWeekSales = empSales.filter((s) => isSaleInRange(s, payrollWeek.start, payrollWeek.end));
                      const empWeekTotal = empWeekSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
                      const rate = Number(emp.commissionRate) || 0;
                      const grossCommission = empWeekTotal * (rate / 100);
                      const refundLookback = lookbackWeek(payrollWeek.start, payrollWeek.end);
                      const refundedCredit = refundedCreditForEmployee(emp.id, refundLookback.start, refundLookback.end);
                      const refundDeduction = refundedCredit * (rate / 100);
                      const commissionOwed = grossCommission - refundDeduction;
                      const hasBasePay = emp.basePay !== "" && emp.basePay !== undefined && emp.basePay !== null;
                      const basePay = hasBasePay ? Number(emp.basePay) || 0 : 0;
                      const rawTotalPay = commissionOwed + basePay;
                      const computedTotalPay = Math.max(rawTotalPay, settings.minWeeklyPay);
                      const guaranteeApplied = rawTotalPay < settings.minWeeklyPay;
                      const override = getPayrollOverride(emp.id, payrollWeek.start);
                      const totalPay = override !== null ? override : computedTotalPay;
                      const isOverridden = override !== null;
                      return (
                        <tr key={emp.id} className="crm-row" onClick={() => setEmployeeModal({ ...emp })}>
                          <td style={{ ...S.td, fontWeight: 500, whiteSpace: "nowrap" }}>
                            <div style={S.reorderCell}>
                              <div style={S.reorderBtns} onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => moveEmployee(emp.id, "up", activeEmployees)}
                                  disabled={empIdx === 0}
                                  style={{ ...S.reorderBtn, ...(empIdx === 0 ? S.reorderBtnDisabled : {}) }}
                                  aria-label="Move up"
                                >
                                  <ChevronUp size={11} />
                                </button>
                                <button
                                  onClick={() => moveEmployee(emp.id, "down", activeEmployees)}
                                  disabled={empIdx === activeEmployees.length - 1}
                                  style={{ ...S.reorderBtn, ...(empIdx === activeEmployees.length - 1 ? S.reorderBtnDisabled : {}) }}
                                  aria-label="Move down"
                                >
                                  <ChevronDown size={11} />
                                </button>
                              </div>
                              {emp.name}
                            </div>
                          </td>
                          <td style={S.td}>
                            {empWeekSales.length} sale{empWeekSales.length === 1 ? "" : "s"} · {money(empWeekTotal)}
                          </td>
                          <td style={{ ...S.td, fontFamily: T.mono }}>{money(empSales.reduce((s, r) => s + saleCredit(r, emp.id), 0))}</td>
                          <td style={S.td}>
                            {rate > 0 ? (
                              <span style={S.commissionRateBadge}>{rate}%</span>
                            ) : (
                              <span style={{ color: T.borderStrong }}>Not set</span>
                            )}
                          </td>
                          <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 500 }}>
                            {rate > 0 ? money(commissionOwed) : "—"}
                          </td>
                          <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 500, color: refundDeduction > 0 ? "#A32D2D" : T.borderStrong }}>
                            {refundDeduction > 0 ? "-" + money(refundDeduction) : "—"}
                          </td>
                          <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 500 }}>
                            {hasBasePay ? money(basePay) : "—"}
                          </td>
                          <td style={{ ...S.td, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                            <div style={S.totalPayCell}>
                              <span style={S.totalPayCurrency}>$</span>
                              <input
                                type="number"
                                value={totalPay}
                                onChange={(e) => setPayrollOverrideValue(emp.id, payrollWeek.start, e.target.value)}
                                style={{
                                  ...S.totalPayInput,
                                  color: isOverridden ? "#8A5A1E" : T.pineDark,
                                }}
                              />
                              {isOverridden ? (
                                <button
                                  style={S.totalPayResetBtn}
                                  onClick={() => clearPayrollOverride(emp.id, payrollWeek.start)}
                                  title="Reset to calculated amount"
                                >
                                  <X size={11} />
                                </button>
                              ) : (
                                guaranteeApplied && <span style={S.minGuaranteeBadge}>min guarantee</span>
                              )}
                            </div>
                            {isOverridden && <div style={S.customPayNote}>Custom · calculated {money(computedTotalPay)}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ ...S.td, fontWeight: 600 }}>Total owed this week</td>
                      <td style={S.td} />
                      <td style={S.td} />
                      <td style={S.td} />
                      <td style={S.td} />
                      <td style={S.td} />
                      <td style={S.td} />
                      <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 600, color: T.pineDark }}>
                        {money(
                          activeEmployees.reduce((sum, emp) => {
                            const override = getPayrollOverride(emp.id, payrollWeek.start);
                            if (override !== null) return sum + override;
                            const empSales = salesForEmployee(emp.id)
                              .filter((s) => s.status === "Approved")
                              .filter((s) => isSaleInRange(s, payrollWeek.start, payrollWeek.end));
                            const total = empSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
                            const rate = Number(emp.commissionRate) || 0;
                            const refundLookback = lookbackWeek(payrollWeek.start, payrollWeek.end);
                            const refundedCredit = refundedCreditForEmployee(emp.id, refundLookback.start, refundLookback.end);
                            const commission = total * (rate / 100) - refundedCredit * (rate / 100);
                            const hasBasePay = emp.basePay !== "" && emp.basePay !== undefined && emp.basePay !== null;
                            const basePay = hasBasePay ? Number(emp.basePay) || 0 : 0;
                            return sum + Math.max(commission + basePay, settings.minWeeklyPay);
                          }, 0)
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {section === "reports" && (
          <div style={S.dashboardWrap}>
            <div style={S.weekNavRow}>
              <div style={S.dashboardSectionLabel}>Business snapshot</div>
              <div style={S.weekNav}>
                <div style={{ position: "relative" }}>
                  <select
                    value={reportsFilterMode}
                    onChange={(e) => setReportsFilterMode(e.target.value)}
                    style={{ ...S.select, width: 130, paddingRight: 28 }}
                  >
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                    <option value="year">This year</option>
                    <option value="all">All time</option>
                  </select>
                  <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                </div>
                {reportsFilterMode !== "all" && (
                  <>
                    <button onClick={reportsNavPrev} style={S.weekNavBtn} aria-label="Previous">
                      ‹
                    </button>
                    <button
                      onClick={reportsNavReset}
                      style={{ ...S.weekNavLabel, ...(reportsNavIsCurrent ? S.weekNavLabelActive : {}) }}
                    >
                      {reportsRangeLabel}
                      {reportsNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                    </button>
                    <button onClick={reportsNavNext} style={S.weekNavBtn} aria-label="Next">
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={S.reportsExportRow}>
              <div style={{ ...S.hint, flex: 1 }}>
                This snapshot covers {reportsFilterMode === "all" ? "all time" : reportsRangeLabel}. Export downloads a CSV
                you can upload to Google Drive or open in Sheets — this environment can't connect to your Drive account
                directly, so a manual upload after downloading is the reliable path.
              </div>
              <button onClick={exportReportCSV} style={S.exportBtn}>
                <Download size={13} /> Export CSV
              </button>
            </div>

            <div style={S.sourceGrid}>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={S.reportsCardLabel}>Total sales</span>
                  <span style={S.sourceCount}>{reportsSales.length} sale{reportsSales.length === 1 ? "" : "s"}</span>
                </div>
                <div style={S.sourceValue}>{money(reportsTotalSalesValue)}</div>
              </div>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={S.reportsCardLabel}>Package prices</span>
                </div>
                <div style={S.sourceValue}>{money(reportsTotalPackagePrice)}</div>
              </div>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={S.reportsCardLabel}>Date flex</span>
                </div>
                <div style={S.sourceValue}>{money(reportsTotalDateFlex)}</div>
              </div>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={S.reportsCardLabel}>Refunds</span>
                  <span style={S.sourceCount}>
                    {reportsRefundedSales.length} lead{reportsRefundedSales.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={{ ...S.sourceValue, color: reportsTotalRefunded > 0 ? "#A32D2D" : T.ink }}>
                  {money(reportsTotalRefunded)}
                </div>
              </div>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={S.reportsCardLabel}>Commission earned</span>
                </div>
                <div style={S.sourceValue}>{money(reportsTotalCommission)}</div>
              </div>
            </div>

            <div style={{ ...S.dashboardSectionLabel, marginTop: 20 }}>Sales by source</div>
            <div style={S.sourceGrid}>
              {reportsSourceBreakdown.map((row) => (
                <div key={row.source} style={S.sourceCard}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ ...S.leadBadge, ...(row.source === "Monster" ? S.leadBadgeMonster : S.leadBadgePGR) }}>
                      {row.source}
                    </span>
                    <span style={S.sourceCount}>
                      {row.count} sale{row.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div style={S.sourceValue}>{money(row.total)}</div>
                </div>
              ))}
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...S.leadBadge, background: "#FCEBEB", color: "#A32D2D" }}>Declined</span>
                  <span style={S.sourceCount}>
                    {reportsDeclined.length} sale{reportsDeclined.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={S.sourceValue}>
                  {money(reportsDeclined.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0))}
                </div>
              </div>
            </div>

            <div style={{ ...S.dashboardSectionLabel, marginTop: 20 }}>Employees</div>
            {reportsEmployeeRows.length === 0 ? (
              <div style={S.emptyState}>
                <BarChart3 size={22} color={T.borderStrong} />
                <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                  No employee activity for this period yet
                </div>
              </div>
            ) : (
              <div className="crm-scroll" style={S.tableScroll}>
                <table style={{ ...S.table, minWidth: 620 }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Employee</th>
                      <th style={S.th}>Sales</th>
                      <th style={S.th}>Credited total</th>
                      <th style={S.th}>Commission %</th>
                      <th style={S.th}>Commission earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsEmployeeRows.map((r) => (
                      <tr key={r.employee.id}>
                        <td style={{ ...S.td, fontWeight: 500, whiteSpace: "nowrap" }}>{r.employee.name}</td>
                        <td style={S.td}>{r.salesCount}</td>
                        <td style={{ ...S.td, fontFamily: T.mono }}>{money(r.credited)}</td>
                        <td style={S.td}>
                          {r.rate > 0 ? <span style={S.commissionRateBadge}>{r.rate}%</span> : <span style={{ color: T.borderStrong }}>—</span>}
                        </td>
                        <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 500 }}>{money(r.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ ...S.hint, marginTop: 12 }}>
              Commission figures here are earned-commission only for the period shown — they don't include base pay or the
              {" "}{money(settings.minWeeklyPay)} weekly minimum guarantee, since those apply per calendar week. Visit Payroll for
              exact take-home figures on any given week.
            </div>
          </div>
        )}

        {section === "admin" && (
          <div style={S.dashboardWrap}>
            <div style={S.dashboardSectionLabel}>Users & access</div>
            <div style={S.hint}>
              Each person signs in with their own username and password. Roles are currently just a label — everyone sees
              every tab regardless of role, until you ask me to turn on real per-role restrictions.
            </div>

            <div className="crm-scroll" style={{ ...S.tableScroll, marginTop: 12 }}>
              <table style={{ ...S.table, minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={S.th}>Name</th>
                    <th style={S.th}>Username</th>
                    <th style={S.th}>Role</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="crm-row" onClick={() => setUserModal({ ...u, password: "" })}>
                      <td style={{ ...S.td, fontWeight: 500 }}>{u.name}</td>
                      <td style={{ ...S.td, fontFamily: T.mono }}>@{u.username}</td>
                      <td style={S.td}>
                        <RoleBadge role={u.role} size="sm" />
                      </td>
                      <td style={S.td}>
                        {currentUser && currentUser.id === u.id && (
                          <span style={{ fontSize: 10.5, color: T.textMuted }}>You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setUserModal({ name: "", username: "", password: "", role: "rep" })}
              style={{ ...S.primaryBtn, marginTop: 10 }}
            >
              <Plus size={14} /> Add user
            </button>

            <div style={{ ...S.dashboardSectionLabel, marginTop: 28 }}>Business settings</div>
            <div style={S.adminSettingsGrid}>
              <div>
                <div style={S.fieldLabel}>Company name</div>
                <input
                  value={settings.companyName}
                  onChange={(e) => updateSettings({ ...settings, companyName: e.target.value })}
                  style={S.input}
                />
              </div>
              <div>
                <div style={S.fieldLabel}>Weekly pay guarantee</div>
                <input
                  value={settings.minWeeklyPay}
                  onChange={(e) => updateSettings({ ...settings, minWeeklyPay: Number(e.target.value) || 0 })}
                  type="number"
                  style={{ ...S.input, fontFamily: T.mono }}
                />
              </div>
            </div>
            {adminSaved && <div style={S.savedNote}>Saved</div>}

            <div style={{ ...S.dashboardSectionLabel, marginTop: 24 }}>Dropdown lists</div>
            <div style={S.adminListsGrid}>
              <div style={S.adminListCard}>
                <div style={S.adminListTitle}>Source (Dialer / Paper, etc.)</div>
                <div style={S.adminChipRow}>
                  {settings.sources.map((s) => (
                    <span key={s} style={S.adminChip}>
                      {s}
                      <button onClick={() => removeListItem("sources", s)} style={S.adminChipRemove}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={S.adminAddRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      value={adminNewSource}
                      onChange={(e) => setAdminNewSource(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addListItem("sources", adminNewSource, setAdminNewSource)}
                      placeholder="Add option"
                      style={S.input}
                    />
                  </div>
                  <button onClick={() => addListItem("sources", adminNewSource, setAdminNewSource)} style={S.ghostBtn}>
                    Add
                  </button>
                </div>
              </div>

              <div style={S.adminListCard}>
                <div style={S.adminListTitle}>Submitted to (Monster / PGR, etc.)</div>
                <div style={S.adminChipRow}>
                  {settings.leadSources.map((s) => (
                    <span key={s} style={S.adminChip}>
                      {s}
                      <button onClick={() => removeListItem("leadSources", s)} style={S.adminChipRemove}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={S.adminAddRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      value={adminNewLeadSource}
                      onChange={(e) => setAdminNewLeadSource(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addListItem("leadSources", adminNewLeadSource, setAdminNewLeadSource)}
                      placeholder="Add option"
                      style={S.input}
                    />
                  </div>
                  <button onClick={() => addListItem("leadSources", adminNewLeadSource, setAdminNewLeadSource)} style={S.ghostBtn}>
                    Add
                  </button>
                </div>
              </div>

              <div style={S.adminListCard}>
                <div style={S.adminListTitle}>Lead category (All Leads filter)</div>
                <div style={S.adminChipRow}>
                  {settings.leadCategories.map((s) => (
                    <span key={s} style={{ ...S.adminChip, background: categoryColor(s).bg, color: categoryColor(s).color }}>
                      {s}
                      <button onClick={() => removeListItem("leadCategories", s)} style={{ ...S.adminChipRemove, color: categoryColor(s).color }}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={S.adminAddRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      value={adminNewCategory}
                      onChange={(e) => setAdminNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addListItem("leadCategories", adminNewCategory, setAdminNewCategory)}
                      placeholder="Add option"
                      style={S.input}
                    />
                  </div>
                  <button onClick={() => addListItem("leadCategories", adminNewCategory, setAdminNewCategory)} style={S.ghostBtn}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User modal */}
      {userModal && (
        <Modal onClose={() => setUserModal(null)} narrow>
          <UserForm
            initial={userModal}
            currentUserId={currentUser ? currentUser.id : null}
            userCount={users.length}
            onCancel={() => setUserModal(null)}
            onSave={async (form) => {
              const isSelf = currentUser && form.id === currentUser.id;
              try {
                if (form.id) {
                  const body = { name: form.name, username: form.username, role: form.role };
                  if (form.password) body.password = form.password;
                  const res = await fetch(`/api/users/${form.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(body),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    setUserFormError(err.error || "Couldn't save that user.");
                    return;
                  }
                  if (isSelf) {
                    setCurrentUser({ ...currentUser, name: form.name, username: form.username });
                  }
                } else {
                  const res = await fetch("/api/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(form),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    setUserFormError(err.error || "Couldn't create that user.");
                    return;
                  }
                }
                setUserFormError("");
                setUserModal(null);
                refreshUsers();
              } catch (e) {
                setUserFormError("Couldn't reach the server. Try again.");
              }
            }}
            serverError={userFormError}
            onDelete={
              userModal.id
                ? async () => {
                    try {
                      const res = await fetch(`/api/users/${userModal.id}`, { method: "DELETE", credentials: "include" });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        setUserFormError(err.error || "Couldn't delete that user.");
                        return;
                      }
                      const wasSelf = currentUser && currentUser.id === userModal.id;
                      setUserFormError("");
                      setUserModal(null);
                      if (wasSelf) {
                        logOut();
                      } else {
                        refreshUsers();
                      }
                    } catch (e) {
                      setUserFormError("Couldn't reach the server. Try again.");
                    }
                  }
                : null
            }
          />
        </Modal>
      )}

      {/* Contact modal */}
      {contactModal && (
        <Modal onClose={() => setContactModal(null)}>
          <ContactForm
            initial={contactModal}
            onCancel={() => setContactModal(null)}
            onSave={saveContact}
            onDelete={
              contactModal.id
                ? () => setConfirmDelete({ type: "contact", id: contactModal.id, label: contactModal.name })
                : null
            }
          />
        </Modal>
      )}

      {/* Sale modal */}
      {saleModal && (
        <Modal onClose={() => setSaleModal(null)}>
          <SaleForm
            initial={saleModal}
            employees={employees}
            settings={settings}
            onCancel={() => setSaleModal(null)}
            onSave={saveSale}
            onDelete={
              saleModal.id
                ? () => setConfirmDelete({ type: "sale", id: saleModal.id, label: saleModal.name })
                : null
            }
          />
        </Modal>
      )}

      {/* Employee modal */}
      {employeeModal && (
        <Modal onClose={() => setEmployeeModal(null)}>
          <EmployeeForm
            initial={employeeModal}
            onCancel={() => setEmployeeModal(null)}
            onSave={saveEmployee}
            onDelete={
              employeeModal.id
                ? () => setConfirmDelete({ type: "employee", id: employeeModal.id, label: employeeModal.name })
                : null
            }
            onToggleActive={
              employeeModal.id
                ? () =>
                    employeeModal.active === false
                      ? reactivateEmployee(employeeModal.id)
                      : deactivateEmployee(employeeModal.id)
                : null
            }
          />
        </Modal>
      )}

      {/* Employee weekly template modal */}
      {employeeDetail && (
        <Modal onClose={() => setEmployeeDetailId(null)} wide>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={S.avatar}>{initials(employeeDetail.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.modalTitle}>{employeeDetail.name}</div>
              </div>
              <RoleBadge role={employeeDetail.role} size="sm" />
            </div>

            <div style={S.weekNavRow}>
              <div style={S.dashboardSectionLabel}>Weekly template</div>
              <div style={S.weekNav}>
                <button
                  onClick={() => setEmployeeDetailWeekOffset((w) => w - 1)}
                  style={S.weekNavBtn}
                  aria-label="Previous week"
                >
                  ‹
                </button>
                <button
                  onClick={() => setEmployeeDetailWeekOffset(0)}
                  style={{ ...S.weekNavLabel, ...(employeeDetailWeekOffset === 0 ? S.weekNavLabelActive : {}) }}
                >
                  {employeeDetailWeekLabel}
                  {employeeDetailWeekOffset === 0 && <span style={S.weekNavThisWeek}>This week</span>}
                </button>
                <button
                  onClick={() => setEmployeeDetailWeekOffset((w) => w + 1)}
                  style={S.weekNavBtn}
                  aria-label="Next week"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="crm-scroll" style={S.tableScroll}>
              <table style={{ ...S.table, minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Day</th>
                    <th style={S.th}>Sales</th>
                    <th style={S.th}>Total</th>
                    <th style={S.th}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeDetailRows.map((row, i) => {
                    const dayCommission = row.dayTotal * (employeeDetailRate / 100);
                    return (
                      <tr key={i}>
                        <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                          {row.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td style={{ ...S.td, whiteSpace: "nowrap" }}>{row.label}</td>
                        <td style={{ ...S.td, whiteSpace: "normal" }}>
                          {row.entries.length === 0 ? (
                            ""
                          ) : (
                            <div style={S.rrgChipRow}>
                              {row.entries.map((entry, j) => {
                                const t = SALE_TYPES.find((x) => x.id === entry.type);
                                const refunded = isEntryRefunded(entry.sale, entry.type);
                                return (
                                  <span
                                    key={entry.sale.id + "-" + entry.type + "-" + j}
                                    style={{
                                      ...S.rrgChip,
                                      color: refunded ? "#A32D2D" : t ? t.color : T.textMuted,
                                      textDecoration: refunded ? "line-through" : "none",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => {
                                      setEmployeeDetailId(null);
                                      setSection("sales");
                                      setView("salesform");
                                      setSaleModal({ ...entry.sale });
                                    }}
                                  >
                                    {entry.sale.name} {money(entry.amount)}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 500 }}>
                          {row.dayTotal ? money(row.dayTotal) : ""}
                        </td>
                        <td style={{ ...S.td, fontFamily: T.mono }}>
                          {row.dayTotal ? money(dayCommission) : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ ...S.td, fontWeight: 600 }} colSpan={3}>
                      Total sales
                    </td>
                    <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 600 }}>{money(employeeDetailTotalSales)}</td>
                    <td style={{ ...S.td, fontFamily: T.mono, fontWeight: 600 }}>{money(employeeDetailCommission)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={S.detailSummary}>
              <div style={S.detailSummaryRow}>
                <span>Commission ({employeeDetailRate}%)</span>
                <span style={{ fontFamily: T.mono }}>{money(employeeDetailTotalSales * (employeeDetailRate / 100))}</span>
              </div>
              {employeeDetailRefundDeduction > 0 && (
                <div style={{ ...S.detailSummaryRow, color: "#A32D2D" }}>
                  <span>Refund deduction</span>
                  <span style={{ fontFamily: T.mono }}>-{money(employeeDetailRefundDeduction)}</span>
                </div>
              )}
              <div style={S.detailSummaryRow}>
                <span>Base pay</span>
                <span style={{ fontFamily: T.mono }}>{employeeDetailHasBasePay ? money(employeeDetailBasePay) : "—"}</span>
              </div>
              <div style={{ ...S.detailSummaryRow, ...S.detailSummaryTotal }}>
                <span>Total pay {employeeDetailGuarantee && <span style={S.minGuaranteeBadge}>min guarantee</span>}</span>
                <span style={{ fontFamily: T.mono }}>{money(employeeDetailTotalPay)}</span>
              </div>
            </div>

            <div style={S.modalFooter}>
              <span />
              <button style={S.primaryBtn} onClick={() => setEmployeeDetailId(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} narrow>
          <div style={{ padding: 4 }}>
            <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
              Delete {confirmDelete.type === "contact" ? "contact" : confirmDelete.type === "employee" ? "employee" : "sale"}?
            </div>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 18, lineHeight: 1.5 }}>
              {confirmDelete.type === "contact"
                ? `This removes "${confirmDelete.label}". This can't be undone.`
                : confirmDelete.type === "employee"
                ? `This removes "${confirmDelete.label}" from your employee roster. Their sales records aren't affected. This can't be undone.`
                : `This removes the sale record for "${confirmDelete.label}". This can't be undone.`}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={S.ghostBtn} onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                style={S.dangerBtn}
                onClick={() =>
                  confirmDelete.type === "contact"
                    ? deleteContact(confirmDelete.id)
                    : confirmDelete.type === "employee"
                    ? deleteEmployee(confirmDelete.id)
                    : deleteSale(confirmDelete.id)
                }
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm refund */}
      {confirmRefund && (
        <Modal onClose={() => setConfirmRefund(null)} narrow>
          <div style={{ padding: 4 }}>
            <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
              Refund "{confirmRefund.name}"
            </div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              A full refund deducts the whole credited commission from everyone on the lead. A partial refund lets you
              enter a specific amount to deduct from each person separately.
            </div>

            <Field label="Refund type">
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setRefundType("full")}
                  style={{ ...S.roleChip, ...(refundType === "full" ? S.refundTypeActive : {}) }}
                >
                  Full refund
                </button>
                <button
                  onClick={() => setRefundType("partial")}
                  style={{ ...S.roleChip, ...(refundType === "partial" ? S.refundTypeActive : {}) }}
                >
                  Partial refund
                </button>
              </div>
            </Field>

            {refundType === "partial" && (
              <div style={S.refundAmountsGrid}>
                {REFUND_TARGET_OPTIONS.map((opt) => {
                  const empId = employeeIdForRole(confirmRefund, opt.id);
                  const emp = empId ? employeeById[empId] : null;
                  return (
                    <div key={opt.id}>
                      <Field label={emp ? `${opt.label} — ${emp.name}` : `${opt.label} — unassigned`}>
                        <input
                          value={refundAmounts[opt.id]}
                          onChange={(e) => setRefundAmounts((a) => ({ ...a, [opt.id]: e.target.value }))}
                          type="number"
                          disabled={!emp}
                          style={{
                            ...S.input,
                            fontFamily: T.mono,
                            ...(emp ? {} : { background: T.border, cursor: "not-allowed", color: T.textMuted }),
                          }}
                          placeholder="0"
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button style={S.ghostBtn} onClick={() => setConfirmRefund(null)}>
                Cancel
              </button>
              <button
                style={{
                  ...S.dangerBtn,
                  ...(refundType === "partial" &&
                  !(Number(refundAmounts.front) || Number(refundAmounts.close) || Number(refundAmounts.verification))
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : {}),
                }}
                disabled={
                  refundType === "partial" &&
                  !(Number(refundAmounts.front) || Number(refundAmounts.close) || Number(refundAmounts.verification))
                }
                onClick={() => markRefunded(confirmRefund.id, { type: refundType, amounts: refundAmounts })}
              >
                Mark refunded
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, narrow, wide }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div
        style={{ ...S.modal, ...(narrow ? { maxWidth: 360 } : {}), ...(wide ? { maxWidth: 760 } : {}) }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ContactForm({ initial, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function submit() {
    if (!form.name || !form.name.trim()) {
      setError("Enter a name first");
      return;
    }
    onSave(form);
  }

  return (
    <div>
      <div style={S.modalTitle}>{form.id ? "Edit contact" : "New contact"}</div>
      <Field label="Name">
        <input autoFocus value={form.name} onChange={set("name")} style={S.input} placeholder="Jordan Lee" />
      </Field>
      {error && <div style={S.errorText}>{error}</div>}
      <Field label="Company">
        <input value={form.company || ""} onChange={set("company")} style={S.input} placeholder="Acme Co" />
      </Field>
      <Field label="Email">
        <input value={form.email || ""} onChange={set("email")} style={S.input} placeholder="jordan@acme.com" />
      </Field>
      <Field label="Phone">
        <input value={form.phone || ""} onChange={set("phone")} style={S.input} placeholder="+1 415 555 0100" />
      </Field>
      <Field label="Notes">
        <textarea
          value={form.notes || ""}
          onChange={set("notes")}
          style={{ ...S.input, minHeight: 64, resize: "vertical" }}
          placeholder="Context, how you met, preferences…"
        />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Owner">
            <input value={form.owner || ""} onChange={set("owner")} style={S.input} placeholder="Who owns this" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Owner role">
            <div style={{ position: "relative" }}>
              <select value={form.ownerRole || "rep"} onChange={set("ownerRole")} style={S.select}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
            </div>
          </Field>
        </div>
      </div>
      <div style={S.modalFooter}>
        {onDelete ? (
          <button style={S.dangerGhostBtn} onClick={onDelete}>
            <Trash2 size={13} /> Delete
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={S.primaryBtn} onClick={submit}>
            Save contact
          </button>
        </div>
      </div>
    </div>
  );
}

function UserForm({ initial, currentUserId, userCount, onCancel, onSave, onDelete, serverError }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isSelf = form.id && form.id === currentUserId;
  const isLastAdmin = form.role === "admin" && userCount <= 1;
  const isEdit = !!form.id;

  function submit() {
    if (!form.name || !form.name.trim()) {
      setError("Enter a name first");
      return;
    }
    if (!form.username || !form.username.trim()) {
      setError("Enter a username first");
      return;
    }
    if (!isEdit && (!form.password || !form.password.trim())) {
      setError("Enter a password first");
      return;
    }
    setError("");
    onSave(form);
  }

  return (
    <div>
      <div style={S.modalTitle}>{form.id ? "Edit user" : "New user"}</div>
      <Field label="Name">
        <input autoFocus value={form.name} onChange={set("name")} style={S.input} placeholder="Jordan Lee" />
      </Field>
      {(error || serverError) && <div style={S.errorText}>{error || serverError}</div>}
      <Field label="Username">
        <input value={form.username} onChange={set("username")} style={S.input} placeholder="jordan" />
      </Field>
      <Field label={isEdit ? "New password (leave blank to keep current)" : "Password"}>
        <input
          value={form.password}
          onChange={set("password")}
          style={{ ...S.input, fontFamily: T.mono }}
          placeholder={isEdit ? "Leave blank to keep current password" : "Password"}
        />
      </Field>
      <Field label="Role">
        <div style={{ position: "relative" }}>
          <select value={form.role || "rep"} onChange={set("role")} style={S.select} disabled={isSelf && isLastAdmin}>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
        </div>
      </Field>
      {isSelf && isLastAdmin && (
        <div style={S.hint}>You're the only admin, so this role can't be changed until another admin exists.</div>
      )}
      <div style={S.hint}>
        Passwords are hashed on the server and never stored or displayed in plain text.
      </div>
      <div style={S.modalFooter}>
        {onDelete && !isSelf ? (
          <button style={S.dangerGhostBtn} onClick={onDelete}>
            <Trash2 size={13} /> Delete
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={S.primaryBtn} onClick={submit}>
            Save user
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeeForm({ initial, onCancel, onSave, onDelete, onToggleActive }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isInactive = form.active === false;

  function submit() {
    if (!form.name || !form.name.trim()) {
      setError("Enter a name first");
      return;
    }
    onSave({
      ...form,
      commissionRate: form.commissionRate === "" ? "" : Number(form.commissionRate) || 0,
      basePay: form.basePay === "" ? "" : Number(form.basePay) || 0,
    });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={S.modalTitle}>{form.id ? "Edit employee" : "New employee"}</div>
        {isInactive && <span style={S.refundedBadge}>Deactivated</span>}
      </div>
      <Field label="Name">
        <input autoFocus value={form.name} onChange={set("name")} style={S.input} placeholder="Jordan Lee" />
      </Field>
      {error && <div style={S.errorText}>{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Role">
            <div style={{ position: "relative" }}>
              <select value={form.role || "rep"} onChange={set("role")} style={S.select}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
            </div>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Commission %">
            <input
              value={form.commissionRate}
              onChange={set("commissionRate")}
              type="number"
              min="0"
              max="100"
              step="1"
              style={{ ...S.input, fontFamily: T.mono }}
              placeholder="e.g. 35"
            />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Base pay / week">
            <input
              value={form.basePay}
              onChange={set("basePay")}
              type="number"
              min="0"
              step="1"
              style={{ ...S.input, fontFamily: T.mono }}
              placeholder="Leave blank if none"
            />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Phone">
            <input value={form.phone || ""} onChange={set("phone")} style={S.input} placeholder="+1 415 555 0100" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Email">
            <input value={form.email || ""} onChange={set("email")} style={S.input} placeholder="jordan@company.com" />
          </Field>
        </div>
      </div>
      <Field label="Notes">
        <textarea
          value={form.notes || ""}
          onChange={set("notes")}
          style={{ ...S.input, minHeight: 56, resize: "vertical" }}
        />
      </Field>
      <div style={S.hint}>
        Sales are attributed to this employee when they're selected as Opener, Closer, or Verification on a sale record.
      </div>
      {onToggleActive && (
        <button style={isInactive ? S.reactivateBtn : S.deactivateBtn} onClick={onToggleActive}>
          {isInactive ? "Reactivate employee" : "Deactivate employee"}
        </button>
      )}
      <div style={S.modalFooter}>
        {onDelete ? (
          <button style={S.dangerGhostBtn} onClick={onDelete}>
            <Trash2 size={13} /> Delete
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={S.primaryBtn} onClick={submit}>
            Save employee
          </button>
        </div>
      </div>
    </div>
  );
}

function SaleForm({ initial, employees, settings, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    const pkg = Number(form.packagePrice) || 0;
    const flex = Number(form.dateFlex) || 0;
    const computed = pkg + flex;
    if (computed !== Number(form.totalPrice)) {
      setForm((f) => ({ ...f, totalPrice: computed }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.packagePrice, form.dateFlex]);

  function submit() {
    const missing = SALE_REQUIRED_FIELDS.filter((f) => {
      const v = form[f.key];
      return v === undefined || v === null || (typeof v === "string" ? v.trim() === "" : false);
    });
    if (missing.length > 0) {
      setError(`Please fill out: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setError("");
    const packagePrice = form.packagePrice === "" ? 0 : Number(form.packagePrice) || 0;
    const dateFlex = form.dateFlex === "" ? 0 : Number(form.dateFlex) || 0;
    onSave({
      ...form,
      packagePrice,
      dateFlex,
      totalPrice: packagePrice + dateFlex,
    });
  }

  return (
    <div>
      <div style={S.modalTitle}>{form.id ? "Edit sale" : "New sale"}</div>
      <div style={{ ...S.hint, marginBottom: 10 }}>All fields marked * are required to save.</div>
      <Field label="Timestamp">
        <input type="datetime-local" value={form.timestamp || ""} onChange={set("timestamp")} style={S.input} />
      </Field>
      <Field label="Name *">
        <input autoFocus value={form.name} onChange={set("name")} style={S.input} placeholder="Customer name" />
      </Field>
      <Field label="Spouse name">
        <input value={form.spouseName || ""} onChange={set("spouseName")} style={S.input} placeholder="Optional" />
      </Field>
      {error && <div style={S.errorText}>{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Phone number *">
            <input value={form.phone || ""} onChange={set("phone")} style={S.input} placeholder="+1 415 555 0100" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Email address *">
            <input value={form.email || ""} onChange={set("email")} style={S.input} placeholder="name@email.com" />
          </Field>
        </div>
      </div>
      <Field label="Address *">
        <input value={form.address || ""} onChange={set("address")} style={S.input} placeholder="123 Main St" />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          <Field label="City *">
            <input value={form.city || ""} onChange={set("city")} style={S.input} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="State *">
            <input value={form.state || ""} onChange={set("state")} style={S.input} placeholder="FL" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Zip code *">
            <input value={form.zip || ""} onChange={set("zip")} style={S.input} />
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Package price *">
            <input value={form.packagePrice} onChange={set("packagePrice")} type="number" style={{ ...S.input, fontFamily: T.mono }} placeholder="0" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Date flex price *">
            <input value={form.dateFlex} onChange={set("dateFlex")} type="number" style={{ ...S.input, fontFamily: T.mono }} placeholder="0" />
          </Field>
        </div>
      </div>
      <Field label="Total price (auto-calculated)">
        <input
          value={form.totalPrice || 0}
          readOnly
          disabled
          type="number"
          style={{ ...S.input, fontFamily: T.mono, fontWeight: 600, color: T.pineDark, background: T.border, cursor: "not-allowed" }}
        />
      </Field>
      <div style={S.hint}>
        Package price splits 50/50 between the opener and closer. Date flex price is credited entirely to verification.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Password *">
            <input value={form.password || ""} onChange={set("password")} style={{ ...S.input, fontFamily: T.mono }} placeholder="Verification password" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Genie # *">
            <input value={form.genieNumber || ""} onChange={set("genieNumber")} style={S.input} />
          </Field>
        </div>
      </div>
      <div style={S.roleFieldGrid}>
        <div>
          <Field label="Opener *">
            <div style={{ position: "relative" }}>
              <select value={form.openerId || ""} onChange={set("openerId")} style={{ ...S.select, borderColor: SALE_TYPES[0].color }}>
                <option value="">Unassigned</option>
                {(employees || []).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
            </div>
          </Field>
        </div>
        <div>
          <Field label="Closer *">
            <div style={{ position: "relative" }}>
              <select value={form.closerId || ""} onChange={set("closerId")} style={{ ...S.select, borderColor: SALE_TYPES[1].color }}>
                <option value="">Unassigned</option>
                {(employees || []).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
            </div>
          </Field>
        </div>
        <div>
          <Field label="Verification *">
            <div style={{ position: "relative" }}>
              <select value={form.verificationId || ""} onChange={set("verificationId")} style={{ ...S.select, borderColor: SALE_TYPES[2].color }}>
                <option value="">Unassigned</option>
                {(employees || []).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
            </div>
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Source *">
            <div style={{ position: "relative" }}>
              <select value={form.source || ""} onChange={set("source")} style={S.select}>
                <option value="">Not set</option>
                {settings.sources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
            </div>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Submitted to *">
            <div style={{ position: "relative" }}>
              <select value={form.leadSubmittedTo || ""} onChange={set("leadSubmittedTo")} style={S.select}>
                <option value="">Not submitted yet</option>
                {settings.leadSources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
            </div>
          </Field>
        </div>
      </div>
      <Field label="Status *">
        <div style={{ position: "relative" }}>
          <select value={form.status || ""} onChange={set("status")} style={S.select}>
            <option value="">Pending</option>
            {SALE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
        </div>
      </Field>
      <Field label="Notes">
        <textarea
          value={form.notes || ""}
          onChange={set("notes")}
          style={{ ...S.input, minHeight: 64, resize: "vertical" }}
        />
      </Field>
      <div style={S.modalFooter}>
        {onDelete ? (
          <button style={S.dangerGhostBtn} onClick={onDelete}>
            <Trash2 size={13} /> Delete
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
          <button style={S.primaryBtn} onClick={submit}>
            Save sale
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={S.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

// ---- theme + styles ----
const T = {
  paper: "#FAFAF7",
  paperRaised: "#FFFFFF",
  ink: "#1B1E1A",
  textMuted: "#767468",
  border: "#E6E2D6",
  borderStrong: "#D3CEBD",
  pine: "#2D5F4C",
  pineDark: "#1F4536",
  gold: "#B8944A",
  red: "#A45050",
  display: "'Fraunces', Georgia, serif",
  sans: "'Inter', -apple-system, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const S = {
  app: {
    fontFamily: T.sans,
    background: T.paper,
    color: T.ink,
    borderRadius: 14,
    border: `1px solid ${T.border}`,
    overflow: "hidden",
    display: "flex",
    flexDirection: "row",
    width: "100%",
  },
  sidebar: {
    width: 176,
    flexShrink: 0,
    background: T.paperRaised,
    borderRight: `1px solid ${T.border}`,
    padding: "18px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  navList: { display: "flex", flexDirection: "column", gap: 2, marginTop: 20 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: "none",
    background: "transparent",
    color: T.textMuted,
    fontSize: 13,
    fontWeight: 500,
    padding: "8px 9px",
    borderRadius: 7,
    textAlign: "left",
  },
  navItemActive: { background: T.pineDark, color: "#fff" },
  viewerBtnSidebar: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    border: `1px solid ${T.border}`,
    background: T.paper,
    borderRadius: 10,
    padding: "7px 8px",
    width: "100%",
  },
  viewerPopoverSidebar: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: 0,
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 14,
    width: 220,
    boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
    zIndex: 50,
  },
  main: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    borderBottom: `1px solid ${T.border}`,
    background: T.paperRaised,
    flexWrap: "wrap",
  },
  topbarTitle: { fontFamily: T.display, fontSize: 18, fontWeight: 600, color: T.ink },
  dashboardWrap: { padding: 20 },
  entryScreenWrap: {
    maxWidth: 360,
    margin: "60px auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  entrySuccessIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#EAF3EC",
    color: "#1E8E4A",
    fontSize: 22,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  entrySuccessTitle: { fontFamily: T.display, fontSize: 19, fontWeight: 600, marginBottom: 6 },
  dashboardSectionLabel: { fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" },
  weekNavRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 },
  weekNav: { display: "flex", alignItems: "center", gap: 4 },
  weekNavBtn: {
    border: `1px solid ${T.border}`,
    background: T.paperRaised,
    color: T.textMuted,
    fontSize: 14,
    lineHeight: 1,
    width: 26,
    height: 26,
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  weekNavLabel: {
    border: `1px solid ${T.border}`,
    background: T.paperRaised,
    color: T.ink,
    fontSize: 12,
    fontWeight: 500,
    padding: "5px 10px",
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  weekNavLabelActive: { borderColor: T.pineDark },
  weekNavThisWeek: {
    fontSize: 9.5,
    fontWeight: 600,
    color: T.pineDark,
    background: "#E7EFEA",
    padding: "1px 6px",
    borderRadius: 20,
  },
  rrgLegend: { display: "flex", gap: 16, marginBottom: 14 },
  rrgLegendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.textMuted },
  rrgLegendDot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block" },
  rrgChipRow: { display: "flex", flexWrap: "wrap", gap: "3px 6px" },
  rrgChip: { fontFamily: T.mono, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" },
  attendanceSelect: {
    fontSize: 10.5,
    fontWeight: 600,
    border: "1px solid transparent",
    borderRadius: 5,
    padding: "2px 4px",
    outline: "none",
    cursor: "pointer",
    maxWidth: 90,
  },
  sourceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 4 },
  sourceCard: {
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 14,
  },
  sourceCount: { fontSize: 11, color: T.textMuted },
  sourceValue: { fontFamily: T.mono, fontSize: 18, fontWeight: 500, color: T.ink, marginTop: 10 },
  reportsCardLabel: { fontSize: 10.5, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" },
  adminSettingsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 12 },
  savedNote: { fontSize: 11.5, color: T.pineDark, fontWeight: 500, marginTop: 8 },
  adminListsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 },
  adminListCard: {
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 14,
  },
  adminListTitle: { fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 10 },
  adminChipRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, minHeight: 24 },
  adminChip: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11.5,
    fontWeight: 500,
    color: T.textMuted,
    background: T.paper,
    border: `1px solid ${T.border}`,
    padding: "3px 4px 3px 9px",
    borderRadius: 20,
  },
  adminChipRemove: {
    border: "none",
    background: "transparent",
    color: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    borderRadius: "50%",
    opacity: 0.6,
  },
  adminAddRow: { display: "flex", gap: 6 },
  reportsExportRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    padding: "10px 12px",
    background: T.paper,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: "none",
    background: T.pineDark,
    color: "#fff",
    fontSize: 12.5,
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 7,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  recentList: { display: "flex", flexDirection: "column", gap: 6 },
  recentRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 9,
    padding: "10px 12px",
    cursor: "pointer",
  },
  recentTitle: { fontSize: 13, fontWeight: 500, color: T.ink },
  recentSub: { fontSize: 11.5, color: T.textMuted, marginTop: 1 },
  brand: {
    fontFamily: T.display,
    fontSize: 19,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: T.ink,
    lineHeight: 1.1,
  },
  gateWrap: {
    width: "100%",
    maxWidth: 300,
    margin: "auto",
    padding: "40px 20px",
  },
  brandSub: {
    fontSize: 11,
    color: T.textMuted,
    fontFamily: T.mono,
    letterSpacing: "0.02em",
    marginTop: 1,
  },
  tabs: { display: "flex", gap: 2, background: T.paper, padding: 3, borderRadius: 8, border: `1px solid ${T.border}` },
  tab: {
    border: "none",
    background: "transparent",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: T.textMuted,
  },
  tabActive: { background: T.ink, color: T.paper },
  searchWrap: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: "7px 10px",
    minWidth: 180,
    background: T.paper,
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13,
    color: T.ink,
    width: "100%",
  },
  iconBtnGhost: { border: "none", background: "transparent", padding: 2, display: "flex" },
  viewerBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    border: `1px solid ${T.border}`,
    background: T.paper,
    borderRadius: 20,
    padding: "5px 10px 5px 5px",
  },
  avatarSm: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#E7EFEA",
    color: T.pineDark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9.5,
    fontWeight: 600,
    flexShrink: 0,
  },
  viewerPopover: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 14,
    width: 220,
    boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
    zIndex: 50,
  },
  roleChip: {
    flex: 1,
    border: `1px solid ${T.border}`,
    background: "transparent",
    color: T.textMuted,
    fontSize: 11.5,
    fontWeight: 500,
    padding: "6px 4px",
    borderRadius: 20,
  },
  refundTypeActive: { background: "#FCEBEB", color: "#A32D2D", borderColor: "#E8B4B4" },
  refundAmountsGrid: { display: "flex", flexDirection: "column", gap: 2 },
  viewerNote: { fontSize: 10.5, color: T.textMuted, lineHeight: 1.4, marginTop: 8 },
  myItemsToggle: {
    border: `1px solid ${T.border}`,
    background: T.paperRaised,
    color: T.textMuted,
    fontSize: 11.5,
    fontWeight: 500,
    padding: "6px 12px",
    borderRadius: 20,
  },
  myItemsToggleActive: { background: T.pineDark, color: "#fff", borderColor: T.pineDark },
  dealOwner: { fontSize: 10.5, color: T.textMuted, marginTop: 2 },
  contactOwner: { fontSize: 10.5, color: T.textMuted, marginTop: 8 },
  stats: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    borderBottom: `1px solid ${T.border}`,
    background: T.paper,
    gap: 20,
    flexWrap: "wrap",
  },
  statItem: { display: "flex", flexDirection: "column", gap: 2 },
  statLabel: { fontSize: 10.5, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontFamily: T.mono, fontSize: 16, fontWeight: 500, color: T.ink },
  statDivider: { width: 1, height: 26, background: T.border },
  dealValue: { fontFamily: T.mono, fontSize: 12.5, color: T.pineDark, marginTop: 6, fontWeight: 500 },
  contactsWrap: { padding: 20 },
  salesWrap: { padding: 20 },
  tableScroll: { overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 10, background: T.paperRaised },
  leadBadge: {
    fontSize: 10.5,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  },
  leadBadgeMonster: { background: "#F3E9DA", color: "#8A5A1E" },
  leadBadgePGR: { background: "#E1EAF5", color: "#2A5488" },
  sourceBadge: {
    fontSize: 10.5,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    background: T.border,
    color: T.textMuted,
  },
  table: { borderCollapse: "collapse", width: "100%", minWidth: 1820 },
  th: {
    textAlign: "left",
    fontSize: 10.5,
    fontWeight: 600,
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    padding: "10px 12px",
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: "nowrap",
  },
  tr: { cursor: "pointer" },
  td: {
    fontSize: 12.5,
    color: T.ink,
    padding: "9px 12px",
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: "nowrap",
  },
  rowDeleteBtn: {
    border: "none",
    background: "transparent",
    color: T.borderStrong,
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  reorderCell: { display: "flex", alignItems: "center", gap: 6 },
  reorderBtns: { display: "flex", flexDirection: "column", gap: 1 },
  reorderBtn: {
    border: `1px solid ${T.border}`,
    background: T.paperRaised,
    color: T.textMuted,
    padding: 0,
    width: 16,
    height: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
  },
  reorderBtnDisabled: { opacity: 0.3, cursor: "not-allowed" },
  contactsToolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  contactsCount: { fontSize: 12.5, color: T.textMuted },
  contactGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 },
  leadList: { display: "flex", flexDirection: "column", gap: 10 },
  leadCard: {
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 14,
  },
  leadCardRefunded: {
    borderColor: "#E8B4B4",
    background: "#FCF3F3",
  },
  leadCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  leadName: { fontSize: 14, fontWeight: 600, color: T.ink, fontFamily: T.display },
  refundedBadge: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#fff",
    background: "#A32D2D",
    padding: "2px 8px",
    borderRadius: 20,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  leadCardActions: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  refundBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    border: `1px solid #E8B4B4`,
    background: "#FCEBEB",
    color: "#A32D2D",
    fontSize: 12,
    fontWeight: 500,
    padding: "6px 10px",
    borderRadius: 7,
  },
  leadInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "8px 16px",
    paddingTop: 10,
    borderTop: `1px solid ${T.border}`,
  },
  leadInfoItem: { display: "flex", flexDirection: "column", gap: 2, fontSize: 12.5, color: T.ink },
  leadInfoLabel: { fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" },
  leadEmployeeRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px solid ${T.border}`,
  },
  leadEmployeeItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.ink },
  refundImpactNote: { fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: "#A32D2D" },
  leadNotes: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px solid ${T.border}`,
    fontSize: 12.5,
    color: T.textMuted,
    lineHeight: 1.5,
  },
  contactCard: {
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 14,
    cursor: "pointer",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#E7EFEA",
    color: T.pineDark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  contactName: { fontSize: 13.5, fontWeight: 500, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  contactCompany: { fontSize: 11.5, color: T.textMuted, display: "flex", alignItems: "center", marginTop: 2 },
  contactMeta: { marginTop: 10, display: "flex", flexDirection: "column", gap: 4 },
  contactMetaRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.textMuted },
  employeeStats: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: `1px solid ${T.border}`,
    fontFamily: T.mono,
    fontSize: 11,
    color: T.pineDark,
  },
  weeklySaleList: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: `1px solid ${T.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  weeklySaleRow: {
    fontFamily: T.mono,
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer",
  },
  weeklyTemplateBtn: {
    marginTop: 10,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    border: `1px solid ${T.border}`,
    background: T.paper,
    color: T.textMuted,
    fontSize: 11.5,
    fontWeight: 500,
    padding: "7px 8px",
    borderRadius: 7,
  },
  deactivateBtn: {
    marginTop: 14,
    marginBottom: -4,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    border: `1px solid #E8B4B4`,
    background: "transparent",
    color: "#A32D2D",
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 8px",
    borderRadius: 7,
  },
  reactivateBtn: {
    marginTop: 14,
    marginBottom: -4,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    border: `1px solid #B8D9C4`,
    background: "#EAF3EC",
    color: T.pineDark,
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 8px",
    borderRadius: 7,
  },
  exEmployeeNote: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px solid ${T.border}`,
    fontSize: 11,
    color: T.textMuted,
    fontStyle: "italic",
  },
  detailSummary: {
    marginTop: 16,
    background: T.paper,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  detailSummaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 12.5,
    color: T.textMuted,
  },
  detailSummaryTotal: {
    paddingTop: 8,
    marginTop: 2,
    borderTop: `1px solid ${T.border}`,
    fontWeight: 600,
    color: T.ink,
    fontSize: 13,
  },
  commissionRateBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: T.gold,
    background: "#F3E9DA",
    padding: "2px 8px",
    borderRadius: 20,
  },
  minGuaranteeBadge: {
    display: "block",
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: 600,
    color: T.gold,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  totalPayCell: { display: "flex", alignItems: "center", gap: 4 },
  totalPayCurrency: { fontFamily: T.mono, fontSize: 12.5, fontWeight: 600, color: T.pineDark },
  totalPayInput: {
    fontFamily: T.mono,
    fontSize: 12.5,
    fontWeight: 600,
    border: `1px solid transparent`,
    background: "transparent",
    borderRadius: 5,
    padding: "3px 4px",
    width: 72,
    outline: "none",
  },
  totalPayResetBtn: {
    border: "none",
    background: "#F3E9DA",
    color: "#8A5A1E",
    padding: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    flexShrink: 0,
  },
  customPayNote: { fontSize: 10, color: "#8A5A1E", marginTop: 2 },
  emptyState: { textAlign: "center", padding: "50px 0" },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(27,30,26,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: T.paperRaised,
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  },
  modalTitle: { fontFamily: T.display, fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 14 },
  fieldLabel: { fontSize: 11.5, color: T.textMuted, marginBottom: 5, fontWeight: 500 },
  input: {
    width: "100%",
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    padding: "8px 10px",
    fontSize: 13,
    color: T.ink,
    outline: "none",
    background: T.paper,
  },
  select: {
    width: "100%",
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    padding: "8px 10px",
    fontSize: 13,
    color: T.ink,
    outline: "none",
    background: T.paper,
    appearance: "none",
    WebkitAppearance: "none",
  },
  selectChevron: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  errorText: { fontSize: 11.5, color: T.red, marginTop: -8, marginBottom: 10 },
  passwordEyeBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: T.textMuted,
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  hint: { fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 4 },
  roleFieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  modalFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    border: "none",
    background: T.pineDark,
    color: "#fff",
    fontSize: 12.5,
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 7,
  },
  ghostBtn: {
    border: `1px solid ${T.border}`,
    background: "transparent",
    color: T.ink,
    fontSize: 12.5,
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 7,
  },
  dangerBtn: {
    border: "none",
    background: T.red,
    color: "#fff",
    fontSize: 12.5,
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 7,
  },
  dangerGhostBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    border: "none",
    background: "transparent",
    color: T.red,
    fontSize: 12.5,
    fontWeight: 500,
    padding: "8px 4px",
  },
};
