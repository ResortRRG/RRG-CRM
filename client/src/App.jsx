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

// Distinct palette for the Dashboard category chart, separate from the
// badge colors used on All Leads/Reports.
const DASHBOARD_CHART_COLORS = {
  Monster: "#1E9E62", // shamrock green
  PGR: "#007FFF", // azure blue
  Declined: "#E07B1A", // orange
  Chargeback: "#E5231B", // red
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

// Which sidebar sections each account role can see and use.
// Only roles listed here are RESTRICTED — any role not listed (including
// unknown/future roles) defaults to full access, so this can never
// accidentally lock an admin or existing user out of everything.
const ROLE_PERMISSIONS = {
  rep: ["sales"],
  manager: ["dashboard", "sales"],
};
function getAllowedSections(role) {
  if (ROLE_PERMISSIONS[role]) return ROLE_PERMISSIONS[role];
  return NAV_ITEMS.map((n) => n.id);
}
// Roles that see the restricted "just submit a sale" screen instead of the full Sales table.
function isSalesEntryRole(role) {
  return role === "rep" || role === "manager";
}

const ATTENDANCE_STATUSES = [
  { id: "late", label: "Late", color: "#B8763E" },
  { id: "left_early", label: "Left early", color: "#8A5A1E" },
  { id: "absent", label: "Absent", color: "#A32D2D" },
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

// Nominatim's address suggestions return full state names ("Florida"); the
// form uses two-letter abbreviations, so this converts between the two.
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

// Like getDayRange, but takes an actual "YYYY-MM-DD" calendar date instead of
// an offset from today — lets someone jump straight to any specific day.
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

// Builds the chip/list entries for a given employee on a given sale. When the
// same person is both Opener and Closer, that's shown as a single combined
// "openclose" entry (their full package-price credit, one color, one line)
// instead of two separate front/close entries with the customer's name twice.
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
  const [contactModal, setContactModal] = useState(null); // null | 'new' | contact object
  const [saleModal, setSaleModal] = useState(null);
  const [saleModalMinimized, setSaleModalMinimized] = useState(false);
  // Wide tables (Sales, RRG Board, Payroll, Reports, Employees, All Leads) all
  // use the .crm-scroll container. Their horizontal scrollbar sits at the very
  // bottom of the table, which for tall tables means scrolling the page down
  // before it's even reachable. This lets a normal mouse-wheel scroll sideways
  // whenever the cursor is anywhere over one of these tables, so people never
  // need to hunt for the scrollbar itself.
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
    if (saleModal) setSaleModalMinimized(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleModal]);
  const [entryJustSaved, setEntryJustSaved] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // {type, id, label}
  const [viewer, setViewer] = useState({ name: "", role: "rep" });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [myItemsOnly, setMyItemsOnly] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [dashboardFilterMode, setDashboardFilterMode] = useState("week"); // 'day' | 'week' | 'month' | 'year' | 'custom' | 'all'
  const [dashboardSelectedDate, setDashboardSelectedDate] = useState(todayDateStr());
  const [dashboardCustomStart, setDashboardCustomStart] = useState(shiftDateStr(todayDateStr(), -7));
  const [dashboardCustomEnd, setDashboardCustomEnd] = useState(todayDateStr());
  const [dashboardMonthOffset, setDashboardMonthOffset] = useState(0);
  const [dashboardYearOffset, setDashboardYearOffset] = useState(0);
  const [rrgWeekOffset, setRrgWeekOffset] = useState(0);
  const [payrollWeekOffset, setPayrollWeekOffset] = useState(0);
  const [reportsSubTab, setReportsSubTab] = useState("snapshot"); // 'snapshot' | 'pnl'
  const [pnlMode, setPnlMode] = useState("month"); // 'month' | 'week'
  const [pnlMonthOffset, setPnlMonthOffset] = useState(0);
  const [pnlWeekOffset, setPnlWeekOffset] = useState(0);
  const [pnlCustomStart, setPnlCustomStart] = useState(shiftDateStr(todayDateStr(), -7));
  const [pnlCustomEnd, setPnlCustomEnd] = useState(todayDateStr());
  const [expenses, setExpenses] = useState({}); // { "YYYY-MM": { CategoryName: amount } } — legacy single-number entry
  const [expenseTransactions, setExpenseTransactions] = useState([]); // [{ id, date, category, amount, notes }] — itemized entries
  const [infoNotes, setInfoNotes] = useState([]); // [{ id, date, title, body }] — free-form notes
  const [dncList, setDncList] = useState([]); // [{ id, name, phone, email, notes, addedAt }]
  const [dncModal, setDncModal] = useState(null); // null | entry object
  const [dncBulkOpen, setDncBulkOpen] = useState(false);
  const [dncBulkText, setDncBulkText] = useState("");
  const [infoNoteModal, setInfoNoteModal] = useState(null); // null | note object
  const [infoNoteError, setInfoNoteError] = useState("");
  const [expenseModal, setExpenseModal] = useState(null); // null | transaction object (always has an id, even before first save)
  const [expenseModalError, setExpenseModalError] = useState("");
  const [confirmClearMonthExpenses, setConfirmClearMonthExpenses] = useState(null); // month key pending confirmation, or null
  const [reportsFilterMode, setReportsFilterMode] = useState("month"); // 'day' | 'week' | 'month' | 'year' | 'custom' | 'all'
  const [reportsSelectedDate, setReportsSelectedDate] = useState(todayDateStr());
  const [reportsCustomStart, setReportsCustomStart] = useState(shiftDateStr(todayDateStr(), -7));
  const [reportsCustomEnd, setReportsCustomEnd] = useState(todayDateStr());
  const [reportsWeekOffset, setReportsWeekOffset] = useState(0);
  const [reportsMonthOffset, setReportsMonthOffset] = useState(0);
  const [reportsYearOffset, setReportsYearOffset] = useState(0);
  const [employeeDetailId, setEmployeeDetailId] = useState(null);
  const [employeeDetailMinimized, setEmployeeDetailMinimized] = useState(false);
  const [payslipStatus, setPayslipStatus] = useState(null); // null | 'sending' | 'sent' | { error }
  const [backupStatus, setBackupStatus] = useState(null); // null | 'restored' | { error }
  const [confirmRestoreBackup, setConfirmRestoreBackup] = useState(null); // parsed backup object pending confirmation, or null
  const [confirmImportLeads, setConfirmImportLeads] = useState(null); // parsed import object pending confirmation, or null
  const [mergeBuilderOpen, setMergeBuilderOpen] = useState(false);
  const [mergeBuilderPairs, setMergeBuilderPairs] = useState([]); // [{ fromId, toId, fromName, toName }]
  const [mergeBuilderFromId, setMergeBuilderFromId] = useState("");
  const [mergeBuilderToId, setMergeBuilderToId] = useState("");
  const [confirmDeactivateEmployee, setConfirmDeactivateEmployee] = useState(null); // { id, name, date } | null
  useEffect(() => {
    if (employeeDetailId) {
      setEmployeeDetailMinimized(false);
      setPayslipStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeDetailId]);
  const [employeesView, setEmployeesView] = useState("active"); // 'active' | 'exemployees'
  const [employeeDetailWeekOffset, setEmployeeDetailWeekOffset] = useState(0);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsSubTab, setLeadsSubTab] = useState("leads"); // 'leads' | 'dnc'
  const [showDuplicateCustomers, setShowDuplicateCustomers] = useState(false);
  const [leadsFilterMode, setLeadsFilterMode] = useState("all"); // 'day' | 'week' | 'month' | 'year' | 'all'
  const [leadsSelectedDate, setLeadsSelectedDate] = useState(todayDateStr());
  const [leadsCategoryFilter, setLeadsCategoryFilter] = useState(""); // '' | 'Monster' | 'PGR' | 'Chargeback' | 'Declined'
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
  const [confirmRefund, setConfirmRefund] = useState(null); // full sale object being refunded, or null
  const [refundType, setRefundType] = useState("full");
  const [refundWeekChoices, setRefundWeekChoices] = useState({ front: "next", close: "next", verification: "next" });
  const [refundAmounts, setRefundAmounts] = useState({ front: "", close: "", verification: "" });
  const saveTimer = useRef(null);

  useEffect(() => {
    if (confirmRefund) {
      setRefundType("full");
      setRefundAmounts({ front: "", close: "", verification: "" });
      setRefundWeekChoices({ front: "next", close: "next", verification: "next" });
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
      const rdo = await window.storage.get("crm:refundDeductionOverrides", true);
      setRefundDeductionOverrides(rdo && rdo.value ? JSON.parse(rdo.value) : {});
    } catch (e) {
      setRefundDeductionOverrides({});
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
  const ABSENCE_GUARANTEE_DEDUCTION = 40;
  function absentDaysInWeek(employeeId, weekStart) {
    let count = 0;
    for (let i = 0; i < 6; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      if (getAttendance(employeeId, date) === "absent") count++;
    }
    return count;
  }
  function effectiveMinGuarantee(employeeId, weekStart) {
    const absences = absentDaysInWeek(employeeId, weekStart);
    return Math.max(0, settings.minWeeklyPay - absences * ABSENCE_GUARANTEE_DEDUCTION);
  }

  function spiffKey(employeeId, date) {
    return employeeId + "__" + date.toISOString().slice(0, 10);
  }
  // Spiffs used to be stored as a plain number per employee/day. Now they can
  // also carry a "paid" flag (paid same-day in cash, so it shouldn't also
  // land on their check) — getSpiffEntry reads either shape transparently.
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
    if (existing.amount === "" || Number(existing.amount) === 0) return; // nothing to mark paid without an amount
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
  // Splits a week's spiffs into paid (already handed over, won't hit the
  // check) vs unpaid (still owed, will be added to the check) — used so
  // Payroll can show both, color-coded, instead of just one combined number.
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

  // Same formula as Payroll's "Total owed this week" footer, but callable for
  // any arbitrary week — used to auto-total payroll cost into Profit & Loss.
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
      const basePay = hasBasePay ? Number(emp.basePay) || 0 : 0;
      const spiffTotal = spiffTotalInWeek(emp.id, weekStart);
      const guaranteedBase = Math.max(commission + basePay, effectiveMinGuarantee(emp.id, weekStart));
      return sum + guaranteedBase + spiffTotal;
    }, 0);
  }
  // Sums payroll across every Mon–Sat week whose Monday falls within the
  // given date range — used for the P&L's monthly payroll total, so each
  // week is only counted once even if it straddles two calendar months.
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
  // Sales don't count toward source totals or dashboard visibility until they're
  // marked Approved — a pending or declined sale shows as $0 here regardless of
  // which source it's tagged with, until someone approves it.
  const dashboardApprovedSales = dashboardSales.filter((s) => s.status === "Approved");
  const totalSalesValue = dashboardApprovedSales.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0);
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
  // Uses the refund's own date (not the original sale's date) so this always
  // matches Reports' "Refunds" figure — a refund belongs to whichever period
  // it actually happened in, same as any other transaction.
  const chargebackSales = dashboardRange
    ? sales.filter((s) => s.refunded && dateInRange(s.refundedAt, dashboardRange.start, dashboardRange.end))
    : sales.filter((s) => s.refunded);
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
      value: chargebackSales.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0),
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
  // For week-specific views (RRG Board, Payroll) — an employee should show
  // up for a given week if they'd already started by then, AND either
  // they're still active or weren't let go until after that week. This lets
  // a former employee's history stay intact on old weeks while keeping them
  // off brand-new weeks, and keeps a brand-new hire off weeks before they started.
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
      return false; // deactivated with no recorded date — legacy data, hide as before
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
  // Same rule as Dashboard/RRG Board/Payroll: a sale doesn't count toward any
  // of these totals until it's marked Approved.
  const reportsApprovedSales = reportsSales.filter((s) => s.status === "Approved");

  const reportsTotalSalesValue = reportsApprovedSales.reduce((s, r) => s + (Number(r.totalPrice) || 0), 0);
  const reportsAverageSalePrice = reportsApprovedSales.length > 0 ? reportsTotalSalesValue / reportsApprovedSales.length : 0;
  const reportsTotalPackagePrice = reportsApprovedSales.reduce((s, r) => s + (Number(r.packagePrice) || 0), 0);
  const reportsTotalDateFlex = reportsApprovedSales.reduce((s, r) => s + (Number(r.dateFlex) || 0), 0);
  const reportsTotalRefunded = reportsRefundedSales.reduce((s, r) => s + (Number(r.refundAmount) || 0), 0);
  const reportsSourceBreakdown = settings.leadSources.map((src) => {
    const rows = reportsApprovedSales.filter((s) => s.leadSubmittedTo === src);
    return { source: src, count: rows.length, total: rows.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0) };
  });
  // Dialer vs Paper — a different axis than Monster/PGR (which lead vendor a
  // sale went to). This is about how the sale itself was worked.
  const reportsChannelBreakdown = settings.sources.map((src) => {
    const rows = reportsApprovedSales.filter((s) => s.source === src);
    return { source: src, count: rows.length, total: rows.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0) };
  });
  const reportsDeclined = reportsSales.filter((s) => s.status === "Declined");
  const reportsMonsterTotal = (reportsSourceBreakdown.find((r) => r.source === "Monster") || {}).total || 0;
  const reportsPgrTotal = (reportsSourceBreakdown.find((r) => r.source === "PGR") || {}).total || 0;
  const reportsMonsterCommission = reportsMonsterTotal * ((Number(settings.monsterCommissionRate) || 0) / 100);
  const reportsPgrCommission = reportsPgrTotal * ((Number(settings.pgrCommissionRate) || 0) / 100);

  // ---- Profit & Loss ----
  const pnlMonth = getMonthRange(pnlMonthOffset);
  const pnlWeek = getWeekRange(pnlWeekOffset);
  const pnlPeriodStart =
    pnlMode === "week"
      ? pnlWeek.start
      : pnlMode === "month"
      ? pnlMonth.start
      : pnlMode === "custom"
      ? new Date(pnlCustomStart + "T00:00:00")
      : new Date(2000, 0, 1); // "all"
  const pnlPeriodEnd =
    pnlMode === "week"
      ? pnlWeek.end
      : pnlMode === "month"
      ? pnlMonth.end
      : pnlMode === "custom"
      ? new Date(pnlCustomEnd + "T23:59:59")
      : new Date(2100, 0, 1); // "all"
  const pnlPeriodLabel =
    pnlMode === "week"
      ? formatWeekLabel(pnlWeek.start, pnlWeek.end)
      : pnlMode === "month"
      ? formatMonthLabel(pnlMonth.start)
      : pnlMode === "custom"
      ? formatWeekLabel(pnlPeriodStart, pnlPeriodEnd)
      : "All time";
  const pnlIsMultiMonth = pnlMode === "all" || pnlMode === "custom";
  // Expenses are always entered per calendar month (the source of truth).
  // In weekly view, that same monthly figure is prorated down to a per-week
  // share instead of asking anyone to re-enter numbers weekly.
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
  // Sales not tagged Monster or PGR (e.g. Dialer/Paper self-sourced leads)
  // don't have a vendor commission split, so they count at full value.
  const pnlOtherRevenue = pnlPeriodSales
    .filter((s) => s.leadSubmittedTo !== "Monster" && s.leadSubmittedTo !== "PGR")
    .reduce((sum, s) => sum + (Number(s.totalPrice) || 0), 0);
  // Refunds count toward whichever period the refund itself happened in
  // (not the original sale date) — same rule as Dashboard and Reports, so
  // all three always agree with each other.
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
      // Custom range / All time can span many months — sum every logged
      // transaction whose own date falls in the window directly, plus any
      // legacy manually-typed month totals whose month overlaps the window.
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
    // Individually-logged expenses (via "New Expense") for this single
    // month, grouped by category — these add on top of whatever's typed
    // directly into the amount field, so both ways combine cleanly.
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
    const { isNew, ...cleanForm } = form; // strip the isNew marker, it's only for the form's own bookkeeping
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
  // Accepts one entry per line, either a bare phone number or
  // "Name, Phone, Email" (email optional) — flexible for pasting in
  // whatever format an existing DNC list happens to already be in.
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
          // Guess what a bare single value is: an email has "@", a phone is
          // mostly digits, otherwise treat it as a name.
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
  // Normalizes a phone number to just digits, so formatting differences
  // ("555-123-4567" vs "(555) 123-4567") don't cause false negatives.
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

  // Which payroll week a specific role's (Opener/Closer/Verification) refund
  // deduction should land in — each role on the same refund can have its own
  // choice, since different employees involved may want different timing.
  function refundTargetWeekStart(sale, roleId) {
    if (!sale.refundedAt) return null;
    const choice =
      (sale.refundWeekChoices && sale.refundWeekChoices[roleId]) || sale.refundWeekChoice || "next";
    // A choice that isn't one of the three fixed options is a specific
    // "YYYY-MM-DD" date someone picked — use the Mon–Sat week containing it.
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

  // Same matching as refundedCreditForEmployee, but broken out per sale (with
  // the customer name) instead of summed into one total — so the Employees
  // tab can list exactly which leads are behind a pending refund.
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
  const employeeDetailRefundDeduction = employeeDetailRefundedCredit * (employeeDetailRate / 100);
  const employeeDetailRefundEntries = employeeDetail
    ? pendingRefundEntriesForEmployee(employeeDetail.id, employeeDetailWeek.start)
    : [];
  const employeeDetailCommission = employeeDetailTotalSales * (employeeDetailRate / 100) - employeeDetailRefundDeduction;
  const employeeDetailHasBasePay =
    employeeDetail && employeeDetail.basePay !== "" && employeeDetail.basePay !== undefined && employeeDetail.basePay !== null;
  const employeeDetailBasePay = employeeDetailHasBasePay ? Number(employeeDetail.basePay) || 0 : 0;
  const employeeDetailSpiff = employeeDetail ? spiffTotalInWeek(employeeDetail.id, employeeDetailWeek.start) : 0;
  const employeeDetailRawBasePay = employeeDetailCommission + employeeDetailBasePay;
  const employeeDetailMinGuarantee = employeeDetail
    ? effectiveMinGuarantee(employeeDetail.id, employeeDetailWeek.start)
    : settings.minWeeklyPay;
  const employeeDetailGuaranteedBase = Math.max(employeeDetailRawBasePay, employeeDetailMinGuarantee);
  const employeeDetailTotalPay = employeeDetailGuaranteedBase + employeeDetailSpiff;
  const employeeDetailGuarantee = employeeDetailRawBasePay < employeeDetailMinGuarantee;
  const employeeDetailAbsences = employeeDetail ? absentDaysInWeek(employeeDetail.id, employeeDetailWeek.start) : 0;

  // ---- actions ----
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
    e.target.value = ""; // allow selecting the same file again later
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

  // Adds historical records ON TOP of what's already here — existing sales
  // and employees are untouched. Any employee referenced by name that
  // doesn't already exist gets created (inactive, so they don't show up as
  // current team members, but their sales history stays attributed to them).
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

  // Merges historical placeholder employees (e.g. "Cotey", created during a
  // leads import) into their real, full-name employee record. Every sale
  // crediting the placeholder gets reassigned to the real employee, and the
  // placeholder record is removed. Matching is by exact name (case-insensitive)
  // on both sides — if either isn't found, that specific pair is skipped and
  // reported, so nothing gets silently mismatched.
  async function mergeEmployees(mergePairs) {
    try {
      const notFound = [];
      let nextEmployees = [...employees];
      const idRedirect = {}; // placeholder employee id -> real employee id
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
        if (fromEmp.id === toEmp.id) return; // already the same record
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
      setEmployees(nextEmployees);
      setSales(nextSales);
      await window.storage.set("crm:sales", JSON.stringify(nextSales), true);
      await window.storage.set("crm:employees", JSON.stringify(nextEmployees), true);
      setConfirmMergeEmployees(null);
      if (notFound.length > 0) {
        setBackupStatus({ error: "Some merges couldn't be matched and were skipped: " + notFound.join(", ") });
      } else {
        setBackupStatus("restored");
      }
      setTimeout(() => window.location.reload(), notFound.length > 0 ? 4000 : 500);
    } catch (err) {
      console.error("Merge failed:", err);
      setConfirmMergeEmployees(null);
      setBackupStatus({ error: "Merge failed: " + (err.message || "unknown error") + " — nothing was changed." });
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
  function saveSale(form) {
    let savedSale;
    let wasAlreadyApproved = false;
    if (form.id) {
      const existing = sales.find((s) => s.id === form.id);
      wasAlreadyApproved = !!(existing && existing.status === "Approved");
      savedSale = { ...existing, ...form };
      updateSales(sales.map((s) => (s.id === form.id ? savedSale : s)));
    } else {
      savedSale = { ...form, id: uid(), createdAt: Date.now() };
      updateSales([...sales, savedSale]);
      setEntryJustSaved(true);
    }
    setSaleModal(null);
    setSaleModalMinimized(false);

    // Push newly-Approved Monster deals to EPG in the background — this
    // never blocks the save or the UI, and failures get recorded on the
    // sale itself (see pushSaleToEpg) instead of silently vanishing.
    const justBecameApproved = savedSale.status === "Approved" && !wasAlreadyApproved;
    if (justBecameApproved && savedSale.leadSubmittedTo === "Monster") {
      pushSaleToEpg(savedSale);
    }
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
      setSales((prev) => {
        const next = prev.map((s) => (s.id === sale.id ? { ...s, ...patch } : s));
        window.storage.set("crm:sales", JSON.stringify(next), true).catch((e) => console.error("EPG status save failed", e));
        return next;
      });
    } catch (err) {
      console.error("EPG push failed:", err);
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

  // "Today" on the Dashboard is Admin-only — if a Manager account somehow
  // ends up with it selected (e.g. a role change mid-session), fall back to
  // This week instead of silently showing them a filter they shouldn't have.
  useEffect(() => {
    if (dashboardFilterMode === "day" && !(currentUser && currentUser.role === "admin")) {
      setDashboardFilterMode("week");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardFilterMode, currentUser && currentUser.role]);

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

      {/* Main */}
      <div style={S.main}>
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
                    {currentUser && currentUser.role === "admin" && <option value="day">Today</option>}
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
                  {money(chargebackSales.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0))}
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
                centerValue={money(dashboardChartSegments.reduce((s, seg) => s + seg.value, 0))}
              />
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

        {section === "leads" && (
          <div style={S.contactsWrap}>
            <div style={S.reportsSubTabs}>
              <button
                onClick={() => setLeadsSubTab("leads")}
                style={{ ...S.reportsSubTabBtn, ...(leadsSubTab === "leads" ? S.reportsSubTabBtnActive : {}) }}
              >
                Leads
              </button>
              <button
                onClick={() => setLeadsSubTab("dnc")}
                style={{ ...S.reportsSubTabBtn, ...(leadsSubTab === "dnc" ? S.reportsSubTabBtnActive : {}) }}
              >
                DNC List{dncList.length > 0 ? ` (${dncList.length})` : ""}
              </button>
            </div>
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

              // Group ALL sales (not just the filtered/visible ones) by
              // customer name to find repeat customers — someone who bought
              // more than once shouldn't look like an unrelated duplicate.
              const nameGroups = {};
              sales.forEach((s) => {
                const key = (s.name || "").trim().toLowerCase();
                if (!key) return;
                if (!nameGroups[key]) nameGroups[key] = [];
                nameGroups[key].push(s);
              });
              const duplicateCustomerGroups = Object.values(nameGroups)
                .filter((group) => group.length > 1)
                .map((group) => [...group].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)));

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
                      {duplicateCustomerGroups.length > 0 && (
                        <button
                          onClick={() => setShowDuplicateCustomers((v) => !v)}
                          style={{ ...S.ghostBtn, ...(showDuplicateCustomers ? S.refundTypeActive : {}) }}
                          title="Customers with more than one sale on file"
                        >
                          <Users size={14} /> Repeat customers ({duplicateCustomerGroups.length})
                        </button>
                      )}
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

                  {showDuplicateCustomers && duplicateCustomerGroups.length > 0 && (
                    <div style={S.duplicateCustomersPanel}>
                      {duplicateCustomerGroups.map((group, gi) => (
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
                          {empSales.length} sale{empSales.length === 1 ? "" : "s"} all-time · {money(empAllTimeTotal)}
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
                      {WEEKDAY_LABELS.map((d) => (
                        <th key={d} style={{ ...S.th, fontSize: 16 }}>
                          {d}
                        </th>
                      ))}
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
                      <th style={{ ...S.th, fontSize: 12 }}>Base pay</th>
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
                      const basePay = hasBasePay ? Number(emp.basePay) || 0 : 0;
                      const spiffTotal = spiffTotalInWeek(emp.id, payrollWeek.start);
                      const spiffPaidUnpaid = spiffPaidAndUnpaidInWeek(emp.id, payrollWeek.start);
                      const rawBasePay = commissionOwed + basePay;
                      const empMinGuarantee = effectiveMinGuarantee(emp.id, payrollWeek.start);
                      const guaranteedBase = Math.max(rawBasePay, empMinGuarantee);
                      const computedTotalPay = guaranteedBase + spiffTotal;
                      const guaranteeApplied = rawBasePay < empMinGuarantee;
                      const empAbsences = absentDaysInWeek(emp.id, payrollWeek.start);
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
                            const basePay = hasBasePay ? Number(emp.basePay) || 0 : 0;
                            const spiffTotal = spiffTotalInWeek(emp.id, payrollWeek.start);
                            const guaranteedBase = Math.max(commission + basePay, effectiveMinGuarantee(emp.id, payrollWeek.start));
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
            </div>

            {reportsSubTab === "snapshot" && (
              <>
            <div style={S.weekNavRow}>
              <div style={S.dashboardSectionLabel}>Business snapshot</div>
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
                      setExpenseModal({
                        id: uid(),
                        date: todayDateStr(),
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
          </div>
        )}

        {section === "information" && (
          <div style={S.dashboardWrap}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
          </div>
        )}

        {/* Add/edit information note */}
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

        {/* Add/edit DNC entry */}
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

        {/* Bulk add DNC entries */}
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

      {/* Confirm restore backup */}
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

      {/* Confirm import leads */}
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

      {/* Merge employees builder */}

      {/* Add/edit expense transaction */}
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
      {saleModal && !saleModalMinimized && (
        <Modal
          onClose={() => {
            setSaleModal(null);
            setSaleModalMinimized(false);
          }}
          disableBackdropClose
        >
          <SaleForm
            initial={saleModal}
            employees={employees}
            settings={settings}
            dncList={dncList}
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

      {/* Employee modal */}
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

      {/* Confirm deactivate employee with a chosen date */}
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

      {/* Employee weekly template modal */}
      {employeeDetail && !employeeDetailMinimized && (
        <Modal
          onClose={() => {
            setEmployeeDetailId(null);
            setEmployeeDetailMinimized(false);
          }}
          fullScreen
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={S.avatar}>{initials(employeeDetail.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.modalTitle}>{employeeDetail.name}</div>
              </div>
              <RoleBadge role={employeeDetail.role} size="sm" />
              {payslipStatus === "sent" && <span style={S.payslipSentNote}>Sent ✓</span>}
              {payslipStatus && typeof payslipStatus === "object" && (
                <span style={S.payslipErrorNote}>{payslipStatus.error}</span>
              )}
              <button
                type="button"
                onClick={sendPayslip}
                disabled={!employeeDetail.email || payslipStatus === "sending"}
                style={{
                  ...S.minimizeBtn,
                  ...(!employeeDetail.email ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                }}
                title={employeeDetail.email ? `Email payslip to ${employeeDetail.email}` : "No email on file for this employee"}
              >
                <Mail size={14} /> {payslipStatus === "sending" ? "Sending…" : "Send Payslip"}
              </button>
              <button
                type="button"
                onClick={() => setEmployeeDetailMinimized(true)}
                style={S.minimizeBtn}
                title="Minimize — come back to this later"
              >
                <Minus size={14} /> Minimize
              </button>
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
                        <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14, fontWeight: 500 }}>
                          {row.dayTotal ? money(row.dayTotal) : ""}
                        </td>
                        <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14 }}>
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
                    <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>{money(employeeDetailTotalSales)}</td>
                    <td style={{ ...S.td, fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>{money(employeeDetailCommission)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={S.detailSummary}>
              <div style={S.detailSummaryRow}>
                <span>Commission ({employeeDetailRate}%)</span>
                <span style={{ fontFamily: T.mono, fontSize: 14 }}>{money(employeeDetailTotalSales * (employeeDetailRate / 100))}</span>
              </div>
              {employeeDetailRefundEntries.length > 0 && (
                <>
                  {employeeDetailRefundEntries.map(({ sale, credit }) => {
                    const entryType = (buildRoleEntries(sale, employeeDetail.id)[0] || {}).type;
                    const nameColor = (SALE_TYPES.find((t) => t.id === entryType) || {}).color || "#A32D2D";
                    return (
                      <div key={sale.id} style={{ ...S.detailSummaryRow, color: "#A32D2D" }}>
                        <span>
                          Refund — <span style={{ color: nameColor, fontWeight: 600 }}>{sale.name}</span>
                        </span>
                        <span style={{ fontFamily: T.mono, fontSize: 14 }}>
                          -{money(credit * (employeeDetailRate / 100))}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
              <div style={S.detailSummaryRow}>
                <span>Base pay</span>
                <span style={{ fontFamily: T.mono, fontSize: 14 }}>{employeeDetailHasBasePay ? money(employeeDetailBasePay) : "—"}</span>
              </div>
              {employeeDetailSpiff > 0 && (
                <div style={{ ...S.detailSummaryRow, color: "#8A5A1E" }}>
                  <span>Spiff</span>
                  <span style={{ fontFamily: T.mono, fontSize: 14 }}>{money(employeeDetailSpiff)}</span>
                </div>
              )}
              <div style={{ ...S.detailSummaryRow, ...S.detailSummaryTotal }}>
                <span>
                  Total pay{" "}
                  {employeeDetailGuarantee && (
                    <span style={S.minGuaranteeBadge}>
                      min guarantee{employeeDetailAbsences > 0 ? ` (−${employeeDetailAbsences}d)` : ""}
                    </span>
                  )}
                </span>
                <span style={{ fontFamily: T.mono, fontSize: 14 }}>{money(employeeDetailTotalPay)}</span>
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
        <Modal onClose={() => setConfirmRefund(null)}>
          <div style={{ padding: 4 }}>
            <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
              Refund "{confirmRefund.name}"
            </div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              A full refund deducts the whole credited commission from everyone on the lead. A partial refund lets you
              enter a specific amount to deduct from each person separately. Each person can have their deduction land
              in a different payroll week — handy when one person wants it out right away and another wants it spread
              out or delayed.
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

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {REFUND_TARGET_OPTIONS.map((opt) => {
                const empId = employeeIdForRole(confirmRefund, opt.id);
                const emp = empId ? employeeById[empId] : null;
                const choice = refundWeekChoices[opt.id];
                const isCustom = !["previous", "current", "next"].includes(choice);
                return (
                  <div key={opt.id} style={S.refundRoleBlock}>
                    <div style={S.refundRoleBlockLabel}>{emp ? `${opt.label} — ${emp.name}` : `${opt.label} — unassigned`}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {refundType === "partial" && (
                        <input
                          value={refundAmounts[opt.id]}
                          onChange={(e) => setRefundAmounts((a) => ({ ...a, [opt.id]: e.target.value }))}
                          type="number"
                          disabled={!emp}
                          style={{
                            ...S.input,
                            fontFamily: T.mono,
                            width: 100,
                            flexShrink: 0,
                            ...(emp ? {} : { background: T.border, cursor: "not-allowed", color: T.textMuted }),
                          }}
                          placeholder="0"
                        />
                      )}
                      <div style={{ position: "relative", flex: 1 }}>
                        <select
                          value={isCustom ? "custom" : choice}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRefundWeekChoices((c) => ({
                              ...c,
                              [opt.id]: v === "custom" ? todayDateStr() : v,
                            }));
                          }}
                          disabled={!emp}
                          style={{ ...S.select, ...(emp ? {} : { background: T.border, cursor: "not-allowed", color: T.textMuted }) }}
                        >
                          <option value="previous">Previous week's check</option>
                          <option value="current">This week's check</option>
                          <option value="next">Next week's check</option>
                          <option value="custom">Custom date…</option>
                        </select>
                        <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
                      </div>
                    </div>
                    {isCustom && emp && (
                      <input
                        type="date"
                        value={choice}
                        onChange={(e) => e.target.value && setRefundWeekChoices((c) => ({ ...c, [opt.id]: e.target.value }))}
                        style={{ ...S.customRangeInput, marginTop: 8, width: "100%" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
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
                onClick={() =>
                  markRefunded(confirmRefund.id, { type: refundType, amounts: refundAmounts, weekChoices: refundWeekChoices })
                }
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

function Modal({ children, onClose, narrow, wide, disableBackdropClose, fullScreen }) {
  return (
    <div
      style={{ ...S.overlay, ...(fullScreen ? S.overlayFullScreen : {}) }}
      onClick={disableBackdropClose ? undefined : onClose}
    >
      <div
        style={{
          ...S.modal,
          ...(narrow ? { maxWidth: 360 } : {}),
          ...(wide ? { maxWidth: 760 } : {}),
          ...(fullScreen ? S.modalFullScreen : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ExpenseTransactionForm({ initial, categories, error: saveError, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function submit() {
    if (!form.category) {
      setError("Choose a category first");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Enter an amount first");
      return;
    }
    if (!form.date) {
      setError("Choose a date first");
      return;
    }
    setError("");
    onSave({ ...form, amount: Number(form.amount) });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ ...S.modalTitle, marginBottom: 0 }}>{form.isNew ? "New Expense" : "Edit expense"}</div>
        <ExpenseFileButton expenseKey={`txn_${form.id}`} />
      </div>
      <Field label="Date">
        <input type="date" value={form.date || ""} onChange={set("date")} style={S.input} />
      </Field>
      <Field label="Category">
        <div style={{ position: "relative" }}>
          <select value={form.category || ""} onChange={set("category")} style={S.select}>
            <option value="">Choose category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown size={13} color={T.textMuted} style={S.selectChevron} />
        </div>
      </Field>
      <Field label="Amount">
        <input
          type="number"
          value={form.amount ?? ""}
          onChange={set("amount")}
          style={{ ...S.input, fontFamily: T.mono }}
          placeholder="0.00"
        />
      </Field>
      <Field label="Notes">
        <input
          value={form.notes || ""}
          onChange={set("notes")}
          style={S.input}
          placeholder="e.g. Olive Garden — client lunch"
        />
      </Field>
      {error && <div style={S.errorText}>{error}</div>}
      {saveError && <div style={S.errorText}>{saveError}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: onDelete ? "space-between" : "flex-end", marginTop: 4 }}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerGhostBtn}>
            <Trash2 size={13} /> Delete
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={S.ghostBtn}>
            Cancel
          </button>
          <button onClick={submit} style={S.primaryBtn}>
            {form.isNew ? "New Expense" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteForm({ initial, error: saveError, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function submit() {
    if (!form.title || !form.title.trim()) {
      setError("Give this note a title first");
      return;
    }
    setError("");
    onSave(form);
  }

  return (
    <div>
      <div style={S.modalTitle}>{form.isNew ? "New Note" : "Edit note"}</div>
      <Field label="Date">
        <input type="date" value={form.date || ""} onChange={set("date")} style={S.input} />
      </Field>
      <Field label="Title">
        <input autoFocus value={form.title || ""} onChange={set("title")} style={S.input} placeholder="e.g. Landlord contact info" />
      </Field>
      <Field label="Notes">
        <textarea
          value={form.body || ""}
          onChange={set("body")}
          style={{ ...S.input, minHeight: 140, resize: "vertical" }}
          placeholder="Type whatever you need to remember here…"
        />
      </Field>
      {error && <div style={S.errorText}>{error}</div>}
      {saveError && <div style={S.errorText}>{saveError}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: onDelete ? "space-between" : "flex-end", marginTop: 4 }}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerGhostBtn}>
            <Trash2 size={13} /> Delete
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={S.ghostBtn}>
            Cancel
          </button>
          <button onClick={submit} style={S.primaryBtn}>
            {form.isNew ? "New Note" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DncEntryForm({ initial, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function submit() {
    if (!form.name?.trim() && !form.phone?.trim() && !form.email?.trim()) {
      setError("Fill in at least one field first");
      return;
    }
    setError("");
    onSave(form);
  }

  return (
    <div>
      <div style={S.modalTitle}>{form.isNew ? "New DNC" : "Edit DNC entry"}</div>
      <Field label="Phone">
        <input value={form.phone || ""} onChange={set("phone")} style={S.input} placeholder="555-123-4567" autoFocus />
      </Field>
      <Field label="Name">
        <input value={form.name || ""} onChange={set("name")} style={S.input} placeholder="Optional" />
      </Field>
      <Field label="Email">
        <input value={form.email || ""} onChange={set("email")} style={S.input} placeholder="Optional" />
      </Field>
      <Field label="Notes">
        <input value={form.notes || ""} onChange={set("notes")} style={S.input} placeholder="Why they're on the list, optional" />
      </Field>
      {error && <div style={S.errorText}>{error}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: onDelete ? "space-between" : "flex-end", marginTop: 4 }}>
        {onDelete && (
          <button onClick={onDelete} style={S.dangerGhostBtn}>
            <Trash2 size={13} /> Delete
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={S.ghostBtn}>
            Cancel
          </button>
          <button onClick={submit} style={S.primaryBtn}>
            {form.isNew ? "New DNC" : "Save"}
          </button>
        </div>
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
          style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }}
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

function EmployeeForm({ initial, attendance, onCancel, onSave, onDelete, onToggleActive }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const isInactive = form.active === false;
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");

  // All-time attendance tally for this employee — attendance is stored as
  // { "employeeId__YYYY-MM-DD": "late" | "absent" | "left_early" }.
  const attendanceCounts = { late: 0, absent: 0, left_early: 0 };
  if (form.id && attendance) {
    const prefix = form.id + "__";
    Object.keys(attendance).forEach((key) => {
      if (!key.startsWith(prefix)) return;
      const status = attendance[key];
      if (attendanceCounts[status] !== undefined) attendanceCounts[status] += 1;
    });
  }
  const attendanceTotal = attendanceCounts.late + attendanceCounts.absent + attendanceCounts.left_early;

  async function refreshFiles() {
    if (!form.id) return;
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/employees/${form.id}/files`, { credentials: "include" });
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {
      // leave the list as-is on a transient error
    }
    setFilesLoading(false);
  }

  useEffect(() => {
    refreshFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  async function handleFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setFileError("That file is over 15MB — try a smaller scan or a compressed PDF.");
      return;
    }
    setFileError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/employees/${form.id}/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFileError(err.error || "Upload failed. Try again.");
      } else {
        await refreshFiles();
      }
    } catch (e) {
      setFileError("Couldn't reach the server. Try again.");
    }
    setUploading(false);
  }

  async function handleFileDelete(fileId) {
    try {
      await fetch(`/api/employees/${form.id}/files/${fileId}`, { method: "DELETE", credentials: "include" });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (e) {
      setFileError("Couldn't delete that file. Try again.");
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

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
              style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }}
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
              style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }}
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
      <Field label="Start date">
        <input type="date" value={form.startDate || ""} onChange={set("startDate")} style={S.input} />
      </Field>
      {form.id && (
        <div style={S.attendanceSummaryBox}>
          <div style={S.fieldLabel}>Attendance history (all-time)</div>
          {attendanceTotal === 0 ? (
            <div style={{ fontSize: 12.5, color: T.textMuted }}>No late, absent, or left-early days recorded yet.</div>
          ) : (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={S.attendanceSummaryItem}>
                <span style={{ ...S.attendanceSummaryDot, background: "#B8763E" }} />
                Late <strong>{attendanceCounts.late}</strong>
              </div>
              <div style={S.attendanceSummaryItem}>
                <span style={{ ...S.attendanceSummaryDot, background: "#A32D2D" }} />
                Absent <strong>{attendanceCounts.absent}</strong>
              </div>
              <div style={S.attendanceSummaryItem}>
                <span style={{ ...S.attendanceSummaryDot, background: "#8A5A1E" }} />
                Left early <strong>{attendanceCounts.left_early}</strong>
              </div>
            </div>
          )}
        </div>
      )}
      <Field label="Notes">
        <textarea
          value={form.notes || ""}
          onChange={set("notes")}
          style={{ ...S.input, minHeight: 56, resize: "vertical" }}
        />
      </Field>

      <div style={S.fieldLabel}>Attachments (ID, work agreement, etc.)</div>
      {!form.id ? (
        <div style={{ ...S.hint, marginBottom: 12 }}>Save this employee first — then you can attach files here.</div>
      ) : (
        <div style={S.attachmentsBox}>
          {filesLoading ? (
            <div style={{ ...S.hint, margin: 0 }}>Loading attachments…</div>
          ) : files.length === 0 ? (
            <div style={{ ...S.hint, margin: 0 }}>No files attached yet.</div>
          ) : (
            <div style={S.attachmentList}>
              {files.map((f) => (
                <div key={f.id} style={S.attachmentRow}>
                  <a
                    href={`/api/employees/${form.id}/files/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={S.attachmentLink}
                  >
                    {f.filename}
                  </a>
                  <span style={S.attachmentMeta}>{formatFileSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => handleFileDelete(f.id)}
                    style={S.attachmentDeleteBtn}
                    aria-label="Remove file"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {fileError && <div style={{ ...S.errorText, marginTop: 8 }}>{fileError}</div>}
          <label style={S.attachmentUploadBtn}>
            {uploading ? "Uploading…" : "+ Add file"}
            <input type="file" onChange={handleFileSelect} disabled={uploading} style={{ display: "none" }} />
          </label>
        </div>
      )}

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

function SaleForm({ initial, employees, settings, dncList, onCancel, onMinimize, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressLookupBusy, setAddressLookupBusy] = useState(false);
  const [zipLookupBusy, setZipLookupBusy] = useState(false);
  const normalizedFormPhone = (form.phone || "").replace(/\D/g, "");
  const dncMatch = (dncList || []).find((d) => {
    const dPhone = (d.phone || "").replace(/\D/g, "");
    if (normalizedFormPhone && dPhone && dPhone === normalizedFormPhone) return true;
    if (form.email && d.email && form.email.trim().toLowerCase() === d.email.trim().toLowerCase()) return true;
    if (form.name && d.name && form.name.trim().toLowerCase() === d.name.trim().toLowerCase()) return true;
    return false;
  });
  const addressDebounceRef = useRef(null);
  const zipDebounceRef = useRef(null);
  const blacklistDebounceRef = useRef(null);
  const lastCheckedPhone = useRef("");
  const [blacklistResult, setBlacklistResult] = useState(null); // null | { message, code } | { error }
  const lastLookedUpZip = useRef("");

  useEffect(() => {
    const pkg = Number(form.packagePrice) || 0;
    const flex = Number(form.dateFlex) || 0;
    const computed = pkg + flex;
    if (computed !== Number(form.totalPrice)) {
      setForm((f) => ({ ...f, totalPrice: computed }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.packagePrice, form.dateFlex]);

  // ZIP code -> city/state autofill, via the free Zippopotam.us API (no key needed).
  useEffect(() => {
    const zip = (form.zip || "").trim();
    clearTimeout(zipDebounceRef.current);
    if (!/^\d{5}$/.test(zip) || zip === lastLookedUpZip.current) return;
    zipDebounceRef.current = setTimeout(async () => {
      try {
        setZipLookupBusy(true);
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (!res.ok) return;
        const data = await res.json();
        const place = data.places && data.places[0];
        if (!place) return;
        lastLookedUpZip.current = zip;
        setForm((f) =>
          f.zip === zip ? { ...f, city: place["place name"], state: place["state abbreviation"] } : f
        );
      } catch (e) {
        // Silently ignore — this is a convenience autofill, not a required step.
      } finally {
        setZipLookupBusy(false);
      }
    }, 500);
    return () => clearTimeout(zipDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.zip]);

  // Litigation risk check via Blacklist Alliance — only fires once the phone
  // number looks complete (10 digits) and only re-checks if it actually
  // changes, since each lookup has a small real cost on their end.
  useEffect(() => {
    const cleanPhone = (form.phone || "").replace(/\D/g, "");
    clearTimeout(blacklistDebounceRef.current);
    if (cleanPhone.length !== 10 || cleanPhone === lastCheckedPhone.current) return;
    blacklistDebounceRef.current = setTimeout(async () => {
      try {
        lastCheckedPhone.current = cleanPhone;
        const res = await fetch("/api/blacklist/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ phone: cleanPhone }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setBlacklistResult({ error: data.error || "Couldn't check litigation risk." });
          return;
        }
        setBlacklistResult(data);
      } catch (e) {
        setBlacklistResult({ error: "Network error checking litigation risk." });
      }
    }, 800);
    return () => clearTimeout(blacklistDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.phone]);

  // Address suggestions as you type, via OpenStreetMap's free Nominatim search
  // (no API key needed). Debounced and limited to respect their usage policy.
  useEffect(() => {
    const q = (form.address || "").trim();
    clearTimeout(addressDebounceRef.current);
    if (q.length < 5) {
      setAddressSuggestions([]);
      return;
    }
    addressDebounceRef.current = setTimeout(async () => {
      try {
        setAddressLookupBusy(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(q)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setAddressSuggestions(Array.isArray(data) ? data : []);
      } catch (e) {
        // Silently ignore — suggestions are a convenience, typing the address manually always works.
      } finally {
        setAddressLookupBusy(false);
      }
    }, 500);
    return () => clearTimeout(addressDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.address]);

  function selectAddressSuggestion(s) {
    const a = s.address || {};
    const houseNumber = a.house_number || "";
    const road = a.road || a.pedestrian || a.footway || "";
    const streetLine = [houseNumber, road].filter(Boolean).join(" ") || s.display_name.split(",")[0];
    const city = a.city || a.town || a.village || a.hamlet || form.city;
    const state = a.state ? US_STATE_ABBREVIATIONS[a.state] || a.state : form.state;
    const zip = a.postcode || form.zip;
    lastLookedUpZip.current = zip || "";
    setForm((f) => ({ ...f, address: streetLine, city: city || f.city, state: state || f.state, zip: zip || f.zip }));
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  }

  function submit() {
    if (blacklistResult && blacklistResult.message && blacklistResult.message !== "Good") {
      setError("This lead cannot be entered — it was flagged by litigation risk screening. See the warning above.");
      return;
    }
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={S.modalTitle}>{form.id ? "Edit sale" : "New sale"}</div>
        {onMinimize && (
          <button type="button" onClick={onMinimize} style={S.minimizeBtn} title="Minimize — come back to this later">
            <Minus size={14} /> Minimize
          </button>
        )}
      </div>
      <div style={{ ...S.hint, marginBottom: 10 }}>All fields marked * are required to save.</div>
      {dncMatch && (
        <div style={S.dncWarningBanner}>
          <ShieldAlert size={16} color="#A32D2D" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700 }}>This person is on your Do Not Call list</div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>
              {dncMatch.name ? `${dncMatch.name} — ` : ""}
              {dncMatch.phone || dncMatch.email}
              {dncMatch.notes ? ` — ${dncMatch.notes}` : ""}
            </div>
          </div>
        </div>
      )}
      {blacklistResult && blacklistResult.message && blacklistResult.message !== "Good" && (
        <div style={S.dncWarningBanner}>
          <ShieldAlert size={16} color="#A32D2D" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700 }}>
              {(() => {
                // The API's docs show the "code" example as a comma-separated
                // string even though the schema says array — normalize
                // either shape so this never crashes on a mismatch.
                const raw = blacklistResult.code;
                const codes = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",").map((c) => c.trim()) : [];
                if (codes.some((c) => c.startsWith("plaintiff"))) return "This lead cannot be entered — flagged as a professional TCPA plaintiff";
                if (codes.some((c) => c.startsWith("attorney"))) return "This lead cannot be entered — flagged as a litigator attorney";
                if (codes.some((c) => c.startsWith("prelitigation"))) return "This lead cannot be entered — flagged as a pre-litigation complainer";
                if (codes.includes("anti-telemarketing")) return "This lead cannot be entered — flagged as anti-telemarketing";
                if (codes.some((c) => c.endsWith("-dnc"))) return "This lead cannot be entered — this number is on a Do Not Call registry";
                return "This lead cannot be entered — flagged by litigation risk screening";
              })()}
            </div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>
              Blacklist Alliance: {blacklistResult.message}
              {(() => {
                const raw = blacklistResult.code;
                const codes = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",").map((c) => c.trim()) : [];
                return codes.length > 0 ? ` (${codes.join(", ")})` : "";
              })()}
            </div>
          </div>
        </div>
      )}
      {blacklistResult && blacklistResult.error && (
        <div style={{ ...S.hint, color: "#8A5A1E" }}>Litigation risk check: {blacklistResult.error}</div>
      )}
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
          <Field label="Secondary phone number">
            <input
              value={form.phone2 || ""}
              onChange={set("phone2")}
              style={S.input}
              placeholder="Optional"
            />
          </Field>
        </div>
      </div>
      <Field label="Email address *">
        <input value={form.email || ""} onChange={set("email")} style={S.input} placeholder="name@email.com" />
      </Field>
      <Field label="Address *">
        <div style={{ position: "relative" }}>
          <input
            value={form.address || ""}
            onChange={set("address")}
            onFocus={() => setShowAddressSuggestions(true)}
            onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 150)}
            style={S.input}
            placeholder="123 Main St"
            autoComplete="off"
          />
          {addressLookupBusy && <div style={S.addressLookupSpinner}>Searching…</div>}
          {showAddressSuggestions && addressSuggestions.length > 0 && (
            <div style={S.addressSuggestionsBox}>
              {addressSuggestions.map((s) => (
                <div
                  key={s.place_id}
                  style={S.addressSuggestionRow}
                  onMouseDown={() => selectAddressSuggestion(s)}
                >
                  {s.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
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
            <div style={{ position: "relative" }}>
              <input value={form.zip || ""} onChange={set("zip")} style={S.input} />
              {zipLookupBusy && <div style={S.zipLookupSpinner}>…</div>}
            </div>
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Package price *">
            <input value={form.packagePrice} onChange={set("packagePrice")} type="number" style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }} placeholder="0" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Date flex price *">
            <input value={form.dateFlex} onChange={set("dateFlex")} type="number" style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }} placeholder="0" />
          </Field>
        </div>
      </div>
      <Field label="Total price (auto-calculated)">
        <input
          value={form.totalPrice || 0}
          readOnly
          disabled
          type="number"
          style={{ ...S.input, fontFamily: T.mono, fontSize: 14, fontWeight: 600, color: T.pineDark, background: T.border, cursor: "not-allowed" }}
        />
      </Field>
      <div style={S.hint}>
        Package price splits 50/50 between the opener and closer. Date flex price is credited entirely to verification.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Password *">
            <input value={form.password || ""} onChange={set("password")} style={{ ...S.input, fontFamily: T.mono, fontSize: 14 }} placeholder="Customer Password" />
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
            <option value="" disabled>
              Select status…
            </option>
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
          <button
            style={{
              ...S.primaryBtn,
              ...(blacklistResult && blacklistResult.message && blacklistResult.message !== "Good"
                ? { opacity: 0.5, cursor: "not-allowed" }
                : {}),
            }}
            disabled={!!(blacklistResult && blacklistResult.message && blacklistResult.message !== "Good")}
            onClick={submit}
          >
            Save sale
          </button>
        </div>
      </div>
    </div>
  );
}

// Small paperclip button that opens a popover for attaching receipts/invoices
// to a specific expense category + month. expenseKey should be something like
// "2026-08_Rent" so files stay tied to the exact month and category.
function ExpenseFileButton({ expenseKey, disabled }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function refreshFiles() {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${encodeURIComponent(expenseKey)}/files`, { credentials: "include" });
      if (!res.ok) {
        console.error("Expense files list failed:", res.status);
        throw new Error("status " + res.status);
      }
      const data = await res.json();
      setFiles(data.files || []);
      setError("");
    } catch (err) {
      console.error("Expense files list error:", err);
      setError("Couldn't load files: " + (err.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount too (not just when opened) so the badge below is
  // accurate from the moment the page loads — otherwise there's no way to
  // tell at a glance whether a category already has something attached.
  useEffect(() => {
    refreshFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) refreshFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
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
        let detail = `status ${res.status}`;
        try {
          const body = await res.json();
          if (body && body.error) detail = body.error;
        } catch (parseErr) {
          // response wasn't JSON — keep the status code as the detail
        }
        console.error("Expense file upload failed:", detail);
        throw new Error(detail);
      }
      await refreshFiles();
    } catch (err) {
      console.error("Expense file upload error:", err);
      setError("Upload failed: " + (err.message || "unknown error"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId) {
    try {
      await fetch(`/api/expenses/${encodeURIComponent(expenseKey)}/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (e) {
      setError("Couldn't delete that file");
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        style={{
          ...S.iconBtnGhost,
          ...(files.length > 0 ? { background: "#EAF3EC" } : {}),
          ...(disabled ? { opacity: 0.4, cursor: "not-allowed" } : {}),
        }}
        title={files.length > 0 ? `${files.length} file${files.length === 1 ? "" : "s"} attached` : "Attach a receipt or invoice"}
      >
        <Paperclip size={14} color={files.length > 0 ? T.pineDark : T.textMuted} />
      </button>
      {files.length > 0 && (
        <span style={S.expenseFileBadge}>{files.length}</span>
      )}
      {open && (
        <Modal onClose={() => setOpen(false)} narrow>
          <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 500, color: T.ink, marginBottom: 10 }}>
            Attachments
          </div>
          {loading ? (
            <div style={{ fontSize: 12.5, color: T.textMuted }}>Loading…</div>
          ) : files.length === 0 ? (
            <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 12 }}>No files attached yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {files.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12.5,
                    background: T.paper,
                    border: `1px solid ${T.border}`,
                    borderRadius: 7,
                    padding: "6px 10px",
                  }}
                >
                  <a
                    href={`/api/expenses/${encodeURIComponent(expenseKey)}/files/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: T.ink, flex: 1, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {f.filename}
                  </a>
                  <button onClick={() => handleDelete(f.id)} style={S.iconBtnGhost}>
                    <Trash2 size={12} color={T.textMuted} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && <div style={{ fontSize: 11.5, color: "#A32D2D", marginBottom: 8 }}>{error}</div>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ ...S.ghostBtn, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Upload size={14} /> {uploading ? "Uploading…" : "Add file"}
              <input type="file" onChange={handleFileSelect} disabled={uploading} style={{ display: "none" }} />
            </label>
            <button onClick={() => setOpen(false)} style={S.primaryBtn}>
              Done
            </button>
          </div>
        </Modal>
      )}
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
  logOutLink: {
    display: "block",
    width: "100%",
    marginTop: 6,
    border: "none",
    background: "transparent",
    color: T.textMuted,
    fontSize: 11.5,
    fontWeight: 500,
    padding: "4px 8px",
    textAlign: "center",
    cursor: "pointer",
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
  reportsSubTabs: { display: "flex", gap: 6, marginBottom: 16 },
  reportsSubTabBtn: {
    border: `1px solid ${T.border}`,
    background: T.paper,
    color: T.textMuted,
    fontSize: 12.5,
    fontWeight: 500,
    padding: "7px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
  reportsSubTabBtnActive: {
    background: T.pineDark,
    color: "#fff",
    borderColor: T.pineDark,
  },
  pnlAutoBadge: {
    marginLeft: 8,
    fontSize: 9.5,
    fontWeight: 600,
    color: T.pineDark,
    background: "#EAF3EC",
    padding: "1px 6px",
    borderRadius: 10,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  epgBadgeSuccess: {
    fontSize: 9,
    fontWeight: 700,
    color: T.pineDark,
    background: "#EAF3EC",
    padding: "1px 6px",
    borderRadius: 10,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  epgBadgeFailed: {
    fontSize: 9,
    fontWeight: 700,
    color: "#A32D2D",
    background: "#FCEBEB",
    padding: "1px 6px",
    borderRadius: 10,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    flexShrink: 0,
    cursor: "help",
  },
  pnlTransactionList: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    background: T.paper,
    borderRadius: 7,
    padding: 8,
  },
  pnlTransactionRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    padding: "3px 4px",
  },
  infoNotesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 12,
    marginTop: 16,
  },
  infoNoteCard: {
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 14,
    cursor: "pointer",
  },
  infoNoteHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  infoNoteTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
  },
  infoNoteDate: {
    fontSize: 10.5,
    color: T.textMuted,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  infoNoteBody: {
    fontSize: 12.5,
    color: T.textMuted,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 5,
    WebkitBoxOrient: "vertical",
  },
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
  customRangeInput: {
    border: `1px solid ${T.border}`,
    background: T.paperRaised,
    color: T.ink,
    fontSize: 12,
    fontWeight: 500,
    padding: "5px 8px",
    borderRadius: 7,
    outline: "none",
  },
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
  rrgChip: { fontFamily: T.mono, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  attendanceSummaryBox: {
    background: T.paper,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  attendanceSummaryItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12.5,
    color: T.ink,
  },
  attendanceSummaryDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  attendanceSelect: {
    fontSize: 10.5,
    fontWeight: 700,
    border: "1px solid transparent",
    borderRadius: 5,
    padding: "2px 4px",
    outline: "none",
    cursor: "pointer",
    maxWidth: 90,
  },
  spiffInput: {
    fontSize: 10.5,
    fontWeight: 600,
    fontFamily: T.mono,
    border: "1px solid transparent",
    borderRadius: 5,
    padding: "2px 4px",
    outline: "none",
    maxWidth: 74,
    color: T.textMuted,
    background: "transparent",
  },
  spiffPaidLabel: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    fontSize: 9,
    fontWeight: 600,
    color: "#8A5A1E",
    marginTop: 2,
    cursor: "pointer",
    userSelect: "none",
  },
  sourceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 4 },
  sourceCard: {
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 14,
  },
  sourceCount: { fontSize: 11, color: T.textMuted },
  channelBadge: {
    fontSize: 10.5,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    background: "#EDEAE0",
    color: "#5A5748",
  },
  sourceValue: { fontFamily: T.mono, fontSize: 21, fontWeight: 600, color: T.ink, marginTop: 10 },
  chartCard: {
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    padding: 20,
  },
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
  refundRoleBlock: {
    background: T.paper,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 10,
  },
  refundRoleBlockLabel: { fontSize: 11.5, color: T.textMuted, marginBottom: 6, fontWeight: 500 },
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
  statValue: { fontFamily: T.mono, fontSize: 19, fontWeight: 600, color: T.ink },
  statDivider: { width: 1, height: 26, background: T.border },
  dealValue: { fontFamily: T.mono, fontSize: 14.5, color: T.pineDark, marginTop: 6, fontWeight: 600 },
  contactsWrap: { padding: 20 },
  salesWrap: { padding: 20 },
  tableScroll: {
    overflowX: "auto",
    overflowY: "auto",
    maxHeight: "calc(100vh - 260px)",
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    background: T.paperRaised,
  },
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
  duplicateCustomersPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 16,
  },
  duplicateCustomerCard: {
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: 12,
  },
  duplicateCustomerName: {
    fontSize: 14,
    fontWeight: 600,
    color: T.ink,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  duplicateCustomerCount: {
    fontSize: 11,
    fontWeight: 500,
    color: T.textMuted,
  },
  duplicateCustomerRows: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  duplicateCustomerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12.5,
    padding: "6px 8px",
    borderRadius: 6,
    cursor: "pointer",
    background: T.paper,
  },
  expenseFileBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    background: T.pineDark,
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 20,
    minWidth: 14,
    height: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 3px",
    pointerEvents: "none",
  },
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
    position: "sticky",
    top: 0,
    background: T.paperRaised,
    zIndex: 1,
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
  leadCardApproved: {
    borderColor: "#B8D9C4",
    background: "#F2F8F4",
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
  leadInfoItem: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    fontSize: 12,
    color: T.ink,
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  leadInfoLabel: { fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.03em" },
  leadEmployeeRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px solid ${T.border}`,
  },
  leadEmployeeItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.ink },
  refundImpactNote: { fontFamily: T.mono, fontSize: 12.5, fontWeight: 700, color: "#A32D2D" },
  leadNotes: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px solid ${T.border}`,
    fontSize: 12,
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
  contactName: { fontSize: 16, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  contactCompany: { fontSize: 11.5, color: T.textMuted, display: "flex", alignItems: "center", marginTop: 2 },
  contactMeta: { marginTop: 10, display: "flex", flexDirection: "column", gap: 4 },
  contactMetaRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.textMuted },
  employeeStats: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: `1px solid ${T.border}`,
    fontFamily: T.mono,
    fontSize: 13,
    fontWeight: 600,
    color: T.pineDark,
  },
  pendingRefundList: {
    marginTop: 6,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  pendingRefundNote: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11.5,
    fontWeight: 600,
    color: "#A32D2D",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
    fontSize: 13,
    fontWeight: 600,
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
  totalPayCurrency: { fontFamily: T.mono, fontSize: 17, fontWeight: 700, color: T.pineDark },
  totalPayInput: {
    fontFamily: T.mono,
    fontSize: 17,
    fontWeight: 700,
    border: `1px solid transparent`,
    background: "transparent",
    borderRadius: 5,
    padding: "3px 4px",
    width: 80,
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
  customPayNote: { fontSize: 11, color: "#8A5A1E", marginTop: 2 },
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
  overlayFullScreen: {
    background: T.paper,
    padding: 0,
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
  modalFullScreen: {
    maxWidth: "100%",
    width: "100%",
    height: "100vh",
    maxHeight: "100vh",
    borderRadius: 0,
    boxShadow: "none",
    padding: "24px 28px",
  },
  modalTitle: { fontFamily: T.display, fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 14 },
  payslipSentNote: {
    fontSize: 11.5,
    fontWeight: 600,
    color: T.pineDark,
  },
  payslipErrorNote: {
    fontSize: 11,
    fontWeight: 500,
    color: "#A32D2D",
    maxWidth: 220,
  },
  minimizeBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    border: `1px solid ${T.border}`,
    background: T.paper,
    color: T.textMuted,
    fontSize: 11.5,
    fontWeight: 500,
    padding: "5px 10px",
    borderRadius: 7,
    cursor: "pointer",
    flexShrink: 0,
  },
  minimizedPill: {
    position: "fixed",
    bottom: 20,
    right: 20,
    zIndex: 1100,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: T.pineDark,
    color: "#fff",
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    padding: "12px 18px",
    borderRadius: 30,
    boxShadow: "0 6px 20px rgba(27,30,26,0.25)",
    cursor: "pointer",
  },
  fieldLabel: { fontSize: 11.5, color: T.textMuted, marginBottom: 5, fontWeight: 500 },
  addressSuggestionsBox: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#FFFFFF",
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 20,
    maxHeight: 220,
    overflowY: "auto",
  },
  addressSuggestionRow: {
    padding: "9px 12px",
    fontSize: 12.5,
    color: T.ink,
    cursor: "pointer",
    borderBottom: `1px solid ${T.border}`,
  },
  addressLookupSpinner: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 11,
    color: T.textMuted,
    background: T.paper,
    pointerEvents: "none",
  },
  zipLookupSpinner: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 11,
    color: T.textMuted,
    pointerEvents: "none",
  },
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
  dncWarningBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    background: "#FCEBEB",
    border: "1px solid #E8B4B4",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 12,
    fontSize: 13,
    color: "#A32D2D",
  },
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
  attachmentsBox: {
    background: T.paper,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  attachmentList: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 },
  attachmentRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: T.paperRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    padding: "6px 8px",
  },
  attachmentLink: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: T.pineDark,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textDecoration: "none",
  },
  attachmentMeta: { fontSize: 10.5, color: T.textMuted, flexShrink: 0 },
  attachmentDeleteBtn: {
    border: "none",
    background: "transparent",
    color: T.borderStrong,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    borderRadius: 4,
    flexShrink: 0,
    cursor: "pointer",
  },
  attachmentUploadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${T.border}`,
    background: T.paperRaised,
    color: T.ink,
    fontSize: 12,
    fontWeight: 500,
    padding: "7px 12px",
    borderRadius: 7,
    cursor: "pointer",
  },
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
