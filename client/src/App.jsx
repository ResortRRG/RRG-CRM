import { useState, useEffect, useRef, useCallback, Fragment } from "react";
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
  Upload,
  Paperclip,
  Pencil,
  Settings,
  Tag,
  Eye,
  EyeOff,
  Minus,
  FileText,
  ShieldAlert,
  Printer,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales", icon: TrendingUp },
  { id: "leads", label: "All Leads", icon: ClipboardList },
  { id: "employees", label: "Employees", icon: Users },
  { id: "rrgboard", label: "RRG Board", icon: LayoutGrid },
  { id: "payroll", label: "Payroll", icon: Wallet },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "information", label: "Information", icon: FileText },
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
const DEFAULT_LEAD_CATEGORIES = ["Monster", "PGR", "Pending", "Chargeback", "Declined"];
const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent",
  "Dialer",
  "Office Supplies",
  "Internet",
  "Legal and Accounting",
  "Payroll",
  "Marketing",
  "Leads",
];
const SALE_STATUSES = ["Pending", "Approved", "Declined"];
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

const DASHBOARD_CHART_COLORS = {
  Monster: "#1E9E62",
  PGR: "#007FFF",
  Declined: "#E07B1A",
  Chargeback: "#E5231B",
};
function chartColor(name) {
  return DASHBOARD_CHART_COLORS[name] || "#767468";
}

const DEFAULT_SETTINGS = {
  companyName: DEFAULT_COMPANY_NAME,
  minWeeklyPay: DEFAULT_MIN_WEEKLY_PAY,
  sources: DEFAULT_SOURCES,
  leadSources: DEFAULT_LEAD_SOURCES,
  leadCategories: DEFAULT_LEAD_CATEGORIES,
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  monsterCommissionRate: 68,
  pgrCommissionRate: 75,
};

const ROLE_PERMISSIONS = {
  rep: ["sales"],
  manager: ["dashboard", "sales", "employees"],
};
function getAllowedSections(role) {
  if (ROLE_PERMISSIONS[role]) return ROLE_PERMISSIONS[role];
  return NAV_ITEMS.map((n) => n.id);
}
function isSalesEntryRole(role) {
  return role === "rep" || role === "manager";
}

const ATTENDANCE_STATUSES = [
  { id: "late", label: "Late", color: "#B8763E" },
  { id: "unexcused_late", label: "Unexcused Late", color: "#A3521E" },
  { id: "left_early", label: "Left early", color: "#8A5A1E" },
  { id: "absent", label: "Absent", color: "#A32D2D" },
  { id: "unexcused_absent", label: "Unexcused Absent", color: "#7A1F1F" },
];

const SALE_TYPES = [
  { id: "front", label: "Front", color: "#2B2B28" },
  { id: "close", label: "Close", color: "#1E8E4A" },
  { id: "openclose", label: "Opened & Closed", color: "#2A5488" },
  { id: "verification", label: "Verification", color: "#B23B3B" },
  { id: "allroles", label: "Opened, Closed & Verified", color: "#7B3FA0" },
];

const REFUND_TARGET_OPTIONS = [
  { id: "front", label: "Opener" },
  { id: "close", label: "Closer" },
  { id: "verification", label: "Verification" },
];

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const US_STATE_ABBREVIATIONS = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO",
  Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
  "District of Columbia": "DC",
};

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
    phone2: "",
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
    status: "Pending",
    leadCategory: "",
    notes: "",
    skipEpgPush: false,
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
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);
  return { start: monday, end: saturday };
}

function mondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
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

function getDayRange(offset) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 23, 59, 59, 999);
  return { start, end };
}

function formatDayLabel(start) {
  return start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function todayDateStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getDayRangeFromDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end };
}

function shiftDateStr(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
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
  const day = dateObj.getDay();
  const idx = (day + 6) % 7;
  return idx <= 5 ? idx : null;
}

const BASE_PAY_LABEL_EXCEPTIONS = ["cristina rossi", "nicholas pelloni"];
function basePayLabel(name) {
  const normalized = (name || "").trim().toLowerCase();
  return BASE_PAY_LABEL_EXCEPTIONS.includes(normalized) ? "Base pay" : "Draw";
}

function combinedEarnings(commission, basePay, employeeName) {
  if (basePayLabel(employeeName) === "Base pay") return commission + basePay;
  return Math.max(commission, basePay);
}

function toTitleCase(str) {
  return (str || "")
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

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

function buildRoleEntries(sale, employeeId) {
  const entries = [];
  const isOpener = sale.openerId === employeeId;
  const isCloser = sale.closerId === employeeId;
  const isVerification = sale.verificationId === employeeId;

  if (isOpener && isCloser && isVerification) {
    entries.push({
      sale,
      type: "allroles",
      amount: roleCreditAmount(sale, "front") + roleCreditAmount(sale, "close") + roleCreditAmount(sale, "verification"),
    });
    return entries;
  }

  if (isOpener && isCloser) {
    entries.push({
      sale,
      type: "openclose",
      amount: roleCreditAmount(sale, "front") + roleCreditAmount(sale, "close"),
    });
  } else {
    if (isOpener) entries.push({ sale, type: "front", amount: roleCreditAmount(sale, "front") });
    if (isCloser) entries.push({ sale, type: "close", amount: roleCreditAmount(sale, "close") });
  }
  if (isVerification) {
    entries.push({ sale, type: "verification", amount: roleCreditAmount(sale, "verification") });
  }
  return entries;
}

function employeeIdForRole(sale, roleId) {
  if (roleId === "front") return sale.openerId;
  if (roleId === "close") return sale.closerId;
  if (roleId === "verification") return sale.verificationId;
  return null;
}

function refundImpactForRole(sale, roleId) {
  if (!sale.refunded) return 0;
  if (sale.refundType === "partial") {
    return Number((sale.refundAmounts && sale.refundAmounts[roleId]) || 0);
  }
  return roleCreditAmount(sale, roleId);
}

function isEntryRefunded(sale, roleId) {
  if (!sale.refunded) return false;
  if (sale.refundType === "partial") {
    if (roleId === "openclose") {
      return refundImpactForRole(sale, "front") > 0 || refundImpactForRole(sale, "close") > 0;
    }
    if (roleId === "allroles") {
      return (
        refundImpactForRole(sale, "front") > 0 ||
        refundImpactForRole(sale, "close") > 0 ||
        refundImpactForRole(sale, "verification") > 0
      );
    }
    return refundImpactForRole(sale, roleId) > 0;
  }
  return true;
}

function DonutChart({ segments, centerLabel, centerValue }) {
  const total = segments.reduce((s, seg) => s + (seg.value > 0 ? seg.value : 0), 0);
  const size = 200;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const visibleSegments = segments.filter((seg) => seg.value > 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EDEAE0" strokeWidth={strokeWidth} />
          {total === 0
            ? null
            : visibleSegments.map((seg, i) => {
                const fraction = seg.value / total;
                const dash = fraction * circumference;
                const gap = circumference - dash;
                const offset = -cumulative * circumference;
                cumulative += fraction;
                return (
                  <circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                  />
                );
              })}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: "#1B1E1A" }}>
            {centerValue}
          </div>
          <div style={{ fontSize: 10.5, color: "#767468", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {centerLabel}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, minWidth: 160 }}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: seg.color,
                  flexShrink: 0,
                  opacity: seg.value > 0 ? 1 : 0.3,
                }}
              />
              <span style={{ fontSize: 12.5, color: "#1B1E1A", fontWeight: 500, minWidth: 78 }}>{seg.label}</span>
              <span style={{ fontSize: 11.5, color: "#767468" }}>
                {seg.count} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const [refundDeductionOverrides, setRefundDeductionOverrides] = useState({});
  const [workedSaturdays, setWorkedSaturdays] = useState({});
  const [attendance, setAttendance] = useState({});
  const [spiffs, setSpiffs] = useState({});
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
  const [contactModal, setContactModal] = useState(null);
  const [saleModal, setSaleModal] = useState(null);
  const [saleModalMinimized, setSaleModalMinimized] = useState(false);
  const [saleSyncingToEpg, setSaleSyncingToEpg] = useState(false);
  const [saleSaveError, setSaleSaveError] = useState("");
  useEffect(() => {
    function handleWheel(e) {
      const scrollEl = e.target.closest && e.target.closest(".crm-scroll");
      if (!scrollEl) return;
      if (scrollEl.scrollWidth <= scrollEl.clientWidth) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      scrollEl.scrollLeft += e.deltaY;
      e.preventDefault();
    }
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);
  useEffect(() => {
    if (saleModal) {
      setSaleModalMinimized(false);
      setSaleSaveError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleModal]);
  const [entryJustSaved, setEntryJustSaved] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewer, setViewer] = useState({ name: "", role: "rep" });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [myItemsOnly, setMyItemsOnly] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dashboardFilterMode, setDashboardFilterMode] = useState("week");
  const [dashboardSalesListMode, setDashboardSalesListMode] = useState("approved");
  const [dashboardSelectedDate, setDashboardSelectedDate] = useState(todayDateStr());
  const [dashboardCustomStart, setDashboardCustomStart] = useState(shiftDateStr(todayDateStr(), -7));
  const [dashboardCustomEnd, setDashboardCustomEnd] = useState(todayDateStr());
  const [dashboardMonthOffset, setDashboardMonthOffset] = useState(0);
  const [dashboardYearOffset, setDashboardYearOffset] = useState(0);
  const [rrgWeekOffset, setRrgWeekOffset] = useState(0);
  const [payrollWeekOffset, setPayrollWeekOffset] = useState(0);
  const [reportsSubTab, setReportsSubTab] = useState("snapshot");
  const [pnlMode, setPnlMode] = useState("month");
  const [pnlMonthOffset, setPnlMonthOffset] = useState(0);
  const [pnlWeekOffset, setPnlWeekOffset] = useState(0);
  const [pnlCustomStart, setPnlCustomStart] = useState(shiftDateStr(todayDateStr(), -7));
  const [pnlCustomEnd, setPnlCustomEnd] = useState(todayDateStr());
  const [expenses, setExpenses] = useState({});
  const [expenseTransactions, setExpenseTransactions] = useState([]);
  const [infoNotes, setInfoNotes] = useState([]);
  const [dncList, setDncList] = useState([]);
  const [dncModal, setDncModal] = useState(null);
  const [dncBulkOpen, setDncBulkOpen] = useState(false);
  const [dncBulkText, setDncBulkText] = useState("");
  const [infoNoteModal, setInfoNoteModal] = useState(null);
  const [informationSubTab, setInformationSubTab] = useState("notes");
  const [scriptFiles, setScriptFiles] = useState([]);
  const [scriptFilesLoading, setScriptFilesLoading] = useState(false);
  const [scriptUploadBusy, setScriptUploadBusy] = useState(false);
  const [scriptFilesError, setScriptFilesError] = useState("");
  const [infoNoteError, setInfoNoteError] = useState("");
  const [expenseModal, setExpenseModal] = useState(null);
  const [expenseModalError, setExpenseModalError] = useState("");
  const [confirmClearMonthExpenses, setConfirmClearMonthExpenses] = useState(null);
  const [reportsFilterMode, setReportsFilterMode] = useState("month");
  const [reportsSelectedDate, setReportsSelectedDate] = useState(todayDateStr());
  const [reportsCustomStart, setReportsCustomStart] = useState(shiftDateStr(todayDateStr(), -7));
  const [reportsCustomEnd, setReportsCustomEnd] = useState(todayDateStr());
  const [reportsWeekOffset, setReportsWeekOffset] = useState(0);
  const [reportsMonthOffset, setReportsMonthOffset] = useState(0);
  const [reportsYearOffset, setReportsYearOffset] = useState(0);
  const [employeeDetailId, setEmployeeDetailId] = useState(null);
  const [employeeDetailMinimized, setEmployeeDetailMinimized] = useState(false);
  const [payslipStatus, setPayslipStatus] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [confirmRestoreBackup, setConfirmRestoreBackup] = useState(null);
  const [confirmImportLeads, setConfirmImportLeads] = useState(null);
  const [mergeBuilderOpen, setMergeBuilderOpen] = useState(false);
  const [mergeBuilderPairs, setMergeBuilderPairs] = useState([]);
  const [mergeBuilderFromId, setMergeBuilderFromId] = useState("");
  const [mergeBuilderToId, setMergeBuilderToId] = useState("");
  const [mergeStatus, setMergeStatus] = useState(null);
  const [confirmDeactivateEmployee, setConfirmDeactivateEmployee] = useState(null);
  useEffect(() => {
    if (employeeDetailId) {
      setEmployeeDetailMinimized(false);
      setPayslipStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeDetailId]);
  const [employeesView, setEmployeesView] = useState("active");
  const [candidates, setCandidates] = useState([]);
  const [candidateModal, setCandidateModal] = useState(null);
  const [employeeStatsMode, setEmployeeStatsMode] = useState("all");
  const [employeeStatsMonthOffset, setEmployeeStatsMonthOffset] = useState(0);
  const [employeeStatsYearOffset, setEmployeeStatsYearOffset] = useState(0);
  const [employeeDetailWeekOffset, setEmployeeDetailWeekOffset] = useState(0);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsSubTab, setLeadsSubTab] = useState("leads");
  const [leadsFilterMode, setLeadsFilterMode] = useState("all");
  const [leadsSelectedDate, setLeadsSelectedDate] = useState(todayDateStr());
  const [leadsCategoryFilter, setLeadsCategoryFilter] = useState("");
  const [adminNewSource, setAdminNewSource] = useState("");
  const [adminNewLeadSource, setAdminNewLeadSource] = useState("");
  const [adminNewCategory, setAdminNewCategory] = useState("");
  const [adminNewExpenseCategory, setAdminNewExpenseCategory] = useState("");
  const [adminSaved, setAdminSaved] = useState(false);
  const [userModal, setUserModal] = useState(null);
  const [userFormError, setUserFormError] = useState("");
  const [leadsWeekOffset, setLeadsWeekOffset] = useState(0);
  const [leadsMonthOffset, setLeadsMonthOffset] = useState(0);
  const [leadsYearOffset, setLeadsYearOffset] = useState(0);
  const [confirmRefund, setConfirmRefund] = useState(null);
  const [refundType, setRefundType] = useState("full");
  const [refundWeekChoices, setRefundWeekChoices] = useState({ front: "next", close: "next", verification: "next" });
  const [refundAmounts, setRefundAmounts] = useState({ front: "", close: "", verification: "" });
  const [blacklistFailure, setBlacklistFailure] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (confirmRefund) {
      setRefundType("full");
      setRefundAmounts({ front: "", close: "", verification: "" });
      setRefundWeekChoices({ front: "next", close: "next", verification: "next" });
    }
  }, [confirmRefund]);

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
      const rdo = await window.storage.get("crm:refundDeductionOverrides", true);
      setRefundDeductionOverrides(rdo && rdo.value ? JSON.parse(rdo.value) : {});
    } catch (e) {
      setRefundDeductionOverrides({});
    }
    try {
      const ws = await window.storage.get("crm:workedSaturdays", true);
      setWorkedSaturdays(ws && ws.value ? JSON.parse(ws.value) : {});
    } catch (e) {
      setWorkedSaturdays({});
    }
    try {
      const cand = await window.storage.get("crm:candidates", true);
      setCandidates(cand && cand.value ? JSON.parse(cand.value) : []);
    } catch (e) {
      setCandidates([]);
    }
    try {
      const att = await window.storage.get("crm:attendance", true);
      setAttendance(att && att.value ? JSON.parse(att.value) : {});
    } catch (e) {
      setAttendance({});
    }
    try {
      const sp = await window.storage.get("crm:spiffs", true);
      setSpiffs(sp && sp.value ? JSON.parse(sp.value) : {});
    } catch (e) {
      setSpiffs({});
    }
    try {
      const ex = await window.storage.get("crm:expenses", true);
      setExpenses(ex && ex.value ? JSON.parse(ex.value) : {});
    } catch (e) {
      setExpenses({});
    }
    try {
      const et = await window.storage.get("crm:expenseTransactions", true);
      setExpenseTransactions(et && et.value ? JSON.parse(et.value) : []);
    } catch (e) {
      setExpenseTransactions([]);
    }
    try {
      const inf = await window.storage.get("crm:infoNotes", true);
      setInfoNotes(inf && inf.value ? JSON.parse(inf.value) : []);
    } catch (e) {
      setInfoNotes([]);
    }
    try {
      const dnc = await window.storage.get("crm:dncList", true);
      setDncList(dnc && dnc.value ? JSON.parse(dnc.value) : []);
    } catch (e) {
      setDncList([]);
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

  useEffect(() => {
    if (currentUser) {
      loadAppData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser && currentUser.id]);

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
    const interval = setInterval(loadAppData, 120000);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser && currentUser.id]);

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

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await fetch("/api/blacklist/failure-status", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setBlacklistFailure(data.failure || null);
      } catch (e) {
        // ignore — banner just won't show, not worth surfacing a second error about the error banner
      }
    })();
  }, [currentUser && currentUser.id]);

  async function acknowledgeBlacklistFailure() {
    setBlacklistFailure(null);
    try {
      await fetch("/api/blacklist/acknowledge-failure", { method: "POST", credentials: "include" });
    } catch (e) {
      // local dismiss already happened; not critical if the server call fails
    }
  }

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

  const persist = useCallback((nextContacts, nextSales, nextEmployees, nextOverrides, nextAttendance, nextSettings, nextSpiffs, nextRefundDeductionOverrides, nextExpenses, nextExpenseTransactions) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        if (nextContacts) await window.storage.set("crm:contacts", JSON.stringify(nextContacts), true);
        if (nextSales) await window.storage.set("crm:sales", JSON.stringify(nextSales), true);
        if (nextEmployees) await window.storage.set("crm:employees", JSON.stringify(nextEmployees), true);
        if (nextOverrides) await window.storage.set("crm:payrollOverrides", JSON.stringify(nextOverrides), true);
        if (nextAttendance) await window.storage.set("crm:attendance", JSON.stringify(nextAttendance), true);
        if (nextSettings) await window.storage.set("crm:settings", JSON.stringify(nextSettings), true);
        if (nextSpiffs) await window.storage.set("crm:spiffs", JSON.stringify(nextSpiffs), true);
        if (nextRefundDeductionOverrides)
          await window.storage.set("crm:refundDeductionOverrides", JSON.stringify(nextRefundDeductionOverrides), true);
        if (nextExpenses) await window.storage.set("crm:expenses", JSON.stringify(nextExpenses), true);
        if (nextExpenseTransactions)
          await window.storage.set("crm:expenseTransactions", JSON.stringify(nextExpenseTransactions), true);
      } catch (e) {
        console.error("save failed", e);
      }
    }, 250);
  }, []);

  function updateContacts(next) {
    setContacts(next);
    persist(next, null, null, null, null, null, null, null, null);
  }
  function updateSales(next) {
    setSales(next);
    persist(null, next, null, null, null, null, null, null, null);
  }
  function updateEmployees(next) {
    setEmployees(next);
    persist(null, null, next, null, null, null, null, null, null);
  }
  function updatePayrollOverrides(next) {
    setPayrollOverrides(next);
    persist(null, null, null, next, null, null, null, null, null);
  }
  function updateAttendance(next) {
    setAttendance(next);
    persist(null, null, null, null, next, null, null, null, null);
  }
  function updateSpiffs(next) {
    setSpiffs(next);
    persist(null, null, null, null, null, null, next, null, null);
  }
  function updateSettings(next) {
    setSettings(next);
    persist(null, null, null, null, null, next, null, null, null);
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 1500);
  }
  function updateRefundDeductionOverrides(next) {
    setRefundDeductionOverrides(next);
    persist(null, null, null, null, null, null, null, next, null);
  }
  function updateExpenses(next) {
    setExpenses(next);
    persist(null, null, null, null, null, null, null, null, next, null);
  }
  function updateExpenseTransactions(next) {
    setExpenseTransactions(next);
    persist(null, null, null, null, null, null, null, null, null, next);
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

  function getRefundDeductionOverride(employeeId, weekStart) {
    const key = payrollOverrideKey(employeeId, weekStart);
    return refundDeductionOverrides[key] !== undefined ? refundDeductionOverrides[key] : null;
  }
  function setRefundDeductionOverrideValue(employeeId, weekStart, value) {
    const key = payrollOverrideKey(employeeId, weekStart);
    if (value === "" || value === null) {
      const next = { ...refundDeductionOverrides };
      delete next[key];
      updateRefundDeductionOverrides(next);
    } else {
      updateRefundDeductionOverrides({ ...refundDeductionOverrides, [key]: Number(value) || 0 });
    }
  }
  function clearRefundDeductionOverride(employeeId, weekStart) {
    const key = payrollOverrideKey(employeeId, weekStart);
    const next = { ...refundDeductionOverrides };
    delete next[key];
    updateRefundDeductionOverrides(next);
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
  const ABSENCE_GUARANTEE_DEDUCTION = 80;
  const UNEXCUSED_LATE_HALF_DAY_DEDUCTION = 40;
  const BASE_PAY_ABSENCE_DEDUCTION = 100;
  function absentDaysInWeek(employeeId, weekStart) {
    let count = 0;
    for (let i = 0; i < 6; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const status = getAttendance(employeeId, date);
      if (status === "absent" || status === "unexcused_absent") count++;
    }
    return count;
  }
  function unexcusedLateDaysInWeek(employeeId, weekStart) {
    let count = 0;
    for (let i = 0; i < 6; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      if (getAttendance(employeeId, date) === "unexcused_late") count++;
    }
    return count;
  }
  function workedSaturdayKey(employeeId, weekStart) {
    return employeeId + "__" + weekStart.toISOString().slice(0, 10);
  }
  function getWorkedSaturday(employeeId, weekStart) {
    return !!workedSaturdays[workedSaturdayKey(employeeId, weekStart)];
  }
  async function setWorkedSaturdayValue(employeeId, weekStart, value) {
    const key = workedSaturdayKey(employeeId, weekStart);
    const next = { ...workedSaturdays };
    if (value) next[key] = true;
    else delete next[key];
    setWorkedSaturdays(next);
    try {
      await window.storage.set("crm:workedSaturdays", JSON.stringify(next), true);
    } catch (err) {
      console.error("Worked Saturday save failed:", err);
    }
  }
  function effectiveMinGuarantee(employeeId, weekStart) {
    const emp = employees.find((e) => e.id === employeeId);
    const hasBasePay = emp && emp.basePay !== "" && emp.basePay !== undefined && emp.basePay !== null;
    if (!hasBasePay) return 0;
    let baseGuarantee = settings.minWeeklyPay;
    if (emp && emp.startDate) {
      const startDate = new Date(emp.startDate + "T00:00:00");
      if (startDate > weekStart) {
        let prorated = 0;
        for (let i = 0; i < 6; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          if (date >= startDate) {
            if (i === 5) {
              if (getWorkedSaturday(employeeId, weekStart)) prorated += ABSENCE_GUARANTEE_DEDUCTION / 2;
            } else {
              prorated += ABSENCE_GUARANTEE_DEDUCTION;
            }
          }
        }
        baseGuarantee = Math.min(prorated, settings.minWeeklyPay);
      }
    }
    const absences = absentDaysInWeek(employeeId, weekStart);
    if (absences >= 6) return 0;
    const effectiveAbsences = getWorkedSaturday(employeeId, weekStart) ? Math.max(0, absences - 1) : absences;
    let guarantee = Math.max(0, baseGuarantee - effectiveAbsences * ABSENCE_GUARANTEE_DEDUCTION);
    if (unexcusedLateDaysInWeek(employeeId, weekStart) >= 3) {
      guarantee = Math.max(0, guarantee - UNEXCUSED_LATE_HALF_DAY_DEDUCTION);
    }
    return guarantee;
  }

  function effectiveBasePay(employeeId, weekStart, rawBasePay) {
    const amount = Number(rawBasePay) || 0;
    if (amount <= 0) return 0;
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return amount;
    let proratedAmount = amount;
    if (emp.startDate) {
      const startDate = new Date(emp.startDate + "T00:00:00");
      if (startDate > weekStart) {
        const dailyRate = amount / 5;
        let prorated = 0;
        for (let i = 0; i < 6; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          if (date >= startDate) {
            if (i === 5) {
              if (getWorkedSaturday(employeeId, weekStart)) prorated += dailyRate / 2;
            } else {
              prorated += dailyRate;
            }
          }
        }
        proratedAmount = Math.min(prorated, amount);
      }
    }
    if (basePayLabel(emp.name) === "Base pay") {
      const absences = absentDaysInWeek(employeeId, weekStart);
      proratedAmount = Math.max(0, proratedAmount - absences * BASE_PAY_ABSENCE_DEDUCTION);
    } else {
      // Draw: same $80/day absence deduction as the weekly minimum guarantee,
      // with the same Worked Saturday credit (one absence forgiven per week).
      const absences = absentDaysInWeek(employeeId, weekStart);
      const effectiveAbsences = getWorkedSaturday(employeeId, weekStart) ? Math.max(0, absences - 1) : absences;
      proratedAmount = Math.max(0, proratedAmount - effectiveAbsences * ABSENCE_GUARANTEE_DEDUCTION);
    }
    return proratedAmount;
  }

  function spiffKey(employeeId, date) {
    return employeeId + "__" + date.toISOString().slice(0, 10);
  }
  function getSpiffEntry(employeeId, date) {
    const key = spiffKey(employeeId, date);
    const raw = spiffs[key];
    if (raw === undefined) return { amount: "", paid: false };
    if (typeof raw === "number" || typeof raw === "string") return { amount: raw, paid: false };
    return { amount: raw.amount ?? "", paid: !!raw.paid };
  }
  function getSpiff(employeeId, date) {
    return getSpiffEntry(employeeId, date).amount;
  }
  function getSpiffPaid(employeeId, date) {
    return getSpiffEntry(employeeId, date).paid;
  }
  function setSpiffValue(employeeId, date, amount) {
    const key = spiffKey(employeeId, date);
    if (amount === "" || amount === null || Number(amount) === 0) {
      const next = { ...spiffs };
      delete next[key];
      updateSpiffs(next);
    } else {
      const existing = getSpiffEntry(employeeId, date);
      updateSpiffs({ ...spiffs, [key]: { amount: Number(amount) || 0, paid: existing.paid } });
    }
  }
  function setSpiffPaid(employeeId, date, paid) {
    const key = spiffKey(employeeId, date);
    const existing = getSpiffEntry(employeeId, date);
    if (existing.amount === "" || Number(existing.amount) === 0) return;
    updateSpiffs({ ...spiffs, [key]: { amount: Number(existing.amount) || 0, paid } });
  }
  function spiffTotalInWeek(employeeId, weekStart) {
    let total = 0;
    for (let i = 0; i < 6; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const entry = getSpiffEntry(employeeId, date);
      if (!entry.paid) total += Number(entry.amount) || 0;
    }
    return total;
  }
  function spiffPaidAndUnpaidInWeek(employeeId, weekStart) {
    let paid = 0;
    let unpaid = 0;
    for (let i = 0; i < 6; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const entry = getSpiffEntry(employeeId, date);
      const amt = Number(entry.amount) || 0;
      if (entry.paid) paid += amt;
      else unpaid += amt;
    }
    return { paid, unpaid };
  }

  function computeWeeklyPayrollTotal(weekStart, weekEnd) {
    return employeesForWeek(weekStart).reduce((sum, emp) => {
      const override = getPayrollOverride(emp.id, weekStart);
      if (override !== null) return sum + override;
      const empSales = salesForEmployee(emp.id).filter((s) => isSaleInRange(s, weekStart, weekEnd));
      const total = empSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
      const rate = Number(emp.commissionRate) || 0;
      const refundedCredit = refundedCreditForEmployee(emp.id, weekStart, weekEnd);
      const refundOverrideVal = getRefundDeductionOverride(emp.id, weekStart);
      const refundDed = refundOverrideVal !== null ? refundOverrideVal : refundedCredit * (rate / 100);
      const commission = total * (rate / 100) - refundDed;
      const hasBasePay = emp.basePay !== "" && emp.basePay !== undefined && emp.basePay !== null;
      const basePay = hasBasePay ? effectiveBasePay(emp.id, weekStart, emp.basePay) : 0;
      const spiffTotal = spiffTotalInWeek(emp.id, weekStart);
      const guaranteedBase = Math.max(combinedEarnings(commission, basePay, emp.name), effectiveMinGuarantee(emp.id, weekStart));
      return sum + guaranteedBase + spiffTotal;
    }, 0);
  }
  function payrollTotalForRange(rangeStart, rangeEnd) {
    let total = 0;
    let cursor = new Date(rangeStart);
    const day = cursor.getDay();
    const diffToMonday = (day + 6) % 7;
    cursor.setDate(cursor.getDate() - diffToMonday);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= rangeEnd) {
      if (cursor >= rangeStart) {
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 5);
        weekEnd.setHours(23, 59, 59, 999);
        total += computeWeeklyPayrollTotal(new Date(cursor), weekEnd);
      }
      cursor.setDate(cursor.getDate() + 7);
    }
    return total;
  }

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


  let dashboardRange = null;
  let dashboardRangeLabel = "";
  if (dashboardFilterMode === "day") {
    const d = getDayRangeFromDate(dashboardSelectedDate);
    dashboardRange = d;
    dashboardRangeLabel = formatDayLabel(d.start);
  } else if (dashboardFilterMode === "week") {
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
  } else if (dashboardFilterMode === "custom") {
    const start = new Date(dashboardCustomStart + "T00:00:00");
    const end = new Date(dashboardCustomEnd + "T23:59:59");
    dashboardRange = { start, end };
    dashboardRangeLabel = formatWeekLabel(start, end);
  }
  const dashboardSales = dashboardRange ? sales.filter((s) => isSaleInRange(s, dashboardRange.start, dashboardRange.end)) : sales;
  const dashboardApprovedSales = dashboardSales.filter((s) => s.status === "Approved");
  const chargebackSales = dashboardRange
    ? sales.filter((s) => s.refunded && dateInRange(s.refundedAt, dashboardRange.start, dashboardRange.end))
    : sales.filter((s) => s.refunded);
  const chargebackTotal = chargebackSales.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);
  // Chargebacks reduce the day/week total rather than being counted as
  // additional revenue — the sale's full amount was already counted when it
  // was approved, and a chargeback takes that money back.
  const totalSalesValue = dashboardApprovedSales.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0) - chargebackTotal;
  function dashboardNavPrev() {
    if (dashboardFilterMode === "day") setDashboardSelectedDate((d) => shiftDateStr(d, -1));
    else if (dashboardFilterMode === "week") setWeekOffset((w) => w - 1);
    else if (dashboardFilterMode === "month") setDashboardMonthOffset((m) => m - 1);
    else if (dashboardFilterMode === "year") setDashboardYearOffset((y) => y - 1);
  }
  function dashboardNavNext() {
    if (dashboardFilterMode === "day") setDashboardSelectedDate((d) => shiftDateStr(d, 1));
    else if (dashboardFilterMode === "week") setWeekOffset((w) => w + 1);
    else if (dashboardFilterMode === "month") setDashboardMonthOffset((m) => m + 1);
    else if (dashboardFilterMode === "year") setDashboardYearOffset((y) => y + 1);
  }
  function dashboardNavReset() {
    if (dashboardFilterMode === "day") setDashboardSelectedDate(todayDateStr());
    else if (dashboardFilterMode === "week") setWeekOffset(0);
    else if (dashboardFilterMode === "month") setDashboardMonthOffset(0);
    else if (dashboardFilterMode === "year") setDashboardYearOffset(0);
  }
  const dashboardNavIsCurrent =
    (dashboardFilterMode === "day" && dashboardSelectedDate === todayDateStr()) ||
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
  const pendingSales = dashboardSales.filter((s) => s.status === "Pending");
  const dashboardChartSegments = [
    ...salesBySource.map((row) => ({
      label: row.source,
      value: row.total,
      count: row.count,
      color: chartColor(row.source),
    })),
    {
      label: "Declined",
      value: declinedSales.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0),
      count: declinedSales.length,
      color: chartColor("Declined"),
    },
    {
      label: "Chargeback",
      value: chargebackTotal,
      count: chargebackSales.length,
      color: chartColor("Chargeback"),
    },
  ];

  function salesForEmployee(employeeId) {
    if (!employeeId) return [];
    return sales.filter(
      (s) =>
        s.status === "Approved" &&
        (s.openerId === employeeId || s.closerId === employeeId || s.verificationId === employeeId)
    );
  }

  const activeEmployees = employees.filter((e) => e.active !== false);
  function employeesForWeek(weekStart) {
    return employees.filter((e) => {
      if (e.startDate) {
        const start = new Date(e.startDate + "T00:00:00");
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (start > weekEnd) return false;
      }
      if (e.active !== false) return true;
      if (e.deactivatedDate) {
        const deactivated = new Date(e.deactivatedDate + "T00:00:00");
        return weekStart < deactivated;
      }
      return false;
    });
  }
  const exEmployees = employees.filter((e) => e.active === false);

  const rrg = getWeekRange(rrgWeekOffset);
  const rrgLabel = formatWeekLabel(rrg.start, rrg.end);
  const rrgDayDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(rrg.start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const rrgWeekSales = sales.filter((s) => isSaleInRange(s, rrg.start, rrg.end) && s.status === "Approved");
  const rrgBoard = employeesForWeek(rrg.start).map((emp) => {
    const days = Array.from({ length: 6 }, () => []);
    rrgWeekSales.forEach((s) => {
      const idx = getWeekdayIndex(new Date(s.timestamp));
      if (idx === null) return;
      days[idx].push(...buildRoleEntries(s, emp.id));
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
  const payrollEmployeesForWeek = employeesForWeek(payrollWeek.start);
  // Pay date: everything worked this week is paid on the Friday of the FOLLOWING week.
  const payrollPayDate = new Date(payrollWeek.start);
  payrollPayDate.setDate(payrollPayDate.getDate() + 11);
  const payrollPayDateLabel = payrollPayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  const currentWeek = getWeekRange(0);

  let reportsRange = null;
  let reportsRangeLabel = "";
  if (reportsFilterMode === "day") {
    const d = getDayRangeFromDate(reportsSelectedDate);
    reportsRange = d;
    reportsRangeLabel = formatDayLabel(d.start);
  } else if (reportsFilterMode === "week") {
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
  } else if (reportsFilterMode === "custom") {
    const start = new Date(reportsCustomStart + "T00:00:00");
    const end = new Date(reportsCustomEnd + "T23:59:59");
    reportsRange = { start, end };
    reportsRangeLabel = formatWeekLabel(start, end);
  }
  function reportsNavPrev() {
    if (reportsFilterMode === "day") setReportsSelectedDate((d) => shiftDateStr(d, -1));
    else if (reportsFilterMode === "week") setReportsWeekOffset((w) => w - 1);
    else if (reportsFilterMode === "month") setReportsMonthOffset((m) => m - 1);
    else if (reportsFilterMode === "year") setReportsYearOffset((y) => y - 1);
  }
  function reportsNavNext() {
    if (reportsFilterMode === "day") setReportsSelectedDate((d) => shiftDateStr(d, 1));
    else if (reportsFilterMode === "week") setReportsWeekOffset((w) => w + 1);
    else if (reportsFilterMode === "month") setReportsMonthOffset((m) => m + 1);
    else if (reportsFilterMode === "year") setReportsYearOffset((y) => y + 1);
  }
  function reportsNavReset() {
    if (reportsFilterMode === "day") setReportsSelectedDate(todayDateStr());
    else if (reportsFilterMode === "week") setReportsWeekOffset(0);
    else if (reportsFilterMode === "month") setReportsMonthOffset(0);
    else if (reportsFilterMode === "year") setReportsYearOffset(0);
  }
  const reportsNavIsCurrent =
    (reportsFilterMode === "day" && reportsSelectedDate === todayDateStr()) ||
    (reportsFilterMode === "week" && reportsWeekOffset === 0) ||
    (reportsFilterMode === "month" && reportsMonthOffset === 0) ||
    (reportsFilterMode === "year" && reportsYearOffset === 0);

  const reportsSales = reportsRange ? sales.filter((s) => isSaleInRange(s, reportsRange.start, reportsRange.end)) : sales;
  const reportsRefundedSales = reportsRange
    ? sales.filter((s) => s.refunded && dateInRange(s.refundedAt, reportsRange.start, reportsRange.end))
    : sales.filter((s) => s.refunded);
  const reportsApprovedSales = reportsSales.filter((s) => s.status === "Approved");

  const reportsHourlyBuckets = [12, 13, 14, 15, 16, 17, 18, 19].map((hour) => ({ hour, count: 0, value: 0 }));
  reportsApprovedSales.forEach((s) => {
    if (!s.timestamp) return;
    const d = new Date(s.timestamp);
    const hour = d.getHours();
    const bucket = reportsHourlyBuckets.find((b) => b.hour === hour);
    if (bucket) {
      bucket.count += 1;
      bucket.value += Number(s.totalPrice) || 0;
    }
  });
  const reportsHourlyMaxCount = Math.max(1, ...reportsHourlyBuckets.map((b) => b.count));
  function formatHourLabel(hour) {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}${period}`;
  }

  const reportsTotalSalesValue = reportsApprovedSales.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0);
  const reportsAverageSalePrice = reportsApprovedSales.length > 0 ? reportsTotalSalesValue / reportsApprovedSales.length : 0;
  const reportsTotalPackagePrice = reportsApprovedSales.reduce((s, r) => s + (Number(r.packagePrice) || 0), 0);
  const reportsTotalDateFlex = reportsApprovedSales.reduce((s, r) => s + (Number(r.dateFlex) || 0), 0);
  const reportsTotalRefunded = reportsRefundedSales.reduce((s, r) => s + (Number(r.refundAmount) || 0), 0);
  const reportsSourceBreakdown = settings.leadSources.map((src) => {
    const rows = reportsApprovedSales.filter((s) => s.leadSubmittedTo === src);
    return { source: src, count: rows.length, total: rows.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0) };
  });
  const reportsChannelBreakdown = settings.sources.map((src) => {
    const rows = reportsApprovedSales.filter((s) => s.source === src);
    return { source: src, count: rows.length, total: rows.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0) };
  });
  const reportsDeclined = reportsSales.filter((s) => s.status === "Declined");
  const reportsMonsterTotal = (reportsSourceBreakdown.find((r) => r.source === "Monster") || {}).total || 0;
  const reportsPgrTotal = (reportsSourceBreakdown.find((r) => r.source === "PGR") || {}).total || 0;
  const reportsMonsterCommission = reportsMonsterTotal * ((Number(settings.monsterCommissionRate) || 0) / 100);
  const reportsPgrCommission = reportsPgrTotal * ((Number(settings.pgrCommissionRate) || 0) / 100);

  const pnlMonth = getMonthRange(pnlMonthOffset);
  const pnlWeek = getWeekRange(pnlWeekOffset);
  const pnlPeriodStart =
    pnlMode === "week"
      ? pnlWeek.start
      : pnlMode === "month"
      ? pnlMonth.start
      : pnlMode === "custom"
      ? new Date(pnlCustomStart + "T00:00:00")
      : new Date(2000, 0, 1);
  const pnlPeriodEnd =
    pnlMode === "week"
      ? pnlWeek.end
      : pnlMode === "month"
      ? pnlMonth.end
      : pnlMode === "custom"
      ? new Date(pnlCustomEnd + "T23:59:59")
      : new Date(2100, 0, 1);
  const pnlPeriodLabel =
    pnlMode === "week"
      ? formatWeekLabel(pnlWeek.start, pnlWeek.end)
      : pnlMode === "month"
      ? formatMonthLabel(pnlMonth.start)
      : pnlMode === "custom"
      ? formatWeekLabel(pnlPeriodStart, pnlPeriodEnd)
      : "All time";
  const pnlIsMultiMonth = pnlMode === "all" || pnlMode === "custom";
  const pnlExpenseSourceMonthDate = pnlMode === "week" ? pnlWeek.start : pnlMonth.start;
  const pnlExpenseSourceMonthKey = `${pnlExpenseSourceMonthDate.getFullYear()}-${String(pnlExpenseSourceMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const pnlExpenseSourceMonthLabel = formatMonthLabel(pnlExpenseSourceMonthDate);
  const pnlDaysInSourceMonth = new Date(
    pnlExpenseSourceMonthDate.getFullYear(),
    pnlExpenseSourceMonthDate.getMonth() + 1,
    0
  ).getDate();
  const pnlWeeksInSourceMonth = pnlDaysInSourceMonth / 7;
  const pnlMonthKey = pnlExpenseSourceMonthKey;
  const pnlMonthLabel = pnlIsMultiMonth ? pnlPeriodLabel : pnlExpenseSourceMonthLabel;
  const pnlPeriodSales = sales.filter((s) => s.status === "Approved" && isSaleInRange(s, pnlPeriodStart, pnlPeriodEnd));
  const pnlMonsterRevenue =
    pnlPeriodSales
      .filter((s) => s.leadSubmittedTo === "Monster")
      .reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0) * ((Number(settings.monsterCommissionRate) || 0) / 100);
  const pnlPgrRevenue =
    pnlPeriodSales
      .filter((s) => s.leadSubmittedTo === "PGR")
      .reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0) * ((Number(settings.pgrCommissionRate) || 0) / 100);
  const pnlOtherRevenue = pnlPeriodSales
    .filter((s) => s.leadSubmittedTo !== "Monster" && s.leadSubmittedTo !== "PGR")
    .reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0);
  const pnlRefundedSales = sales.filter(
    (s) => s.refunded && isSaleInRange({ timestamp: s.refundedAt }, pnlPeriodStart, pnlPeriodEnd)
  );
  const pnlMonsterRefunds =
    pnlRefundedSales
      .filter((s) => s.leadSubmittedTo === "Monster")
      .reduce((sum, s) => sum + (Number(s.refundAmount) || 0), 0) * ((Number(settings.monsterCommissionRate) || 0) / 100);
  const pnlPgrRefunds =
    pnlRefundedSales
      .filter((s) => s.leadSubmittedTo === "PGR")
      .reduce((sum, s) => sum + (Number(s.refundAmount) || 0), 0) * ((Number(settings.pgrCommissionRate) || 0) / 100);
  const pnlOtherRefunds = pnlRefundedSales
    .filter((s) => s.leadSubmittedTo !== "Monster" && s.leadSubmittedTo !== "PGR")
    .reduce((sum, s) => sum + (Number(s.refundAmount) || 0), 0);
  const pnlTotalRefunds = pnlMonsterRefunds + pnlPgrRefunds + pnlOtherRefunds;
  const pnlRevenue = pnlMonsterRevenue + pnlPgrRevenue + pnlOtherRevenue - pnlTotalRefunds;
  const pnlExpensesForMonth = expenses[pnlMonthKey] || {};
  const pnlAutoPayrollTotal = payrollTotalForRange(pnlPeriodStart, pnlPeriodEnd);
  const pnlExpenseRows = settings.expenseCategories.map((cat) => {
    if (cat === "Payroll") {
      return { category: cat, amount: pnlAutoPayrollTotal, auto: true, transactions: [] };
    }
    if (pnlIsMultiMonth) {
      const catTransactions = expenseTransactions
        .filter((t) => t.category === cat && t.date && isSaleInRange({ timestamp: t.date }, pnlPeriodStart, pnlPeriodEnd))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const transactionTotal = catTransactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      let legacyTotal = 0;
      Object.keys(expenses).forEach((monthKey) => {
        const [y, m] = monthKey.split("-").map(Number);
        const monthDate = new Date(y, m - 1, 1);
        if (monthDate >= pnlPeriodStart && monthDate <= pnlPeriodEnd) {
          legacyTotal += Number(expenses[monthKey][cat]) || 0;
        }
      });
      return { category: cat, amount: transactionTotal + legacyTotal, auto: false, transactions: catTransactions };
    }
    const catTransactions = expenseTransactions
      .filter((t) => t.category === cat && t.date && t.date.slice(0, 7) === pnlMonthKey)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const transactionTotal = catTransactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const manualAmount = Number(pnlExpensesForMonth[cat]) || 0;
    const monthlyAmount = manualAmount + transactionTotal;
    const amount = pnlMode === "week" ? monthlyAmount / pnlWeeksInSourceMonth : monthlyAmount;
    return { category: cat, amount, auto: false, transactions: catTransactions };
  });
  const pnlTotalExpenses = pnlExpenseRows.reduce((sum, r) => sum + r.amount, 0);
  const pnlNetProfit = pnlRevenue - pnlTotalExpenses;
  const pnlProfitMargin = pnlRevenue > 0 ? (pnlNetProfit / pnlRevenue) * 100 : 0;
  function updatePnlExpense(category, value) {
    const next = {
      ...expenses,
      [pnlMonthKey]: {
        ...(expenses[pnlMonthKey] || {}),
        [category]: value,
      },
    };
    updateExpenses(next);
  }
  async function saveExpenseTransaction(form) {
    const exists = expenseTransactions.some((t) => t.id === form.id);
    const { isNew, ...cleanForm } = form;
    const next = exists
      ? expenseTransactions.map((t) => (t.id === form.id ? { ...t, ...cleanForm } : t))
      : [...expenseTransactions, cleanForm];
    setExpenseTransactions(next);
    try {
      await window.storage.set("crm:expenseTransactions", JSON.stringify(next), true);
      setExpenseModal(null);
      setExpenseModalError("");
    } catch (err) {
      console.error("Expense save failed:", err);
      setExpenseModalError("Couldn't save — " + (err.message || "unknown error") + ". Try again.");
    }
  }
  async function deleteExpenseTransaction(id) {
    const next = expenseTransactions.filter((t) => t.id !== id);
    setExpenseTransactions(next);
    try {
      await window.storage.set("crm:expenseTransactions", JSON.stringify(next), true);
    } catch (err) {
      console.error("Expense delete failed:", err);
    }
  }
  async function clearMonthExpenses(monthKey) {
    const nextExpenses = { ...expenses };
    delete nextExpenses[monthKey];
    const nextTransactions = expenseTransactions.filter((t) => !t.date || t.date.slice(0, 7) !== monthKey);
    setExpenses(nextExpenses);
    setExpenseTransactions(nextTransactions);
    try {
      await window.storage.set("crm:expenses", JSON.stringify(nextExpenses), true);
      await window.storage.set("crm:expenseTransactions", JSON.stringify(nextTransactions), true);
      setConfirmClearMonthExpenses(null);
    } catch (err) {
      console.error("Clear month expenses failed:", err);
      setBackupStatus({ error: "Couldn't clear that month's expenses: " + (err.message || "unknown error") });
    }
  }
  async function saveInfoNote(form) {
    const exists = infoNotes.some((n) => n.id === form.id);
    const { isNew, ...cleanForm } = form;
    const next = exists
      ? infoNotes.map((n) => (n.id === form.id ? { ...n, ...cleanForm } : n))
      : [...infoNotes, cleanForm];
    setInfoNotes(next);
    try {
      await window.storage.set("crm:infoNotes", JSON.stringify(next), true);
      setInfoNoteModal(null);
      setInfoNoteError("");
    } catch (err) {
      console.error("Note save failed:", err);
      setInfoNoteError("Couldn't save — " + (err.message || "unknown error") + ". Try again.");
    }
  }
  async function deleteInfoNote(id) {
    const next = infoNotes.filter((n) => n.id !== id);
    setInfoNotes(next);
    try {
      await window.storage.set("crm:infoNotes", JSON.stringify(next), true);
    } catch (err) {
      console.error("Note delete failed:", err);
    }
  }
  async function loadScriptFiles() {
    setScriptFilesLoading(true);
    setScriptFilesError("");
    try {
      const res = await fetch("/api/scripts/files", { credentials: "include" });
      if (!res.ok) throw new Error("status " + res.status);
      const data = await res.json();
      setScriptFiles(data.files || []);
    } catch (err) {
      console.error("Loading scripts failed:", err);
      setScriptFilesError("Couldn't load scripts: " + (err.message || "unknown error"));
    } finally {
      setScriptFilesLoading(false);
    }
  }
  async function uploadScriptFile(file) {
    if (!file) return;
    setScriptUploadBusy(true);
    setScriptFilesError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/scripts/files", { method: "POST", credentials: "include", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "status " + res.status);
      }
      await loadScriptFiles();
    } catch (err) {
      console.error("Script upload failed:", err);
      setScriptFilesError("Upload failed: " + (err.message || "unknown error"));
    } finally {
      setScriptUploadBusy(false);
    }
  }
  async function deleteScriptFile(id) {
    try {
      await fetch(`/api/scripts/files/${id}`, { method: "DELETE", credentials: "include" });
      setScriptFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Script delete failed:", err);
      setScriptFilesError("Couldn't delete that file");
    }
  }
  async function saveCandidate(form) {
    const exists = candidates.some((c) => c.id === form.id);
    const { isNew, ...cleanForm } = form;
    const next = exists ? candidates.map((c) => (c.id === form.id ? { ...c, ...cleanForm } : c)) : [...candidates, cleanForm];
    setCandidates(next);
    try {
      await window.storage.set("crm:candidates", JSON.stringify(next), true);
      setCandidateModal(null);
    } catch (err) {
      console.error("Candidate save failed:", err);
    }
  }
  async function deleteCandidate(id) {
    const next = candidates.filter((c) => c.id !== id);
    setCandidates(next);
    try {
      await window.storage.set("crm:candidates", JSON.stringify(next), true);
    } catch (err) {
      console.error("Candidate delete failed:", err);
    }
  }
  async function convertCandidateToEmployee(candidate) {
    const newEmployee = {
      id: uid(),
      name: candidate.name || "",
      role: "rep",
      phone: candidate.phone || "",
      email: candidate.email || "",
      commissionRate: "",
      basePay: "",
      active: true,
      startDate: todayDateStr(),
      notes: [candidate.position ? `Hired as ${candidate.position === "closer" ? "Closer" : "Opener"}` : "", candidate.notes || ""]
        .filter(Boolean)
        .join(" — "),
    };
    const nextEmployees = [...employees, newEmployee];
    const nextCandidates = candidates.filter((c) => c.id !== candidate.id);
    setEmployees(nextEmployees);
    setCandidates(nextCandidates);
    try {
      await window.storage.set("crm:employees", JSON.stringify(nextEmployees), true);
      await window.storage.set("crm:candidates", JSON.stringify(nextCandidates), true);
      setCandidateModal(null);
      setEmployeesView("active");
    } catch (err) {
      console.error("Convert to employee failed:", err);
    }
  }
  async function saveDncEntry(form) {
    const exists = dncList.some((d) => d.id === form.id);
    const { isNew, ...cleanForm } = form;
    const next = exists ? dncList.map((d) => (d.id === form.id ? { ...d, ...cleanForm } : d)) : [...dncList, cleanForm];
    setDncList(next);
    try {
      await window.storage.set("crm:dncList", JSON.stringify(next), true);
      setDncModal(null);
    } catch (err) {
      console.error("DNC save failed:", err);
    }
  }
  async function deleteDncEntry(id) {
    const next = dncList.filter((d) => d.id !== id);
    setDncList(next);
    try {
      await window.storage.set("crm:dncList", JSON.stringify(next), true);
    } catch (err) {
      console.error("DNC delete failed:", err);
    }
  }
  async function bulkAddDncEntries(text) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const newEntries = lines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length === 1) {
          const val = parts[0];
          if (val.includes("@")) {
            return { id: uid(), name: "", phone: "", email: val, notes: "", addedAt: new Date().toISOString() };
          }
          const digitCount = (val.match(/\d/g) || []).length;
          if (digitCount >= 7) {
            return { id: uid(), name: "", phone: val, email: "", notes: "", addedAt: new Date().toISOString() };
          }
          return { id: uid(), name: val, phone: "", email: "", notes: "", addedAt: new Date().toISOString() };
        }
        return {
          id: uid(),
          name: parts[0] || "",
          phone: parts[1] || "",
          email: parts[2] || "",
          notes: "",
          addedAt: new Date().toISOString(),
        };
      })
      .filter((e) => e.name || e.phone || e.email);
    const next = [...dncList, ...newEntries];
    setDncList(next);
    try {
      await window.storage.set("crm:dncList", JSON.stringify(next), true);
      setDncBulkText("");
      setDncBulkOpen(false);
    } catch (err) {
      console.error("DNC bulk add failed:", err);
    }
  }
  function normalizePhone(p) {
    return (p || "").replace(/\D/g, "");
  }
  function matchingDncEntry(phone) {
    const normalized = normalizePhone(phone);
    if (!normalized) return null;
    return dncList.find((d) => normalizePhone(d.phone) === normalized) || null;
  }

  const reportsEmployeeRows = activeEmployees
    .map((emp) => {
      const empSales = reportsApprovedSales.filter(
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
      const companyRevenue = empSales.reduce((sum, s) => {
        const contractRate =
          s.leadSubmittedTo === "Monster"
            ? (Number(settings.monsterCommissionRate) || 0) / 100
            : s.leadSubmittedTo === "PGR"
            ? (Number(settings.pgrCommissionRate) || 0) / 100
            : 0;
        return sum + saleCredit(s, emp.id) * contractRate;
      }, 0);
      let estimatedPaid = commission;
      if (reportsRange) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        let weekCursor = mondayOfWeek(reportsRange.start);
        let totalGuarantee = 0;
        let guard = 0;
        while (weekCursor <= reportsRange.end && weekCursor <= today && guard < 260) {
          if (employeesForWeek(weekCursor).some((e) => e.id === emp.id)) {
            totalGuarantee += effectiveMinGuarantee(emp.id, weekCursor);
          }
          weekCursor = new Date(weekCursor);
          weekCursor.setDate(weekCursor.getDate() + 7);
          guard++;
        }
        estimatedPaid = Math.max(commission, totalGuarantee);
      }
      const profitLoss = companyRevenue - estimatedPaid;
      return { employee: emp, salesCount: empSales.length, credited, rate, commission, companyRevenue, profitLoss };
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
    rows.push(["Total sales", reportsApprovedSales.length]);
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
    rows.push(["Name", "Sales", "Credited total", "Commission %", "Commission earned", "Profit or Loss"]);
    reportsEmployeeRows.forEach((r) =>
      rows.push([r.employee.name, r.salesCount, r.credited.toFixed(2), r.rate, r.commission.toFixed(2), r.profitLoss.toFixed(2)])
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

  function exportLeadsCSV(leadsToExport, periodLabel) {
    const rows = [];
    rows.push(["Date", "Name", "Phone", "Secondary phone", "Email", "Address", "City", "State", "Zip",
      "Package price", "Date flex price", "Total price", "Status", "Source", "Submitted to", "Category",
      "Opener", "Closer", "Verification", "Notes"]);
    leadsToExport.forEach((s) => {
      rows.push([
        formatTimestamp(s.timestamp),
        s.name || "",
        s.phone || "",
        s.phone2 || "",
        s.email || "",
        s.address || "",
        s.city || "",
        s.state || "",
        s.zip || "",
        (Number(s.packagePrice) || 0).toFixed(2),
        (Number(s.dateFlex) || 0).toFixed(2),
        (Number(s.totalPrice) || 0).toFixed(2),
        s.status || "",
        s.source || "",
        s.leadSubmittedTo || "",
        s.leadCategory || "",
        (employeeById[s.openerId] || {}).name || "",
        (employeeById[s.closerId] || {}).name || "",
        (employeeById[s.verificationId] || {}).name || "",
        s.notes || "",
      ]);
    });
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeLabel = periodLabel.replace(/[^a-z0-9]+/gi, "-");
    a.href = url;
    a.download = `RRG-Leads-${safeLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  let leadsRange = null;
  let leadsRangeLabel = "";
  if (leadsFilterMode === "day") {
    const d = getDayRangeFromDate(leadsSelectedDate);
    leadsRange = d;
    leadsRangeLabel = formatDayLabel(d.start);
  } else if (leadsFilterMode === "week") {
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
    if (leadsFilterMode === "day") setLeadsSelectedDate((d) => shiftDateStr(d, -1));
    else if (leadsFilterMode === "week") setLeadsWeekOffset((w) => w - 1);
    else if (leadsFilterMode === "month") setLeadsMonthOffset((m) => m - 1);
    else if (leadsFilterMode === "year") setLeadsYearOffset((y) => y - 1);
  }
  function leadsNavNext() {
    if (leadsFilterMode === "day") setLeadsSelectedDate((d) => shiftDateStr(d, 1));
    else if (leadsFilterMode === "week") setLeadsWeekOffset((w) => w + 1);
    else if (leadsFilterMode === "month") setLeadsMonthOffset((m) => m + 1);
    else if (leadsFilterMode === "year") setLeadsYearOffset((y) => y + 1);
  }
  function leadsNavReset() {
    if (leadsFilterMode === "day") setLeadsSelectedDate(todayDateStr());
    else if (leadsFilterMode === "week") setLeadsWeekOffset(0);
    else if (leadsFilterMode === "month") setLeadsMonthOffset(0);
    else if (leadsFilterMode === "year") setLeadsYearOffset(0);
  }
  const leadsNavIsCurrent =
    (leadsFilterMode === "day" && leadsSelectedDate === todayDateStr()) ||
    (leadsFilterMode === "week" && leadsWeekOffset === 0) ||
    (leadsFilterMode === "month" && leadsMonthOffset === 0) ||
    (leadsFilterMode === "year" && leadsYearOffset === 0);

  function weeklySaleEntries(employeeId) {
    const entries = [];
    sales.forEach((s) => {
      if (s.status !== "Approved") return;
      if (!isSaleInRange(s, currentWeek.start, currentWeek.end)) return;
      entries.push(...buildRoleEntries(s, employeeId));
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
      if (s.status !== "Approved") return;
      if (!isSaleInRange(s, weekStart, weekEnd)) return;
      const idx = getWeekdayIndex(new Date(s.timestamp));
      if (idx === null) return;
      rows[idx].entries.push(...buildRoleEntries(s, employeeId));
    });
    return rows.map((r) => ({ ...r, dayTotal: r.entries.reduce((sum, e) => sum + e.amount, 0) }));
  }

  function refundTargetWeekStart(sale, roleId) {
    if (!sale.refundedAt) return null;
    const choice =
      (sale.refundWeekChoices && sale.refundWeekChoices[roleId]) || sale.refundWeekChoice || "next";
    if (choice !== "previous" && choice !== "current" && choice !== "next") {
      const [y, m, d] = choice.split("-").map(Number);
      const picked = new Date(y, m - 1, d);
      const pickedDay = picked.getDay();
      const pickedDiffToMonday = (pickedDay + 6) % 7;
      const pickedMonday = new Date(y, m - 1, d - pickedDiffToMonday);
      pickedMonday.setHours(0, 0, 0, 0);
      return pickedMonday;
    }
    const d = new Date(sale.refundedAt);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    if (choice === "next") monday.setDate(monday.getDate() + 7);
    else if (choice === "previous") monday.setDate(monday.getDate() - 7);
    return monday;
  }

  function refundedCreditForEmployee(employeeId, weekStart, weekEnd) {
    return sales.reduce((sum, s) => {
      if (!s.refunded) return sum;
      let add = 0;
      ["front", "close", "verification"].forEach((roleId) => {
        if (employeeIdForRole(s, roleId) !== employeeId) return;
        const target = refundTargetWeekStart(s, roleId);
        if (!target || target.getTime() !== weekStart.getTime()) return;
        add += refundImpactForRole(s, roleId);
      });
      return sum + add;
    }, 0);
  }

  function pendingRefundEntriesForEmployee(employeeId, weekStart) {
    const bySale = {};
    sales.forEach((s) => {
      if (!s.refunded) return;
      ["front", "close", "verification"].forEach((roleId) => {
        if (employeeIdForRole(s, roleId) !== employeeId) return;
        const target = refundTargetWeekStart(s, roleId);
        if (!target || target.getTime() !== weekStart.getTime()) return;
        bySale[s.id] = (bySale[s.id] || 0) + refundImpactForRole(s, roleId);
      });
    });
    return Object.keys(bySale)
      .map((saleId) => ({ sale: sales.find((s) => s.id === saleId), credit: bySale[saleId] }))
      .filter((e) => e.sale);
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
  const employeeDetailRefundedCredit = employeeDetail
    ? refundedCreditForEmployee(employeeDetail.id, employeeDetailWeek.start, employeeDetailWeek.end)
    : 0;
  const employeeDetailRefundOverride = employeeDetail
    ? getRefundDeductionOverride(employeeDetail.id, employeeDetailWeek.start)
    : null;
  const employeeDetailRefundDeduction =
    employeeDetailRefundOverride !== null
      ? employeeDetailRefundOverride
      : employeeDetailRefundedCredit * (employeeDetailRate / 100);
  const employeeDetailRefundEntries = employeeDetail
    ? pendingRefundEntriesForEmployee(employeeDetail.id, employeeDetailWeek.start)
    : [];
  const employeeDetailCommission = employeeDetailTotalSales * (employeeDetailRate / 100) - employeeDetailRefundDeduction;
  const employeeDetailHasBasePay =
    employeeDetail && employeeDetail.basePay !== "" && employeeDetail.basePay !== undefined && employeeDetail.basePay !== null;
  const employeeDetailBasePay = employeeDetailHasBasePay
    ? effectiveBasePay(employeeDetail.id, employeeDetailWeek.start, employeeDetail.basePay)
    : 0;
  const employeeDetailSpiff = employeeDetail ? spiffTotalInWeek(employeeDetail.id, employeeDetailWeek.start) : 0;
  const employeeDetailRawBasePay = employeeDetail
    ? combinedEarnings(employeeDetailCommission, employeeDetailBasePay, employeeDetail.name)
    : employeeDetailCommission + employeeDetailBasePay;
  const employeeDetailMinGuarantee = employeeDetail
    ? effectiveMinGuarantee(employeeDetail.id, employeeDetailWeek.start)
    : settings.minWeeklyPay;
  const employeeDetailGuaranteedBase = Math.max(employeeDetailRawBasePay, employeeDetailMinGuarantee);
  const employeeDetailTotalPay = employeeDetailGuaranteedBase + employeeDetailSpiff;
  const employeeDetailGuarantee = employeeDetailRawBasePay < employeeDetailMinGuarantee;
  const employeeDetailAbsences = employeeDetail ? absentDaysInWeek(employeeDetail.id, employeeDetailWeek.start) : 0;

  async function sendPayslip() {
    if (!employeeDetail || !employeeDetail.email) return;
    setPayslipStatus("sending");
    const rowsHtml = employeeDetailRows
      .filter((r) => r.entries.length > 0)
      .map(
        (r) => `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #E6E2D6;">${r.label}, ${r.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #E6E2D6;">${r.entries
              .map((e) => {
                const t = SALE_TYPES.find((x) => x.id === e.type);
                const refunded = isEntryRefunded(e.sale, e.type);
                const color = refunded ? "#A32D2D" : t ? t.color : "#767468";
                const decoration = refunded ? "text-decoration:line-through;" : "";
                return `<span style="color:${color};${decoration}font-weight:600;">${e.sale.name} ${money(e.amount)}</span>`;
              })
              .join(" &nbsp; ")}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #E6E2D6;text-align:right;">${money(r.dayTotal)}</td>
          </tr>`
      )
      .join("");
    const refundRowsHtml = employeeDetailRefundEntries
      .map((r) => {
        const entryType = (buildRoleEntries(r.sale, employeeDetail.id)[0] || {}).type;
        const nameColor = (SALE_TYPES.find((t) => t.id === entryType) || {}).color || "#A32D2D";
        return `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #E6E2D6;color:#A32D2D;">Refund — <span style="color:${nameColor};font-weight:600;">${r.sale.name}</span></td>
            <td style="padding:6px 10px;border-bottom:1px solid #E6E2D6;color:#A32D2D;text-align:right;" colspan="2">-${money(r.credit * (employeeDetailRate / 100))}</td>
          </tr>`;
      })
      .join("");
    const refundOverrideRowHtml =
      employeeDetailRefundOverride !== null
        ? `<tr><td style="padding:8px 10px;color:#A32D2D;">Refund deduction (custom)</td><td style="padding:8px 10px;text-align:right;color:#A32D2D;" colspan="2">-${money(employeeDetailRefundOverride)}</td></tr>`
        : "";
    const html = `
      <div style="font-family:Arial,sans-serif;color:#1B1E1A;max-width:600px;margin:0 auto;">
        <h2 style="margin-bottom:4px;">${settings.companyName}</h2>
        <p style="color:#767468;margin-top:0;">Payslip for ${employeeDetail.name} — ${employeeDetailWeekLabel}</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">
          <thead>
            <tr style="text-align:left;color:#767468;font-size:11px;text-transform:uppercase;">
              <th style="padding:6px 10px;">Day</th>
              <th style="padding:6px 10px;">Sales</th>
              <th style="padding:6px 10px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="3" style="padding:10px;color:#767468;">No sales this week</td></tr>'}
          </tbody>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:20px;background:#FAFAF7;border:1px solid #E6E2D6;border-radius:8px;">
          <tbody>
            <tr>
              <td style="padding:8px 10px;color:#767468;">Commission</td>
              <td style="padding:8px 10px;text-align:right;" colspan="2">${money(employeeDetailTotalSales * (employeeDetailRate / 100))}</td>
            </tr>
            ${refundRowsHtml}
            ${refundOverrideRowHtml}
            ${employeeDetailSpiff > 0 ? `<tr><td style="padding:8px 10px;color:#8A5A1E;">Spiff</td><td style="padding:8px 10px;text-align:right;" colspan="2">${money(employeeDetailSpiff)}</td></tr>` : ""}
            <tr style="font-weight:700;border-top:1px solid #E6E2D6;">
              <td style="padding:10px;">Total pay</td>
              <td style="padding:10px;text-align:right;" colspan="2">${money(employeeDetailTotalPay)}</td>
            </tr>
          </tbody>
        </table>
        <p style="color:#767468;font-size:11px;margin-top:20px;">This is an automated payslip from ${settings.companyName}'s CRM.</p>
      </div>`;
    try {
      const res = await fetch("/api/payslip/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: employeeDetail.email,
          employeeName: employeeDetail.name,
          subject: `Your payslip — ${employeeDetailWeekLabel}`,
          html,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayslipStatus({ error: data.error || "Failed to send" });
        return;
      }
      setPayslipStatus("sent");
      setTimeout(() => setPayslipStatus(null), 4000);
    } catch (e) {
      setPayslipStatus({ error: "Network error — check your connection and try again" });
    }
  }

  function downloadBackup() {
    const backup = {
      backedUpAt: new Date().toLocaleString("en-US"),
      companyName: settings.companyName,
      contacts,
      sales,
      employees,
      payrollOverrides,
      attendance,
      settings,
      spiffs,
      refundDeductionOverrides,
      expenses,
      expenseTransactions,
      infoNotes,
      workedSaturdays,
      candidates,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = todayDateStr();
    a.href = url;
    a.download = `rrg-crm-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleBackupFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.sales)) {
          setBackupStatus({ error: "That doesn't look like a valid backup file." });
          return;
        }
        setBackupStatus(null);
        setConfirmRestoreBackup(parsed);
      } catch (err) {
        setBackupStatus({ error: "Couldn't read that file — make sure it's a backup downloaded from this CRM." });
      }
    };
    reader.readAsText(file);
  }

  async function restoreBackup(backup) {
    try {
      if (backup.contacts) setContacts(backup.contacts);
      if (backup.sales) setSales(backup.sales);
      if (backup.employees) setEmployees(backup.employees);
      if (backup.payrollOverrides) setPayrollOverrides(backup.payrollOverrides);
      if (backup.attendance) setAttendance(backup.attendance);
      if (backup.settings) setSettings(backup.settings);
      if (backup.spiffs) setSpiffs(backup.spiffs);
      if (backup.refundDeductionOverrides) setRefundDeductionOverrides(backup.refundDeductionOverrides);
      if (backup.expenses) setExpenses(backup.expenses);
      if (backup.expenseTransactions) setExpenseTransactions(backup.expenseTransactions);
      if (backup.infoNotes) setInfoNotes(backup.infoNotes);
      if (backup.workedSaturdays) setWorkedSaturdays(backup.workedSaturdays);
      if (backup.candidates) setCandidates(backup.candidates);
      if (backup.contacts) await window.storage.set("crm:contacts", JSON.stringify(backup.contacts), true);
      if (backup.sales) await window.storage.set("crm:sales", JSON.stringify(backup.sales), true);
      if (backup.employees) await window.storage.set("crm:employees", JSON.stringify(backup.employees), true);
      if (backup.payrollOverrides) await window.storage.set("crm:payrollOverrides", JSON.stringify(backup.payrollOverrides), true);
      if (backup.attendance) await window.storage.set("crm:attendance", JSON.stringify(backup.attendance), true);
      if (backup.settings) await window.storage.set("crm:settings", JSON.stringify(backup.settings), true);
      if (backup.spiffs) await window.storage.set("crm:spiffs", JSON.stringify(backup.spiffs), true);
      if (backup.refundDeductionOverrides)
        await window.storage.set("crm:refundDeductionOverrides", JSON.stringify(backup.refundDeductionOverrides), true);
      if (backup.expenses) await window.storage.set("crm:expenses", JSON.stringify(backup.expenses), true);
      if (backup.expenseTransactions)
        await window.storage.set("crm:expenseTransactions", JSON.stringify(backup.expenseTransactions), true);
      if (backup.infoNotes) await window.storage.set("crm:infoNotes", JSON.stringify(backup.infoNotes), true);
      if (backup.workedSaturdays)
        await window.storage.set("crm:workedSaturdays", JSON.stringify(backup.workedSaturdays), true);
      if (backup.candidates) await window.storage.set("crm:candidates", JSON.stringify(backup.candidates), true);
      setConfirmRestoreBackup(null);
      setBackupStatus("restored");
      window.location.reload();
    } catch (err) {
      console.error("Restore failed:", err);
      setConfirmRestoreBackup(null);
      setBackupStatus({ error: "Restore failed: " + (err.message || "unknown error") + " — some data may be inconsistent, check carefully." });
    }
  }

  function handleImportFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.sales)) {
          setBackupStatus({ error: "That doesn't look like a valid import file — expected a 'sales' list." });
          return;
        }
        setBackupStatus(null);
        setConfirmImportLeads(parsed);
      } catch (err) {
        setBackupStatus({ error: "Couldn't read that file — make sure it's a valid import file." });
      }
    };
    reader.readAsText(file);
  }

  async function importLeadsData(importData) {
    try {
      const idMap = {};
      let nextEmployees = [...employees];
      (importData.employees || []).forEach((imp) => {
        const impName = (imp.name || "").trim().toLowerCase();
        const existing = nextEmployees.find((e) => (e.name || "").trim().toLowerCase() === impName);
        if (existing) {
          idMap[imp.tempId] = existing.id;
        } else {
          const newId = uid();
          idMap[imp.tempId] = newId;
          nextEmployees.push({
            id: newId,
            name: imp.name || "Unknown",
            role: "rep",
            commissionRate: "",
            basePay: "",
            active: false,
            notes: imp.notes || "Imported from historical data",
          });
        }
      });
      const nextSales = [
        ...sales,
        ...importData.sales.map((s) => ({
          ...blankSale(),
          ...s,
          id: uid(),
          openerId: idMap[s.openerId] || s.openerId || "",
          closerId: idMap[s.closerId] || s.closerId || "",
          verificationId: idMap[s.verificationId] || s.verificationId || "",
        })),
      ];
      setEmployees(nextEmployees);
      setSales(nextSales);
      await window.storage.set("crm:sales", JSON.stringify(nextSales), true);
      await window.storage.set("crm:employees", JSON.stringify(nextEmployees), true);
      setConfirmImportLeads(null);
      setBackupStatus("restored");
      window.location.reload();
    } catch (err) {
      console.error("Import failed:", err);
      setConfirmImportLeads(null);
      setBackupStatus({ error: "Import failed: " + (err.message || "unknown error") + " — nothing was changed." });
    }
  }

  async function mergeEmployees(mergePairs) {
    const notFound = [];
    let nextEmployees = [...employees];
    const idRedirect = {};
    mergePairs.forEach((pair) => {
      const fromEmp = pair.fromId
        ? nextEmployees.find((e) => e.id === pair.fromId)
        : nextEmployees.find((e) => (e.name || "").trim().toLowerCase() === (pair.from || "").trim().toLowerCase());
      const toEmp = pair.toId
        ? nextEmployees.find((e) => e.id === pair.toId)
        : nextEmployees.find((e) => (e.name || "").trim().toLowerCase() === (pair.to || "").trim().toLowerCase());
      if (!fromEmp) {
        notFound.push(`"${pair.from || pair.fromId}" (not found)`);
        return;
      }
      if (!toEmp) {
        notFound.push(`"${pair.to || pair.toId}" (not found)`);
        return;
      }
      if (fromEmp.id === toEmp.id) return;
      idRedirect[fromEmp.id] = toEmp.id;
    });
    const placeholderIds = new Set(Object.keys(idRedirect));
    nextEmployees = nextEmployees.filter((e) => !placeholderIds.has(e.id));
    const nextSales = sales.map((s) => ({
      ...s,
      openerId: idRedirect[s.openerId] || s.openerId,
      closerId: idRedirect[s.closerId] || s.closerId,
      verificationId: idRedirect[s.verificationId] || s.verificationId,
    }));
    await window.storage.set("crm:sales", JSON.stringify(nextSales), true);
    await window.storage.set("crm:employees", JSON.stringify(nextEmployees), true);
    setEmployees(nextEmployees);
    setSales(nextSales);
    if (notFound.length > 0) {
      throw new Error("Some pairs couldn't be matched and were skipped: " + notFound.join(", "));
    }
  }

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
  async function saveSale(form) {
    const skipEpgPush = !!form.skipEpgPush;
    const { skipEpgPush: _skipFlag, ...formWithoutSkipFlag } = form;
    const isNew = !formWithoutSkipFlag.id;

    // Fetch the absolute latest copy from the server right before merging in
    // this change, rather than trusting whatever was already loaded in this
    // browser tab. Two people saving around the same moment, each starting
    // from their own slightly-stale local copy, would otherwise silently
    // overwrite one another — whoever's write lands last wins, and the
    // other person's change vanishes with no error and no trace. Re-fetching
    // right here shrinks that collision window from "however long since this
    // tab last refreshed" down to a fraction of a second.
    let latestSales = sales;
    try {
      const latest = await window.storage.get("crm:sales", true);
      latestSales = latest && latest.value ? JSON.parse(latest.value) : [];
    } catch (err) {
      console.error("Couldn't fetch latest sales before saving, falling back to local copy:", err);
    }

    let savedSale;
    let wasAlreadyApproved = false;
    let nextSales;
    if (formWithoutSkipFlag.id) {
      const existing =
        latestSales.find((s) => s.id === formWithoutSkipFlag.id) || sales.find((s) => s.id === formWithoutSkipFlag.id);
      wasAlreadyApproved = !!(existing && existing.status === "Approved");
      savedSale = { ...existing, ...formWithoutSkipFlag };
      nextSales = latestSales.some((s) => s.id === formWithoutSkipFlag.id)
        ? latestSales.map((s) => (s.id === formWithoutSkipFlag.id ? savedSale : s))
        : [...latestSales, savedSale];
    } else {
      savedSale = { ...formWithoutSkipFlag, id: uid(), createdAt: Date.now(), submittedBy: currentUser ? currentUser.name : "" };
      nextSales = [...latestSales, savedSale];
    }
    if (skipEpgPush) {
      savedSale = { ...savedSale, epgPushStatus: "success", epgPushedAt: new Date().toISOString(), epgPushError: null };
      nextSales = nextSales.map((s) => (s.id === savedSale.id ? savedSale : s));
    }

    // Write directly and WAIT for confirmation before showing success,
    // closing the modal, or pushing to EPG. The debounced persist() used
    // for most other state in this app can be silently interrupted if the
    // tab closes or the device loses connectivity right after submitting —
    // for a brand-new sale, that would lose it completely with no error
    // shown and no trace left behind, which is unacceptable for real data.
    setSales(nextSales);
    clearTimeout(saveTimer.current);
    setSaleSaveError("");
    try {
      await window.storage.set("crm:sales", JSON.stringify(nextSales), true);
    } catch (err) {
      console.error("Sale save failed:", err);
      setSaleSaveError(
        "Couldn't save this sale — " + (err.message || "unknown error") + ". Don't close this screen — try Save again."
      );
      return;
    }

    if (isNew) {
      setEntryJustSaved(true);
    }

    // Push newly-Approved Monster deals to EPG — awaited before the modal
    // closes so the request can't get silently interrupted by closing the
    // tab or navigating away right after saving. Skipped entirely if the
    // rep marked this sale as already sent to EPG some other way, so we
    // don't create a duplicate over there.
    const justBecameApproved = savedSale.status === "Approved" && !wasAlreadyApproved;
    if (!skipEpgPush && justBecameApproved && savedSale.leadSubmittedTo === "Monster") {
      setSaleSyncingToEpg(true);
      try {
        await pushSaleToEpg(savedSale);
      } finally {
        setSaleSyncingToEpg(false);
      }
    }
    setSaleModal(null);
    setSaleModalMinimized(false);
  }
  async function pushSaleToEpg(sale) {
    try {
      const res = await fetch("/api/epg/push-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sale),
      });
      const data = await res.json().catch(() => ({}));
      const patch = res.ok
        ? { epgPushStatus: "success", epgPushedAt: new Date().toISOString(), epgPushError: null }
        : { epgPushStatus: "failed", epgPushError: data.error || `EPG rejected the request (status ${res.status}).` };
      // The updateSales() call just above scheduled a DEBOUNCED write of the
      // sale as it looked before this EPG patch (see persist(), 250ms
      // timer). If that stale timer fires after this direct write, it
      // silently overwrites the epgPushStatus we're setting right now — so
      // cancel it first. This is the fix for the badge disappearing even
      // though EPG genuinely received the sale.
      clearTimeout(saveTimer.current);
      setSales((prev) => {
        const next = prev.map((s) => (s.id === sale.id ? { ...s, ...patch } : s));
        window.storage.set("crm:sales", JSON.stringify(next), true).catch((e) => console.error("EPG status save failed", e));
        return next;
      });
    } catch (err) {
      console.error("EPG push failed:", err);
      clearTimeout(saveTimer.current);
      setSales((prev) => {
        const next = prev.map((s) =>
          s.id === sale.id ? { ...s, epgPushStatus: "failed", epgPushError: "Network error reaching EPG" } : s
        );
        window.storage.set("crm:sales", JSON.stringify(next), true).catch((e) => console.error("EPG status save failed", e));
        return next;
      });
    }
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
          refundWeekChoices: {
            front: (opts.weekChoices && opts.weekChoices.front) || "next",
            close: (opts.weekChoices && opts.weekChoices.close) || "next",
            verification: (opts.weekChoices && opts.weekChoices.verification) || "next",
          },
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
  function deactivateEmployee(id, date) {
    updateEmployees(employees.map((e) => (e.id === id ? { ...e, active: false, deactivatedDate: date || todayDateStr() } : e)));
    setEmployeeModal(null);
    setConfirmDeactivateEmployee(null);
  }
  function reactivateEmployee(id) {
    updateEmployees(employees.map((e) => (e.id === id ? { ...e, active: true, deactivatedDate: null } : e)));
    setEmployeeModal(null);
  }
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

  useEffect(() => {
    if (dashboardFilterMode === "day" && !(currentUser && (currentUser.role === "admin" || currentUser.role === "manager"))) {
      setDashboardFilterMode("week");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardFilterMode, currentUser && currentUser.role]);

  useEffect(() => {
    if (section === "information" && informationSubTab === "scripts") loadScriptFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, informationSubTab]);

  useEffect(() => {
    if (currentUser && currentUser.role === "manager" && employeesView !== "hiring") {
      setEmployeesView("hiring");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeesView, currentUser && currentUser.role]);


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
        .crm-scroll { scrollbar-width: auto; scrollbar-color: #B8B2A0 #EDEAE0; }
        .crm-scroll::-webkit-scrollbar { height: 12px; width: 12px; }
        .crm-scroll::-webkit-scrollbar-track { background: #EDEAE0; border-radius: 6px; }
        .crm-scroll::-webkit-scrollbar-thumb { background: #B8B2A0; border-radius: 6px; border: 2px solid #EDEAE0; }
        .crm-scroll::-webkit-scrollbar-thumb:hover { background: #9C9686; }
        .crm-row:hover { background: #F4F2EA; }
        .crm-row-del:hover { color: #A32D2D !important; background: #FCEBEB !important; }
        .crm-scroll input[type="number"]:hover, .crm-scroll input[type="number"]:focus { border-color: #D3CEBD !important; background: #FFFFFF !important; }
        .crm-scroll select:hover { border-color: #D3CEBD !important; }
        button { font-family: inherit; cursor: pointer; }
        input, textarea, select { font-family: inherit; }
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute; top: 0; left: 0; width: 100%;
            max-width: 100%; max-height: none; box-shadow: none; border: none;
          }
          #print-area input, #print-area select, #print-area textarea {
            border: none !important; background: transparent !important; padding: 2px 0 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          #print-area button, #print-area .no-print { display: none !important; }
        }
      `}</style>

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

        <div style={S.viewerBtnSidebar}>
          <div style={S.avatarSm}>{currentUser ? initials(currentUser.name) : <User size={12} />}</div>
          <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentUser ? currentUser.name : "Signed in"}
            </div>
          </div>
          {currentUser && <RoleBadge role={currentUser.role} size="sm" />}
        </div>
        <button style={S.logOutLink} onClick={logOut}>
          Log out
        </button>
      </div>

      <div style={S.main}>
        {blacklistFailure && (
          <div style={S.blacklistFailureBanner}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              Blacklist Alliance check failed ({new Date(blacklistFailure.at).toLocaleString("en-US")}): {blacklistFailure.message}
            </span>
            <button onClick={acknowledgeBlacklistFailure} style={S.blacklistFailureDismiss}>
              <X size={14} />
            </button>
          </div>
        )}
        <div style={S.topbar}>
          <div>
            <div style={S.topbarTitle}>{NAV_ITEMS.find((n) => n.id === section)?.label}</div>
          </div>
          {section === "sales" && !(currentUser && isSalesEntryRole(currentUser.role)) && (
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

        {(section === "dashboard" || (section === "sales" && !(currentUser && isSalesEntryRole(currentUser.role)))) && (
          <div style={S.stats}>
            <div style={S.statItem}>
              <div style={S.statLabel}>
                total sales {dashboardFilterMode === "all" ? "(all time)" : `(${dashboardRangeLabel})`}
              </div>
              <div style={S.statValue}>{money(totalSalesValue)}</div>
            </div>
            <div style={S.statDivider} />
            <div style={S.statItem}>
              <div style={S.statLabel}>sales logged</div>
              <div style={S.statValue}>{dashboardSales.length}</div>
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
                    value={dashboardFilterMode === "week" && weekOffset === -1 ? "prevweek" : dashboardFilterMode}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "prevweek") {
                        setDashboardFilterMode("week");
                        setWeekOffset(-1);
                      } else if (v === "week") {
                        setDashboardFilterMode("week");
                        setWeekOffset(0);
                      } else {
                        setDashboardFilterMode(v);
                      }
                    }}
                    style={{ ...S.select, width: 140, paddingRight: 28 }}
                  >
                    {currentUser && (currentUser.role === "admin" || currentUser.role === "manager") && (
                      <option value="day">Today</option>
                    )}
                    <option value="week">This week</option>
                    <option value="prevweek">Previous week</option>
                    <option value="month">This month</option>
                    <option value="year">This year</option>
                    <option value="custom">Custom range</option>
                    <option value="all">All time</option>
                  </select>
                  <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                </div>
                {dashboardFilterMode === "custom" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="date"
                      value={dashboardCustomStart}
                      max={dashboardCustomEnd}
                      onChange={(e) => e.target.value && setDashboardCustomStart(e.target.value)}
                      style={S.customRangeInput}
                    />
                    <span style={{ color: T.textMuted, fontSize: 12 }}>to</span>
                    <input
                      type="date"
                      value={dashboardCustomEnd}
                      min={dashboardCustomStart}
                      onChange={(e) => e.target.value && setDashboardCustomEnd(e.target.value)}
                      style={S.customRangeInput}
                    />
                  </div>
                ) : (
                  dashboardFilterMode !== "all" && (
                    <>
                      <button onClick={dashboardNavPrev} style={S.weekNavBtn} aria-label="Previous">
                        ‹
                      </button>
                      {dashboardFilterMode === "day" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="date"
                            value={dashboardSelectedDate}
                            onChange={(e) => e.target.value && setDashboardSelectedDate(e.target.value)}
                            style={{ ...S.weekNavLabel, ...(dashboardNavIsCurrent ? S.weekNavLabelActive : {}), cursor: "pointer" }}
                          />
                          {dashboardNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                        </div>
                      ) : (
                        <button
                          onClick={dashboardNavReset}
                          style={{ ...S.weekNavLabel, ...(dashboardNavIsCurrent ? S.weekNavLabelActive : {}) }}
                        >
                          {dashboardRangeLabel}
                          {dashboardNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                        </button>
                      )}
                      <button onClick={dashboardNavNext} style={S.weekNavBtn} aria-label="Next">
                        ›
                      </button>
                    </>
                  )
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
                        fontSize: 16,
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
                  <span style={{ ...S.leadBadge, background: "#F3E9DA", color: "#8A5A1E", fontSize: 16 }}>Pending</span>
                  <span style={S.sourceCount}>
                    {pendingSales.length} sale{pendingSales.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={S.sourceValue}>
                  {money(pendingSales.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0))}
                </div>
              </div>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...S.leadBadge, background: "#FCEBEB", color: "#A32D2D", fontSize: 16 }}>Declined</span>
                  <span style={S.sourceCount}>
                    {declinedSales.length} sale{declinedSales.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={S.sourceValue}>
                  {money(declinedSales.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0))}
                </div>
              </div>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...S.leadBadge, background: chartColor("Chargeback") + "22", color: chartColor("Chargeback"), fontSize: 16 }}>Chargeback</span>
                  <span style={S.sourceCount}>
                    {chargebackSales.length} sale{chargebackSales.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={S.sourceValue}>
                  {money(chargebackTotal)}
                </div>
              </div>
            </div>

            <div style={{ ...S.dashboardSectionLabel, marginTop: 24 }}>
              By category {dashboardFilterMode === "all" ? "(all time)" : `(${dashboardRangeLabel})`}
            </div>
            <div style={S.chartCard}>
              <DonutChart
                segments={dashboardChartSegments}
                centerLabel="Total"
                centerValue={money(dashboardChartSegments.reduce((s, seg) => s + seg.value, 0) - chargebackTotal)}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 20,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={S.dashboardSectionLabel}>
                {dashboardSalesListMode === "pending" ? "Pending sales" : "Approved sales"}{" "}
                {dashboardFilterMode === "all" ? "(all time)" : `(${dashboardRangeLabel})`} (
                {dashboardSalesListMode === "pending" ? pendingSales.length : dashboardApprovedSales.length})
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={dashboardSalesListMode}
                  onChange={(e) => setDashboardSalesListMode(e.target.value)}
                  style={{ ...S.select, width: 120, paddingRight: 28 }}
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
                <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
              </div>
            </div>
            {(dashboardSalesListMode === "pending" ? pendingSales : dashboardApprovedSales).length === 0 ? (
              <div style={S.emptyState}>
                <TrendingUp size={22} color={T.borderStrong} />
                <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                  {dashboardFilterMode === "all"
                    ? `No ${dashboardSalesListMode} sales yet`
                    : `No ${dashboardSalesListMode} sales for ${dashboardRangeLabel} yet`}
                </div>
              </div>
            ) : (
              <div style={S.recentList}>
                {[...(dashboardSalesListMode === "pending" ? pendingSales : dashboardApprovedSales)]
                  .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
                  .map((s) => {
                    const isManager = currentUser && currentUser.role === "manager";
                    return (
                      <div
                        key={s.id}
                        style={{ ...S.recentRow, ...(isManager ? { cursor: "default" } : {}) }}
                        onClick={
                          isManager
                            ? undefined
                            : () => {
                                setSection("sales");
                                setView("salesform");
                                setSaleModal({ ...s });
                              }
                        }
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.recentTitle}>{s.name}</div>
                          {!isManager && (
                            <div style={S.recentSub}>{s.city ? `${s.city}${s.state ? `, ${s.state}` : ""}` : formatTimestamp(s.timestamp)}</div>
                          )}
                          {isManager && dashboardSalesListMode === "pending" && s.phone && (
                            <div style={S.recentSub}>{s.phone}</div>
                          )}
                        </div>
                        <div style={S.dealValue}>{s.totalPrice ? money(s.totalPrice) : ""}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {section === "sales" && currentUser && isSalesEntryRole(currentUser.role) ? (
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
        ) : (
          section === "sales" && (() => {
            const q = search.trim().toLowerCase();
            const filteredSalesTab = [...sales]
              .filter((s) => {
                if (!q) return true;
                return (
                  (s.name || "").toLowerCase().includes(q) ||
                  (s.email || "").toLowerCase().includes(q) ||
                  (s.phone || "").toLowerCase().includes(q) ||
                  (s.phone2 || "").toLowerCase().includes(q) ||
                  (s.city || "").toLowerCase().includes(q) ||
                  (s.address || "").toLowerCase().includes(q)
                );
              })
              .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
            return (
          <div style={S.salesWrap}>
                <div style={S.contactsToolbar}>
                  <span style={S.contactsCount}>
                    {filteredSalesTab.length} sale{filteredSalesTab.length === 1 ? "" : "s"}
                    {q && sales.length !== filteredSalesTab.length ? ` of ${sales.length}` : ""}
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

                {filteredSalesTab.length === 0 ? (
                  <div style={S.emptyState}>
                    <TrendingUp size={22} color={T.borderStrong} />
                    <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                      {q ? "No sales match your search" : "No sales logged yet — add your first one"}
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
                        {filteredSalesTab
                          .map((s) => (
                            <tr key={s.id} className="crm-row" style={S.tr} onClick={() => setSaleModal({ ...s })}>
                              <td style={S.td}>{formatTimestamp(s.timestamp)}</td>
                              <td style={{ ...S.td, fontWeight: 500 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  {s.name}
                                  {s.epgPushStatus === "success" && (
                                    <span style={S.epgBadgeSuccess} title={`Sent to EPG${s.epgPushedAt ? " " + new Date(s.epgPushedAt).toLocaleString("en-US") : ""}`}>
                                      EPG ✓
                                    </span>
                                  )}
                                  {s.epgPushStatus === "failed" && (
                                    <span style={S.epgBadgeFailed} title={s.epgPushError || "Failed to send to EPG"}>
                                      EPG ✗
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={S.td}>{s.spouseName}</td>
                              <td style={S.td}>{s.phone}</td>
                              <td style={S.td}>{s.email}</td>
                              <td style={S.td}>{s.address}</td>
                              <td style={S.td}>{s.city}</td>
                              <td style={S.td}>{s.state}</td>
                              <td style={S.td}>{s.zip}</td>
                              <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14 }}>{s.packagePrice ? money(s.packagePrice) : ""}</td>
                              <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14 }}>{s.dateFlex ? money(s.dateFlex) : ""}</td>
                              <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14 }}>
                                {s.password ? "••••••••" : ""}
                              </td>
                              <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14, fontWeight: 500 }}>
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
            );
          })()
        )}

        {section === "leads" && (() => {
          const nameGroupsForTabs = {};
          sales.forEach((s) => {
            const key = (s.name || "").trim().toLowerCase();
            if (!key) return;
            if (!nameGroupsForTabs[key]) nameGroupsForTabs[key] = [];
            nameGroupsForTabs[key].push(s);
          });
          const duplicateCustomerGroupsForTab = Object.values(nameGroupsForTabs)
            .filter((group) => group.length > 1)
            .map((group) => [...group].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)));
          return (
          <div style={S.contactsWrap}>
            <div style={S.reportsSubTabs}>
              <button
                onClick={() => setLeadsSubTab("leads")}
                style={{ ...S.reportsSubTabBtn, ...(leadsSubTab === "leads" ? S.reportsSubTabBtnActive : {}) }}
              >
                Leads
              </button>
              <button
                onClick={() => setLeadsSubTab("duplicates")}
                style={{ ...S.reportsSubTabBtn, ...(leadsSubTab === "duplicates" ? S.reportsSubTabBtnActive : {}) }}
              >
                Duplicates{duplicateCustomerGroupsForTab.length > 0 ? ` (${duplicateCustomerGroupsForTab.length})` : ""}
              </button>
              <button
                onClick={() => setLeadsSubTab("dnc")}
                style={{ ...S.reportsSubTabBtn, ...(leadsSubTab === "dnc" ? S.reportsSubTabBtnActive : {}) }}
              >
                DNC List{dncList.length > 0 ? ` (${dncList.length})` : ""}
              </button>
            </div>
            {leadsSubTab === "duplicates" && (
              <div>
                <div style={{ ...S.hint, marginTop: 4 }}>
                  Customers with more than one sale on file — click any row to open that sale.
                </div>
                {duplicateCustomerGroupsForTab.length === 0 ? (
                  <div style={S.emptyState}>
                    <Users size={22} color={T.borderStrong} />
                    <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>No repeat customers yet</div>
                  </div>
                ) : (
                  <div style={S.duplicateCustomersPanel}>
                    {duplicateCustomerGroupsForTab.map((group, gi) => (
                      <div key={gi} style={S.duplicateCustomerCard}>
                        <div style={S.duplicateCustomerName}>
                          {group[0].name} <span style={S.duplicateCustomerCount}>{group.length} sales</span>
                        </div>
                        <div style={S.duplicateCustomerRows}>
                          {group.map((s) => (
                            <div key={s.id} style={S.duplicateCustomerRow} onClick={() => setSaleModal({ ...s })}>
                              <span style={{ color: T.textMuted, minWidth: 130 }}>{formatTimestamp(s.timestamp)}</span>
                              <span style={{ flex: 1 }}>{money(s.totalPrice)}</span>
                              <span
                                style={{
                                  ...S.leadBadge,
                                  background:
                                    s.status === "Approved" ? "#EAF3EC" : s.status === "Declined" ? "#FCEBEB" : "#F3E9DA",
                                  color:
                                    s.status === "Approved" ? T.pineDark : s.status === "Declined" ? "#A32D2D" : "#8A5A1E",
                                }}
                              >
                                {s.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {leadsSubTab === "leads" && (
            <>
            {(() => {
              const filteredLeads = [...sales]
                .filter((s) => {
                  if (leadsRange && !isSaleInRange(s, leadsRange.start, leadsRange.end)) return false;
                  if (leadsCategoryFilter) {
                    if (leadsCategoryFilter === "Declined") {
                      if (s.status !== "Declined") return false;
                    } else if (leadsCategoryFilter === "Pending") {
                      if (s.status !== "Pending") return false;
                    } else if (leadsCategoryFilter === "Chargeback") {
                      if (!s.refunded) return false;
                    } else if (s.leadSubmittedTo !== leadsCategoryFilter) {
                      return false;
                    }
                  }
                  const q2 = leadsSearch.trim().toLowerCase();
                  if (!q2) return true;
                  return (
                    s.name.toLowerCase().includes(q2) ||
                    (s.email || "").toLowerCase().includes(q2) ||
                    (s.phone || "").toLowerCase().includes(q2) ||
                    (s.city || "").toLowerCase().includes(q2) ||
                    (s.genieNumber || "").toLowerCase().includes(q2)
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
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() =>
                          exportLeadsCSV(filteredLeads, leadsFilterMode === "all" ? "All time" : leadsRangeLabel)
                        }
                        style={S.ghostBtn}
                        title="Download the leads currently shown as a CSV file"
                      >
                        <Download size={14} /> Export CSV
                      </button>
                      <div style={S.searchWrap}>
                        <Search size={14} color={T.textMuted} style={{ flexShrink: 0 }} />
                        <input
                          value={leadsSearch}
                          onChange={(e) => setLeadsSearch(e.target.value)}
                          placeholder="Search leads or Genie #"
                          style={S.searchInput}
                        />
                        {leadsSearch && (
                          <button onClick={() => setLeadsSearch("")} style={S.iconBtnGhost}>
                            <X size={13} color={T.textMuted} />
                          </button>
                        )}
                      </div>
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
                        <option value="day">Daily</option>
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
                        {leadsFilterMode === "day" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="date"
                              value={leadsSelectedDate}
                              onChange={(e) => e.target.value && setLeadsSelectedDate(e.target.value)}
                              style={{ ...S.weekNavLabel, ...(leadsNavIsCurrent ? S.weekNavLabelActive : {}), cursor: "pointer" }}
                            />
                            {leadsNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                          </div>
                        ) : (
                          <button
                            onClick={leadsNavReset}
                            style={{ ...S.weekNavLabel, ...(leadsNavIsCurrent ? S.weekNavLabelActive : {}) }}
                          >
                            {leadsRangeLabel}
                            {leadsNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                          </button>
                        )}
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
                        style={{
                          ...S.leadCard,
                          ...(s.status === "Approved" ? S.leadCardApproved : {}),
                          ...(s.refunded ? S.leadCardRefunded : {}),
                        }}
                      >
                        <div style={S.leadCardHeader}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={S.leadName}>{s.name}</span>
                            {s.refunded && (
                              <>
                                <span style={{ ...S.refundedBadge, fontSize: 14 }}>
                                  {s.refundType === "partial" ? `Partial refund ${money(s.refundAmount)}` : "Refunded"}
                                </span>
                                <span style={{ ...S.leadBadge, fontSize: 14, background: categoryColor("Chargeback").bg, color: categoryColor("Chargeback").color }}>
                                  Chargeback
                                </span>
                              </>
                            )}
                            {st && (
                              <span
                                style={{
                                  ...S.leadBadge,
                                  fontSize: 14,
                                  ...(st === "Declined"
                                    ? { background: "#FCEBEB", color: "#A32D2D" }
                                    : st === "Pending"
                                    ? { background: "#FBF3E6", color: "#8A5A1E" }
                                    : { background: "#EAF3DE", color: "#3B6D11" }),
                                }}
                              >
                                {st}
                              </span>
                            )}
                            {s.leadSubmittedTo && (
                              <span style={{ ...S.leadBadge, fontSize: 14, ...(s.leadSubmittedTo === "Monster" ? S.leadBadgeMonster : S.leadBadgePGR) }}>
                                {s.leadSubmittedTo}
                              </span>
                            )}
                            {s.source && <span style={{ ...S.sourceBadge, fontSize: 14 }}>{s.source}</span>}
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
                          {s.submittedBy && (
                            <div style={S.leadInfoItem}>
                              <span style={S.leadInfoLabel}>Submitted by</span>
                              <span>{s.submittedBy}</span>
                            </div>
                          )}
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
                            <span style={{ fontFamily: T.mono, fontSize: 14 }}>{s.packagePrice ? money(s.packagePrice) : "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Date flex price</span>
                            <span style={{ fontFamily: T.mono, fontSize: 14 }}>{s.dateFlex ? money(s.dateFlex) : "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Total price</span>
                            <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>{s.totalPrice ? money(s.totalPrice) : "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Genie #</span>
                            <span>{s.genieNumber || "—"}</span>
                          </div>
                          <div style={S.leadInfoItem}>
                            <span style={S.leadInfoLabel}>Password</span>
                            <span style={{ fontFamily: T.mono, fontSize: 14 }}>{s.password ? "••••••••" : "—"}</span>
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
            </>
            )}

            {leadsSubTab === "dnc" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={S.hint}>
                    Numbers, emails, or names on this list will show a warning when a rep starts a new sale for them.
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => setDncBulkOpen(true)} style={S.ghostBtn}>
                      <Upload size={14} /> Bulk add
                    </button>
                    <button
                      onClick={() => setDncModal({ id: uid(), name: "", phone: "", email: "", notes: "", isNew: true })}
                      style={S.primaryBtn}
                    >
                      <Plus size={14} /> New DNC
                    </button>
                  </div>
                </div>
                {dncList.length === 0 ? (
                  <div style={S.emptyState}>
                    <ShieldAlert size={22} color={T.borderStrong} />
                    <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>No DNC entries yet</div>
                  </div>
                ) : (
                  <div className="crm-scroll" style={{ ...S.tableScroll, marginTop: 12 }}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Name</th>
                          <th style={S.th}>Phone</th>
                          <th style={S.th}>Email</th>
                          <th style={S.th}>Notes</th>
                          <th style={S.th}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dncList.map((d) => (
                          <tr key={d.id} style={S.tr} onClick={() => setDncModal(d)}>
                            <td style={S.td}>{d.name || "—"}</td>
                            <td style={{ ...S.td, fontFamily: T.mono }}>{d.phone || "—"}</td>
                            <td style={S.td}>{d.email || "—"}</td>
                            <td style={S.td}>{d.notes || "—"}</td>
                            <td style={S.td} onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => deleteDncEntry(d.id)} style={S.iconBtnGhost}>
                                <Trash2 size={13} color={T.textMuted} />
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
          </div>
          );
        })()}

        {section === "employees" && (
          <div style={S.contactsWrap}>
            {(() => {
              const employeeStatsMonth = getMonthRange(employeeStatsMonthOffset);
              const employeeStatsYear = getYearRange(employeeStatsYearOffset);
              const employeeStatsRange =
                employeeStatsMode === "month"
                  ? employeeStatsMonth
                  : employeeStatsMode === "year"
                  ? employeeStatsYear
                  : null;
              const employeeStatsLabel =
                employeeStatsMode === "month"
                  ? formatMonthLabel(employeeStatsMonth.start)
                  : employeeStatsMode === "year"
                  ? formatYearLabel(employeeStatsYear.start)
                  : "all-time";
              return (
                <>
            <div style={S.contactsToolbar}>
              <div style={S.tabs}>
                {!(currentUser && currentUser.role === "manager") && (
                  <>
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
                  </>
                )}
                <button
                  onClick={() => setEmployeesView("hiring")}
                  style={{ ...S.tab, ...(employeesView === "hiring" ? S.tabActive : {}) }}
                >
                  Hiring ({candidates.length})
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ position: "relative" }}>
                  <select
                    value={employeeStatsMode}
                    onChange={(e) => setEmployeeStatsMode(e.target.value)}
                    style={{ ...S.select, width: 110, paddingRight: 28 }}
                  >
                    <option value="all">All time</option>
                    <option value="year">This year</option>
                    <option value="month">This month</option>
                  </select>
                  <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                </div>
                {employeeStatsMode === "month" && (
                  <>
                    <button onClick={() => setEmployeeStatsMonthOffset((m) => m - 1)} style={S.weekNavBtn} aria-label="Previous month">
                      ‹
                    </button>
                    <span style={{ fontSize: 12, color: T.textMuted, minWidth: 90, textAlign: "center" }}>
                      {employeeStatsLabel}
                    </span>
                    <button onClick={() => setEmployeeStatsMonthOffset((m) => m + 1)} style={S.weekNavBtn} aria-label="Next month">
                      ›
                    </button>
                  </>
                )}
                {employeeStatsMode === "year" && (
                  <>
                    <button onClick={() => setEmployeeStatsYearOffset((y) => y - 1)} style={S.weekNavBtn} aria-label="Previous year">
                      ‹
                    </button>
                    <span style={{ fontSize: 12, color: T.textMuted, minWidth: 60, textAlign: "center" }}>
                      {employeeStatsLabel}
                    </span>
                    <button onClick={() => setEmployeeStatsYearOffset((y) => y + 1)} style={S.weekNavBtn} aria-label="Next year">
                      ›
                    </button>
                  </>
                )}
              </div>
              {employeesView === "active" && (
                <button
                  onClick={() => setEmployeeModal({ name: "", role: "rep", phone: "", email: "", commissionRate: "", basePay: "", active: true, notes: "" })}
                  style={S.primaryBtn}
                >
                  <Plus size={14} /> Employee
                </button>
              )}
              {employeesView === "hiring" && (
                <button
                  onClick={() =>
                    setCandidateModal({
                      id: uid(),
                      name: "",
                      phone: "",
                      email: "",
                      interviewDate: "",
                      experience: "",
                      notes: "",
                      position: "",
                      leadSource: "",
                      status: "pending",
                      isNew: true,
                    })
                  }
                  style={S.primaryBtn}
                >
                  <Plus size={14} /> Candidate
                </button>
              )}
            </div>

            {employeesView === "hiring" ? (
              candidates.length === 0 ? (
                <div style={S.emptyState}>
                  <Users size={22} color={T.borderStrong} />
                  <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                    No candidates yet — add your first one
                  </div>
                </div>
              ) : (
                <div style={S.contactGrid}>
                  {[...candidates]
                    .sort((a, b) => new Date(b.interviewDate || 0) - new Date(a.interviewDate || 0))
                    .map((c) => {
                      const statusColors = {
                        hired: { bg: "#EAF3EC", color: T.pineDark },
                        noshow: { bg: "#FBF3E6", color: "#8A5A1E" },
                        rejected: { bg: "#FCEBEB", color: "#A32D2D" },
                        pending: { bg: "#F0EFE9", color: T.textMuted },
                      };
                      const sc = statusColors[c.status] || statusColors.pending;
                      const statusLabel = { hired: "Hired", noshow: "No Show", rejected: "Rejected", pending: "Pending" }[c.status] || "Pending";
                      return (
                        <div key={c.id} style={S.contactCard} onClick={() => setCandidateModal(c)}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={S.contactName}>{c.name}</div>
                            <span style={{ ...S.leadBadge, background: sc.bg, color: sc.color, flexShrink: 0 }}>{statusLabel}</span>
                          </div>
                          {c.position && (
                            <div style={S.contactMetaRow}>
                              <Users size={12} /> {c.position === "closer" ? "Closer" : "Opener"}
                            </div>
                          )}
                          {c.phone && (
                            <div style={S.contactMetaRow}>
                              <Phone size={12} /> {c.phone}
                            </div>
                          )}
                          {c.interviewDate && (
                            <div style={S.contactMetaRow}>
                              <CalendarDays size={12} />{" "}
                              {new Date(c.interviewDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          )}
                          {c.leadSource && <div style={S.contactOwner}>Source: {c.leadSource}</div>}
                        </div>
                      );
                    })}
                </div>
              )
            ) : employeesView === "active" ? (
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
                    const empSalesAll = salesForEmployee(emp.id);
                    const empSales = employeeStatsRange
                      ? empSalesAll.filter((s) => isSaleInRange(s, employeeStatsRange.start, employeeStatsRange.end))
                      : empSalesAll;
                    const empAllTimeTotal = empSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
                    const weekEntries = weeklySaleEntries(emp.id);
                    const empPendingRefunds = pendingRefundEntriesForEmployee(emp.id, currentWeek.start);
                    const empRate = Number(emp.commissionRate) || 0;
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
                          {emp.startDate && (
                            <div style={S.contactMetaRow}>
                              <CalendarDays size={11} color={T.textMuted} /> Started{" "}
                              {new Date(emp.startDate + "T00:00:00").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                        <div style={S.employeeStats}>
                          {empSales.length} sale{empSales.length === 1 ? "" : "s"} {employeeStatsLabel} · {money(empAllTimeTotal)}
                        </div>
                        {empPendingRefunds.length > 0 && (
                          <div style={S.pendingRefundList}>
                            {empPendingRefunds.map(({ sale, credit }) => (
                              <div key={sale.id} style={S.pendingRefundNote}>
                                <RotateCcw size={11} />
                                {sale.name}: -{money(credit * (empRate / 100))}
                              </div>
                            ))}
                          </div>
                        )}
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
                  const empSalesAll = salesForEmployee(emp.id);
                  const empSales = employeeStatsRange
                    ? empSalesAll.filter((s) => isSaleInRange(s, employeeStatsRange.start, employeeStatsRange.end))
                    : empSalesAll;
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
                        {empSales.length} sale{empSales.length === 1 ? "" : "s"} {employeeStatsLabel} · {money(empAllTimeTotal)}
                      </div>
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
                      <div style={S.exEmployeeNote}>Deactivated — open to reactivate, or use Weekly template for past pay/deals</div>
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
              Each day cell has a small dropdown under the sales — use it to mark someone Late, Left early, or Absent for that day. Below that, enter a dollar amount to record a daily Spiff — it carries over into that person's Payroll for the week.
            </div>

            {rrgBoard.length === 0 ? (
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
                      <th style={{ ...S.th, fontSize: 16 }}>Agent</th>
                      {WEEKDAY_LABELS.map((d, i) => {
                        const date = new Date(rrg.start);
                        date.setDate(rrg.start.getDate() + i);
                        return (
                          <th key={d} style={{ ...S.th, fontSize: 16 }}>
                            {d}
                            <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, marginTop: 2 }}>
                              {date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ ...S.th, fontSize: 16 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rrgBoard.map((row, rowIdx) => (
                      <tr key={row.employee.id} className="crm-row">
                        <td style={{ ...S.td, fontSize: 16, fontWeight: 700, whiteSpace: "nowrap" }}>
                          <div style={S.reorderCell}>
                            <div style={S.reorderBtns}>
                              <button
                                onClick={() => moveEmployee(row.employee.id, "up", employeesForWeek(rrg.start))}
                                disabled={rowIdx === 0}
                                style={{ ...S.reorderBtn, ...(rowIdx === 0 ? S.reorderBtnDisabled : {}) }}
                                aria-label="Move up"
                              >
                                <ChevronUp size={11} />
                              </button>
                              <button
                                onClick={() => moveEmployee(row.employee.id, "down", employeesForWeek(rrg.start))}
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
                                    color: attInfo ? attInfo.color : T.textMuted,
                                    borderColor: attInfo ? attInfo.color : "transparent",
                                    background: attInfo ? "#FBF6EC" : "transparent",
                                  }}
                                >
                                  <option value="">—</option>
                                  {ATTENDANCE_STATUSES.map((a) => (
                                    <option key={a.id} value={a.id} style={{ color: a.color, fontWeight: 700 }}>
                                      {a.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ marginTop: 3 }}>
                                <input
                                  type="number"
                                  value={getSpiff(row.employee.id, rrgDayDates[i])}
                                  onChange={(e) => setSpiffValue(row.employee.id, rrgDayDates[i], e.target.value)}
                                  placeholder="+ spiff"
                                  style={{
                                    ...S.spiffInput,
                                    ...(getSpiff(row.employee.id, rrgDayDates[i]) !== ""
                                      ? { color: "#8A5A1E", borderColor: "#E3C89A", background: "#FBF3E6" }
                                      : {}),
                                  }}
                                />
                                {getSpiff(row.employee.id, rrgDayDates[i]) !== "" &&
                                  Number(getSpiff(row.employee.id, rrgDayDates[i])) !== 0 && (
                                    <label style={S.spiffPaidLabel} title="Already paid same-day — won't add to their check">
                                      <input
                                        type="checkbox"
                                        checked={getSpiffPaid(row.employee.id, rrgDayDates[i])}
                                        onChange={(e) => setSpiffPaid(row.employee.id, rrgDayDates[i], e.target.checked)}
                                        style={{ margin: 0 }}
                                      />
                                      Paid
                                    </label>
                                  )}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ ...S.td, fontFamily: T.mono, fontSize: 16, fontWeight: 700 }}>{money(row.weekTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ ...S.td, fontSize: 16, fontWeight: 700 }}>Daily totals</td>
                      {rrgDailyTotals.map((t, i) => (
                        <td key={i} style={{ ...S.td, fontFamily: T.mono, fontSize: 16, fontWeight: 700 }}>
                          {money(t)}
                        </td>
                      ))}
                      <td style={{ ...S.td, fontFamily: T.mono, fontSize: 16, fontWeight: 700 }}>{money(rrgWeekGrandTotal)}</td>
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
              <div>
                <div style={S.dashboardSectionLabel}>Payroll</div>
                <div style={S.payDateLabel}>Pay date: {payrollPayDateLabel}</div>
              </div>
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
              Everyone is guaranteed at least {money(settings.minWeeklyPay)} for the week — if commission plus base pay comes in under that, they're paid the guaranteed amount instead. Sales Total reflects only the week shown here, not an all-time figure. Each day marked Absent on the RRG Board knocks {money(ABSENCE_GUARANTEE_DEDUCTION)} off that person's guarantee for the week. Refunds marked in All Leads deduct the involved employees' credited commission from the payroll week right after the refund was recorded — that Refund Deduction amount is editable too, so if someone's paying a refund back over a few pay periods instead of all at once, you can lower this week's amount and it'll show a reset button to bring back the full calculated figure. Total pay is editable the same way — click into the amount to override it for that person's that week; a reset button brings back the calculated number.
            </div>

            {payrollEmployeesForWeek.length === 0 ? (
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
                      <th style={{ ...S.th, fontSize: 12 }}>Employee</th>
                      <th style={{ ...S.th, fontSize: 12 }}>Sales this week</th>
                      <th style={{ ...S.th, fontSize: 12 }}>Sales total</th>
                      <th style={{ ...S.th, fontSize: 12 }}>Commission %</th>
                      <th style={{ ...S.th, fontSize: 12 }}>Commission owed</th>
                      <th style={{ ...S.th, fontSize: 12 }}>Refund deduction</th>
                      <th style={{ ...S.th, fontSize: 12 }}>Draw</th>
                      <th style={{ ...S.th, fontSize: 12 }}>Spiff</th>
                      <th style={{ ...S.th, fontSize: 12 }}>Total pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollEmployeesForWeek.map((emp, empIdx) => {
                      const empSales = salesForEmployee(emp.id);
                      const empWeekSales = empSales.filter((s) => isSaleInRange(s, payrollWeek.start, payrollWeek.end));
                      const empWeekTotal = empWeekSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
                      const rate = Number(emp.commissionRate) || 0;
                      const grossCommission = empWeekTotal * (rate / 100);
                      const refundedCredit = refundedCreditForEmployee(emp.id, payrollWeek.start, payrollWeek.end);
                      const calculatedRefundDeduction = refundedCredit * (rate / 100);
                      const refundDeductionOverrideVal = getRefundDeductionOverride(emp.id, payrollWeek.start);
                      const refundDeductionIsOverridden = refundDeductionOverrideVal !== null;
                      const refundDeduction = refundDeductionIsOverridden ? refundDeductionOverrideVal : calculatedRefundDeduction;
                      const commissionOwed = grossCommission - refundDeduction;
                      const hasBasePay = emp.basePay !== "" && emp.basePay !== undefined && emp.basePay !== null;
                      const basePay = hasBasePay ? effectiveBasePay(emp.id, payrollWeek.start, emp.basePay) : 0;
                      const spiffTotal = spiffTotalInWeek(emp.id, payrollWeek.start);
                      const spiffPaidUnpaid = spiffPaidAndUnpaidInWeek(emp.id, payrollWeek.start);
                      const rawBasePay = combinedEarnings(commissionOwed, basePay, emp.name);
                      const empMinGuarantee = effectiveMinGuarantee(emp.id, payrollWeek.start);
                      const guaranteedBase = Math.max(rawBasePay, empMinGuarantee);
                      const computedTotalPay = guaranteedBase + spiffTotal;
                      const guaranteeApplied = rawBasePay < empMinGuarantee;
                      const empAbsences = absentDaysInWeek(emp.id, payrollWeek.start);
                      const empIsProrated =
                        !!emp.startDate && new Date(emp.startDate + "T00:00:00") > payrollWeek.start;
                      const override = getPayrollOverride(emp.id, payrollWeek.start);
                      const totalPay = Math.round(override !== null ? override : computedTotalPay);
                      const isOverridden = override !== null;
                      return (
                        <tr key={emp.id} className="crm-row" onClick={() => setEmployeeModal({ ...emp })}>
                          <td style={{ ...S.td, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}>
                            <div style={S.reorderCell}>
                              <div style={S.reorderBtns} onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => moveEmployee(emp.id, "up", payrollEmployeesForWeek)}
                                  disabled={empIdx === 0}
                                  style={{ ...S.reorderBtn, ...(empIdx === 0 ? S.reorderBtnDisabled : {}) }}
                                  aria-label="Move up"
                                >
                                  <ChevronUp size={11} />
                                </button>
                                <button
                                  onClick={() => moveEmployee(emp.id, "down", payrollEmployeesForWeek)}
                                  disabled={empIdx === payrollEmployeesForWeek.length - 1}
                                  style={{ ...S.reorderBtn, ...(empIdx === payrollEmployeesForWeek.length - 1 ? S.reorderBtnDisabled : {}) }}
                                  aria-label="Move down"
                                >
                                  <ChevronDown size={11} />
                                </button>
                              </div>
                              {emp.name}
                            </div>
                          </td>
                          <td style={{ ...S.td, fontSize: 14 }}>
                            {empWeekSales.length} sale{empWeekSales.length === 1 ? "" : "s"} · {money(empWeekTotal)}
                          </td>
                          <td style={{ ...S.td, fontFamily: T.mono, fontSize: 15 }}>{money(empWeekTotal)}</td>
                          <td style={{ ...S.td, fontSize: 14 }}>
                            {rate > 0 ? (
                              <span style={{ ...S.commissionRateBadge, fontSize: 13 }}>{rate}%</span>
                            ) : (
                              <span style={{ color: T.borderStrong }}>Not set</span>
                            )}
                          </td>
                          <td style={{ ...S.td, fontFamily: T.mono, fontSize: 15, fontWeight: 500 }}>
                            {rate > 0 ? money(commissionOwed) : "—"}
                          </td>
                          <td style={{ ...S.td, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                            <div style={S.totalPayCell}>
                              <span style={{ ...S.totalPayCurrency, color: refundDeduction > 0 ? "#A32D2D" : T.borderStrong }}>-$</span>
                              <input
                                type="number"
                                value={refundDeduction || ""}
                                placeholder="0"
                                onChange={(e) => setRefundDeductionOverrideValue(emp.id, payrollWeek.start, e.target.value)}
                                style={{
                                  ...S.totalPayInput,
                                  color: refundDeductionIsOverridden ? "#8A5A1E" : refundDeduction > 0 ? "#A32D2D" : T.borderStrong,
                                }}
                              />
                              {refundDeductionIsOverridden && (
                                <button
                                  style={S.totalPayResetBtn}
                                  onClick={() => clearRefundDeductionOverride(emp.id, payrollWeek.start)}
                                  title="Reset to calculated amount"
                                >
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ ...S.td, fontFamily: T.mono, fontSize: 15, fontWeight: 500 }}>
                            {hasBasePay ? money(basePay) : "—"}
                          </td>
                          <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>
                            {spiffPaidUnpaid.paid === 0 && spiffPaidUnpaid.unpaid === 0 ? (
                              <span style={{ color: T.borderStrong }}>—</span>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {spiffPaidUnpaid.unpaid > 0 && (
                                  <span style={{ color: "#A32D2D" }} title="Not yet paid — will be added to this check">
                                    {money(spiffPaidUnpaid.unpaid)}
                                  </span>
                                )}
                                {spiffPaidUnpaid.paid > 0 && (
                                  <span style={{ color: "#1F4536" }} title="Already paid same-day — won't be added to this check">
                                    {money(spiffPaidUnpaid.paid)}
                                  </span>
                                )}
                              </div>
                            )}
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
                                guaranteeApplied && (
                                  <span style={{ ...S.minGuaranteeBadge, fontSize: 11 }}>
                                    min guarantee{empAbsences > 0 ? ` (−${empAbsences}d)` : ""}
                                  </span>
                                )
                              )}
                            </div>
                            {isOverridden && <div style={S.customPayNote}>Custom · calculated {money(computedTotalPay)}</div>}
                            {!isOverridden && (empAbsences > 0 || empIsProrated) && (
                              <label style={S.workedSaturdayLabel} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={getWorkedSaturday(emp.id, payrollWeek.start)}
                                  onChange={(e) => setWorkedSaturdayValue(emp.id, payrollWeek.start, e.target.checked)}
                                  style={{ margin: 0 }}
                                />
                                {empAbsences > 0 ? "Worked Saturday (makes up 1 day)" : "Worked Saturday"}
                              </label>
                            )}
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
                      <td style={S.td} />
                      <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14, fontWeight: 600, color: T.pineDark }}>
                        {money(
                          payrollEmployeesForWeek.reduce((sum, emp) => {
                            const override = getPayrollOverride(emp.id, payrollWeek.start);
                            if (override !== null) return sum + Math.round(override);
                            const empSales = salesForEmployee(emp.id).filter((s) => isSaleInRange(s, payrollWeek.start, payrollWeek.end));
                            const total = empSales.reduce((s, r) => s + saleCredit(r, emp.id), 0);
                            const rate = Number(emp.commissionRate) || 0;
                            const refundedCredit = refundedCreditForEmployee(emp.id, payrollWeek.start, payrollWeek.end);
                            const refundOverrideVal = getRefundDeductionOverride(emp.id, payrollWeek.start);
                            const refundDed = refundOverrideVal !== null ? refundOverrideVal : refundedCredit * (rate / 100);
                            const commission = total * (rate / 100) - refundDed;
                            const hasBasePay = emp.basePay !== "" && emp.basePay !== undefined && emp.basePay !== null;
                            const basePay = hasBasePay ? effectiveBasePay(emp.id, payrollWeek.start, emp.basePay) : 0;
                            const spiffTotal = spiffTotalInWeek(emp.id, payrollWeek.start);
                            const guaranteedBase = Math.max(
                              combinedEarnings(commission, basePay, emp.name),
                              effectiveMinGuarantee(emp.id, payrollWeek.start)
                            );
                            return sum + Math.round(guaranteedBase + spiffTotal);
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
            <div style={S.reportsSubTabs}>
              <button
                onClick={() => setReportsSubTab("snapshot")}
                style={{ ...S.reportsSubTabBtn, ...(reportsSubTab === "snapshot" ? S.reportsSubTabBtnActive : {}) }}
              >
                Business Snapshot
              </button>
              <button
                onClick={() => setReportsSubTab("pnl")}
                style={{ ...S.reportsSubTabBtn, ...(reportsSubTab === "pnl" ? S.reportsSubTabBtnActive : {}) }}
              >
                Profit & Loss
              </button>
              <button
                onClick={() => setReportsSubTab("hourly")}
                style={{ ...S.reportsSubTabBtn, ...(reportsSubTab === "hourly" ? S.reportsSubTabBtnActive : {}) }}
              >
                Production by Hour
              </button>
            </div>

            {reportsSubTab !== "pnl" && (
              <div style={S.weekNavRow}>
              <div style={S.dashboardSectionLabel}>
                {reportsSubTab === "snapshot" ? "Business snapshot" : "Production by Hour"}
              </div>
              <div style={S.weekNav}>
                <div style={{ position: "relative" }}>
                  <select
                    value={reportsFilterMode === "week" && reportsWeekOffset === -1 ? "prevweek" : reportsFilterMode}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "prevweek") {
                        setReportsFilterMode("week");
                        setReportsWeekOffset(-1);
                      } else if (v === "week") {
                        setReportsFilterMode("week");
                        setReportsWeekOffset(0);
                      } else {
                        setReportsFilterMode(v);
                      }
                    }}
                    style={{ ...S.select, width: 140, paddingRight: 28 }}
                  >
                    <option value="day">Today</option>
                    <option value="week">This week</option>
                    <option value="prevweek">Previous week</option>
                    <option value="month">This month</option>
                    <option value="year">This year</option>
                    <option value="custom">Custom range</option>
                    <option value="all">All time</option>
                  </select>
                  <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                </div>
                {reportsFilterMode === "custom" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="date"
                      value={reportsCustomStart}
                      max={reportsCustomEnd}
                      onChange={(e) => e.target.value && setReportsCustomStart(e.target.value)}
                      style={S.customRangeInput}
                    />
                    <span style={{ color: T.textMuted, fontSize: 12 }}>to</span>
                    <input
                      type="date"
                      value={reportsCustomEnd}
                      min={reportsCustomStart}
                      onChange={(e) => e.target.value && setReportsCustomEnd(e.target.value)}
                      style={S.customRangeInput}
                    />
                  </div>
                ) : (
                  reportsFilterMode !== "all" && (
                    <>
                      <button onClick={reportsNavPrev} style={S.weekNavBtn} aria-label="Previous">
                        ‹
                      </button>
                      {reportsFilterMode === "day" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="date"
                            value={reportsSelectedDate}
                            onChange={(e) => e.target.value && setReportsSelectedDate(e.target.value)}
                            style={{ ...S.weekNavLabel, ...(reportsNavIsCurrent ? S.weekNavLabelActive : {}), cursor: "pointer" }}
                          />
                          {reportsNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                        </div>
                      ) : reportsFilterMode === "month" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ position: "relative" }}>
                            <select
                              value={reportsMonthOffset}
                              onChange={(e) => setReportsMonthOffset(Number(e.target.value))}
                              style={{ ...S.select, width: 170, paddingRight: 28, fontWeight: 600 }}
                            >
                              {Array.from({ length: 25 }, (_, i) => -i).map((offset) => (
                                <option key={offset} value={offset}>
                                  {formatMonthLabel(getMonthRange(offset).start)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                          </div>
                          {reportsNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                        </div>
                      ) : (
                        <button
                          onClick={reportsNavReset}
                          style={{ ...S.weekNavLabel, ...(reportsNavIsCurrent ? S.weekNavLabelActive : {}) }}
                        >
                          {reportsRangeLabel}
                          {reportsNavIsCurrent && <span style={S.weekNavThisWeek}>Current</span>}
                        </button>
                      )}
                      <button onClick={reportsNavNext} style={S.weekNavBtn} aria-label="Next">
                        ›
                      </button>
                    </>
                  )
                )}
              </div>
              </div>
            )}

            {reportsSubTab === "snapshot" && (
              <>
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
                  <span style={S.sourceCount}>{reportsApprovedSales.length} sale{reportsApprovedSales.length === 1 ? "" : "s"}</span>
                </div>
                <div style={S.sourceValue}>{money(reportsTotalSalesValue)}</div>
              </div>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={S.reportsCardLabel}>Average sale price</span>
                </div>
                <div style={S.sourceValue}>{money(reportsAverageSalePrice)}</div>
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
                    <span style={{ ...S.leadBadge, background: chartColor(row.source) + "22", color: chartColor(row.source) }}>
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
                  <span style={{ ...S.leadBadge, background: chartColor("Declined") + "22", color: chartColor("Declined") }}>Declined</span>
                  <span style={S.sourceCount}>
                    {reportsDeclined.length} sale{reportsDeclined.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div style={S.sourceValue}>
                  {money(reportsDeclined.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0))}
                </div>
              </div>
            </div>

            <div style={{ ...S.dashboardSectionLabel, marginTop: 20 }}>By channel (Dialer / Paper)</div>
            <div style={S.sourceGrid}>
              {reportsChannelBreakdown.map((row) => (
                <div key={row.source} style={S.sourceCard}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={S.channelBadge}>{row.source}</span>
                    <span style={S.sourceCount}>
                      {row.count} sale{row.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div style={S.sourceValue}>{money(row.total)}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.dashboardSectionLabel, marginTop: 20 }}>Source commission</div>
            <div style={S.sourceGrid}>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...S.leadBadge, background: chartColor("Monster") + "22", color: chartColor("Monster") }}>Monster</span>
                  <span style={S.sourceCount}>{settings.monsterCommissionRate}% of {money(reportsMonsterTotal)}</span>
                </div>
                <div style={S.sourceValue}>{money(reportsMonsterCommission)}</div>
              </div>
              <div style={S.sourceCard}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ ...S.leadBadge, background: chartColor("PGR") + "22", color: chartColor("PGR") }}>PGR</span>
                  <span style={S.sourceCount}>{settings.pgrCommissionRate}% of {money(reportsPgrTotal)}</span>
                </div>
                <div style={S.sourceValue}>{money(reportsPgrCommission)}</div>
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
                      <th style={S.th}>Profit or Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportsEmployeeRows.map((r) => (
                      <tr key={r.employee.id}>
                        <td style={{ ...S.td, fontWeight: 500, whiteSpace: "nowrap" }}>{r.employee.name}</td>
                        <td style={S.td}>{r.salesCount}</td>
                        <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14 }}>{money(r.credited)}</td>
                        <td style={S.td}>
                          {r.rate > 0 ? <span style={S.commissionRateBadge}>{r.rate}%</span> : <span style={{ color: T.borderStrong }}>—</span>}
                        </td>
                        <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14, fontWeight: 500 }}>{money(r.commission)}</td>
                        <td
                          style={{
                            ...S.td,
                            fontFamily: T.mono,
                            fontSize: 14,
                            fontWeight: 600,
                            color: r.profitLoss >= 0 ? T.pineDark : "#A32D2D",
                          }}
                        >
                          {r.profitLoss >= 0 ? "+" : "-"}
                          {money(Math.abs(r.profitLoss))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ ...S.hint, marginTop: 12 }}>
              Commission figures here are earned-commission only for the period shown — they don't include base pay or the
              {" "}{money(settings.minWeeklyPay)} weekly minimum guarantee, since those apply per calendar week. Visit Payroll for
              exact take-home figures on any given week. Profit or Loss compares what RRG actually collects from Monster/PGR
              on their sales against what they were paid — the guarantee side is calculated week by week, correctly
              accounting for absences and employees who started partway through the period, not just a flat weeks×
              {money(settings.minWeeklyPay)} estimate.
            </div>
              </>
            )}

            {reportsSubTab === "pnl" && (
              <div>
                <div style={S.weekNavRow}>
                  <div style={S.dashboardSectionLabel}>Profit & Loss</div>
                  <div style={S.weekNav}>
                    <div style={{ position: "relative" }}>
                      <select
                        value={pnlMode === "week" && pnlWeekOffset === -1 ? "prevweek" : pnlMode}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "prevweek") {
                            setPnlMode("week");
                            setPnlWeekOffset(-1);
                          } else if (v === "week") {
                            setPnlMode("week");
                            setPnlWeekOffset(0);
                          } else {
                            setPnlMode(v);
                          }
                        }}
                        style={{ ...S.select, width: 130, paddingRight: 28 }}
                      >
                        <option value="week">This week</option>
                        <option value="prevweek">Previous week</option>
                        <option value="month">This month</option>
                        <option value="custom">Custom range</option>
                        <option value="all">All time</option>
                      </select>
                      <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                    </div>
                    {pnlMode === "custom" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="date"
                          value={pnlCustomStart}
                          max={pnlCustomEnd}
                          onChange={(e) => e.target.value && setPnlCustomStart(e.target.value)}
                          style={S.customRangeInput}
                        />
                        <span style={{ color: T.textMuted, fontSize: 12 }}>to</span>
                        <input
                          type="date"
                          value={pnlCustomEnd}
                          min={pnlCustomStart}
                          onChange={(e) => e.target.value && setPnlCustomEnd(e.target.value)}
                          style={S.customRangeInput}
                        />
                      </div>
                    ) : pnlMode === "all" ? null : pnlMode === "week" ? (
                      <>
                        <button onClick={() => setPnlWeekOffset((w) => w - 1)} style={S.weekNavBtn} aria-label="Previous week">
                          ‹
                        </button>
                        <button
                          onClick={() => setPnlWeekOffset(0)}
                          style={{ ...S.weekNavLabel, ...(pnlWeekOffset === 0 ? S.weekNavLabelActive : {}) }}
                        >
                          {pnlPeriodLabel}
                          {pnlWeekOffset === 0 && <span style={S.weekNavThisWeek}>Current</span>}
                        </button>
                        <button onClick={() => setPnlWeekOffset((w) => w + 1)} style={S.weekNavBtn} aria-label="Next week">
                          ›
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setPnlMonthOffset((m) => m - 1)} style={S.weekNavBtn} aria-label="Previous month">
                          ‹
                        </button>
                        <button
                          onClick={() => setPnlMonthOffset(0)}
                          style={{ ...S.weekNavLabel, ...(pnlMonthOffset === 0 ? S.weekNavLabelActive : {}) }}
                        >
                          {pnlPeriodLabel}
                          {pnlMonthOffset === 0 && <span style={S.weekNavThisWeek}>Current</span>}
                        </button>
                        <button onClick={() => setPnlMonthOffset((m) => m + 1)} style={S.weekNavBtn} aria-label="Next month">
                          ›
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div style={S.hint}>
                  Revenue is your actual commission for {pnlPeriodLabel} — {settings.monsterCommissionRate}% of Monster
                  sales and {settings.pgrCommissionRate}% of PGR sales, not the customer's full package price, minus
                  the commission-equivalent of any refunds recorded in this period. Payroll is calculated automatically
                  from actual payroll data for this period. {pnlMode === "week"
                    ? `Other expenses are entered monthly (${pnlExpenseSourceMonthLabel}) and shown here as a 1/${pnlWeeksInSourceMonth.toFixed(1)} weekly share — edit them from Monthly view.`
                    : "Enter your actual monthly expenses below — these come from your books, not the CRM."}
                </div>

                <div style={S.sourceGrid}>
                  <div style={S.sourceCard}>
                    <div style={S.reportsCardLabel}>Revenue</div>
                    <div style={{ ...S.sourceValue, color: T.pineDark }}>{money(pnlRevenue)}</div>
                  </div>
                  <div style={S.sourceCard}>
                    <div style={S.reportsCardLabel}>
                      Refunds{pnlRefundedSales.length > 0 ? ` (${pnlRefundedSales.length})` : ""}
                    </div>
                    <div style={{ ...S.sourceValue, color: "#A32D2D" }}>{money(pnlTotalRefunds)}</div>
                  </div>
                  <div style={S.sourceCard}>
                    <div style={S.reportsCardLabel}>Total expenses</div>
                    <div style={{ ...S.sourceValue, color: "#A32D2D" }}>{money(pnlTotalExpenses)}</div>
                  </div>
                  <div style={S.sourceCard}>
                    <div style={S.reportsCardLabel}>Net profit</div>
                    <div style={{ ...S.sourceValue, color: pnlNetProfit >= 0 ? T.pineDark : "#A32D2D" }}>
                      {money(pnlNetProfit)}
                    </div>
                  </div>
                  <div style={S.sourceCard}>
                    <div style={S.reportsCardLabel}>Profit margin</div>
                    <div style={{ ...S.sourceValue, color: pnlProfitMargin >= 0 ? T.pineDark : "#A32D2D" }}>
                      {pnlRevenue > 0 ? `${pnlProfitMargin.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
                  <div style={S.dashboardSectionLabel}>Business expenses — {pnlMonthLabel}</div>
                  <button
                    onClick={() => {
                      setExpenseModalError("");
                      const today = new Date();
                      const isCurrentMonth =
                        today.getFullYear() === pnlExpenseSourceMonthDate.getFullYear() &&
                        today.getMonth() === pnlExpenseSourceMonthDate.getMonth();
                      const defaultDate = isCurrentMonth
                        ? todayDateStr()
                        : new Date(pnlExpenseSourceMonthDate.getFullYear(), pnlExpenseSourceMonthDate.getMonth() + 1, 0)
                            .toISOString()
                            .slice(0, 10);
                      setExpenseModal({
                        id: uid(),
                        date: defaultDate,
                        category: settings.expenseCategories.find((c) => c !== "Payroll") || "",
                        amount: "",
                        notes: "",
                        isNew: true,
                      });
                    }}
                    style={S.primaryBtn}
                  >
                    <Plus size={14} /> New Expense
                  </button>
                </div>
                <div className="crm-scroll" style={{ ...S.tableScroll, marginTop: 8 }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Category</th>
                        <th style={S.th}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pnlExpenseRows.map((row) => (
                        <Fragment key={row.category}>
                          <tr style={S.tr}>
                            <td style={{ ...S.td, fontWeight: 500 }}>
                              {row.category}
                              {row.auto && <span style={S.pnlAutoBadge}>Auto</span>}
                            </td>
                            <td style={S.td}>
                              <span style={{ fontFamily: T.mono, fontSize: 13, color: T.ink }}>{money(row.amount)}</span>
                            </td>
                          </tr>
                          {row.transactions.length > 0 && (
                            <tr>
                              <td colSpan={2} style={{ padding: "0 12px 10px 12px", borderBottom: `1px solid ${T.border}` }}>
                                <div style={S.pnlTransactionList}>
                                  {row.transactions.map((t) => (
                                    <div key={t.id} style={S.pnlTransactionRow}>
                                      <span style={{ color: T.textMuted, minWidth: 90 }}>
                                        {t.date
                                          ? new Date(t.date + "T00:00:00").toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                            })
                                          : "—"}
                                      </span>
                                      <span style={{ fontFamily: T.mono, minWidth: 70 }}>{money(t.amount)}</span>
                                      <span style={{ flex: 1, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {t.notes}
                                      </span>
                                      <ExpenseFileButton expenseKey={`txn_${t.id}`} />
                                      <button
                                        onClick={() => {
                                          setExpenseModalError("");
                                          setExpenseModal(t);
                                        }}
                                        style={S.iconBtnGhost}
                                        title="Edit"
                                      >
                                        <Pencil size={11} color={T.textMuted} />
                                      </button>
                                      <button onClick={() => deleteExpenseTransaction(t.id)} style={S.iconBtnGhost} title="Delete">
                                        <Trash2 size={11} color={T.textMuted} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ ...S.td, fontWeight: 700 }}>Total expenses</td>
                        <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14, fontWeight: 700 }}>{money(pnlTotalExpenses)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div style={{ ...S.hint, marginTop: 10 }}>
                  Add or rename expense categories under Admin/Settings → Dropdown lists.
                </div>
              </div>
            )}

            {reportsSubTab === "hourly" && (
              <>
                <div style={S.dashboardSectionLabel}>Production by Hour</div>
                <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.ink, marginTop: 4, marginBottom: 6 }}>
                  {reportsFilterMode === "all" ? "All Time" : reportsRangeLabel}
                </div>
                <div style={S.hint}>Approved sales grouped by the hour they came in.</div>
                {reportsApprovedSales.length === 0 ? (
                  <div style={S.emptyState}>
                    <BarChart3 size={22} color={T.borderStrong} />
                    <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>No approved sales in this period yet</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                    {reportsHourlyBuckets.map((b) => {
                      const widthPct = (b.count / reportsHourlyMaxCount) * 100;
                      const isPeak = b.count > 0 && b.count === reportsHourlyMaxCount;
                      return (
                        <div key={b.hour} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 52, fontSize: 12.5, fontWeight: 600, color: T.ink, flexShrink: 0 }}>
                            {formatHourLabel(b.hour)}
                          </div>
                          <div style={{ flex: 1, background: T.paper, borderRadius: 6, overflow: "hidden", height: 26 }}>
                            <div
                              style={{
                                width: `${widthPct}%`,
                                minWidth: b.count > 0 ? 4 : 0,
                                height: "100%",
                                background: isPeak ? T.pineDark : T.borderStrong,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                paddingRight: 8,
                                transition: "width 0.2s",
                              }}
                            >
                              {b.count > 0 && widthPct > 25 && (
                                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#fff" }}>
                                  {b.count} sale{b.count === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ width: 130, textAlign: "right", flexShrink: 0 }}>
                            {b.count > 0 && widthPct <= 25 && (
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: T.textMuted, marginRight: 8 }}>
                                {b.count} sale{b.count === 1 ? "" : "s"}
                              </span>
                            )}
                            <span style={{ fontSize: 12.5, fontFamily: T.mono, color: T.ink }}>{money(b.value)}</span>
                          </div>
                          {isPeak && (
                            <span style={{ ...S.leadBadge, background: "#EAF3EC", color: T.pineDark, flexShrink: 0 }}>Peak</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ ...S.hint, marginTop: 16 }}>
                  Based on each sale's recorded timestamp. If a sale was entered later than when it actually
                  closed, that can shift which hour it counts toward.
                </div>
              </>
            )}
          </div>
        )}

        {section === "information" && (
          <div style={S.dashboardWrap}>
            <div style={S.reportsSubTabs}>
              <button
                onClick={() => setInformationSubTab("notes")}
                style={{ ...S.reportsSubTabBtn, ...(informationSubTab === "notes" ? S.reportsSubTabBtnActive : {}) }}
              >
                Notes
              </button>
              <button
                onClick={() => setInformationSubTab("scripts")}
                style={{ ...S.reportsSubTabBtn, ...(informationSubTab === "scripts" ? S.reportsSubTabBtnActive : {}) }}
              >
                Scripts
              </button>
            </div>

            {informationSubTab === "notes" && (
              <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <div style={S.dashboardSectionLabel}>Information</div>
              <button
                onClick={() => {
                  setInfoNoteError("");
                  setInfoNoteModal({ id: uid(), date: todayDateStr(), title: "", body: "", isNew: true });
                }}
                style={S.primaryBtn}
              >
                <Plus size={14} /> New Note
              </button>
            </div>
            <div style={S.hint}>Anything worth remembering — contacts, passwords, reminders, instructions.</div>

            {infoNotes.length === 0 ? (
              <div style={S.emptyState}>
                <FileText size={22} color={T.borderStrong} />
                <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                  No notes yet — add your first one
                </div>
              </div>
            ) : (
              <div style={S.infoNotesGrid}>
                {[...infoNotes]
                  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                  .map((n) => (
                    <div
                      key={n.id}
                      style={S.infoNoteCard}
                      onClick={() => {
                        setInfoNoteError("");
                        setInfoNoteModal(n);
                      }}
                    >
                      <div style={S.infoNoteHeader}>
                        <div style={S.infoNoteTitle}>{n.title}</div>
                        <div style={S.infoNoteDate}>
                          {n.date
                            ? new Date(n.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : ""}
                        </div>
                      </div>
                      <div style={S.infoNoteBody}>{n.body}</div>
                    </div>
                  ))}
              </div>
            )}
              </>
            )}

            {informationSubTab === "scripts" && (
              <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <div style={S.dashboardSectionLabel}>Scripts</div>
              <label style={{ ...S.primaryBtn, cursor: scriptUploadBusy ? "not-allowed" : "pointer", opacity: scriptUploadBusy ? 0.6 : 1 }}>
                <Upload size={14} /> {scriptUploadBusy ? "Uploading…" : "Upload script"}
                <input
                  type="file"
                  onChange={(e) => uploadScriptFile(e.target.files && e.target.files[0])}
                  disabled={scriptUploadBusy}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            <div style={S.hint}>Keep a copy of your call scripts and talking points here so the whole team can pull them up.</div>
            {scriptFilesError && <div style={{ ...S.hint, color: "#A32D2D" }}>{scriptFilesError}</div>}

            {scriptFilesLoading ? (
              <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 12 }}>Loading…</div>
            ) : scriptFiles.length === 0 ? (
              <div style={S.emptyState}>
                <FileText size={22} color={T.borderStrong} />
                <div style={{ marginTop: 8, fontSize: 13, color: T.textMuted }}>
                  No scripts uploaded yet
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {scriptFiles.map((f) => (
                  <div key={f.id} style={S.scriptFileRow}>
                    <FileText size={16} color={T.pineDark} style={{ flexShrink: 0 }} />
                    <a
                      href={`/api/scripts/files/${f.id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={S.scriptFileLink}
                    >
                      {f.filename}
                    </a>
                    <span style={S.scriptFileMeta}>
                      {f.created_at ? new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </span>
                    <button onClick={() => deleteScriptFile(f.id)} style={S.iconBtnGhost}>
                      <Trash2 size={13} color={T.textMuted} />
                    </button>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        )}

        {infoNoteModal && (
          <Modal onClose={() => setInfoNoteModal(null)}>
            <NoteForm
              initial={infoNoteModal}
              error={infoNoteError}
              onCancel={() => setInfoNoteModal(null)}
              onSave={saveInfoNote}
              onDelete={
                !infoNoteModal.isNew
                  ? async () => {
                      await deleteInfoNote(infoNoteModal.id);
                      setInfoNoteModal(null);
                    }
                  : null
              }
            />
          </Modal>
        )}

        {dncModal && (
          <Modal onClose={() => setDncModal(null)}>
            <DncEntryForm
              initial={dncModal}
              onCancel={() => setDncModal(null)}
              onSave={saveDncEntry}
              onDelete={
                !dncModal.isNew
                  ? async () => {
                      await deleteDncEntry(dncModal.id);
                      setDncModal(null);
                    }
                  : null
              }
            />
          </Modal>
        )}

        {dncBulkOpen && (
          <Modal onClose={() => setDncBulkOpen(false)} narrow>
            <div style={S.modalTitle}>Bulk add DNC entries</div>
            <div style={{ ...S.hint, marginBottom: 10 }}>
              One entry per line — a bare phone number, email, or name works fine on its own, or use "Name, Phone,
              Email" (any of those can be left blank).
            </div>
            <textarea
              value={dncBulkText}
              onChange={(e) => setDncBulkText(e.target.value)}
              style={{ ...S.input, minHeight: 160, resize: "vertical", fontFamily: T.mono, fontSize: 12.5 }}
              placeholder={"555-123-4567\nJane Doe, 555-987-6543\nJohn Smith, 555-111-2222, john@example.com"}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
              <button onClick={() => setDncBulkOpen(false)} style={S.ghostBtn}>
                Cancel
              </button>
              <button
                onClick={() => bulkAddDncEntries(dncBulkText)}
                disabled={!dncBulkText.trim()}
                style={{ ...S.primaryBtn, ...(!dncBulkText.trim() ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
              >
                Add entries
              </button>
            </div>
          </Modal>
        )}

        {mergeBuilderOpen && (
          <Modal onClose={() => setMergeBuilderOpen(false)}>
            <div style={S.modalTitle}>Merge duplicate employees</div>
            <div style={{ ...S.hint, marginBottom: 12 }}>
              Pick the placeholder record ("From") and the real employee it should merge into ("To"). Every sale
              credited to "From" gets reassigned to "To", and the "From" record is removed. This can't be undone.
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={S.fieldLabel}>From (placeholder to remove)</div>
                <div style={{ position: "relative" }}>
                  <select value={mergeBuilderFromId} onChange={(e) => setMergeBuilderFromId(e.target.value)} style={S.select}>
                    <option value="">Choose employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.fieldLabel}>To (real employee to keep)</div>
                <div style={{ position: "relative" }}>
                  <select value={mergeBuilderToId} onChange={(e) => setMergeBuilderToId(e.target.value)} style={S.select}>
                    <option value="">Choose employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                </div>
              </div>
              <button
                onClick={() => {
                  if (!mergeBuilderFromId || !mergeBuilderToId || mergeBuilderFromId === mergeBuilderToId) return;
                  const fromEmp = employees.find((e) => e.id === mergeBuilderFromId);
                  const toEmp = employees.find((e) => e.id === mergeBuilderToId);
                  if (!fromEmp || !toEmp) return;
                  setMergeBuilderPairs((prev) => [
                    ...prev,
                    { fromId: fromEmp.id, toId: toEmp.id, fromName: fromEmp.name, toName: toEmp.name },
                  ]);
                  setMergeBuilderFromId("");
                  setMergeBuilderToId("");
                }}
                disabled={!mergeBuilderFromId || !mergeBuilderToId || mergeBuilderFromId === mergeBuilderToId}
                style={{
                  ...S.ghostBtn,
                  ...(!mergeBuilderFromId || !mergeBuilderToId || mergeBuilderFromId === mergeBuilderToId
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : {}),
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {mergeBuilderPairs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {mergeBuilderPairs.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: T.paper,
                      border: `1px solid ${T.border}`,
                      borderRadius: 7,
                      padding: "8px 10px",
                      fontSize: 12.5,
                    }}
                  >
                    <span>
                      <strong>{p.fromName}</strong> → <strong>{p.toName}</strong>
                    </span>
                    <button
                      onClick={() => setMergeBuilderPairs((prev) => prev.filter((_, i) => i !== idx))}
                      style={S.iconBtnGhost}
                    >
                      <X size={13} color={T.textMuted} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {mergeStatus === "success" && (
              <div style={{ ...S.hint, color: T.pineDark, fontWeight: 600, marginBottom: 10 }}>
                ✓ Merged successfully — closing…
              </div>
            )}
            {mergeStatus && typeof mergeStatus === "object" && (
              <div style={{ ...S.errorText, marginTop: 0, marginBottom: 10 }}>{mergeStatus.error}</div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setMergeBuilderOpen(false)} style={S.ghostBtn} disabled={mergeStatus === "merging"}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  setMergeStatus("merging");
                  try {
                    await mergeEmployees(mergeBuilderPairs);
                    setMergeStatus("success");
                    setTimeout(() => {
                      setMergeBuilderOpen(false);
                      setMergeStatus(null);
                    }, 1200);
                  } catch (err) {
                    console.error("Merge failed:", err);
                    setMergeStatus({ error: "Couldn't merge — " + (err.message || "unknown error") });
                  }
                }}
                disabled={mergeBuilderPairs.length === 0 || mergeStatus === "merging" || mergeStatus === "success"}
                style={{
                  ...S.primaryBtn,
                  ...(mergeBuilderPairs.length === 0 || mergeStatus === "merging" || mergeStatus === "success"
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : {}),
                }}
              >
                {mergeStatus === "merging"
                  ? "Merging…"
                  : mergeStatus === "success"
                  ? "Merged ✓"
                  : `Merge ${mergeBuilderPairs.length || ""} ${mergeBuilderPairs.length === 1 ? "pair" : "pairs"}`}
              </button>
            </div>
          </Modal>
        )}

        {section === "admin" && (
          <div style={S.dashboardWrap}>
            <div style={S.dashboardSectionLabel}>Users & access</div>
            <div style={S.hint}>
              Each person signs in with their own username and password. Admin accounts see every tab. Manager and Rep
              accounts only see Dashboard and Sales — for Rep, Sales is a simple New Sale submission screen with no
              visibility into other deals; for Manager, it's the same restricted screen alongside a full Dashboard.
            </div>

            <div style={{ ...S.chartCard, marginTop: 12, marginBottom: 20 }}>
              <DonutChart
                segments={ROLES.map((r) => ({
                  label: r.label,
                  value: users.filter((u) => u.role === r.id).length,
                  count: users.filter((u) => u.role === r.id).length,
                  color: ROLE_COLORS[r.id] ? ROLE_COLORS[r.id].text : T.textMuted,
                }))}
                centerLabel="Users"
                centerValue={String(users.length)}
              />
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
                      <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14 }}>@{u.username}</td>
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
                  style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }}
                />
              </div>

              <div>
                <div style={S.fieldLabel}>Monster commission %</div>
                <input
                  value={settings.monsterCommissionRate}
                  onChange={(e) => updateSettings({ ...settings, monsterCommissionRate: Number(e.target.value) || 0 })}
                  type="number"
                  style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }}
                />
              </div>
              <div>
                <div style={S.fieldLabel}>PGR commission %</div>
                <input
                  value={settings.pgrCommissionRate}
                  onChange={(e) => updateSettings({ ...settings, pgrCommissionRate: Number(e.target.value) || 0 })}
                  type="number"
                  style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }}
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

              <div style={S.adminListCard}>
                <div style={S.adminListTitle}>Expense categories (Profit & Loss)</div>
                <div style={S.adminChipRow}>
                  {settings.expenseCategories.map((s) => (
                    <span key={s} style={S.adminChip}>
                      {s}
                      <button onClick={() => removeListItem("expenseCategories", s)} style={S.adminChipRemove}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={S.adminAddRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      value={adminNewExpenseCategory}
                      onChange={(e) => setAdminNewExpenseCategory(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addListItem("expenseCategories", adminNewExpenseCategory, setAdminNewExpenseCategory)}
                      placeholder="Add option"
                      style={S.input}
                    />
                  </div>
                  <button onClick={() => addListItem("expenseCategories", adminNewExpenseCategory, setAdminNewExpenseCategory)} style={S.ghostBtn}>
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div style={{ ...S.dashboardSectionLabel, marginTop: 28 }}>Backup & Restore</div>
            <div style={S.hint}>
              Download everything in this CRM — sales, employees, payroll history, attendance, settings, and more — as a
              single file you can save somewhere safe. If anything ever goes wrong, restoring from that file brings
              everything back exactly as it was when you downloaded it.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <button onClick={downloadBackup} style={S.primaryBtn}>
                <Download size={14} /> Download backup
              </button>
              <label style={{ ...S.ghostBtn, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <Upload size={14} /> Restore from backup
                <input type="file" accept=".json" onChange={handleBackupFileSelected} style={{ display: "none" }} />
              </label>
              <label style={{ ...S.ghostBtn, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <Upload size={14} /> Import historical leads
                <input type="file" accept=".json" onChange={handleImportFileSelected} style={{ display: "none" }} />
              </label>
              <button
                onClick={() => {
                  setMergeBuilderPairs([]);
                  setMergeBuilderFromId("");
                  setMergeBuilderToId("");
                  setMergeStatus(null);
                  setMergeBuilderOpen(true);
                }}
                style={S.ghostBtn}
              >
                <Users size={14} /> Merge duplicate employees
              </button>
            </div>
            {backupStatus && typeof backupStatus === "object" && (
              <div style={S.payslipErrorNote}>{backupStatus.error}</div>
            )}
            {backupStatus === "restored" && (
              <div style={S.payslipSentNote}>Done ✓ — reloading…</div>
            )}
          </div>
        )}
      </div>

      {confirmRestoreBackup && (
        <Modal onClose={() => setConfirmRestoreBackup(null)} narrow>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
            Restore this backup?
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
            This replaces everything currently in the CRM — sales, employees, payroll history, attendance, settings, and
            more — with what's in this backup file, dated {confirmRestoreBackup.backedUpAt || "unknown"}. This can't be
            undone. Consider downloading a fresh backup of the current data first if you're not sure.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.ghostBtn} onClick={() => setConfirmRestoreBackup(null)}>
              Cancel
            </button>
            <button style={S.dangerBtn} onClick={() => restoreBackup(confirmRestoreBackup)}>
              Restore backup
            </button>
          </div>
        </Modal>
      )}

      {confirmImportLeads && (
        <Modal onClose={() => setConfirmImportLeads(null)} narrow>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
            Import {confirmImportLeads.sales.length} historical lead{confirmImportLeads.sales.length === 1 ? "" : "s"}?
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
            This adds {confirmImportLeads.sales.length} lead{confirmImportLeads.sales.length === 1 ? "" : "s"} on top of
            what's already in the CRM — nothing existing gets changed or removed.
            {confirmImportLeads.employees && confirmImportLeads.employees.length > 0
              ? ` It'll also create ${confirmImportLeads.employees.length} inactive employee record${confirmImportLeads.employees.length === 1 ? "" : "s"} for names referenced in this data that don't already exist, so those historical sales stay properly attributed.`
              : ""}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.ghostBtn} onClick={() => setConfirmImportLeads(null)}>
              Cancel
            </button>
            <button style={S.primaryBtn} onClick={() => importLeadsData(confirmImportLeads)}>
              Import
            </button>
          </div>
        </Modal>
      )}

      {expenseModal && (
        <Modal onClose={() => setExpenseModal(null)}>
          <ExpenseTransactionForm
            initial={expenseModal}
            categories={settings.expenseCategories.filter((c) => c !== "Payroll")}
            error={expenseModalError}
            onCancel={() => setExpenseModal(null)}
            onSave={saveExpenseTransaction}
            onDelete={
              !expenseModal.isNew
                ? async () => {
                    await deleteExpenseTransaction(expenseModal.id);
                    setExpenseModal(null);
                  }
                : null
            }
          />
        </Modal>
      )}

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

      {saleModal && !saleModalMinimized && (
        <Modal
          onClose={() => {
            setSaleModal(null);
            setSaleModalMinimized(false);
          }}
          disableBackdropClose
          wide
          printable
        >
          <SaleForm
            initial={saleModal}
            employees={employees}
            settings={settings}
            dncList={dncList}
            sales={sales}
            syncingToEpg={saleSyncingToEpg}
            saveError={saleSaveError}
            onCancel={() => {
              setSaleModal(null);
              setSaleModalMinimized(false);
            }}
            onMinimize={() => setSaleModalMinimized(true)}
            onSave={saveSale}
            onDelete={
              saleModal.id
                ? () => setConfirmDelete({ type: "sale", id: saleModal.id, label: saleModal.name })
                : null
            }
          />
        </Modal>
      )}
      {saleModal && saleModalMinimized && (
        <button style={S.minimizedPill} onClick={() => setSaleModalMinimized(false)}>
          <TrendingUp size={14} />
          Resume {saleModal.id ? "editing" : "new"} sale{saleModal.name ? ` — ${saleModal.name}` : ""}
        </button>
      )}
      {employeeDetail && employeeDetailMinimized && (
        <button
          style={{ ...S.minimizedPill, bottom: saleModal && saleModalMinimized ? 74 : 20 }}
          onClick={() => setEmployeeDetailMinimized(false)}
        >
          <Users size={14} />
          Resume weekly template — {employeeDetail.name}
        </button>
      )}

      {employeeModal && (
        <Modal onClose={() => setEmployeeModal(null)}>
          <EmployeeForm
            initial={employeeModal}
            attendance={attendance}
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
                      : setConfirmDeactivateEmployee({ id: employeeModal.id, name: employeeModal.name, date: todayDateStr() })
                : null
            }
          />
        </Modal>
      )}

      {confirmDeactivateEmployee && (
        <Modal onClose={() => setConfirmDeactivateEmployee(null)} narrow>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
            Deactivate {confirmDeactivateEmployee.name}?
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
            Choose the date this actually took effect. They'll still show up correctly on RRG Board and Payroll for
            any week before that date, but won't appear on the week that starts on or after it.
          </div>
          <Field label="Deactivation date">
            <input
              type="date"
              value={confirmDeactivateEmployee.date}
              onChange={(e) => e.target.value && setConfirmDeactivateEmployee((c) => ({ ...c, date: e.target.value }))}
              style={S.input}
            />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button style={S.ghostBtn} onClick={() => setConfirmDeactivateEmployee(null)}>
              Cancel
            </button>
            <button
              style={S.dangerBtn}
              onClick={() => deactivateEmployee(confirmDeactivateEmployee.id, confirmDeactivateEmployee.date)}
            >
              Deactivate
            </button>
          </div>
        </Modal>
      )}

      {candidateModal && (
        <Modal onClose={() => setCandidateModal(null)}>
          <CandidateForm
            initial={candidateModal}
            onCancel={() => setCandidateModal(null)}
            onSave={saveCandidate}
            onDelete={
              !candidateModal.isNew
                ? async () => {
                    await deleteCandidate(candidateModal.id);
                    setCandidateModal(null);
                  }
                : null
            }
            onConvert={
              !candidateModal.isNew
                ? () => convertCandidateToEmployee(candidateModal)
                : null
            }
          />
        </Modal>
      )}

      {employeeDetail && !employeeDetailMinimized && (
        <Modal onClose={() => setEmployeeDetailId(null)} onMinimize={() => setEmployeeDetailMinimized(true)} wide>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={S.modalTitle}>{employeeDetail.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>Weekly template</div>
            </div>
            <div style={S.weekNav}>
              <button onClick={() => setEmployeeDetailWeekOffset((w) => w - 1)} style={S.weekNavBtn} aria-label="Previous week">
                ‹
              </button>
              <button
                onClick={() => setEmployeeDetailWeekOffset(0)}
                style={{ ...S.weekNavLabel, ...(employeeDetailWeekOffset === 0 ? S.weekNavLabelActive : {}) }}
              >
                {employeeDetailWeekLabel}
              </button>
              <button onClick={() => setEmployeeDetailWeekOffset((w) => w + 1)} style={S.weekNavBtn} aria-label="Next week">
                ›
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {employeeDetailRows.map((r) => (
              <div key={r.label} style={S.employeeDetailDayRow}>
                <div style={S.employeeDetailDayLabel}>
                  {r.label}
                  <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 400 }}>
                    {r.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {r.entries.length === 0 ? (
                    <span style={{ color: T.borderStrong, fontSize: 12.5 }}>—</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {r.entries.map((entry, i) => {
                        const t = SALE_TYPES.find((x) => x.id === entry.type);
                        const refunded = isEntryRefunded(entry.sale, entry.type);
                        return (
                          <span
                            key={entry.sale.id + "-" + entry.type + "-" + i}
                            style={{
                              ...S.rrgChip,
                              color: refunded ? "#A32D2D" : t ? t.color : T.textMuted,
                              textDecoration: refunded ? "line-through" : "none",
                            }}
                            onClick={() => setSaleModal({ ...entry.sale })}
                          >
                            {entry.sale.name} {money(entry.amount)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, minWidth: 70, textAlign: "right" }}>
                  {money(r.dayTotal)}
                </div>
              </div>
            ))}
          </div>

          <div style={S.employeeDetailSummary}>
            <div style={S.employeeDetailSummaryRow}>
              <span>Total sales this week</span>
              <span style={{ fontFamily: T.mono }}>{money(employeeDetailTotalSales)}</span>
            </div>
            <div style={S.employeeDetailSummaryRow}>
              <span>Commission ({employeeDetailRate}%)</span>
              <span style={{ fontFamily: T.mono }}>{money(employeeDetailTotalSales * (employeeDetailRate / 100))}</span>
            </div>
            {employeeDetailRefundEntries.map((r) => {
              const entryType = (buildRoleEntries(r.sale, employeeDetail.id)[0] || {}).type;
              const nameColor = (SALE_TYPES.find((t) => t.id === entryType) || {}).color || "#A32D2D";
              return (
                <div key={r.sale.id} style={{ ...S.employeeDetailSummaryRow, color: "#A32D2D" }}>
                  <span>
                    Refund — <span style={{ color: nameColor, fontWeight: 600 }}>{r.sale.name}</span>
                  </span>
                  <span style={{ fontFamily: T.mono }}>-{money(r.credit * (employeeDetailRate / 100))}</span>
                </div>
              );
            })}
            {employeeDetailHasBasePay && (
              <div style={S.employeeDetailSummaryRow}>
                <span>Draw</span>
                <span style={{ fontFamily: T.mono }}>{money(employeeDetailBasePay)}</span>
              </div>
            )}
            {employeeDetailSpiff > 0 && (
              <div style={{ ...S.employeeDetailSummaryRow, color: "#8A5A1E" }}>
                <span>Spiff</span>
                <span style={{ fontFamily: T.mono }}>{money(employeeDetailSpiff)}</span>
              </div>
            )}
            {employeeDetailAbsences > 0 && (
              <div style={{ ...S.employeeDetailSummaryRow, color: "#A32D2D" }}>
                <span>Absences this week</span>
                <span>{employeeDetailAbsences}</span>
              </div>
            )}
            <div style={{ ...S.employeeDetailSummaryRow, fontWeight: 700, borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4 }}>
              <span>Total pay {employeeDetailGuarantee && <span style={S.minGuaranteeBadge}>min guarantee</span>}</span>
              <span style={{ fontFamily: T.mono, color: T.pineDark }}>{money(employeeDetailTotalPay)}</span>
            </div>
          </div>

          {employeeDetail.email && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={sendPayslip}
                disabled={payslipStatus === "sending"}
                style={{ ...S.primaryBtn, ...(payslipStatus === "sending" ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
              >
                <Mail size={14} /> {payslipStatus === "sending" ? "Sending…" : `Email payslip to ${employeeDetail.email}`}
              </button>
              {payslipStatus === "sent" && <div style={S.payslipSentNote}>Sent ✓</div>}
              {payslipStatus && typeof payslipStatus === "object" && (
                <div style={S.payslipErrorNote}>{payslipStatus.error}</div>
              )}
            </div>
          )}
        </Modal>
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} narrow>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
            Delete {confirmDelete.label || "this"}?
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 18 }}>This can't be undone.</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={S.ghostBtn} onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button
              style={S.dangerBtn}
              onClick={() => {
                if (confirmDelete.type === "contact") deleteContact(confirmDelete.id);
                else if (confirmDelete.type === "sale") deleteSale(confirmDelete.id);
                else if (confirmDelete.type === "employee") deleteEmployee(confirmDelete.id);
              }}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {confirmRefund && (
        <Modal onClose={() => setConfirmRefund(null)} narrow>
          <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
            Refund {confirmRefund.name}?
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
            This deducts the involved employees' commission from payroll. Choose full or partial, and which week each
            person's deduction should land on.
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button
              onClick={() => setRefundType("full")}
              style={{ ...S.refundTypeBtn, ...(refundType === "full" ? S.refundTypeActive : {}) }}
            >
              Full refund
            </button>
            <button
              onClick={() => setRefundType("partial")}
              style={{ ...S.refundTypeBtn, ...(refundType === "partial" ? S.refundTypeActive : {}) }}
            >
              Partial refund
            </button>
          </div>

          {REFUND_TARGET_OPTIONS.map((opt) => {
            const empId = employeeIdForRole(confirmRefund, opt.id);
            if (!empId) return null;
            const emp = employeeById[empId];
            const fullAmount = roleCreditAmount(confirmRefund, opt.id);
            return (
              <div key={opt.id} style={S.refundRoleRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>
                    {opt.label} — {emp ? emp.name : "Unassigned"}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>Full credit {money(fullAmount)}</div>
                </div>
                {refundType === "partial" && (
                  <input
                    type="number"
                    value={refundAmounts[opt.id]}
                    onChange={(e) => setRefundAmounts((r) => ({ ...r, [opt.id]: e.target.value }))}
                    placeholder="0"
                    style={{ ...S.input, width: 90, fontFamily: T.mono }}
                  />
                )}
                <div style={{ position: "relative" }}>
                  <select
                    value={refundWeekChoices[opt.id]}
                    onChange={(e) => setRefundWeekChoices((r) => ({ ...r, [opt.id]: e.target.value }))}
                    style={{ ...S.select, width: 130, paddingRight: 26, fontSize: 12 }}
                  >
                    <option value="previous">Previous week</option>
                    <option value="current">This week</option>
                    <option value="next">Next week</option>
                  </select>
                  <ChevronDown size={12} color={T.textMuted} style={S.selectChevron} />
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
            <button style={S.ghostBtn} onClick={() => setConfirmRefund(null)}>
              Cancel
            </button>
            <button
              style={S.dangerBtn}
              onClick={() =>
                markRefunded(confirmRefund.id, { type: refundType, amounts: refundAmounts, weekChoices: refundWeekChoices })
              }
            >
              Confirm refund
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, narrow, wide, disableBackdropClose, printable, onMinimize }) {
  return (
    <div
      style={S.modalBackdrop}
      onClick={disableBackdropClose ? undefined : onClose}
    >
      <div
        id={printable ? "print-area" : undefined}
        style={{ ...S.modalCard, ...(narrow ? { maxWidth: 420 } : {}), ...(wide ? { maxWidth: 760 } : {}) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={S.modalCloseRow} className="no-print">
          {printable && (
            <button onClick={() => window.print()} style={S.modalIconBtn} aria-label="Print">
              <Printer size={15} />
            </button>
          )}
          {onMinimize && (
            <button onClick={onMinimize} style={S.modalIconBtn} aria-label="Minimize">
              <Minus size={15} />
            </button>
          )}
          <button onClick={onClose} style={S.modalIconBtn} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={S.fieldLabel}>
        {label}
        {required && <span style={{ color: "#A32D2D" }}> *</span>}
      </div>
      {children}
    </div>
  );
}

function ExpenseFileButton({ expenseKey }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadFiles() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/expenses/${encodeURIComponent(expenseKey)}/files`, { credentials: "include" });
      if (!res.ok) throw new Error("status " + res.status);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error("Loading expense files failed:", err);
      setError("Couldn't load attachments: " + (err.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/expenses/${encodeURIComponent(expenseKey)}/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "status " + res.status);
      }
      await loadFiles();
    } catch (err) {
      console.error("Expense file upload failed:", err);
      setError("Upload failed: " + (err.message || "unknown error"));
    } finally {
      setUploading(false);
    }
  }

  async function deleteFile(fileId) {
    try {
      await fetch(`/api/expenses/${encodeURIComponent(expenseKey)}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Expense file delete failed:", err);
      setError("Couldn't delete that file");
    }
  }

  function formatFileSize(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ ...S.iconBtnGhost, position: "relative" }}
        title="Receipts / attachments"
      >
        <Paperclip size={11} color={T.textMuted} />
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} narrow>
          <div style={S.modalTitle}>Attachments</div>
          {loading ? (
            <div style={{ fontSize: 12.5, color: T.textMuted }}>Loading…</div>
          ) : files.length === 0 ? (
            <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 14 }}>No files attached yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {files.map((f) => (
                <div key={f.id} style={S.expenseFileRow}>
                  <FileText size={14} color={T.pineDark} style={{ flexShrink: 0 }} />
                  <a
                    href={`/api/expenses/${encodeURIComponent(expenseKey)}/files/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={S.expenseFileLink}
                  >
                    {f.filename}
                  </a>
                  <span style={{ fontSize: 10.5, color: T.textMuted, flexShrink: 0 }}>{formatFileSize(f.size)}</span>
                  <button onClick={() => deleteFile(f.id)} style={S.iconBtnGhost} title="Delete">
                    <Trash2 size={12} color={T.textMuted} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && <div style={S.errorText}>{error}</div>}
          <label style={{ ...S.ghostBtn, display: "inline-flex", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
            <Upload size={13} /> {uploading ? "Uploading…" : "Upload receipt"}
            <input
              type="file"
              onChange={(e) => uploadFile(e.target.files && e.target.files[0])}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </Modal>
      )}
    </>
  );
}

function SaleForm({ initial, employees, settings, dncList, sales, syncingToEpg, saveError, onCancel, onMinimize, onSave, onDelete }) {
  const [form, setForm] = useState({ ...blankSale(), ...initial });
  const [saving, setSaving] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addressDebounce = useRef(null);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    const pkg = Number(form.packagePrice) || 0;
    const flex = Number(form.dateFlex) || 0;
    const total = pkg + flex;
    setForm((f) => ({ ...f, totalPrice: total ? String(total) : "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.packagePrice, form.dateFlex]);

  function fetchAddressSuggestions(query) {
    if (addressDebounce.current) clearTimeout(addressDebounce.current);
    if (!query || query.length < 4) {
      setAddressSuggestions([]);
      return;
    }
    addressDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setAddressSuggestions(data || []);
      } catch (e) {
        setAddressSuggestions([]);
      }
    }, 350);
  }

  function selectAddressSuggestion(sug) {
    const addr = sug.address || {};
    const houseNumber = addr.house_number || "";
    const road = addr.road || "";
    const streetLine = [houseNumber, road].filter(Boolean).join(" ");
    const city = addr.city || addr.town || addr.village || addr.hamlet || "";
    const stateFull = addr.state || "";
    const stateAbbr = US_STATE_ABBREVIATIONS[stateFull] || stateFull;
    const zip = addr.postcode ? addr.postcode.split("-")[0] : "";
    setForm((f) => ({
      ...f,
      address: streetLine || f.address,
      city: city || f.city,
      state: stateAbbr || f.state,
      zip: zip || f.zip,
    }));
    setAddressSuggestions([]);
    setShowSuggestions(false);
  }

  const dncMatch =
    matchingDncEntryHelper(dncList, form.phone) ||
    matchingDncEntryHelper(dncList, form.phone2) ||
    matchingDncEntryHelper(dncList, form.email, true);

  // Surfaces prior sales for this same customer — matched by name OR phone
  // number, across ALL users. `sales` is shared data, not scoped to the
  // person filling out this form.
  const lastSoldNameKey = (form.name || "").trim().toLowerCase();
  const lastSoldPhoneKey = (form.phone || "").replace(/\D/g, "");
  const lastSoldPhone2Key = (form.phone2 || "").replace(/\D/g, "");
  function matchesSameCustomer(s) {
    if (s.id === form.id || s.status !== "Approved") return false;
    const sName = (s.name || "").trim().toLowerCase();
    const sPhone = (s.phone || "").replace(/\D/g, "");
    const sPhone2 = (s.phone2 || "").replace(/\D/g, "");
    if (lastSoldNameKey && sName === lastSoldNameKey) return true;
    if (lastSoldPhoneKey && lastSoldPhoneKey.length >= 7 && (sPhone === lastSoldPhoneKey || sPhone2 === lastSoldPhoneKey)) return true;
    if (lastSoldPhone2Key && lastSoldPhone2Key.length >= 7 && (sPhone === lastSoldPhone2Key || sPhone2 === lastSoldPhone2Key)) return true;
    return false;
  }
  const lastSold =
    lastSoldNameKey || lastSoldPhoneKey || lastSoldPhone2Key
      ? sales.filter(matchesSameCustomer).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))[0] || null
      : null;

  const [blacklistResult, setBlacklistResult] = useState(null); // { data } | { error } | null
  const [blacklistChecking, setBlacklistChecking] = useState(false);
  const [blacklistCheckedPhone, setBlacklistCheckedPhone] = useState("");

  async function checkBlacklist() {
    const cleanPhone = (form.phone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setBlacklistResult({ error: "Enter a valid 10-digit phone number first." });
      return;
    }
    setBlacklistChecking(true);
    setBlacklistResult(null);
    try {
      const res = await fetch("/api/blacklist/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBlacklistResult({ error: data.error || "Litigation risk check failed." });
      } else {
        setBlacklistResult({ data });
        setBlacklistCheckedPhone(cleanPhone);
      }
    } catch (err) {
      setBlacklistResult({ error: "Couldn't reach the server — check your connection and try again." });
    } finally {
      setBlacklistChecking(false);
    }
  }

  function matchingDncEntryHelper(list, value, isEmail) {
    if (!value) return null;
    if (isEmail) {
      const v = value.trim().toLowerCase();
      return list.find((d) => (d.email || "").trim().toLowerCase() === v) || null;
    }
    const normalized = value.replace(/\D/g, "");
    if (!normalized) return null;
    return list.find((d) => (d.phone || "").replace(/\D/g, "") === normalized) || null;
  }

  const missingFields = SALE_REQUIRED_FIELDS.filter((f) => !String(form[f.key] || "").trim());
  const [showValidation, setShowValidation] = useState(false);

  async function handleSave() {
    if (missingFields.length > 0) {
      setShowValidation(true);
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={S.modalTitle}>{form.id ? "Edit sale" : "New sale"}</div>
      {dncMatch && (
        <div style={S.dncWarning}>
          <ShieldAlert size={15} />
          This contact is on the DNC list{dncMatch.notes ? `: ${dncMatch.notes}` : ""}.
        </div>
      )}
      {lastSold && (
        <div style={S.lastSoldNotice}>
          <CheckCircle size={15} />
          Last sold on {formatTimestamp(lastSold.timestamp)}{lastSold.totalPrice ? ` — ${money(lastSold.totalPrice)}` : ""}
        </div>
      )}
      <div style={S.blacklistCheckRow}>
        <button
          type="button"
          onClick={checkBlacklist}
          disabled={blacklistChecking}
          style={{ ...S.ghostBtn, ...(blacklistChecking ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
        >
          <ShieldAlert size={14} /> {blacklistChecking ? "Checking…" : "Check Blacklist"}
        </button>
        {blacklistResult && blacklistResult.data && blacklistCheckedPhone && (
          <span style={{ fontSize: 11.5, color: T.textMuted }}>Checked {blacklistCheckedPhone}</span>
        )}
      </div>
      {blacklistResult && blacklistResult.error && (
        <div style={S.errorText}>Litigation risk check failed: {blacklistResult.error}</div>
      )}
      {blacklistResult && blacklistResult.data && (
        <div style={S.blacklistResultBox}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.02em" }}>
            Blacklist Alliance result
          </div>
          <div style={S.blacklistResultGrid}>
            {Object.entries(blacklistResult.data).map(([key, value]) => (
              <div key={key} style={S.blacklistResultRow}>
                <span style={{ color: T.textMuted }}>{key}</span>
                <span style={{ color: T.ink, fontWeight: 500, textAlign: "right" }}>
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ ...S.hint, marginTop: 8, marginBottom: 0 }}>
            This is Blacklist Alliance's raw screening result — review it yourself before proceeding; a clean-looking
            result here isn't a legal guarantee against TCPA or DNC exposure.
          </div>
        </div>
      )}
      <div style={S.formGrid2}>
        <Field label="Timestamp">
          <input type="datetime-local" value={form.timestamp} onChange={(e) => set("timestamp", e.target.value)} style={S.input} />
        </Field>
        <Field label="Genie #" required>
          <input value={form.genieNumber} onChange={(e) => set("genieNumber", e.target.value)} style={S.input} />
        </Field>
        <Field label="Name" required>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} style={S.input} autoFocus />
        </Field>
        <Field label="Spouse name">
          <input value={form.spouseName} onChange={(e) => set("spouseName", e.target.value)} style={S.input} />
        </Field>
        <Field label="Phone" required>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={S.input} />
        </Field>
        <Field label="Secondary phone">
          <input value={form.phone2} onChange={(e) => set("phone2", e.target.value)} style={S.input} />
        </Field>
        <Field label="Email" required>
          <input value={form.email} onChange={(e) => set("email", e.target.value)} style={S.input} />
        </Field>
        <Field label="Password" required>
          <input value={form.password} onChange={(e) => set("password", e.target.value)} style={S.input} />
        </Field>
        <div style={{ gridColumn: "1 / -1", position: "relative" }}>
          <Field label="Address" required>
            <input
              value={form.address}
              onChange={(e) => {
                set("address", e.target.value);
                fetchAddressSuggestions(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              style={S.input}
              autoComplete="off"
            />
          </Field>
          {showSuggestions && addressSuggestions.length > 0 && (
            <div style={S.addressSuggestions}>
              {addressSuggestions.map((sug, i) => (
                <div key={i} style={S.addressSuggestionItem} onMouseDown={() => selectAddressSuggestion(sug)}>
                  {sug.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <Field label="City" required>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} style={S.input} />
        </Field>
        <Field label="State" required>
          <input value={form.state} onChange={(e) => set("state", e.target.value)} style={S.input} maxLength={2} />
        </Field>
        <Field label="Zip code" required>
          <input value={form.zip} onChange={(e) => set("zip", e.target.value)} style={S.input} />
        </Field>
        <Field label="Package price" required>
          <input type="number" value={form.packagePrice} onChange={(e) => set("packagePrice", e.target.value)} style={{ ...S.input, fontFamily: T.mono }} />
        </Field>
        <Field label="Date flex price" required>
          <input type="number" value={form.dateFlex} onChange={(e) => set("dateFlex", e.target.value)} style={{ ...S.input, fontFamily: T.mono }} />
        </Field>
        <Field label="Total price">
          <input type="number" value={form.totalPrice} readOnly style={{ ...S.input, fontFamily: T.mono, background: T.paper }} />
        </Field>
        <Field label="Source" required>
          <div style={{ position: "relative" }}>
            <select value={form.source} onChange={(e) => set("source", e.target.value)} style={S.select}>
              <option value="">Choose</option>
              {settings.sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
          </div>
        </Field>
        <Field label="Submitted to" required>
          <div style={{ position: "relative" }}>
            <select value={form.leadSubmittedTo} onChange={(e) => set("leadSubmittedTo", e.target.value)} style={S.select}>
              <option value="">Choose</option>
              {settings.leadSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
          </div>
        </Field>
        <Field label="Status" required>
          <div style={{ position: "relative" }}>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} style={S.select}>
              {SALE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
          </div>
        </Field>
        <Field label="Opener" required>
          <div style={{ position: "relative" }}>
            <select value={form.openerId} onChange={(e) => set("openerId", e.target.value)} style={S.select}>
              <option value="">Choose</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
          </div>
        </Field>
        <Field label="Closer" required>
          <div style={{ position: "relative" }}>
            <select value={form.closerId} onChange={(e) => set("closerId", e.target.value)} style={S.select}>
              <option value="">Choose</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
          </div>
        </Field>
        <Field label="Verification" required>
          <div style={{ position: "relative" }}>
            <select value={form.verificationId} onChange={(e) => set("verificationId", e.target.value)} style={S.select}>
              <option value="">Choose</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
          </div>
        </Field>
      </div>
      <Field label="Notes">
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...S.input, minHeight: 70, resize: "vertical" }} />
      </Field>
      {form.leadSubmittedTo === "Monster" && (
        <label style={S.skipEpgLabel}>
          <input type="checkbox" checked={!!form.skipEpgPush} onChange={(e) => set("skipEpgPush", e.target.checked)} style={{ margin: 0 }} />
          Already sent to EPG — don't push again (marks it as synced here without re-sending)
        </label>
      )}
      {showValidation && missingFields.length > 0 && (
        <div style={S.errorText}>
          Missing: {missingFields.map((f) => f.label).join(", ")}
        </div>
      )}
      {saveError && (
        <div style={S.dncWarning}>
          <AlertTriangle size={15} />
          {saveError}
        </div>
      )}
      {syncingToEpg && (
        <div style={{ ...S.hint, color: "#8A5A1E", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          Syncing to EPG…
        </div>
      )}
      <div style={S.modalFooter} className="no-print">
        {onDelete && (
          <button onClick={onDelete} style={S.dangerBtnGhost}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        <div style={{ flex: 1 }} />
        {onMinimize && (
          <button onClick={onMinimize} style={S.ghostBtn} disabled={saving}>
            Minimize
          </button>
        )}
        <button onClick={onCancel} style={S.ghostBtn} disabled={saving}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || syncingToEpg}
          style={{ ...S.primaryBtn, ...(saving || syncingToEpg ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
        >
          {saving || syncingToEpg ? "Saving…" : "Save sale"}
        </button>
      </div>
    </div>
  );
}

function ContactForm({ initial, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", owner: "", notes: "", ...initial });
  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <div>
      <div style={S.modalTitle}>{form.id ? "Edit contact" : "New contact"}</div>
      <Field label="Name" required>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={S.input} autoFocus />
      </Field>
      <Field label="Company">
        <input value={form.company} onChange={(e) => set("company", e.target.value)} style={S.input} />
      </Field>
      <Field label="Email">
        <input value={form.email} onChange={(e) => set("email", e.target.value)} style={S.input} />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={S.input} />
      </Field>
      <Field label="Owner">
        <input value={form.owner} onChange={(e) => set("owner", e.target.value)} style={S.input} />
      </Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...S.input, minHeight: 70 }} />
      </Field>
      <div style={S.modalFooter}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerBtnGhost}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={S.ghostBtn}>
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={!form.name.trim()} style={S.primaryBtn}>
          Save
        </button>
      </div>
    </div>
  );
}

function UserForm({ initial, currentUserId, userCount, onCancel, onSave, serverError }) {
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "rep", ...initial });
  const [localError, setLocalError] = useState("");
  const isSelf = form.id && form.id === currentUserId;
  const isLastAdmin = form.id && form.role === "admin" && userCount <= 1;
  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function handleSave() {
    if (!form.name.trim() || !form.username.trim()) {
      setLocalError("Name and username are required.");
      return;
    }
    if (!form.id && !form.password.trim()) {
      setLocalError("Password is required for a new user.");
      return;
    }
    setLocalError("");
    onSave(form);
  }
  return (
    <div>
      <div style={S.modalTitle}>{form.id ? "Edit user" : "New user"}</div>
      <Field label="Name" required>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={S.input} autoFocus />
      </Field>
      <Field label="Username" required>
        <input value={form.username} onChange={(e) => set("username", e.target.value)} style={S.input} />
      </Field>
      <Field label={form.id ? "New password (leave blank to keep current)" : "Password"} required={!form.id}>
        <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} style={S.input} />
      </Field>
      <Field label="Role">
        <div style={{ position: "relative" }}>
          <select value={form.role} onChange={(e) => set("role", e.target.value)} disabled={isLastAdmin} style={S.select}>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
        </div>
        {isLastAdmin && <div style={S.hint}>This is the last admin account, so its role can't be changed.</div>}
      </Field>
      {(localError || serverError) && <div style={S.errorText}>{localError || serverError}</div>}
      <div style={S.modalFooter}>
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={S.ghostBtn}>
          Cancel
        </button>
        <button onClick={handleSave} style={S.primaryBtn}>
          Save
        </button>
      </div>
    </div>
  );
}

function EmployeeForm({ initial, attendance, onCancel, onSave, onDelete, onToggleActive }) {
  const [form, setForm] = useState({
    name: "",
    role: "rep",
    phone: "",
    email: "",
    commissionRate: "",
    basePay: "",
    startDate: "",
    active: true,
    notes: "",
    ...initial,
  });
  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <div>
      <div style={S.modalTitle}>{form.id ? "Edit employee" : "New employee"}</div>
      <Field label="Name" required>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={S.input} autoFocus />
      </Field>
      <Field label="Role">
        <div style={{ position: "relative" }}>
          <select value={form.role} onChange={(e) => set("role", e.target.value)} style={S.select}>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
        </div>
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={S.input} />
      </Field>
      <Field label="Email">
        <input value={form.email} onChange={(e) => set("email", e.target.value)} style={S.input} />
      </Field>
      <Field label="Commission rate (%)">
        <input type="number" value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value)} style={{ ...S.input, fontFamily: T.mono }} />
      </Field>
      <Field label={basePayLabel(form.name)}>
        <input type="number" value={form.basePay} onChange={(e) => set("basePay", e.target.value)} style={{ ...S.input, fontFamily: T.mono }} />
      </Field>
      <Field label="Start date">
        <input type="date" value={form.startDate || ""} onChange={(e) => set("startDate", e.target.value)} style={S.input} />
      </Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...S.input, minHeight: 60 }} />
      </Field>
      <div style={S.modalFooter}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerBtnGhost}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        {onToggleActive && (
          <button onClick={onToggleActive} style={S.ghostBtn}>
            {form.active === false ? "Reactivate" : "Deactivate"}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={S.ghostBtn}>
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={!form.name.trim()} style={S.primaryBtn}>
          Save
        </button>
      </div>
    </div>
  );
}

function CandidateForm({ initial, onCancel, onSave, onDelete, onConvert }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    interviewDate: "",
    experience: "",
    notes: "",
    position: "",
    leadSource: "",
    status: "pending",
    ...initial,
  });
  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <div>
      <div style={S.modalTitle}>{form.isNew ? "New candidate" : "Edit candidate"}</div>
      <Field label="Name" required>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={S.input} autoFocus />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={S.input} />
      </Field>
      <Field label="Email">
        <input value={form.email} onChange={(e) => set("email", e.target.value)} style={S.input} />
      </Field>
      <Field label="Position">
        <div style={{ position: "relative" }}>
          <select value={form.position} onChange={(e) => set("position", e.target.value)} style={S.select}>
            <option value="">Choose</option>
            <option value="opener">Opener</option>
            <option value="closer">Closer</option>
          </select>
          <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
        </div>
      </Field>
      <Field label="Interview date">
        <input type="date" value={form.interviewDate} onChange={(e) => set("interviewDate", e.target.value)} style={S.input} />
      </Field>
      <Field label="Lead source">
        <input value={form.leadSource} onChange={(e) => set("leadSource", e.target.value)} style={S.input} />
      </Field>
      <Field label="Status">
        <div style={{ position: "relative" }}>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} style={S.select}>
            <option value="pending">Pending</option>
            <option value="hired">Hired</option>
            <option value="noshow">No Show</option>
            <option value="rejected">Rejected</option>
          </select>
          <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
        </div>
      </Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...S.input, minHeight: 70 }} />
      </Field>
      <div style={S.modalFooter}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerBtnGhost}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        {onConvert && (
          <button onClick={onConvert} style={S.ghostBtn}>
            <Users size={14} /> Convert to employee
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={S.ghostBtn}>
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={!form.name.trim()} style={S.primaryBtn}>
          Save
        </button>
      </div>
    </div>
  );
}

function NoteForm({ initial, error, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState({ date: todayDateStr(), title: "", body: "", ...initial });
  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <div>
      <div style={S.modalTitle}>{form.isNew ? "New note" : "Edit note"}</div>
      <Field label="Title" required>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} style={S.input} autoFocus />
      </Field>
      <Field label="Date">
        <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={S.input} />
      </Field>
      <Field label="Notes">
        <textarea value={form.body} onChange={(e) => set("body", e.target.value)} style={{ ...S.input, minHeight: 140, resize: "vertical" }} />
      </Field>
      {error && <div style={S.errorText}>{error}</div>}
      <div style={S.modalFooter}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerBtnGhost}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={S.ghostBtn}>
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={!form.title.trim()} style={S.primaryBtn}>
          Save
        </button>
      </div>
    </div>
  );
}

function DncEntryForm({ initial, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", ...initial });
  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <div>
      <div style={S.modalTitle}>{form.isNew ? "New DNC entry" : "Edit DNC entry"}</div>
      <Field label="Name">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={S.input} autoFocus />
      </Field>
      <Field label="Phone">
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={S.input} />
      </Field>
      <Field label="Email">
        <input value={form.email} onChange={(e) => set("email", e.target.value)} style={S.input} />
      </Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...S.input, minHeight: 60 }} />
      </Field>
      <div style={S.modalFooter}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerBtnGhost}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={S.ghostBtn}>
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!form.name.trim() && !form.phone.trim() && !form.email.trim()}
          style={S.primaryBtn}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ExpenseTransactionForm({ initial, categories, error, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState({ date: todayDateStr(), category: categories[0] || "", amount: "", notes: "", ...initial });
  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <div>
      <div style={S.modalTitle}>{form.isNew ? "New expense" : "Edit expense"}</div>
      <Field label="Date" required>
        <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={S.input} />
      </Field>
      <Field label="Category" required>
        <div style={{ position: "relative" }}>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} style={S.select}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
        </div>
      </Field>
      <Field label="Amount" required>
        <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} style={{ ...S.input, fontFamily: T.mono }} autoFocus />
      </Field>
      <Field label="Notes">
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ ...S.input, minHeight: 60 }} />
      </Field>
      {error && <div style={S.errorText}>{error}</div>}
      <div style={S.modalFooter}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerBtnGhost}>
            <Trash2 size={14} /> Delete
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onCancel} style={S.ghostBtn}>
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={!form.amount || !form.category} style={S.primaryBtn}>
          Save
        </button>
      </div>
    </div>
  );
}

const T = {
  bg: "#F7F5EF",
  paper: "#EDEAE0",
  ink: "#1B1E1A",
  textMuted: "#767468",
  border: "#E6E2D6",
  borderStrong: "#D3CEBD",
  pine: "#2D5F4C",
  pineDark: "#1F4536",
  display: "'Fraunces', serif",
  sans: "'Inter', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const S = {
  app: { display: "flex", minHeight: "100vh", background: T.bg, fontFamily: T.sans, color: T.ink },
  sidebar: {
    width: 220,
    background: "#232620",
    color: "#F7F5EF",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "22px 14px",
    flexShrink: 0,
  },
  brand: { fontFamily: T.display, fontSize: 19, fontWeight: 600, color: "#fff", padding: "0 8px" },
  brandSub: { fontSize: 11, color: "#9C9686", padding: "2px 8px 18px 8px" },
  navList: { display: "flex", flexDirection: "column", gap: 2 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 10px",
    borderRadius: 7,
    border: "none",
    background: "transparent",
    color: "#C9C4B4",
    fontSize: 13,
    fontWeight: 500,
    textAlign: "left",
  },
  navItemActive: { background: "#33362E", color: "#fff" },
  viewerBtnSidebar: { display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", marginTop: 12 },
  avatarSm: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: T.pine,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 600,
    flexShrink: 0,
  },
  logOutLink: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "8px 8px",
    background: "transparent",
    border: "none",
    color: "#9C9686",
    fontSize: 12,
  },
  main: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 28px",
    borderBottom: `1px solid ${T.border}`,
    flexWrap: "wrap",
    gap: 12,
  },
  topbarTitle: { fontFamily: T.display, fontSize: 22, fontWeight: 600, color: T.ink },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#fff",
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: "7px 10px",
    minWidth: 220,
  },
  searchInput: { border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent", color: T.ink },
  iconBtnGhost: { border: "none", background: "transparent", padding: 2, display: "flex" },
  stats: { display: "flex", alignItems: "center", gap: 24, padding: "18px 28px", borderBottom: `1px solid ${T.border}` },
  statItem: {},
  statLabel: { fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 3 },
  statValue: { fontFamily: T.mono, fontSize: 22, fontWeight: 500, color: T.ink },
  statDivider: { width: 1, height: 34, background: T.border },
  dashboardWrap: { padding: "22px 28px 60px 28px", flex: 1, overflow: "auto" },
  dashboardSectionLabel: { fontSize: 13, fontWeight: 600, color: T.ink },
  payDateLabel: { fontSize: 11, color: T.pineDark, fontWeight: 600, marginTop: 3 },
  weekNavRow: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  weekNav: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  weekNavBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: "#fff",
    color: T.ink,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  weekNavLabel: {
    fontSize: 12.5,
    fontWeight: 600,
    color: T.ink,
    background: "transparent",
    border: "none",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  weekNavLabelActive: { color: T.pineDark },
  weekNavThisWeek: { fontSize: 9.5, background: "#EAF3EC", color: T.pineDark, padding: "2px 6px", borderRadius: 20, fontWeight: 700 },
  select: {
    appearance: "none",
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    padding: "6px 10px",
    fontSize: 12.5,
    background: "#fff",
    color: T.ink,
    width: "100%",
  },
  selectChevron: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  customRangeInput: { border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 8px", fontSize: 12, background: "#fff", color: T.ink },
  sourceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  sourceCard: { background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" },
  sourceCount: { fontSize: 11, color: T.textMuted },
  sourceValue: { fontFamily: T.mono, fontSize: 21, fontWeight: 500, color: T.ink, marginTop: 6 },
  reportsCardLabel: { fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" },
  channelBadge: { fontSize: 11, fontWeight: 600, background: "#F0EFE9", color: T.textMuted, padding: "2px 8px", borderRadius: 20 },
  chartCard: { background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "50px 0", textAlign: "center" },
  recentList: { display: "flex", flexDirection: "column", gap: 2, marginTop: 10 },
  recentRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderRadius: 8,
    background: "#fff",
    border: `1px solid ${T.border}`,
    marginBottom: 6,
    cursor: "pointer",
  },
  recentTitle: { fontSize: 13, fontWeight: 500, color: T.ink },
  recentSub: { fontSize: 11.5, color: T.textMuted, marginTop: 2 },
  dealValue: { fontFamily: T.mono, fontSize: 14, fontWeight: 500, color: T.ink },
  entryScreenWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    maxWidth: 420,
    margin: "0 auto",
  },
  entrySuccessIcon: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#EAF3EC",
    color: T.pineDark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 14,
  },
  entrySuccessTitle: { fontFamily: T.display, fontSize: 19, fontWeight: 600, color: T.ink, marginBottom: 6 },
  salesWrap: { padding: "22px 28px 60px 28px", flex: 1, overflow: "auto" },
  contactsWrap: { padding: "22px 28px 60px 28px", flex: 1, overflow: "auto" },
  contactsToolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 },
  contactsCount: { fontSize: 12.5, color: T.textMuted },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: T.pineDark,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 15px",
    fontSize: 13,
    fontWeight: 600,
  },
  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#fff",
    color: T.ink,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: "8px 13px",
    fontSize: 12.5,
    fontWeight: 500,
  },
  dangerBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#A32D2D",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 15px",
    fontSize: 13,
    fontWeight: 600,
  },
  dangerBtnGhost: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    color: "#A32D2D",
    border: `1px solid #F0C9C9`,
    borderRadius: 8,
    padding: "8px 13px",
    fontSize: 12.5,
    fontWeight: 500,
  },
  refundBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    background: "#FBF3E6",
    color: "#8A5A1E",
    border: "1px solid #E3C89A",
    borderRadius: 8,
    padding: "6px 11px",
    fontSize: 11.5,
    fontWeight: 600,
  },
  exportBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#fff",
    color: T.ink,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  contactGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 },
  contactCard: { background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, cursor: "pointer" },
  contactName: { fontSize: 13.5, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  contactOwner: { fontSize: 11, color: T.textMuted, marginTop: 4 },
  contactMeta: { display: "flex", flexDirection: "column", gap: 4, marginTop: 8 },
  contactMetaRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textMuted },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: T.pine,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  employeeStats: { fontSize: 11.5, color: T.textMuted, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` },
  pendingRefundList: { display: "flex", flexDirection: "column", gap: 3, marginTop: 6 },
  pendingRefundNote: { display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#A32D2D", fontWeight: 500 },
  weeklySaleList: { display: "flex", flexDirection: "column", gap: 3, marginTop: 6 },
  weeklySaleRow: { fontSize: 11.5, fontWeight: 500 },
  weeklyTemplateBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    background: "transparent",
    border: "none",
    color: T.pineDark,
    fontSize: 11,
    fontWeight: 600,
    padding: 0,
  },
  exEmployeeNote: { fontSize: 10.5, color: T.textMuted, marginTop: 6, fontStyle: "italic" },
  tableScroll: { overflowX: "auto", borderRadius: 10, border: `1px solid ${T.border}`, background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12.5 },
  th: {
    textAlign: "left",
    padding: "9px 12px",
    fontSize: 10.5,
    fontWeight: 600,
    color: T.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: "nowrap",
  },
  tr: { cursor: "pointer" },
  td: { padding: "9px 12px", borderBottom: `1px solid ${T.border}`, color: T.ink, whiteSpace: "nowrap" },
  rowDeleteBtn: { border: "none", background: "transparent", padding: 4, borderRadius: 6, color: T.textMuted, display: "flex" },
  sourceBadge: { fontSize: 10.5, fontWeight: 600, background: "#F0EFE9", color: T.textMuted, padding: "2px 7px", borderRadius: 20 },
  leadBadge: { fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" },
  leadBadgeMonster: { background: "#F3E9DA", color: "#8A5A1E" },
  leadBadgePGR: { background: "#E1EAF5", color: "#2A5488" },
  epgBadgeSuccess: { fontSize: 9.5, fontWeight: 700, background: "#EAF3EC", color: T.pineDark, padding: "1px 6px", borderRadius: 20 },
  epgBadgeFailed: { fontSize: 9.5, fontWeight: 700, background: "#FCEBEB", color: "#A32D2D", padding: "1px 6px", borderRadius: 20 },
  leadList: { display: "flex", flexDirection: "column", gap: 10 },
  leadCard: { background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 },
  leadCardApproved: { borderColor: "#B9D6BF" },
  leadCardRefunded: { borderColor: "#F0C9C9" },
  leadCardHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  leadName: { fontSize: 15, fontWeight: 600, color: T.ink },
  leadCardActions: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  refundedBadge: { fontSize: 10.5, fontWeight: 700, color: "#A32D2D" },
  leadInfoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 10 },
  leadInfoItem: { display: "flex", flexDirection: "column", gap: 1, minWidth: 0, overflowWrap: "break-word", wordBreak: "break-word" },
  leadInfoLabel: { fontSize: 9.5, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.02em" },
  leadEmployeeRow: { display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 10, borderTop: `1px solid ${T.border}` },
  leadEmployeeItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12 },
  commissionRateBadge: { fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 20 },
  refundImpactNote: { fontSize: 10.5, color: "#A32D2D", fontWeight: 600 },
  leadNotes: { fontSize: 12, color: T.textMuted, marginTop: 8, fontStyle: "italic" },
  duplicateCustomersPanel: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  duplicateCustomerCard: { background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 },
  duplicateCustomerName: { fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 },
  duplicateCustomerCount: { fontSize: 11, color: T.textMuted, fontWeight: 400 },
  duplicateCustomerRows: { display: "flex", flexDirection: "column", gap: 4 },
  duplicateCustomerRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", padding: "3px 0" },
  rrgLegend: { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 6 },
  rrgLegendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.textMuted },
  rrgLegendDot: { width: 8, height: 8, borderRadius: "50%" },
  hint: { fontSize: 11.5, color: T.textMuted, lineHeight: 1.5, marginBottom: 14 },
  rrgChipRow: { display: "flex", flexDirection: "column", gap: 2 },
  rrgChip: { fontSize: 12, fontWeight: 600, cursor: "pointer" },
  reorderCell: { display: "flex", alignItems: "center", gap: 6 },
  reorderBtns: { display: "flex", flexDirection: "column", gap: 1 },
  reorderBtn: { border: "none", background: "transparent", padding: 0, color: T.textMuted, display: "flex" },
  reorderBtnDisabled: { opacity: 0.25, cursor: "not-allowed" },
  attendanceSelect: {
    fontSize: 10.5,
    fontWeight: 600,
    border: "1px solid transparent",
    borderRadius: 5,
    padding: "2px 4px",
    width: "100%",
  },
  spiffInput: { width: "100%", fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 5, padding: "2px 4px" },
  spiffPaidLabel: { display: "flex", alignItems: "center", gap: 3, fontSize: 9.5, color: T.textMuted, marginTop: 2 },
  totalPayCell: { display: "flex", alignItems: "center", gap: 4 },
  totalPayCurrency: { fontSize: 13, fontFamily: T.mono, color: T.textMuted },
  totalPayInput: { width: 66, border: "none", background: "transparent", fontFamily: T.mono, fontSize: 14, fontWeight: 600 },
  totalPayResetBtn: { border: "none", background: "#F0EFE9", borderRadius: 5, padding: 2, color: T.textMuted, display: "flex" },
  minGuaranteeBadge: { fontSize: 9, fontWeight: 600, background: "#FBF3E6", color: "#8A5A1E", padding: "1px 6px", borderRadius: 20 },
  customPayNote: { fontSize: 9.5, color: "#8A5A1E", marginTop: 2 },
  workedSaturdayLabel: { display: "flex", alignItems: "center", gap: 4, fontSize: 9.5, color: T.textMuted, marginTop: 3 },
  reportsSubTabs: { display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${T.border}` },
  reportsSubTabBtn: {
    border: "none",
    background: "transparent",
    padding: "8px 4px",
    marginRight: 18,
    fontSize: 13,
    fontWeight: 600,
    color: T.textMuted,
    borderBottom: "2px solid transparent",
  },
  reportsSubTabBtnActive: { color: T.pineDark, borderBottom: `2px solid ${T.pineDark}` },
  reportsExportRow: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 },
  pnlAutoBadge: { fontSize: 9, fontWeight: 700, background: "#F0EFE9", color: T.textMuted, padding: "1px 6px", borderRadius: 20, marginLeft: 6 },
  pnlTransactionList: { display: "flex", flexDirection: "column", gap: 4 },
  pnlTransactionRow: { display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 },
  tabs: { display: "flex", gap: 6 },
  tab: { border: `1px solid ${T.border}`, background: "#fff", color: T.textMuted, borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 600 },
  tabActive: { background: T.pineDark, color: "#fff", borderColor: T.pineDark },
  infoNotesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginTop: 14 },
  infoNoteCard: { background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, cursor: "pointer" },
  infoNoteHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 },
  infoNoteTitle: { fontSize: 13.5, fontWeight: 600, color: T.ink },
  infoNoteDate: { fontSize: 10.5, color: T.textMuted, flexShrink: 0 },
  infoNoteBody: {
    fontSize: 12,
    color: T.textMuted,
    lineHeight: 1.5,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 4,
    WebkitBoxOrient: "vertical",
  },
  scriptFileRow: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px" },
  expenseFileRow: { display: "flex", alignItems: "center", gap: 8, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px" },
  expenseFileLink: { flex: 1, fontSize: 12, color: T.ink, textDecoration: "none", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  scriptFileLink: { flex: 1, fontSize: 13, color: T.ink, textDecoration: "none", fontWeight: 500 },
  scriptFileMeta: { fontSize: 11, color: T.textMuted },
  adminSettingsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 12 },
  savedNote: { fontSize: 11.5, color: T.pineDark, fontWeight: 600, marginTop: 10 },
  adminListsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 12 },
  adminListCard: { background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 },
  adminListTitle: { fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 10 },
  adminChipRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  adminChip: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, background: "#F0EFE9", color: T.ink, padding: "4px 8px", borderRadius: 20 },
  adminChipRemove: { border: "none", background: "transparent", padding: 0, display: "flex", color: "inherit" },
  adminAddRow: { display: "flex", gap: 6 },
  gateWrap: { width: "100%", maxWidth: 340, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: 30 },
  fieldLabel: { fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.02em" },
  input: { width: "100%", border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: T.ink, background: "#fff" },
  passwordEyeBtn: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: T.textMuted, display: "flex" },
  errorText: { fontSize: 12, color: "#A32D2D", marginBottom: 10, marginTop: -4 },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(27,30,26,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 },
  modalCard: { background: "#fff", borderRadius: 14, padding: 26, width: "100%", maxWidth: 540, maxHeight: "88vh", overflow: "auto", position: "relative" },
  modalCloseRow: { display: "flex", justifyContent: "flex-end", gap: 4, marginBottom: 6 },
  modalIconBtn: { border: "none", background: "transparent", padding: 4, borderRadius: 6, color: T.textMuted, display: "flex" },
  modalTitle: { fontFamily: T.display, fontSize: 19, fontWeight: 600, color: T.ink, marginBottom: 16 },
  modalFooter: { display: "flex", alignItems: "center", gap: 8, marginTop: 18, flexWrap: "wrap" },
  formGrid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" },
  skipEpgLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: T.textMuted,
    marginBottom: 14,
    cursor: "pointer",
  },
  dncWarning: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#FCEBEB",
    color: "#A32D2D",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 12.5,
    fontWeight: 600,
    marginBottom: 14,
  },
  blacklistCheckRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  lastSoldNotice: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#FBF3E6",
    color: "#8A5A1E",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 12.5,
    fontWeight: 600,
    marginBottom: 14,
  },
  blacklistResultBox: { background: T.paper, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, marginBottom: 14 },
  blacklistResultGrid: { display: "flex", flexDirection: "column", gap: 4 },
  blacklistResultRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, fontSize: 12 },
  blacklistFailureBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FBF3E6",
    color: "#8A5A1E",
    borderBottom: "1px solid #E3C89A",
    padding: "10px 24px",
    fontSize: 12.5,
    fontWeight: 500,
  },
  blacklistFailureDismiss: { border: "none", background: "transparent", padding: 4, borderRadius: 6, color: "#8A5A1E", display: "flex", flexShrink: 0 },
  addressSuggestions: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    marginTop: 2,
    zIndex: 10,
    maxHeight: 200,
    overflow: "auto",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },
  addressSuggestionItem: { padding: "8px 12px", fontSize: 12, color: T.ink, cursor: "pointer", borderBottom: `1px solid ${T.border}` },
  minimizedPill: {
    position: "fixed",
    bottom: 20,
    right: 20,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: T.pineDark,
    color: "#fff",
    border: "none",
    borderRadius: 30,
    padding: "10px 16px",
    fontSize: 12.5,
    fontWeight: 600,
    boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
    zIndex: 90,
  },
  employeeDetailDayRow: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}` },
  employeeDetailDayLabel: { width: 70, fontSize: 12, fontWeight: 600, color: T.ink, flexShrink: 0 },
  employeeDetailSummary: { marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.border}` },
  employeeDetailSummaryRow: { display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: T.ink, padding: "4px 0" },
  payslipSentNote: { fontSize: 11.5, color: T.pineDark, fontWeight: 600, marginTop: 6 },
  payslipErrorNote: { fontSize: 11.5, color: "#A32D2D", fontWeight: 600, marginTop: 6 },
  refundTypeBtn: { flex: 1, border: `1px solid ${T.border}`, background: "#fff", color: T.textMuted, borderRadius: 8, padding: "8px 0", fontSize: 12.5, fontWeight: 600 },
  refundTypeActive: { background: T.pineDark, color: "#fff", borderColor: T.pineDark },
  refundRoleRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}` },
};
