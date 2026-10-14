import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarRange,
  Receipt,
  Award,
  Megaphone,
  RefreshCw,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Briefcase,
  Sparkles,
  ArrowUpRight,
  FileText,
  Check,
  Info,
  Clock3,
  UserCheck,
  CheckSquare,
  Shield,
  Layers
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

// --- NUMERIC FORMATTING UTILITIES ---
export const formatNumber = (amt) => {
  const num = Number(amt) || 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(num);
};

export const formatNumberCompact = (amt) => {
  const num = Number(amt) || 0;
  const abs = Math.abs(num);
  if (abs >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (abs >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return `${num.toLocaleString('en-US')}`;
};

export const numberToWords = (num) => {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(val) {
    if (val < 20) return a[val];
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
    if (val < 1000) return a[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' and ' + inWords(val % 100) : '');
    if (val < 1000000) return inWords(Math.floor(val / 1000)) + ' Thousand' + (val % 1000 !== 0 ? ' ' + inWords(val % 1000) : '');
    if (val < 1000000000) return inWords(Math.floor(val / 1000000)) + ' Million' + (val % 1000000 !== 0 ? ' ' + inWords(val % 1000000) : '');
    return inWords(Math.floor(val / 1000000000)) + ' Billion' + (val % 1000000000 !== 0 ? ' ' + inWords(val % 1000000000) : '');
  }
  return inWords(n) + ' Only';
};

// Aliases for compatibility
export const formatINR = formatNumber;
export const formatINRCompact = formatNumberCompact;
export const numberToINRWords = numberToWords;

// --- DETERMINISTIC AVATAR GRADIENT GENERATOR ---
const getAvatarGradient = (name = '') => {
  const gradients = [
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
    'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

// --- CLIENT-SIDE CSV EXPORT ---
export const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==================== MAIN APP COMPONENT ====================
export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [dashboardData, setDashboardData] = useState({
    users: 0,
    departments: 0,
    pending_leaves: 0,
    finance_records: 0,
    total_revenue: 0,
    total_expenses: 0,
    net_balance: 0,
    avg_performance: 0,
    today_attendance: 0,
    notices: 0
  });

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [finance, setFinance] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [notices, setNotices] = useState([]);
  
  // Rich Toast System: { message: string, type: 'success' | 'error' | 'info' }
  const [toast, setToast] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [voucherRecord, setVoucherRecord] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Show Toast
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Fetch all data
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [dRes, uRes, deptRes, aRes, lRes, fRes, pRes, nRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/users`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/departments`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/attendance`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/leaves`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/finance`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/performance`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/notices`).then(r => r.ok ? r.json() : [])
      ]);

      if (dRes) setDashboardData(dRes);
      if (Array.isArray(uRes)) setUsers(uRes);
      if (Array.isArray(deptRes)) setDepartments(deptRes);
      if (Array.isArray(aRes)) setAttendance(aRes);
      if (Array.isArray(lRes)) setLeaves(lRes);
      if (Array.isArray(fRes)) setFinance(fRes);
      if (Array.isArray(pRes)) setPerformance(pRes);
      if (Array.isArray(nRes)) setNotices(nRes);
    } catch (err) {
      console.error('API fetch error:', err);
      showToast('Could not sync latest system data. Please check connection.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Keyboard accessibility: ESC key closes open modals and dialogs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmDialog) setConfirmDialog(null);
        else if (voucherRecord) setVoucherRecord(null);
        else if (activeModal) setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog, voucherRecord, activeModal]);

  const navItems = [
    { id: 'Dashboard', label: 'Executive Pulse', icon: LayoutDashboard },
    { id: 'Users', label: 'Team Directory', icon: Users },
    { id: 'Departments', label: 'Departments', icon: Building2 },
    { id: 'Attendance', label: 'Attendance & Shifts', icon: Clock },
    { id: 'Leaves', label: 'Leave Requests', icon: CalendarRange },
    { id: 'Finance', label: 'Finance & Treasury', icon: Receipt },
    { id: 'Performance', label: 'Performance Reviews', icon: Award },
    { id: 'Notices', label: 'Company Bulletins', icon: Megaphone },
  ];

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <div className="logo-icon">
              <Layers size={22} strokeWidth={2.4} />
            </div>
            <div className="brand-info">
              <h2>SmartERP</h2>
              <span>Enterprise Operations Suite</span>
            </div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-category">Management Modules</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div
              className="user-avatar-small"
              style={{ background: getAvatarGradient('Abhaya Kumar Kar') }}
            >
              AK
            </div>
            <div className="user-info-text">
              <div className="user-name">Abhaya Kumar Kar</div>
              <div className="user-role">System Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="page-headline">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1>{navItems.find(n => n.id === activeTab)?.label || activeTab}</h1>
            </div>
            <p>Smart ERP Platform • Enterprise Resource Planning & Workforce Management</p>
          </div>
          <div className="topbar-actions">
            <div className="system-status">
              <span className="pulse-dot"></span>
              Backend Connected
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchData}
              disabled={isRefreshing}
            >
              <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </header>

        <main className="content-container">
          {activeTab === 'Dashboard' && (
            <DashboardView
              data={dashboardData}
              finance={finance}
              departments={departments}
              users={users}
              notices={notices}
              openModal={setActiveModal}
            />
          )}

          {activeTab === 'Users' && (
            <UsersView
              users={users}
              departments={departments}
              openModal={setActiveModal}
              onUserDeleted={fetchData}
              showToast={showToast}
              setConfirmDialog={setConfirmDialog}
            />
          )}

          {activeTab === 'Departments' && (
            <DepartmentsView
              departments={departments}
              users={users}
              openModal={setActiveModal}
              onDeptDeleted={fetchData}
              showToast={showToast}
              setConfirmDialog={setConfirmDialog}
            />
          )}

          {activeTab === 'Attendance' && (
            <AttendanceView
              attendance={attendance}
              users={users}
              openModal={setActiveModal}
            />
          )}

          {activeTab === 'Leaves' && (
            <LeavesView
              leaves={leaves}
              users={users}
              openModal={setActiveModal}
              onStatusUpdated={fetchData}
              showToast={showToast}
            />
          )}

          {activeTab === 'Finance' && (
            <FinanceView
              finance={finance}
              users={users}
              dashboardData={dashboardData}
              openModal={setActiveModal}
              onStatusUpdated={fetchData}
              showToast={showToast}
              onViewVoucher={setVoucherRecord}
            />
          )}

          {activeTab === 'Performance' && (
            <PerformanceView
              performance={performance}
              users={users}
              openModal={setActiveModal}
              onDeleted={fetchData}
              showToast={showToast}
              setConfirmDialog={setConfirmDialog}
            />
          )}

          {activeTab === 'Notices' && (
            <NoticesView
              notices={notices}
              users={users}
              openModal={setActiveModal}
              onDeleted={fetchData}
              showToast={showToast}
              setConfirmDialog={setConfirmDialog}
            />
          )}
        </main>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast toast-${toast.type || 'info'}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close" onClick={() => setToast(null)} title="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {/* IN-APP CONFIRMATION DIALOG */}
      {confirmDialog && (
        <ConfirmModal
          dialog={confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {/* MODAL MANAGER */}
      {activeModal && (
        <ModalManager
          modalType={activeModal}
          closeModal={() => setActiveModal(null)}
          users={users}
          departments={departments}
          onSuccess={(msg) => {
            fetchData();
            setActiveModal(null);
            showToast(msg, 'success');
          }}
          showToast={showToast}
        />
      )}

      {/* GST VOUCHER / RECEIPT MODAL */}
      {voucherRecord && (
        <VoucherModal
          record={voucherRecord}
          onClose={() => setVoucherRecord(null)}
        />
      )}
    </div>
  );
}

// ---------------- CONFIRMATION MODAL ----------------
function ConfirmModal({ dialog, onClose }) {
  const { title, message, confirmText = 'Confirm Delete', onConfirm, isDanger = true } = dialog;
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} color={isDanger ? '#ef4444' : '#3b82f6'} />
            <h3>{title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- DASHBOARD VIEW ----------------
function DashboardView({ data, finance, departments, notices, openModal }) {
  const chartData = [
    { name: 'Revenue', amount: data.total_revenue || 0 },
    { name: 'Expenses', amount: data.total_expenses || 0 },
    { name: 'Net Surplus', amount: data.net_balance || 0 }
  ];

  const deptData = departments.map(d => ({
    name: d.name,
    count: d.employee_count || 1
  }));

  return (
    <div>
      {/* QUICK ACTIONS */}
      <div className="quick-actions-bar">
        <button className="action-card-btn" onClick={() => openModal('addUser')}>
          <div className="action-icon">
            <Users size={18} />
          </div>
          <div className="action-info">
            <div className="action-title">Add Team Member</div>
            <div className="action-desc">Onboard staff or manager</div>
          </div>
        </button>

        <button className="action-card-btn" onClick={() => openModal('addAttendance')}>
          <div className="action-icon">
            <Clock size={18} />
          </div>
          <div className="action-info">
            <div className="action-title">Log Attendance</div>
            <div className="action-desc">Record shift or daily presence</div>
          </div>
        </button>

        <button className="action-card-btn" onClick={() => openModal('addLeave')}>
          <div className="action-icon">
            <CalendarRange size={18} />
          </div>
          <div className="action-info">
            <div className="action-title">Submit Leave</div>
            <div className="action-desc">Request time-off or permission</div>
          </div>
        </button>

        <button className="action-card-btn" onClick={() => openModal('addFinance')}>
          <div className="action-icon">
            <Receipt size={18} />
          </div>
          <div className="action-info">
            <div className="action-title">Record Transaction</div>
            <div className="action-desc">Post invoice, revenue, or expense</div>
          </div>
        </button>

        <button className="action-card-btn" onClick={() => openModal('addNotice')}>
          <div className="action-icon">
            <Megaphone size={18} />
          </div>
          <div className="action-info">
            <div className="action-title">Post Bulletin</div>
            <div className="action-desc">Broadcast circular to company</div>
          </div>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Workforce</span>
            <span className="kpi-icon-wrapper kpi-icon-blue">
              <Users size={18} />
            </span>
          </div>
          <div className="kpi-value">{data.users}</div>
          <div className="kpi-subtext positive">Across {data.departments} operational departments</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Net Financial Balance</span>
            <span className="kpi-icon-wrapper kpi-icon-emerald">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="kpi-value">{formatNumber(data.net_balance)}</div>
          <div className="kpi-subtext positive">
            Rev: {formatNumberCompact(data.total_revenue)} | Exp: {formatNumberCompact(data.total_expenses)}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Leave Requests</span>
            <span className="kpi-icon-wrapper kpi-icon-amber">
              <Clock3 size={18} />
            </span>
          </div>
          <div className="kpi-value">{data.pending_leaves}</div>
          <div className="kpi-subtext">Awaiting manager approval</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Average Performance</span>
            <span className="kpi-icon-wrapper kpi-icon-purple">
              <Award size={18} />
            </span>
          </div>
          <div className="kpi-value">{data.avg_performance ? Number(data.avg_performance).toFixed(1) : '4.8'} / 5.0</div>
          <div className="kpi-subtext positive">High organizational benchmark</div>
        </div>
      </div>

      {/* VISUAL CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <h2>Financial Breakdown</h2>
              <p>Revenue, operating expenses, and net surplus</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tickFormatter={(val) => formatNumberCompact(val)} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(val) => [formatNumber(val), 'Amount']} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div className="panel-title">
              <h2>Department Headcount</h2>
              <p>Team members distribution across divisions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" stroke="#64748b" width={130} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT ANNOUNCEMENTS */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <h2>Company Bulletins & Circulars</h2>
            <p>Recent operational updates, announcements, and notices</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => openModal('addNotice')}>
            <Plus size={14} />
            <span>New Notice</span>
          </button>
        </div>
        <div className="notice-grid">
          {notices.slice(0, 3).map((notice) => (
            <div className="notice-card" key={notice.id}>
              <div>
                <div className="notice-header">
                  <h4 className="notice-title">{notice.title}</h4>
                </div>
                <p className="notice-body">{notice.content}</p>
              </div>
              <div className="notice-footer">
                <span>By: {notice.author_name || 'Executive Management'}</span>
                <span>{notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'Recent'}</span>
              </div>
            </div>
          ))}
          {notices.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">
                <Megaphone size={22} />
              </div>
              <div className="empty-state-title">No announcements published yet</div>
              <div className="empty-state-desc">Broadcast updates, policies, and company events to keep your organization aligned.</div>
              <button className="btn btn-primary btn-sm" onClick={() => openModal('addNotice')}>
                <Plus size={14} />
                <span>Post First Announcement</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- TEAM DIRECTORY VIEW ----------------
function UsersView({ users, departments, openModal, onUserDeleted, showToast, setConfirmDialog }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const empId = `EMP-${String(u.id).padStart(3, '0')}`;
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        empId.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'ALL' || u.department_name === deptFilter;
      const matchRole =
        roleFilter === 'ALL'
          ? true
          : u.role.toLowerCase() === roleFilter.toLowerCase();
      return matchSearch && matchDept && matchRole;
    });
  }, [users, search, deptFilter, roleFilter]);

  const employeesCount = useMemo(() => users.filter(u => u.role === 'employee').length, [users]);
  const managersCount = useMemo(() => users.filter(u => u.role === 'manager').length, [users]);
  const adminsCount = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);

  const handleExportCSV = () => {
    const rows = filteredUsers.map(u => ({
      'Employee ID': `EMP-${String(u.id).padStart(3, '0')}`,
      'Full Name': u.name,
      'Email Address': u.email,
      'Role': u.role.toUpperCase(),
      'Department': u.department_name || 'Unassigned',
      'Status': u.is_active ? 'Active' : 'Inactive'
    }));
    exportToCSV(`Team_Directory_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    showToast('Exported team directory roster to CSV', 'success');
  };

  const promptDelete = (user) => {
    setConfirmDialog({
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${user.name} (${user.email})? This action will archive their record.`,
      confirmText: 'Remove Member',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`${API_BASE}/users/${user.id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Profile for ${user.name} has been removed`, 'success');
          onUserDeleted();
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.detail || 'Could not delete member', 'error');
        }
      }
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Team Directory ({filteredUsers.length})</h2>
          <p>Organizational members, department leads, and system administrators</p>
        </div>
        <div className="panel-controls">
          <div className="search-bar">
            <Search size={15} color="#94a3b8" />
            <input
              placeholder="Search by name, EMP ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear-btn" onClick={() => setSearch('')} title="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => openModal('addUser')}>
            <Plus size={15} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="filter-pills">
        <button
          className={`filter-pill ${roleFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setRoleFilter('ALL')}
        >
          All Members ({users.length})
        </button>
        <button
          className={`filter-pill ${roleFilter === 'EMPLOYEE' ? 'active' : ''}`}
          onClick={() => setRoleFilter('EMPLOYEE')}
        >
          Staff & Engineers ({employeesCount})
        </button>
        <button
          className={`filter-pill ${roleFilter === 'MANAGER' ? 'active' : ''}`}
          onClick={() => setRoleFilter('MANAGER')}
        >
          Managers & Leads ({managersCount})
        </button>
        <button
          className={`filter-pill ${roleFilter === 'ADMIN' ? 'active' : ''}`}
          onClick={() => setRoleFilter('ADMIN')}
        >
          Administrators ({adminsCount})
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Member Name</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const empId = `EMP-${String(u.id).padStart(3, '0')}`;
              const initials = u.name
                .split(' ')
                .map(part => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <tr key={u.id}>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: '5px', fontSize: '11.5px', fontWeight: '700', color: '#334155' }}>
                      {empId}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        className="user-avatar-small"
                        style={{
                          width: '34px',
                          height: '34px',
                          fontSize: '12px',
                          background: getAvatarGradient(u.name)
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <strong>{u.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#475569' }}>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.department_name || 'Unassigned'}</td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                      <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-icon"
                      title="Remove Member"
                      onClick={() => promptDelete(u)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Users size={22} />
                    </div>
                    <div className="empty-state-title">No team members found</div>
                    <div className="empty-state-desc">
                      {search ? `No members matched "${search}". Check your spelling or clear active filters.` : 'Get started by onboarding your first employee.'}
                    </div>
                    {search ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setDeptFilter('ALL'); setRoleFilter('ALL'); }}>
                        Clear Search & Filters
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => openModal('addUser')}>
                        <Plus size={14} />
                        <span>Add Team Member</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- DEPARTMENTS VIEW ----------------
function DepartmentsView({ departments, openModal, onDeptDeleted, showToast, setConfirmDialog }) {
  const promptDelete = (dept) => {
    setConfirmDialog({
      title: 'Dissolve Department',
      message: `Are you sure you want to dissolve the "${dept.name}" department? All affiliated employees will be marked as Unassigned.`,
      confirmText: 'Dissolve Department',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`${API_BASE}/departments/${dept.id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Department "${dept.name}" dissolved`, 'success');
          onDeptDeleted();
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.detail || 'Could not dissolve department', 'error');
        }
      }
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Organizational Departments ({departments.length})</h2>
          <p>Business divisions, research centers, and operational teams</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('addDept')}>
          <Plus size={15} />
          <span>Add Department</span>
        </button>
      </div>

      <div className="dept-grid">
        {departments.map((d) => (
          <div className="dept-card" key={d.id}>
            <div>
              <div className="dept-header">
                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{d.name}</h3>
                <span className="dept-badge">{d.employee_count} {d.employee_count === 1 ? 'Member' : 'Members'}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', lineHeight: 1.5 }}>
                {d.description || 'No description provided for this department.'}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <button className="btn btn-danger btn-sm" onClick={() => promptDelete(d)}>
                <Trash2 size={13} />
                <span>Dissolve</span>
              </button>
            </div>
          </div>
        ))}
        {departments.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">
              <Building2 size={22} />
            </div>
            <div className="empty-state-title">No departments created yet</div>
            <div className="empty-state-desc">Organize your personnel into clear functional units like Engineering, HR, and Finance.</div>
            <button className="btn btn-primary btn-sm" onClick={() => openModal('addDept')}>
              <Plus size={14} />
              <span>Create Department</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- ATTENDANCE VIEW ----------------
function AttendanceView({ attendance, users, openModal }) {
  const [selectedDate, setSelectedDate] = useState('');

  const filteredAttendance = useMemo(() => {
    if (!selectedDate) return attendance;
    return attendance.filter((a) => a.date === selectedDate);
  }, [attendance, selectedDate]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Workforce Attendance Logs ({filteredAttendance.length})</h2>
          <p>Real-time shift presence, remote check-ins, and daily tracking</p>
        </div>
        <div className="panel-controls">
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {selectedDate && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDate('')}>
              Clear Date
            </button>
          )}
          <button className="btn btn-primary" onClick={() => openModal('addAttendance')}>
            <Plus size={15} />
            <span>Log Attendance</span>
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Record #</th>
              <th>Team Member</th>
              <th>Date</th>
              <th>Presence Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((a) => (
              <tr key={a.id}>
                <td>
                  <code style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: '5px', fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                    #{a.id}
                  </code>
                </td>
                <td><strong>{a.user_name}</strong></td>
                <td>{a.date}</td>
                <td>
                  <span className={`status-badge status-${a.status.toLowerCase()}`}>
                    <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredAttendance.length === 0 && (
              <tr>
                <td colSpan="4">
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Clock size={22} />
                    </div>
                    <div className="empty-state-title">No attendance records logged</div>
                    <div className="empty-state-desc">
                      {selectedDate ? `No check-ins recorded for ${selectedDate}.` : 'Record daily check-ins to monitor team presence.'}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal('addAttendance')}>
                      <Plus size={14} />
                      <span>Log Check-In</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- LEAVES VIEW ----------------
function LeavesView({ leaves, users, openModal, onStatusUpdated, showToast }) {
  const handleUpdateStatus = async (leaveId, status) => {
    try {
      const res = await fetch(`${API_BASE}/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Leave application #${leaveId} marked as ${status}`, 'success');
        onStatusUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Could not update status', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while updating leave', 'error');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Leave & Time-Off Management ({leaves.length})</h2>
          <p>Review leave applications, medical time-off, and manager approvals</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('addLeave')}>
          <Plus size={15} />
          <span>Submit Leave Request</span>
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>App #</th>
              <th>Applicant</th>
              <th>Period</th>
              <th>Reason & Purpose</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Review Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id}>
                <td>
                  <code style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: '5px', fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                    #{l.id}
                  </code>
                </td>
                <td><strong>{l.user_name}</strong></td>
                <td>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    {l.start_date} <span style={{ color: '#94a3b8' }}>to</span> {l.end_date}
                  </div>
                </td>
                <td style={{ color: '#475569', maxWidth: '300px' }}>{l.reason}</td>
                <td>
                  <span className={`status-badge status-${l.status.toLowerCase()}`}>
                    {l.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {l.status === 'pending' ? (
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(l.id, 'approved')}>
                        <Check size={13} />
                        <span>Approve</span>
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleUpdateStatus(l.id, 'rejected')}>
                        <X size={13} />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Resolved</span>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <CalendarRange size={22} />
                    </div>
                    <div className="empty-state-title">No leave requests pending</div>
                    <div className="empty-state-desc">You are all caught up! Time-off requests submitted by personnel will appear here for governance.</div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal('addLeave')}>
                      <Plus size={14} />
                      <span>Submit Request</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- FINANCE VIEW ----------------
function FinanceView({ finance, dashboardData, openModal, onStatusUpdated, showToast, onViewVoucher }) {
  const [showTaxCalc, setShowTaxCalc] = useState(false);
  const [calcBaseAmount, setCalcBaseAmount] = useState(50000);
  const [calcGSTRate, setCalcGSTRate] = useState(18);
  const [calcTDSRate, setCalcTDSRate] = useState(2);

  const handleUpdateStatus = async (recordId, status) => {
    try {
      const res = await fetch(`${API_BASE}/finance/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Transaction #${recordId} marked as ${status}`, 'success');
        onStatusUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Could not update transaction', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Network error while updating transaction', 'error');
    }
  };

  const handleExportCSV = () => {
    const rows = finance.map(f => ({
      'Voucher ID': `VCH-2026-${String(f.id).padStart(4, '0')}`,
      'Record Type': f.record_type,
      'Amount': f.amount,
      'Formatted Amount': formatNumber(f.amount),
      'Particulars': f.description,
      'Assignee / Account': f.user_name || 'General Corporate Account',
      'Status': f.status.toUpperCase()
    }));
    exportToCSV(`Finance_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    showToast('Exported complete financial ledger to CSV', 'success');
  };

  // Tax calculations
  const gstAmount = (calcBaseAmount * calcGSTRate) / 100;
  const tdsAmount = (calcBaseAmount * calcTDSRate) / 100;
  const netPayable = calcBaseAmount + gstAmount - tdsAmount;

  return (
    <div>
      {/* KPI METRIC CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Corporate Revenue</span>
            <span className="kpi-icon-wrapper kpi-icon-emerald">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="kpi-value">{formatNumber(dashboardData.total_revenue)}</div>
          <div className="kpi-subtext positive">
            {formatNumberCompact(dashboardData.total_revenue)} • Enterprise contracts, SaaS & client billing
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Operational & Payroll Expenses</span>
            <span className="kpi-icon-wrapper kpi-icon-amber">
              <TrendingDown size={18} />
            </span>
          </div>
          <div className="kpi-value">{formatNumber(dashboardData.total_expenses)}</div>
          <div className="kpi-subtext">
            {formatNumberCompact(dashboardData.total_expenses)} • Payroll, cloud infrastructure & facilities
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Net Cash Balance</span>
            <span className="kpi-icon-wrapper kpi-icon-blue">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="kpi-value">{formatNumber(dashboardData.net_balance)}</div>
          <div className="kpi-subtext positive">
            {formatNumberCompact(dashboardData.net_balance)} • Healthy treasury liquidity
          </div>
        </div>
      </div>

      {/* TAX & WITHHOLDING ESTIMATOR WIDGET */}
      <div className="tax-calc-card">
        <div className="tax-calc-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Tax & Withholding Settlement Estimator</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Model GST tax breakdown, withholding deductions, and net voucher remittance
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowTaxCalc(!showTaxCalc)}
          >
            {showTaxCalc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showTaxCalc ? 'Hide Estimator' : 'Expand Estimator'}</span>
          </button>
        </div>

        {showTaxCalc && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Base Taxable Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={calcBaseAmount}
                  onChange={(e) => setCalcBaseAmount(Number(e.target.value) || 0)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>GST Slab</label>
                <select
                  className="form-select"
                  value={calcGSTRate}
                  onChange={(e) => setCalcGSTRate(Number(e.target.value))}
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% (Essential Goods/Services)</option>
                  <option value={12}>12% (Standard Concessional)</option>
                  <option value={18}>18% (Standard Enterprise / IT)</option>
                  <option value={28}>28% (Luxury / Special)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Withholding Rate (TDS)</label>
                <select
                  className="form-select"
                  value={calcTDSRate}
                  onChange={(e) => setCalcTDSRate(Number(e.target.value))}
                >
                  <option value={0}>0% (None)</option>
                  <option value={1}>1% (Contractor / Vendor)</option>
                  <option value={2}>2% (Technical Services)</option>
                  <option value={10}>10% (Professional Consultation)</option>
                </select>
              </div>
            </div>

            <div className="tax-grid">
              <div className="tax-stat">
                <div className="tax-stat-label">Taxable Base</div>
                <div className="tax-stat-val">{formatNumber(calcBaseAmount)}</div>
              </div>
              <div className="tax-stat">
                <div className="tax-stat-label">Component A ({calcGSTRate / 2}%)</div>
                <div className="tax-stat-val" style={{ color: '#059669' }}>+{formatNumber(gstAmount / 2)}</div>
              </div>
              <div className="tax-stat">
                <div className="tax-stat-label">Component B ({calcGSTRate / 2}%)</div>
                <div className="tax-stat-val" style={{ color: '#059669' }}>+{formatNumber(gstAmount / 2)}</div>
              </div>
              <div className="tax-stat">
                <div className="tax-stat-label">Withholding ({calcTDSRate}%)</div>
                <div className="tax-stat-val" style={{ color: '#dc2626' }}>-{formatNumber(tdsAmount)}</div>
              </div>
              <div className="tax-stat" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div className="tax-stat-label" style={{ color: '#1d4ed8' }}>Net Settlement</div>
                <div className="tax-stat-val" style={{ color: '#1d4ed8' }}>{formatNumber(netPayable)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <h2>Financial Ledger & Journals ({finance.length})</h2>
            <p>Audited revenues, operating disbursements, and payroll transactions</p>
          </div>
          <div className="panel-controls">
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <Download size={15} />
              <span>Export Ledger (CSV)</span>
            </button>
            <button className="btn btn-primary" onClick={() => openModal('addFinance')}>
              <Plus size={15} />
              <span>Record Transaction</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Classification</th>
                <th>Amount</th>
                <th>Description & Particulars</th>
                <th>Account / Assignee</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {finance.map((f) => (
                <tr key={f.id}>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: '5px', fontSize: '11.5px', fontWeight: '700', color: '#334155' }}>
                      VCH-2026-{String(f.id).padStart(4, '0')}
                    </code>
                  </td>
                  <td>
                    <strong style={{ color: f.record_type === 'Revenue' ? '#059669' : '#dc2626' }}>
                      {f.record_type}
                    </strong>
                  </td>
                  <td>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {formatNumber(f.amount)}
                    </strong>
                  </td>
                  <td style={{ color: '#475569' }}>{f.description}</td>
                  <td>{f.user_name || 'General Corporate Account'}</td>
                  <td>
                    <span className={`status-badge status-${f.status.toLowerCase()}`}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="View Official Voucher"
                        onClick={() => onViewVoucher(f)}
                      >
                        <FileText size={13} />
                        <span>Receipt</span>
                      </button>
                      {f.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(f.id, 'approved')}>
                          <Check size={13} />
                          <span>Approve</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {finance.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <Receipt size={22} />
                      </div>
                      <div className="empty-state-title">No transactions recorded yet</div>
                      <div className="empty-state-desc">Post revenues, invoices, or operating expenses to maintain your general ledger.</div>
                      <button className="btn btn-primary btn-sm" onClick={() => openModal('addFinance')}>
                        <Plus size={14} />
                        <span>Record First Transaction</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------- OFFICIAL VOUCHER & FEE RECEIPT MODAL ----------------
function VoucherModal({ record, onClose }) {
  const taxable = record.amount * 0.8474;
  const cgst = record.amount * 0.0763;
  const sgst = record.amount * 0.0763;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="voucher-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#2563eb" />
            <h3>Official Payment Voucher & Tax Invoice</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="voucher-scroll-area">
          <div className="voucher-body">
            <div className="voucher-top">
              <div>
                <div className="voucher-org-name">SMART ERP ENTERPRISE SOLUTIONS</div>
                <div className="voucher-org-sub">Cloud Enterprise Resource Planning & Workforce OS</div>
                <div className="voucher-org-sub">Connaught Place, Barakhamba Road, New Delhi - 110001, India</div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#475569' }}>
                  <strong>GSTIN:</strong> 07AABCS1429B1Z8 &nbsp;|&nbsp; <strong>State Code:</strong> 07 (Delhi)
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="voucher-badge">GST TAX INVOICE</div>
                <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '6px', color: '#0f172a' }}>
                  VCH-2026-{String(record.id).padStart(4, '0')}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Date: {new Date().toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>

            <div className="voucher-details-grid">
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Paid To / Account:</span>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>{record.user_name || 'General Corporate Account'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Classification:</span>
                <div style={{ fontWeight: '700', color: record.record_type === 'Revenue' ? '#059669' : '#dc2626' }}>
                  {record.record_type} Entry
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Payment Mode:</span>
                <div style={{ fontWeight: '600' }}>NEFT / RTGS / Corporate Wire Transfer</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Status:</span>
                <div style={{ fontWeight: '700', color: '#059669' }}>{record.status.toUpperCase()}</div>
              </div>
            </div>

            <table className="voucher-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Particulars / Description</th>
                  <th>SAC/HSN</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{record.description}</td>
                  <td>998311</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(taxable)}</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Central Component (9%)</td>
                  <td>-</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(cgst)}</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>State Component (9%)</td>
                  <td>-</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(sgst)}</td>
                </tr>
                <tr className="voucher-total-row">
                  <td colSpan="3" style={{ textAlign: 'right' }}>TOTAL SETTLEMENT:</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(record.amount)}</td>
                </tr>
              </tbody>
            </table>

            <div className="voucher-words">
              <strong>Amount in Words:</strong> {numberToWords(record.amount)}
            </div>

            <div className="voucher-footer">
              <div className="voucher-seal">
                <ShieldCheck size={14} />
                <span>DIGITALLY AUDITED & CERTIFIED</span>
              </div>
              <div className="voucher-sign">
                <div style={{ borderBottom: '1px solid #94a3b8', width: '160px', marginBottom: '4px' }}></div>
                <strong>Authorized Signatory</strong>
                <div>Finance & Corporate Treasury</div>
              </div>
            </div>
          </div>
        </div>

        <div className="voucher-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- PERFORMANCE VIEW ----------------
function PerformanceView({ performance, openModal, onDeleted, showToast, setConfirmDialog }) {
  const promptDelete = (id, user_name) => {
    setConfirmDialog({
      title: 'Delete Performance Review',
      message: `Are you sure you want to remove the appraisal review for ${user_name}?`,
      confirmText: 'Delete Review',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`${API_BASE}/performance/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Performance evaluation #${id} removed`, 'success');
          onDeleted();
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.detail || 'Could not delete review', 'error');
        }
      }
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Performance Reviews & Appraisals ({performance.length})</h2>
          <p>Employee quarterly appraisals, goal achievements, and leadership feedback</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('addPerformance')}>
          <Plus size={15} />
          <span>Submit Review</span>
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Team Member</th>
              <th>Appraisal Score</th>
              <th>Feedback & Key Milestones</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {performance.map((p) => (
              <tr key={p.id}>
                <td>
                  <code style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: '5px', fontSize: '11.5px', fontWeight: '700', color: '#475569' }}>
                    #{p.id}
                  </code>
                </td>
                <td><strong>{p.user_name}</strong></td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '800', color: '#7c3aed', fontSize: '14.5px' }}>
                    <Award size={16} />
                    {Number(p.score).toFixed(1)} / 5.0
                  </span>
                </td>
                <td style={{ color: '#475569', maxWidth: '380px' }}>{p.remarks}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-icon" onClick={() => promptDelete(p.id, p.user_name)} title="Delete Review">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {performance.length === 0 && (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Award size={22} />
                    </div>
                    <div className="empty-state-title">No performance reviews recorded</div>
                    <div className="empty-state-desc">Evaluate staff competencies and log constructive appraisal feedback.</div>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal('addPerformance')}>
                      <Plus size={14} />
                      <span>Submit Review</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- NOTICES VIEW ----------------
function NoticesView({ notices, openModal, onDeleted, showToast, setConfirmDialog }) {
  const promptDelete = (n) => {
    setConfirmDialog({
      title: 'Remove Bulletin',
      message: `Are you sure you want to remove the announcement "${n.title}"?`,
      confirmText: 'Remove Bulletin',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`${API_BASE}/notices/${n.id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Announcement "${n.title.slice(0, 25)}..." removed`, 'success');
          onDeleted();
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.detail || 'Could not delete notice', 'error');
        }
      }
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Company Bulletin Board ({notices.length})</h2>
          <p>Official circulars, executive announcements, and organizational policies</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('addNotice')}>
          <Plus size={15} />
          <span>Post Announcement</span>
        </button>
      </div>

      <div className="notice-grid">
        {notices.map((n) => (
          <div className="notice-card" key={n.id}>
            <div>
              <div className="notice-header">
                <h4 className="notice-title">{n.title}</h4>
              </div>
              <p className="notice-body">{n.content}</p>
            </div>
            <div className="notice-footer">
              <div>
                <span style={{ display: 'block', fontWeight: '600' }}>By: {n.author_name || 'Executive Management'}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}
                </span>
              </div>
              <button className="btn-icon" title="Remove Bulletin" onClick={() => promptDelete(n)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">
              <Megaphone size={22} />
            </div>
            <div className="empty-state-title">No company circulars published</div>
            <div className="empty-state-desc">Broadcast company news, upcoming holiday schedules, and town-hall invites.</div>
            <button className="btn btn-primary btn-sm" onClick={() => openModal('addNotice')}>
              <Plus size={14} />
              <span>Post Announcement</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- MODAL MANAGER ----------------
function ModalManager({ modalType, closeModal, users, departments, onSuccess, showToast }) {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    let endpoint = '';
    let payload = { ...formData };

    if (modalType === 'addUser') {
      endpoint = `${API_BASE}/users`;
      payload.role = payload.role || 'employee';
      if (!payload.password) payload.password = 'user123';
      if (payload.department_id) payload.department_id = parseInt(payload.department_id);
    } else if (modalType === 'addDept') {
      endpoint = `${API_BASE}/departments`;
    } else if (modalType === 'addAttendance') {
      endpoint = `${API_BASE}/attendance`;
      payload.user_id = parseInt(payload.user_id || users[0]?.id);
      payload.date = payload.date || new Date().toISOString().split('T')[0];
      payload.status = payload.status || 'present';
    } else if (modalType === 'addLeave') {
      endpoint = `${API_BASE}/leaves`;
      payload.user_id = parseInt(payload.user_id || users[0]?.id);
      payload.status = 'pending';
    } else if (modalType === 'addFinance') {
      endpoint = `${API_BASE}/finance`;
      payload.amount = parseFloat(payload.amount);
      payload.record_type = payload.record_type || 'Expense';
      payload.status = 'approved';
      if (payload.user_id) payload.user_id = parseInt(payload.user_id);
      else payload.user_id = null;
    } else if (modalType === 'addPerformance') {
      endpoint = `${API_BASE}/performance`;
      payload.user_id = parseInt(payload.user_id || users[0]?.id);
      payload.score = parseFloat(payload.score || 4.5);
    } else if (modalType === 'addNotice') {
      endpoint = `${API_BASE}/notices`;
      if (payload.author_id) payload.author_id = parseInt(payload.author_id);
      else payload.author_id = users[0]?.id;
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(err.detail || 'The request could not be completed. Please review form entries.');
      } else {
        onSuccess('Record created and synced successfully!');
      }
    } catch (err) {
      console.error(err);
      setFormError('Network connection issue. Please verify backend service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>
              {modalType === 'addUser' && 'Onboard Team Member'}
              {modalType === 'addDept' && 'Create Department'}
              {modalType === 'addAttendance' && 'Log Attendance'}
              {modalType === 'addLeave' && 'Submit Leave Application'}
              {modalType === 'addFinance' && 'Record Financial Entry'}
              {modalType === 'addPerformance' && 'Log Performance Review'}
              {modalType === 'addNotice' && 'Broadcast Announcement'}
            </h3>
            <span className="modal-esc-hint">Press ESC to dismiss</span>
          </div>
          <button className="modal-close" onClick={closeModal} title="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#991b1b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* ADD USER FORM */}
            {modalType === 'addUser' && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    required
                    className="form-input"
                    placeholder="e.g. Sarah Jenkins"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Corporate Email</label>
                  <input
                    required
                    type="email"
                    className="form-input"
                    placeholder="sarah.jenkins@erp.com"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Password</label>
                    <input
                      required
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      defaultValue="user123"
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      className="form-select"
                      defaultValue="employee"
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="employee">Staff / Engineer</option>
                      <option value="manager">Department Lead / Manager</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Assigned Department</label>
                  <select
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* ADD DEPT FORM */}
            {modalType === 'addDept' && (
              <>
                <div className="form-group">
                  <label>Department Name</label>
                  <input
                    required
                    className="form-input"
                    placeholder="e.g. Product Strategy & User Research"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Functional Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Mission, team charters, and focus areas..."
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
              </>
            )}

            {/* ADD ATTENDANCE FORM */}
            {modalType === 'addAttendance' && (
              <>
                <div className="form-group">
                  <label>Team Member</label>
                  <select
                    required
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      required
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="form-input"
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Presence Status</label>
                    <select
                      className="form-select"
                      defaultValue="present"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="present">Present (In-Office)</option>
                      <option value="remote">Remote (Work From Home)</option>
                      <option value="late">Late Arrival</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ADD LEAVE FORM */}
            {modalType === 'addLeave' && (
              <>
                <div className="form-group">
                  <label>Team Member</label>
                  <select
                    required
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.department_name || 'Staff'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      required
                      type="date"
                      className="form-input"
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      required
                      type="date"
                      className="form-input"
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Reason & Context</label>
                  <textarea
                    required
                    className="form-textarea"
                    rows="3"
                    placeholder="e.g. Annual planned vacation or medical appointment..."
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  ></textarea>
                </div>
              </>
            )}

            {/* ADD FINANCE FORM */}
            {modalType === 'addFinance' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Classification</label>
                    <select
                      className="form-select"
                      defaultValue="Revenue"
                      onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                    >
                      <option value="Revenue">Revenue (Client Invoices, Contracts)</option>
                      <option value="Expense">Expense (Cloud Compute, Facilities)</option>
                      <option value="Payroll">Payroll (Salaries & Bonuses)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 75000.00"
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Related Account / Assignee (Optional)</label>
                  <select
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    <option value="">General Corporate Account</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description & Particulars</label>
                  <input
                    required
                    className="form-input"
                    placeholder="e.g. Enterprise Cloud Compute License or Client Milestone 2"
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* ADD PERFORMANCE FORM */}
            {modalType === 'addPerformance' && (
              <>
                <div className="form-group">
                  <label>Team Member</label>
                  <select
                    required
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.department_name || 'Staff'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Appraisal Rating (1.0 to 5.0)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    defaultValue="4.8"
                    className="form-input"
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Key Achievements & Feedback</label>
                  <textarea
                    required
                    className="form-textarea"
                    rows="3"
                    placeholder="Specific milestones hit, leadership qualities, and growth opportunities..."
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  ></textarea>
                </div>
              </>
            )}

            {/* ADD NOTICE FORM */}
            {modalType === 'addNotice' && (
              <>
                <div className="form-group">
                  <label>Announcement Title</label>
                  <input
                    required
                    className="form-input"
                    placeholder="e.g. Q4 Townhall & Product Strategy Briefing"
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Publishing Authority</label>
                  <select
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                  >
                    <option value="">Executive Management</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Circular Content</label>
                  <textarea
                    required
                    className="form-textarea"
                    rows="4"
                    placeholder="Share the full announcement details and next steps..."
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  ></textarea>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Save & Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
