import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import './styles.css';

const API_BASE = 'http://127.0.0.1:8000/api';

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

// Backwards-compatible aliases
export const formatINR = formatNumber;
export const formatINRCompact = formatNumberCompact;
export const numberToINRWords = numberToWords;

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
  const [toastMessage, setToastMessage] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [voucherRecord, setVoucherRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Show Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all data
  const fetchData = async () => {
    try {
      const [dRes, uRes, deptRes, aRes, lRes, fRes, pRes, nRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`).then(r => r.json()),
        fetch(`${API_BASE}/users`).then(r => r.json()),
        fetch(`${API_BASE}/departments`).then(r => r.json()),
        fetch(`${API_BASE}/attendance`).then(r => r.json()),
        fetch(`${API_BASE}/leaves`).then(r => r.json()),
        fetch(`${API_BASE}/finance`).then(r => r.json()),
        fetch(`${API_BASE}/performance`).then(r => r.json()),
        fetch(`${API_BASE}/notices`).then(r => r.json())
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { id: 'Dashboard', label: 'Overview', icon: '📊' },
    { id: 'Users', label: 'Students & Personnel', icon: '🎓' },
    { id: 'Departments', label: 'Departments', icon: '🏢' },
    { id: 'Attendance', label: 'Attendance', icon: '⏱️' },
    { id: 'Leaves', label: 'Leave Requests', icon: '🗓️' },
    { id: 'Finance', label: 'Finance & Accounts', icon: '💳' },
    { id: 'Performance', label: 'Academic & Performance', icon: '⭐' },
    { id: 'Notices', label: 'Notice Board', icon: '📢' },
  ];

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">
            <div className="logo-icon">⚡</div>
            <div className="brand-info">
              <h2>SmartERP</h2>
              <span>National Academic & Enterprise Suite</span>
            </div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-category">Main Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div className="user-avatar-small" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              AK
            </div>
            <div className="user-info-text">
              <div className="user-name">Abhaya Kumar Kar</div>
              <div className="user-role">System Administrator & Dean</div>
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
            <p>Smart ERP Management Suite • Real-time Operations & Academic Resource OS</p>
          </div>
          <div className="topbar-actions">
            <div className="system-status">
              <span className="pulse-dot"></span>
              FastAPI Connected
            </div>
            <button className="btn btn-primary btn-sm" onClick={fetchData}>
              🔄 Refresh
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
            />
          )}

          {activeTab === 'Departments' && (
            <DepartmentsView
              departments={departments}
              users={users}
              openModal={setActiveModal}
              onDeptDeleted={fetchData}
              showToast={showToast}
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
            />
          )}

          {activeTab === 'Notices' && (
            <NoticesView
              notices={notices}
              users={users}
              openModal={setActiveModal}
              onDeleted={fetchData}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="toast">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODALS */}
      {activeModal && (
        <ModalManager
          modalType={activeModal}
          closeModal={() => setActiveModal(null)}
          users={users}
          departments={departments}
          onSuccess={(msg) => {
            fetchData();
            setActiveModal(null);
            showToast(msg);
          }}
        />
      )}

      {/* GST VOUCHER / FEE RECEIPT MODAL */}
      {voucherRecord && (
        <VoucherModal
          record={voucherRecord}
          onClose={() => setVoucherRecord(null)}
        />
      )}
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
          <div className="action-icon">🎓</div>
          <div className="action-info">
            <div className="action-title">Add Student / Faculty</div>
            <div className="action-desc">Enroll student or faculty member</div>
          </div>
        </button>

        <button className="action-card-btn" onClick={() => openModal('addAttendance')}>
          <div className="action-icon">⏱️</div>
          <div className="action-info">
            <div className="action-title">Log Attendance</div>
            <div className="action-desc">Daily classroom & lab check-in</div>
          </div>
        </button>

        <button className="action-card-btn" onClick={() => openModal('addLeave')}>
          <div className="action-icon">🗓️</div>
          <div className="action-info">
            <div className="action-title">Leave / Permission</div>
            <div className="action-desc">Academic leave or medical excuse</div>
          </div>
        </button>

        <button className="action-card-btn" onClick={() => openModal('addFinance')}>
          <div className="action-icon">💳</div>
          <div className="action-info">
            <div className="action-title">Record Transaction</div>
            <div className="action-desc">Log fee, research grant, or expense</div>
          </div>
        </button>

        <button className="action-card-btn" onClick={() => openModal('addNotice')}>
          <div className="action-icon">📢</div>
          <div className="action-info">
            <div className="action-title">Post Bulletin</div>
            <div className="action-desc">Broadcast to campus & institute</div>
          </div>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Enrolled Students & Staff</span>
            <span className="kpi-icon-wrapper kpi-icon-blue">👥</span>
          </div>
          <div className="kpi-value">{data.users}</div>
          <div className="kpi-subtext positive">Across {data.departments} academic & operational departments</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Net Financial Balance</span>
            <span className="kpi-icon-wrapper kpi-icon-emerald">📈</span>
          </div>
          <div className="kpi-value">{formatNumber(data.net_balance)}</div>
          <div className="kpi-subtext positive">
            Rev: {formatNumberCompact(data.total_revenue)} | Exp: {formatNumberCompact(data.total_expenses)} ({formatNumberCompact(data.net_balance)} Net Surplus)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Leave Requests</span>
            <span className="kpi-icon-wrapper kpi-icon-amber">⏳</span>
          </div>
          <div className="kpi-value">{data.pending_leaves}</div>
          <div className="kpi-subtext">Awaiting Dean & HOD approvals</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Academic & CGPA Score</span>
            <span className="kpi-icon-wrapper kpi-icon-purple">⭐</span>
          </div>
          <div className="kpi-value">{data.avg_performance || '4.8'} / 5.0</div>
          <div className="kpi-subtext positive">High institutional performance benchmark</div>
        </div>
      </div>

      {/* VISUAL CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Financial Overview</h2>
              <p>Revenue vs Expenses Breakdown</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(val) => formatNumberCompact(val)} />
              <Tooltip formatter={(val) => [formatNumber(val), 'Amount']} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Department Distribution</h2>
              <p>Student & Staff Allocation Across Disciplines</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} stroke="#64748b" />
              <YAxis dataKey="name" type="category" stroke="#64748b" width={120} />
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
            <h2>Campus & Official Bulletins</h2>
            <p>Notices, academic deadlines, and institutional updates</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => openModal('addNotice')}>
            + New Notice
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
                <span>By: {notice.author_name || 'Dean & Administration'}</span>
                <span>{notice.created_at ? new Date(notice.created_at).toLocaleDateString('en-IN') : 'Recent'}</span>
              </div>
            </div>
          ))}
          {notices.length === 0 && <p style={{ color: '#94a3b8' }}>No announcements published yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------- STUDENTS & PERSONNEL VIEW ----------------
function UsersView({ users, departments, openModal, onUserDeleted, showToast }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        `STU-IND-${String(u.id).padStart(3, '0')}`.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'ALL' || u.department_name === deptFilter;
      const matchRole =
        roleFilter === 'ALL'
          ? true
          : roleFilter === 'STUDENT'
          ? u.role === 'student'
          : roleFilter === 'FACULTY'
          ? u.role === 'employee'
          : roleFilter === 'MANAGER'
          ? u.role === 'manager'
          : u.role === 'admin';
      return matchSearch && matchDept && matchRole;
    });
  }, [users, search, deptFilter, roleFilter]);

  const studentsCount = useMemo(() => users.filter(u => u.role === 'student').length, [users]);
  const facultyCount = useMemo(() => users.filter(u => u.role === 'employee').length, [users]);
  const managerCount = useMemo(() => users.filter(u => u.role === 'manager').length, [users]);

  const handleExportCSV = () => {
    const rows = filteredUsers.map(u => ({
      'Roll / Employee ID': u.role === 'student' ? `STU-IND-${String(u.id).padStart(3, '0')}` : `EMP-IND-${String(u.id).padStart(3, '0')}`,
      'Full Name': u.name,
      'Email Address': u.email,
      'Role Category': u.role.toUpperCase(),
      'Department / Branch': u.department_name || 'Unassigned',
      'Status': u.is_active ? 'Active' : 'Inactive'
    }));
    exportToCSV(`SmartERP_Student_Roster_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    showToast('Exported student & personnel roster to CSV!');
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this record?')) return;
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Record deleted successfully');
        onUserDeleted();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Students & Personnel Directory ({filteredUsers.length})</h2>
          <p>Indian student scholars, faculty members, mentors, and administrators</p>
        </div>
        <div className="panel-controls">
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder="Search by student name, roll no, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
            📥 Export Roster (CSV)
          </button>
          <button className="btn btn-primary" onClick={() => openModal('addUser')}>
            + Add Student / Staff
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
          className={`filter-pill ${roleFilter === 'STUDENT' ? 'active' : ''}`}
          onClick={() => setRoleFilter('STUDENT')}
        >
          🎓 Students ({studentsCount})
        </button>
        <button
          className={`filter-pill ${roleFilter === 'FACULTY' ? 'active' : ''}`}
          onClick={() => setRoleFilter('FACULTY')}
        >
          👔 Faculty & Staff ({facultyCount})
        </button>
        <button
          className={`filter-pill ${roleFilter === 'MANAGER' ? 'active' : ''}`}
          onClick={() => setRoleFilter('MANAGER')}
        >
          💼 Heads & Managers ({managerCount})
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Roll / ID</th>
              <th>Student / Member Name</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>Department / Discipline</th>
              <th>Attendance Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const rollId = u.role === 'student'
                ? `STU-IND-${String(u.id).padStart(3, '0')}`
                : u.role === 'admin'
                ? `ADM-${String(u.id).padStart(3, '0')}`
                : `FAC-${String(u.id).padStart(3, '0')}`;

              return (
                <tr key={u.id}>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                      {rollId}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        className="user-avatar-small"
                        style={{
                          width: '32px',
                          height: '32px',
                          fontSize: '12px',
                          background: u.role === 'student' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : undefined
                        }}
                      >
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong>{u.name}</strong>
                        {u.role === 'student' && (
                          <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: '600' }}>
                            Indian Student Scholar
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role === 'student' ? '🎓 Student' : u.role === 'employee' ? '👔 Faculty' : u.role}
                    </span>
                  </td>
                  <td>{u.department_name || 'General Academic'}</td>
                  <td>
                    <span className={`status-badge ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                      {u.is_active ? 'Active & Enrolled' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" title="Remove Record" onClick={() => handleDelete(u.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No students or personnel matched your query.
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
function DepartmentsView({ departments, openModal, onDeptDeleted, showToast }) {
  const handleDelete = async (deptId) => {
    if (!window.confirm('Delete this department? Users in this department will be unassigned.')) return;
    try {
      const res = await fetch(`${API_BASE}/departments/${deptId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Department removed');
        onDeptDeleted();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Organizational & Academic Departments ({departments.length})</h2>
          <p>Academic faculties, research centers, and enterprise divisions</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('addDept')}>
          + Add Department
        </button>
      </div>

      <div className="dept-grid">
        {departments.map((d) => (
          <div className="dept-card" key={d.id}>
            <div>
              <div className="dept-header">
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{d.name}</h3>
                <span className="dept-badge">{d.employee_count} Enrolled</span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>
                {d.description || 'No description provided for this department.'}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>
                Delete Department
              </button>
            </div>
          </div>
        ))}
        {departments.length === 0 && (
          <p style={{ color: '#94a3b8' }}>No departments created yet.</p>
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
          <h2>Student & Staff Attendance Log ({filteredAttendance.length})</h2>
          <p>Real-time classroom lectures, remote labs, and campus presence</p>
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
            + Log Attendance
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Student / Staff Name</th>
              <th>Date</th>
              <th>Attendance Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.map((a) => (
              <tr key={a.id}>
                <td>#{a.id}</td>
                <td><strong>{a.user_name}</strong></td>
                <td>{a.date}</td>
                <td>
                  <span className={`status-badge status-${a.status.toLowerCase()}`}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredAttendance.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No attendance records found.
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
        showToast(`Leave request ${status}`);
        onStatusUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Leave & Academic Permissions ({leaves.length})</h2>
          <p>Review student exam excuses, hackathon attendance, and faculty permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('addLeave')}>
          + Submit Leave Request
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student / Staff</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Reason & Purpose</th>
              <th>Status</th>
              <th>Approval Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr key={l.id}>
                <td>#{l.id}</td>
                <td><strong>{l.user_name}</strong></td>
                <td>{l.start_date}</td>
                <td>{l.end_date}</td>
                <td>{l.reason}</td>
                <td>
                  <span className={`status-badge status-${l.status.toLowerCase()}`}>
                    {l.status}
                  </span>
                </td>
                <td>
                  {l.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(l.id, 'approved')}>
                        ✓ Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleUpdateStatus(l.id, 'rejected')}>
                        ✗ Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No leave requests submitted yet.
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
        showToast(`Transaction marked as ${status}`);
        onStatusUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const rows = finance.map(f => ({
      'Voucher ID': `VCH-2026-${String(f.id).padStart(4, '0')}`,
      'Record Type': f.record_type,
      'Amount': f.amount,
      'Formatted Amount': formatNumber(f.amount),
      'Particulars': f.description,
      'Assignee / Student': f.user_name || 'General Institute Account',
      'Status': f.status.toUpperCase()
    }));
    exportToCSV(`SmartERP_Finance_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, rows);
    showToast('Exported complete financial ledger to CSV!');
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
            <span className="kpi-title">Total Institutional Revenue</span>
            <span className="kpi-icon-wrapper kpi-icon-emerald">📈</span>
          </div>
          <div className="kpi-value">{formatNumber(dashboardData.total_revenue)}</div>
          <div className="kpi-subtext positive">
            {formatNumberCompact(dashboardData.total_revenue)} • Tuition fees, corporate grants & MoUs
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Operational & Lab Expenses</span>
            <span className="kpi-icon-wrapper kpi-icon-amber">📉</span>
          </div>
          <div className="kpi-value">{formatNumber(dashboardData.total_expenses)}</div>
          <div className="kpi-subtext">
            {formatNumberCompact(dashboardData.total_expenses)} • Faculty stipends, cloud compute & labs
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Net Financial Balance</span>
            <span className="kpi-icon-wrapper kpi-icon-blue">🏦</span>
          </div>
          <div className="kpi-value">{formatNumber(dashboardData.net_balance)}</div>
          <div className="kpi-subtext positive">
            {formatNumberCompact(dashboardData.net_balance)} • Healthy institutional cash reserve
          </div>
        </div>
      </div>

      {/* TAX & WITHHOLDING ESTIMATOR WIDGET */}
      <div className="tax-calc-card">
        <div className="tax-calc-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Tax & Withholding Estimator</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Calculate tax, withholding deductions, and net voucher settlement
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowTaxCalc(!showTaxCalc)}
          >
            {showTaxCalc ? '▲ Hide Estimator' : '▼ Expand Estimator'}
          </button>
        </div>

        {showTaxCalc && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Base Amount</label>
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
                  <option value={5}>5% (Basic Goods/Services)</option>
                  <option value={12}>12% (Standard Concessional)</option>
                  <option value={18}>18% (Standard Enterprise / IT)</option>
                  <option value={28}>28% (Luxury / Special)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>TDS Withholding (IT Act)</label>
                <select
                  className="form-select"
                  value={calcTDSRate}
                  onChange={(e) => setCalcTDSRate(Number(e.target.value))}
                >
                  <option value={0}>0% (None)</option>
                  <option value={1}>1% (Sec 194C Contractor)</option>
                  <option value={2}>2% (Sec 194J Technical Services)</option>
                  <option value={10}>10% (Sec 194J Professional Services)</option>
                </select>
              </div>
            </div>

            <div className="tax-grid">
              <div className="tax-stat">
                <div className="tax-stat-label">Taxable Base</div>
                <div className="tax-stat-val">{formatNumber(calcBaseAmount)}</div>
              </div>
              <div className="tax-stat">
                <div className="tax-stat-label">Tax Part A ({calcGSTRate / 2}%)</div>
                <div className="tax-stat-val" style={{ color: '#059669' }}>{formatNumber(gstAmount / 2)}</div>
              </div>
              <div className="tax-stat">
                <div className="tax-stat-label">Tax Part B ({calcGSTRate / 2}%)</div>
                <div className="tax-stat-val" style={{ color: '#059669' }}>{formatNumber(gstAmount / 2)}</div>
              </div>
              <div className="tax-stat">
                <div className="tax-stat-label">Withholding ({calcTDSRate}%)</div>
                <div className="tax-stat-val" style={{ color: '#dc2626' }}>- {formatNumber(tdsAmount)}</div>
              </div>
              <div className="tax-stat" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div className="tax-stat-label" style={{ color: '#1d4ed8' }}>Net Payable / Receivable</div>
                <div className="tax-stat-val" style={{ color: '#1d4ed8' }}>{formatNumber(netPayable)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <h2>Financial Transactions & Ledger ({finance.length})</h2>
            <p>Institutional fees, research disbursements, and expense records</p>
          </div>
          <div className="panel-controls">
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              📥 Export Ledger (CSV)
            </button>
            <button className="btn btn-primary" onClick={() => openModal('addFinance')}>
              + Record Transaction
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
                <th>Student / Account</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {finance.map((f) => (
                <tr key={f.id}>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
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
                  <td>{f.description}</td>
                  <td>{f.user_name || 'General Institute Account'}</td>
                  <td>
                    <span className={`status-badge status-${f.status.toLowerCase()}`}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="View Official Voucher"
                        onClick={() => onViewVoucher(f)}
                      >
                        📄 Receipt
                      </button>
                      {f.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(f.id, 'approved')}>
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {finance.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No financial transactions recorded yet.
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
            <span style={{ fontSize: '18px' }}>📄</span>
            <h3>Official Payment Voucher & Fee Receipt</h3>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="voucher-scroll-area">
          <div className="voucher-body">
            <div className="voucher-top">
              <div>
                <div className="voucher-org-name">SMART ERP INSTITUTE & ENTERPRISE</div>
                <div className="voucher-org-sub">Approved Educational Institute & Cloud Technology Center</div>
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
                <div style={{ fontWeight: '700', color: '#0f172a' }}>{record.user_name || 'General Institutional Account'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Classification:</span>
                <div style={{ fontWeight: '700', color: record.record_type === 'Revenue' ? '#059669' : '#dc2626' }}>
                  {record.record_type} Entry
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Payment Mode:</span>
                <div style={{ fontWeight: '600' }}>NEFT / RTGS / UPI Electronic Transfer</div>
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
                  <td>Tax Component A (9%)</td>
                  <td>-</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(cgst)}</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Tax Component B (9%)</td>
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
                <span>✓</span>
                <span>DIGITALLY AUDITED & APPROVED</span>
              </div>
              <div className="voucher-sign">
                <div style={{ borderBottom: '1px solid #94a3b8', width: '160px', marginBottom: '4px' }}></div>
                <strong>Authorized Signatory</strong>
                <div>Finance & Accounts Department</div>
              </div>
            </div>
          </div>
        </div>

        <div className="voucher-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print / Download Voucher
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- PERFORMANCE VIEW ----------------
function PerformanceView({ performance, openModal, onDeleted, showToast }) {
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this evaluation?')) return;
    try {
      const res = await fetch(`${API_BASE}/performance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Evaluation deleted');
        onDeleted();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Academic & Faculty Evaluations ({performance.length})</h2>
          <p>Student academic CGPA, research milestones, and institutional appraisals</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('addPerformance')}>
          + Submit Performance Review
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student / Scholar</th>
              <th>Rating / CGPA (out of 5.0)</th>
              <th>Academic Remarks & Achievements</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {performance.map((p) => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td><strong>{p.user_name}</strong></td>
                <td>
                  <span style={{ fontWeight: '800', color: '#8b5cf6', fontSize: '15px' }}>
                    ⭐ {p.score.toFixed(1)}
                  </span>
                </td>
                <td>{p.remarks}</td>
                <td>
                  <button className="btn-icon" onClick={() => handleDelete(p.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {performance.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No performance records submitted yet.
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
function NoticesView({ notices, openModal, onDeleted, showToast }) {
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      const res = await fetch(`${API_BASE}/notices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Notice removed');
        onDeleted();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>National Notice Board ({notices.length})</h2>
          <p>Official circulars, academic milestones, and festival schedules</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('addNotice')}>
          + Post Announcement
        </button>
      </div>

      <div className="notice-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {notices.map((n) => (
          <div className="notice-card" key={n.id}>
            <div>
              <div className="notice-header">
                <h4 className="notice-title">{n.title}</h4>
              </div>
              <p className="notice-body">{n.content}</p>
            </div>
            <div className="notice-footer" style={{ marginTop: '16px' }}>
              <div>
                <span style={{ display: 'block', fontWeight: '600' }}>By: {n.author_name || 'Dean & Administration'}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN') : 'Recent'}
                </span>
              </div>
              <button className="btn-icon" title="Delete Announcement" onClick={() => handleDelete(n.id)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <p style={{ color: '#94a3b8' }}>No announcements published.</p>
        )}
      </div>
    </div>
  );
}

// ---------------- MODAL MANAGER ----------------
function ModalManager({ modalType, closeModal, users, departments, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let endpoint = '';
    let payload = { ...formData };

    if (modalType === 'addUser') {
      endpoint = `${API_BASE}/users`;
      payload.role = payload.role || 'student';
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
        const err = await res.json();
        alert(err.detail || 'Submission failed');
      } else {
        onSuccess('Entry created and saved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Network request error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {modalType === 'addUser' && 'Enroll New Student / Faculty Member'}
            {modalType === 'addDept' && 'Create Academic Department'}
            {modalType === 'addAttendance' && 'Record Classroom Attendance'}
            {modalType === 'addLeave' && 'Submit Leave / Academic Permission'}
            {modalType === 'addFinance' && 'Record Financial Transaction'}
            {modalType === 'addPerformance' && 'Submit Academic Evaluation'}
            {modalType === 'addNotice' && 'Publish Notice Circular'}
          </h3>
          <button className="modal-close" onClick={closeModal}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* ADD USER FORM */}
            {modalType === 'addUser' && (
              <>
                <div className="form-group">
                  <label>Full Name (Indian Student / Scholar)</label>
                  <input
                    required
                    className="form-input"
                    placeholder="e.g. Aarav Sharma / Ananya Patel"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Institutional Email</label>
                  <input
                    required
                    type="email"
                    className="form-input"
                    placeholder="aarav.s@erp.com"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Default Password</label>
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
                      defaultValue="student"
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="student">🎓 Student / Scholar</option>
                      <option value="employee">👔 Faculty / Staff</option>
                      <option value="manager">💼 Department Head / Manager</option>
                      <option value="admin">🛡️ Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Department / Discipline</label>
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
                    placeholder="e.g. Cyber Physical Systems & Robotics"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Academic Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Disciplines, laboratories, and degree programs..."
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>
              </>
            )}

            {/* ADD ATTENDANCE FORM */}
            {modalType === 'addAttendance' && (
              <>
                <div className="form-group">
                  <label>Select Student / Member</label>
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
                    <label>Status</label>
                    <select
                      className="form-select"
                      defaultValue="present"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="present">Present (In-Class / On-Site)</option>
                      <option value="remote">Remote (Virtual Lab)</option>
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
                  <label>Select Student / Staff</label>
                  <select
                    required
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.department_name || 'Student'})</option>
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
                  <label>Reason for Leave / Permission</label>
                  <textarea
                    required
                    className="form-textarea"
                    rows="3"
                    placeholder="e.g. Smart India Hackathon participation or semester exam prep..."
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
                      <option value="Revenue">Revenue (Tuition Fees, Grants, MoUs)</option>
                      <option value="Expense">Expense (Equipment, Labs, Cloud)</option>
                      <option value="Payroll">Payroll (Stipends & Salaries)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 50000.00"
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Assignee / Student Account (Optional)</label>
                  <select
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    <option value="">General Institutional Treasury</option>
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
                    placeholder="e.g. Annual Semester Tuition Fee or Cloud Lab License"
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* ADD PERFORMANCE FORM */}
            {modalType === 'addPerformance' && (
              <>
                <div className="form-group">
                  <label>Select Student / Scholar</label>
                  <select
                    required
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.department_name || 'Scholar'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Performance / CGPA Score (1.0 to 5.0)</label>
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
                  <label>Academic Remarks & Achievements</label>
                  <textarea
                    required
                    className="form-textarea"
                    rows="3"
                    placeholder="Academic ranks, publications, hackathon awards..."
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  ></textarea>
                </div>
              </>
            )}

            {/* ADD NOTICE FORM */}
            {modalType === 'addNotice' && (
              <>
                <div className="form-group">
                  <label>Notice Circular Title</label>
                  <input
                    required
                    className="form-input"
                    placeholder="e.g. 🚀 Smart India Hackathon 2026 Registration Open"
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Publishing Authority</label>
                  <select
                    className="form-select"
                    onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                  >
                    <option value="">Dean & Executive Management</option>
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
                    placeholder="Official circular details and instructions..."
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
